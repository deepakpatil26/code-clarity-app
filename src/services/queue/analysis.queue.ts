import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is missing in env");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

export const PR_ANALYSIS_QUEUE = "pr-analysis";

export interface PRAnalysisJobData {
  repoFullName: string;
  prNumber: number;
  installationId: number;
  commitSha: string;
}

export const prAnalysisQueue = new Queue<PRAnalysisJobData>(PR_ANALYSIS_QUEUE, {
  connection,
});

/**
 * Adds a PR analysis job to the queue.
 */
export async function queuePRAnalysis(data: PRAnalysisJobData) {
  console.log(`Queuing analysis for ${data.repoFullName}#${data.prNumber}`);
  await prAnalysisQueue.add(`${data.repoFullName}-${data.prNumber}`, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  });
}
