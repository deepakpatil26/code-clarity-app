"use server";
/**
 * @fileOverview A flow for listing a user's GitHub repositories.
 *
 * - listRepositories - A function that fetches repositories using a GitHub auth token.
 */

import { ai } from "@/ai/genkit";
import {
  ListRepositoriesInput,
  ListRepositoriesInputSchema,
  ListRepositoriesOutput,
  ListRepositoriesOutputSchema,
} from "@/ai/schemas/github";
import { listUserRepositoriesTool } from "@/ai/tools/github";

export async function listRepositories(
  input: ListRepositoriesInput
): Promise<ListRepositoriesOutput> {
  return listRepositoriesFlow(input);
}

const listRepositoriesFlow = ai.defineFlow(
  {
    name: "listRepositoriesFlow",
    inputSchema: ListRepositoriesInputSchema,
    outputSchema: ListRepositoriesOutputSchema,
  },
  async (input) => {
    const repositories = await listUserRepositoriesTool(input);
    return { repositories };
  }
);
