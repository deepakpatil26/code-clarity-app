import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PR_ANALYSIS_QUEUE, PRAnalysisJobData } from "../queue/analysis.queue";
import { githubAppService } from "../github-app";
import { collections } from "@/lib/firebase-admin";
import { securityAnalyzer } from "../analyzers/security";
import { complexityAnalyzer } from "../analyzers/complexity";
import { performanceAnalyzer } from "../analyzers/performance";
import { qualityScorer } from "../quality-scorer";
import { prCommenter } from "../pr-commenter";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is missing in env");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const analysisWorker = new Worker<PRAnalysisJobData>(
  PR_ANALYSIS_QUEUE,
  async (job: Job<PRAnalysisJobData>) => {
    const { repoFullName, prNumber, installationId, commitSha } = job.data;
    console.log(`Processing analysis for ${repoFullName}#${prNumber} (Job: ${job.id})`);

    try {
      // 0. Fetch userId associated with this repo
      const configDoc = await collections.repositoryConfigs().doc(repoFullName.replace(/\//g, "_")).get();
      const userId = configDoc.exists ? configDoc.data()?.userId : null;

      const [owner, repo] = repoFullName.split("/");
      const octokit = await githubAppService.getInstallationOctokit(installationId);

      // 1. Fetch PR details
      const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      // 2. Fetch PR diff (as string)
      const diffResponse = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        mediaType: {
          format: "diff",
        },
      });
      const diff = diffResponse.data as unknown as string;

      console.log(`Successfully fetched data for ${repoFullName}#${prNumber}`);

      // 3. Run Analyzers
      // For now, we analyze the entire diff as "code" 
      // In a production app, we would split the diff into files and analyze each file.
      // We'll treat the diff as a single block for this version.
      
      const securityFindings = await securityAnalyzer.analyze(diff, "javascript"); // Default to JS for now
      const complexityFindings = await complexityAnalyzer.analyze(diff, "javascript");
      const performanceFindings = await performanceAnalyzer.analyze(diff, "javascript");

      const allFindings = {
        security: securityFindings,
        complexity: complexityFindings,
        performance: performanceFindings,
      };

      // 4. Calculate Quality Score
      const score = qualityScorer.calculateScore(allFindings);

      // 5. Store Review in Firestore
      const reviewRef = await collections.prReviews().add({
        userId,
        repoFullName,
        prNumber,
        prTitle: pr.title,
        author: pr.user?.login || "unknown",
        status: "completed",
        score,
        grade: qualityScorer.getGrade(score),
        commitSha,
        findingsCount: securityFindings.length + performanceFindings.length + complexityFindings.warnings.length,
        queuedAt: job.timestamp,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });

      // 6. Post Comment on GitHub
      await prCommenter.postReview(repoFullName, prNumber, allFindings, score, octokit);

      // 7. Update Commit Status
      let state: "success" | "failure" | "error" = "success";
      let description = `Code quality score: ${score.toFixed(1)}/10`;

      if (score < 5.0) {
        state = "failure";
        description = `Critical issues found! Quality score: ${score.toFixed(1)}/10`;
      } else if (score < 7.5) {
        state = "success"; // Or "pending" if we want to block
        description = `Review suggested. Quality score: ${score.toFixed(1)}/10`;
      }

      await octokit.rest.repos.createCommitStatus({
        owner,
        repo,
        sha: commitSha,
        state,
        context: "CodeClarity Pro Analysis",
        description,
        target_url: `https://code-clarity-app.vercel.app/reviews/${reviewRef.id}`,
      });

      console.log(`✅ Completed analysis for ${repoFullName}#${prNumber}`);

    } catch (error) {
      console.error(`❌ Analysis failed for ${repoFullName}#${prNumber}:`, error);
      throw error; // Trigger BullMQ retry
    }
  },
  { connection }
);

analysisWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed!`);
});

analysisWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
});

console.log("🚀 Analysis worker started and waiting for jobs...");
