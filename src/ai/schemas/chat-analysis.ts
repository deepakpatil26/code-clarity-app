import { z } from "genkit";

export const ChatWithAnalysisInputSchema = z.object({
  codeContext: z.string().describe("The relevant code block."),
  finding: z.string().describe("The specific finding or suggestion."),
  userMessage: z.string().describe("The follow-up question from the user."),
});

export type ChatWithAnalysisInput = z.infer<typeof ChatWithAnalysisInputSchema>;

export const ChatWithAnalysisOutputSchema = z.object({
  response: z.string().describe("The AI's explanation or response.")
});

export type ChatWithAnalysisOutput = z.infer<typeof ChatWithAnalysisOutputSchema>;
