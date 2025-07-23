/**
 * @fileOverview Zod schemas for the report generation flow.
 */
import { z } from "genkit";

export const GenerateReportInputSchema = z.object({
  code: z.string().describe("The original code that was analyzed."),
  language: z.string().describe("The programming language of the code."),
  suggestions: z
    .array(z.string())
    .describe("The list of suggestions from the analysis."),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

export const GenerateReportOutputSchema = z.object({
  html: z.string().describe("The full HTML content of the report."),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;
