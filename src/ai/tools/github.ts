"use server";

/**
 * @fileOverview A Genkit tool for interacting with the GitHub API.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { Octokit } from "octokit";

export const listUserRepositoriesTool = ai.defineTool(
  {
    name: "listUserRepositories",
    description: "Lists the repositories for the authenticated user.",
    inputSchema: z.object({
      authToken: z.string().describe("The user's GitHub OAuth token."),
    }),
    outputSchema: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        fullName: z.string(),
        isPrivate: z.boolean(),
        url: z.string(),
        description: z.string().nullable(),
        language: z.string().nullable(),
        stars: z.number(),
        forks: z.number(),
        updatedAt: z.string().nullable(),
        owner: z.string(),
      })
    ),
  },
  async (input) => {
    const octokit = new Octokit({ auth: input.authToken });

    try {
      const repos = await octokit.rest.repos.listForAuthenticatedUser({
        type: "owner",
        sort: "updated",
        direction: "desc",
        per_page: 50,
      });

      return repos.data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        isPrivate: repo.private,
        url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updatedAt: repo.updated_at ?? new Date().toISOString(),
        owner: repo.owner.login,
      }));
    } catch (error) {
      console.error("Failed to fetch repositories from GitHub:", error);
      throw new Error("Could not retrieve repositories from GitHub.");
    }
  }
);

export const listPullRequestsTool = ai.defineTool(
  {
    name: "listPullRequests",
    description: "Lists the pull requests for a given repository.",
    inputSchema: z.object({
      authToken: z.string().describe("The user's GitHub OAuth token."),
      owner: z.string(),
      repo: z.string(),
    }),
    outputSchema: z.array(
      z.object({
        id: z.number(),
        number: z.number(),
        title: z.string(),
        url: z.string(),
        state: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        user: z.object({
          login: z.string(),
          avatarUrl: z.string(),
        }),
      })
    ),
  },
  async (input) => {
    const octokit = new Octokit({ auth: input.authToken });
    try {
      const prs = await octokit.rest.pulls.list({
        owner: input.owner,
        repo: input.repo,
        state: "open",
        sort: "updated",
        direction: "desc",
        per_page: 30,
      });

      return prs.data.map((pr) => ({
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
      }));
    } catch (error) {
      console.error("Failed to fetch pull requests from GitHub:", error);
      throw new Error("Could not retrieve pull requests from GitHub.");
    }
  }
);

export const getPullRequestDiffTool = ai.defineTool(
  {
    name: "getPullRequestDiff",
    description: "Gets the diff content of a specific pull request.",
    inputSchema: z.object({
      authToken: z.string().describe("The user's GitHub OAuth token."),
      owner: z.string(),
      repo: z.string(),
      pullNumber: z.number(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
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
      // The response.data is the diff content when mediaType.format is 'diff'
      return response.data as unknown as string;
    } catch (error) {
      console.error("Failed to fetch pull request diff from GitHub:", error);
      throw new Error("Could not retrieve pull request diff from GitHub.");
    }
  }
);
