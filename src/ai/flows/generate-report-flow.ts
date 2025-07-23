"use server";
/**
 * @fileOverview Generates an HTML report from code analysis.
 *
 * - generateReport - A function that creates an HTML report.
 */

import { ai } from "@/ai/genkit";
import {
  GenerateReportInput,
  GenerateReportInputSchema,
  GenerateReportOutput,
  GenerateReportOutputSchema,
} from "@/ai/schemas/report-generation";

export async function generateReport(
  input: GenerateReportInput
): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateReportPrompt",
  input: { schema: GenerateReportInputSchema },
  output: { schema: GenerateReportOutputSchema },
  model: "googleai/gemini-1.5-flash",
  prompt: `You are a report generator for a code analysis tool called CodeClarity. Your task is to generate a clean, modern, and professional HTML report based on the provided code and analysis suggestions.

Use Tailwind CSS classes for styling, but embed them in a <style> tag in the HTML head, as the report will be a standalone file. Do not use external stylesheets.

**Report Requirements:**
- The HTML page title should be "CodeClarity Analysis Report".
- The body should have a light gray background (e.g., #F4F3F6).
- Use a main container with a white background, padding, and rounded corners.
- The primary color for headings and accents is a muted purple (#9466FF).
- The font should be 'Inter', a sans-serif font. You can import it from Google Fonts.
- The report should have a main title: "CodeClarity Analysis Report".
- It should contain two sections: "Analyzed Code" and "Analysis Suggestions".
- The "Analyzed Code" section should display the code in a <pre><code> block with a light background color.
- The "Analysis Suggestions" section should display the suggestions as a list. Each suggestion should be in its own list item with a distinct background.
- Escape any HTML characters within the code and suggestions to prevent rendering issues.

Here is the data to use:

**Language:** {{{language}}}

**Analyzed Code:**
\`\`\`
{{{code}}}
\`\`\`

**Analysis Suggestions:**
{{#each suggestions}}
- {{{this}}}
{{/each}}

Now, generate the full HTML for the report based on these instructions.
`,
  config: {
    temperature: 0.1,
  },
});

const generateReportFlow = ai.defineFlow(
  {
    name: "generateReportFlow",
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
