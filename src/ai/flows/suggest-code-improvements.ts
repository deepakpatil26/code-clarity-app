"use server";

/**
 * @fileOverview AI-powered code review assistant for suggesting code improvements.
 *
 * - suggestCodeImprovements - A function that analyzes code and suggests line-by-line improvements.
 */

import { ai } from "@/ai/genkit";
import {
  SuggestCodeImprovementsInput,
  SuggestCodeImprovementsInputSchema,
  SuggestCodeImprovementsOutput,
  SuggestCodeImprovementsOutputSchema,
} from "@/ai/schemas/code-analysis";

export async function suggestCodeImprovements(
  input: SuggestCodeImprovementsInput
): Promise<SuggestCodeImprovementsOutput> {
  return suggestCodeImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: "suggestCodeImprovementsPrompt",
  input: { schema: SuggestCodeImprovementsInputSchema },
  output: { schema: SuggestCodeImprovementsOutputSchema },
  model: "googleai/gemini-1.5-flash",
  prompt: `You are an AI code reviewer. Your task is to analyze the following code and provide line-by-line suggestions for code quality, security vulnerabilities, and performance optimization.

**Instructions:**
- For each suggestion, you MUST provide the line number it applies to.
- For each suggestion, you MUST classify it as 'quality', 'security', or 'performance'.
- For each suggestion, you MUST assign a severity of 'low', 'medium', or 'high'.
- Format EACH suggestion as a single string: "[line <number>] [<type>/<severity>] <your suggestion message>"

**Example Suggestions:**
- "[line 5] [quality/low] Consider using 'const' instead of 'let' as the variable is not reassigned."
- "[line 12] [security/high] This query is vulnerable to SQL injection. Use parameterized queries instead."
- "[line 25] [performance/medium] This loop can be optimized by caching the array length."

Language: {{{language}}}

Code:
\`\`\`
{{{code}}}
\`\`\`

Provide your suggestions in an array of strings, following the format precisely. If there are no suggestions, return an empty array.
`,
  config: {
    maxOutputTokens: 1024,
    temperature: 0.1,
  },
});

const suggestCodeImprovementsFlow = ai.defineFlow(
  {
    name: "suggestCodeImprovementsFlow",
    inputSchema: SuggestCodeImprovementsInputSchema,
    outputSchema: SuggestCodeImprovementsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
