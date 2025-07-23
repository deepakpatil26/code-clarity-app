"use server";
/**
 * @fileOverview A flow for listing pull requests in a GitHub repository.
 *
 * - listPullRequests - A function that fetches pull requests using a GitHub auth token.
 */

import { ai } from "@/ai/genkit";
import {
  ListPullRequestsInput,
  ListPullRequestsInputSchema,
  ListPullRequestsOutput,
  ListPullRequestsOutputSchema,
} from "@/ai/schemas/github";
import { listPullRequestsTool } from "@/ai/tools/github";

export async function listPullRequests(
  input: ListPullRequestsInput
): Promise<ListPullRequestsOutput> {
  return listPullRequestsFlow(input);
}

const listPullRequestsFlow = ai.defineFlow(
  {
    name: "listPullRequestsFlow",
    inputSchema: ListPullRequestsInputSchema,
    outputSchema: ListPullRequestsOutputSchema,
  },
  async (input) => {
    const pullRequests = await listPullRequestsTool(input);
    return { pullRequests };
  }
);
