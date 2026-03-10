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
import { parseUnifiedDiffPatch } from "../diff-parser";
import { Timestamp } from "firebase-admin/firestore";

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

      // 2. Fetch PR files and patches
      const files: { filename: string; patch?: string | null }[] = [];
      let page = 1;
      const perPage = 100;
      while (true) {
        const resp = await octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number: prNumber,
          per_page: perPage,
          page,
        });
        files.push(...resp.data);
        if (resp.data.length < perPage) break;
        page += 1;
      }

      console.log(`Successfully fetched data for ${repoFullName}#${prNumber}`);

      // 2b. Dependency vulnerability scan (OSV) if package-lock.json changed
      const hasPackageLock = files.some((f) => f.filename === "package-lock.json");
      const dependencyFindings: Awaited<ReturnType<typeof securityAnalyzer.analyze>> = [];

      const fetchRepoFile = async (path: string) => {
        const resp = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: commitSha,
        });
        const data = resp.data as { content?: string; encoding?: string };
        if (!data.content || data.encoding !== "base64") {
          return null;
        }
        const raw = Buffer.from(data.content, "base64").toString("utf-8");
        return raw;
      };

      if (hasPackageLock) {
        try {
          const lockRaw = await fetchRepoFile("package-lock.json");
          if (lockRaw) {
            const lock = JSON.parse(lockRaw);
            const deps = lock.dependencies || {};
            const entries = Object.entries(deps)
              .map(([name, info]: any) => ({
                name,
                version: typeof info?.version === "string" ? info.version : null,
              }))
              .filter((d) => !!d.version)
              .slice(0, 200);

            if (entries.length > 0) {
              const osvResp = await fetch("https://api.osv.dev/v1/querybatch", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  queries: entries.map((d) => ({
                    package: { name: d.name, ecosystem: "npm" },
                    version: d.version,
                  })),
                }),
              });
              if (osvResp.ok) {
                const osvData = await osvResp.json();
                const results = Array.isArray(osvData.results) ? osvData.results : [];
                results.forEach((r: any, idx: number) => {
                  if (r?.vulns?.length) {
                    const name = entries[idx]?.name;
                    const version = entries[idx]?.version;
                    const first = r.vulns[0];
                    dependencyFindings.push({
                      type: "dependency_vuln",
                      severity: "high",
                      line: 1,
                      filePath: "package-lock.json",
                      message: `${name}@${version} has ${r.vulns.length} known vulnerabilities (e.g., ${first.id}).`,
                      suggestion: "Update the dependency to a patched version.",
                    });
                  }
                });
              }
            }
          }
        } catch (err) {
          console.warn("Dependency scan failed:", err);
        }
      }

      // 3. Run Analyzers per file (added lines only)
      const securityFindings: Awaited<ReturnType<typeof securityAnalyzer.analyze>> = [];
      const performanceFindings: Awaited<ReturnType<typeof performanceAnalyzer.analyze>> = [];
      const complexityFindingsByFile: Array<Awaited<ReturnType<typeof complexityAnalyzer.analyze>>> = [];
      let filesAnalyzed = 0;

      const getLanguageFromPath = (filePath: string) => {
        const ext = filePath.split(".").pop()?.toLowerCase() || "";
        const map: Record<string, string> = {
          js: "javascript",
          jsx: "javascript",
          ts: "typescript",
          tsx: "typescript",
          py: "python",
          java: "java",
          cpp: "cpp",
          c: "c",
          go: "go",
          rb: "ruby",
          php: "php",
        };
        return map[ext] || "text";
      };

      for (const file of files) {
        if (!file.patch) continue;
        const { addedLines, addedCode, lineMap } = parseUnifiedDiffPatch(file.patch);
        if (!addedCode.trim()) continue;

        filesAnalyzed += 1;
        const language = getLanguageFromPath(file.filename);

        const sec = await securityAnalyzer.analyze(addedCode, language);
        const perf = await performanceAnalyzer.analyze(addedCode, language);
        const comp = await complexityAnalyzer.analyze(addedCode, language);
        complexityFindingsByFile.push(comp);

        // Map findings back to actual file line numbers from patch
        sec.forEach((f) => {
          const mappedLine = lineMap[f.line] || 0;
          f.filePath = file.filename;
          f.line = mappedLine;
        });
        perf.forEach((f) => {
          const mappedLine = lineMap[f.line] || 0;
          f.filePath = file.filename;
          f.line = mappedLine;
        });

        securityFindings.push(...sec);
        performanceFindings.push(...perf);
      }

      const aggregateComplexity = () => {
        if (complexityFindingsByFile.length === 0) {
          return {
            cyclomaticComplexity: 0,
            maxNestingDepth: 0,
            linesOfCode: 0,
            maintainabilityIndex: 100,
            warnings: [],
          };
        }

        const totalLoc = complexityFindingsByFile.reduce((acc, c) => acc + c.linesOfCode, 0);
        const totalComplexity = complexityFindingsByFile.reduce((acc, c) => acc + c.cyclomaticComplexity, 0);
        const maxNestingDepth = Math.max(...complexityFindingsByFile.map((c) => c.maxNestingDepth));
        const avgMaintainability = totalLoc > 0
          ? complexityFindingsByFile.reduce((acc, c) => acc + c.maintainabilityIndex * c.linesOfCode, 0) / totalLoc
          : complexityFindingsByFile.reduce((acc, c) => acc + c.maintainabilityIndex, 0) / complexityFindingsByFile.length;
        const warnings = complexityFindingsByFile.flatMap((c) => c.warnings);

        return {
          cyclomaticComplexity: totalComplexity,
          maxNestingDepth,
          linesOfCode: totalLoc,
          maintainabilityIndex: avgMaintainability,
          warnings,
        };
      };

      const complexityFindings = aggregateComplexity();

      const allFindings = {
        security: [...securityFindings, ...dependencyFindings],
        complexity: complexityFindings,
        performance: performanceFindings,
      };

      // 4. Calculate Quality Score
      const score = qualityScorer.calculateScore(allFindings);

      // 5. Store Review in Firestore
      const nowIso = new Date().toISOString();
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
        findingsCount:
          securityFindings.length +
          dependencyFindings.length +
          performanceFindings.length +
          complexityFindings.warnings.length,
        securityFindingsCount: securityFindings.length + dependencyFindings.length,
        performanceFindingsCount: performanceFindings.length,
        complexityWarningsCount: complexityFindings.warnings.length,
        filesAnalyzed,
        diffStats: {
          additions: pr.additions ?? 0,
          deletions: pr.deletions ?? 0,
          changedFiles: pr.changed_files ?? 0,
        },
        queuedAt: job.timestamp,
        startedAt: nowIso,
        completedAt: nowIso,
        completedAtTs: Timestamp.now(),
      });

      // 5b. Store findings in Firestore
      const reviewFindingsRef = collections.reviewFindings();
      const db = reviewFindingsRef.firestore;
      const batch = db.batch();
      const createdAt = Timestamp.now();

      const findingsToStore = [
        ...securityFindings.map((f) => ({
          userId,
          reviewId: reviewRef.id,
          repoFullName,
          prNumber,
          filePath: f.filePath || "",
          lineNumber: f.line || 0,
          severity: f.severity,
          category: "security",
          message: f.message,
          suggestion: f.suggestion,
          createdAt,
          createdAtTs: createdAt,
        })),
        ...dependencyFindings.map((f) => ({
          userId,
          reviewId: reviewRef.id,
          repoFullName,
          prNumber,
          filePath: f.filePath || "package-lock.json",
          lineNumber: f.line || 1,
          severity: f.severity,
          category: "dependency",
          message: f.message,
          suggestion: f.suggestion,
          createdAt,
          createdAtTs: createdAt,
        })),
        ...performanceFindings.map((f) => ({
          userId,
          reviewId: reviewRef.id,
          repoFullName,
          prNumber,
          filePath: f.filePath || "",
          lineNumber: f.line || 0,
          severity: f.severity,
          category: "performance",
          message: f.message,
          suggestion: f.suggestion,
          createdAt,
          createdAtTs: createdAt,
        })),
        ...complexityFindings.warnings.map((w) => ({
          userId,
          reviewId: reviewRef.id,
          repoFullName,
          prNumber,
          filePath: "",
          lineNumber: 0,
          severity: "medium",
          category: "complexity",
          message: w,
          suggestion: "Consider refactoring for lower complexity and improved readability.",
          createdAt,
          createdAtTs: createdAt,
        })),
      ];

      findingsToStore.forEach((f) => {
        batch.set(reviewFindingsRef.doc(), f);
      });
      if (findingsToStore.length > 0) {
        await batch.commit();
      }

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
