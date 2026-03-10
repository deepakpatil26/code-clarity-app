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
    .array(z.object({
      message: z.string().describe("The suggestion message."),
      suggestedFix: z.string().optional().describe("A code snippet showing the fix."),
      severity: z.enum(["low", "medium", "high"]).optional(),
      type: z.enum(["quality", "security", "performance"]).optional(),
      line: z.number().optional()
    }))
    .describe("Detailed suggestions for code improvement."),
  summary: z.object({
    securityScore: z.number().describe("Security score from 0 to 10."),
    qualityScore: z.number().describe("Code quality score from 0 to 10."),
    performanceScore: z.number().describe("Performance score from 0 to 10."),
    overallGrade: z.string().describe("Overall letter grade (A+, A, B, C, D, F)."),
  }).optional().describe("Summary metrics for the code analysis."),
});
export type SuggestCodeImprovementsOutput = z.infer<
  typeof SuggestCodeImprovementsOutputSchema
>;
