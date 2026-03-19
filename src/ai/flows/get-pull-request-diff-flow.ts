"use server";
/**
 * @fileOverview A server action for fetching the diff of a pull request.
 *
 * - getPullRequestDiff - A function that fetches a PR diff using a GitHub auth token.
 */

import { Octokit } from "octokit";
import {
  GetPullRequestDiffInput,
  GetPullRequestDiffOutput,
} from "@/ai/schemas/github";

export async function getPullRequestDiff(
  input: GetPullRequestDiffInput
): Promise<GetPullRequestDiffOutput> {
  const octokit = new Octokit({ auth: input.authToken });
  try {
    const response = await octokit.rest.pulls.get({
      owner: input.owner,
      repo: input.repo,
      pull_number: input.pullNumber,
      mediaType: {
        format: "diff",
      },
    });
    return { diff: response.data as unknown as string };
  } catch (error) {
    console.error("Failed to fetch pull request diff from GitHub:", error);
    throw new Error("Could not retrieve pull request diff from GitHub.");
  }
}
