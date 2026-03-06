import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

let connection: IORedis | null = null;
let _prAnalysisQueue: Queue | null = null;

function getConnection(): IORedis {
  if (connection) return connection;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is missing in env");
  }
  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  return connection;
}

export const PR_ANALYSIS_QUEUE = "pr-analysis";

export interface PRAnalysisJobData {
  repoFullName: string;
  prNumber: number;
  installationId: number;
  commitSha: string;
}

export function getPRAnalysisQueue() {
  if (_prAnalysisQueue) return _prAnalysisQueue;
  _prAnalysisQueue = new Queue<PRAnalysisJobData>(PR_ANALYSIS_QUEUE, {
    connection: getConnection(),
  });
  return _prAnalysisQueue;
}

/**
 * Adds a PR analysis job to the queue.
 */
export async function queuePRAnalysis(data: PRAnalysisJobData) {
  console.log(`Queuing analysis for ${data.repoFullName}#${data.prNumber}`);
  const queue = getPRAnalysisQueue();
  await queue.add(`${data.repoFullName}-${data.prNumber}`, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  });
}
