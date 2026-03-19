"use server";
/**
 * @fileOverview A server action for listing pull requests in a GitHub repository.
 *
 * - listPullRequests - A function that fetches pull requests using a GitHub auth token.
 */

import { Octokit } from "octokit";
import {
  ListPullRequestsInput,
  ListPullRequestsOutput,
} from "@/ai/schemas/github";

export async function listPullRequests(
  input: ListPullRequestsInput
): Promise<ListPullRequestsOutput> {
  const octokit = new Octokit({ auth: input.authToken });
  try {
    const prs = await octokit.rest.pulls.list({
      owner: input.owner,
      repo: input.repo,
      state: "all",
      sort: "updated",
      direction: "desc",
      per_page: 30,
    });

    return {
      pullRequests: prs.data.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        state: pr.state,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        user: {
          login: pr.user?.login || "unknown",
          avatarUrl: pr.user?.avatar_url || "",
        },
      })),
    };
  } catch (error) {
    console.error("Failed to fetch pull requests from GitHub:", error);
    throw new Error("Could not retrieve pull requests from GitHub.");
  }
}
