"use server";

/**
 * @fileOverview AI-powered code review assistant for suggesting code improvements.
 *
 * - suggestCodeImprovements - A function that analyzes code and suggests line-by-line improvements.
 */

import { ai, aiModel } from "@/ai/genkit";
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
  model: aiModel,
  prompt: `You are an AI code reviewer. Your task is to analyze the following code and provide detailed, structured suggestions for code quality, security vulnerabilities, and performance optimization.
  
  In addition to line-by-line suggestions, you MUST provide a quantitative summary of the code's health.

**Instructions for Suggestions:**
- For each suggestion, you MUST return an object in the 'suggestions' array.
- Each suggestion object must contain:
  - **line**: The line number the suggestion applies to.
  - **type**: 'quality', 'security', or 'performance'.
  - **severity**: 'low', 'medium', or 'high'.
  - **message**: A clear, concise explanation of the issue and how to fix it.
  - **suggestedFix**: A short code snippet showing exactly how the fixed code should look. (Optional but highly recommended for high/medium severity).

**Instructions for Summary Metrics:**
- **securityScore**: 0 to 10.
- **qualityScore**: 0 to 10.
- **performanceScore**: 0 to 10.
- **overallGrade**: 'A+' to 'F'.

Language: {{{language}}}

Code:
\`\`\`
{{{code}}}
\`\`\`

Return the results in the specified JSON structure.
`,
  config: {
    maxOutputTokens: 3000,
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
    try {
      // Truncate large diffs to stay within Groq's context window (~128K tokens).
      // 15,000 chars ≈ 4,000 tokens, leaving room for the prompt template + output.
      const MAX_CODE_CHARS = 15000;
      let code = input.code;
      let truncated = false;
      if (code.length > MAX_CODE_CHARS) {
        code = code.substring(0, MAX_CODE_CHARS);
        truncated = true;
      }

      const { output } = await prompt({ ...input, code });
      if (!output) {
        return { 
          suggestions: [],
          summary: { securityScore: 10, qualityScore: 10, performanceScore: 10, overallGrade: "A+" }
        };
      }
      
      // If we truncated, add a note to the suggestions
      if (truncated) {
        output.suggestions.push({
          message: "Note: The diff was too large for a single pass. Only the first ~15,000 characters were analyzed. Consider reviewing the remaining changes manually.",
          type: "quality" as const,
          severity: "low" as const,
          line: 0,
        });
      }

      return output as SuggestCodeImprovementsOutput;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return { 
        suggestions: [
          {
            message: `AI Analysis Error: ${error instanceof Error ? error.message : String(error)}. Please check your API key and model availability.`,
            type: "security" as const,
            severity: "high" as const,
            line: 1
          }
        ],
        summary: {
          securityScore: 0,
          qualityScore: 0,
          performanceScore: 0,
          overallGrade: "F"
        }
      } as SuggestCodeImprovementsOutput;
    }
  }
);
