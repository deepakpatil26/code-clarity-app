"use server";
/**
 * @fileOverview A flow for fetching the diff of a pull request.
 *
 * - getPullRequestDiff - A function that fetches a PR diff using a GitHub auth token.
 */

import { ai } from "@/ai/genkit";
import {
  GetPullRequestDiffInput,
  GetPullRequestDiffInputSchema,
  GetPullRequestDiffOutput,
  GetPullRequestDiffOutputSchema,
} from "@/ai/schemas/github";
import { getPullRequestDiffTool } from "@/ai/tools/github";

export async function getPullRequestDiff(
  input: GetPullRequestDiffInput
): Promise<GetPullRequestDiffOutput> {
  return getPullRequestDiffFlow(input);
}

const getPullRequestDiffFlow = ai.defineFlow(
  {
    name: "getPullRequestDiffFlow",
    inputSchema: GetPullRequestDiffInputSchema,
    outputSchema: GetPullRequestDiffOutputSchema,
  },
  async (input) => {
    const diff = await getPullRequestDiffTool(input);
    return { diff };
  }
);
