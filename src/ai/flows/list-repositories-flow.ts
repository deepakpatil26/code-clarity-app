"use server";
/**
 * @fileOverview A server action for listing a user's GitHub repositories.
 *
 * - listRepositories - A function that fetches repositories using a GitHub auth token.
 */

import { Octokit } from "octokit";
import {
  ListRepositoriesInput,
  ListRepositoriesOutput,
} from "@/ai/schemas/github";

export async function listRepositories(
  input: ListRepositoriesInput
): Promise<ListRepositoriesOutput> {
  const octokit = new Octokit({ auth: input.authToken });
  try {
    const repos = await octokit.rest.repos.listForAuthenticatedUser({
      type: "owner",
      sort: "updated",
      direction: "desc",
      per_page: 50,
    });

    return {
      repositories: repos.data.map((repo) => ({
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
      })),
    };
  } catch (error) {
    console.error("Failed to fetch repositories from GitHub:", error);
    throw new Error("Could not retrieve repositories from GitHub.");
  }
}
