/**
 * @fileOverview Zod schemas for the code improvement suggestion flow.
 */
import { z } from "genkit";

export const SuggestCodeImprovementsInputSchema = z.object({
  code: z.string().describe("The code to analyze."),
  language: z.string().describe("The programming language of the code."),
});
export type SuggestCodeImprovementsInput = z.infer<
  typeof SuggestCodeImprovementsInputSchema
>;

export const SuggestCodeImprovementsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe("Line-by-line suggestions for code improvement."),
});
export type SuggestCodeImprovementsOutput = z.infer<
  typeof SuggestCodeImprovementsOutputSchema
>;
