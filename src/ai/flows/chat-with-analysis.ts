"use server";

import { ai, aiModel } from "../genkit";
import { ChatWithAnalysisInput, ChatWithAnalysisOutput, ChatWithAnalysisInputSchema, ChatWithAnalysisOutputSchema } from "../schemas/chat-analysis";

/**
 * Server Action for chatting with the AI about a specific code analysis finding.
 */
export async function chatWithAnalysis(input: ChatWithAnalysisInput): Promise<ChatWithAnalysisOutput> {
  return chatWithAnalysisFlow(input);
}

const chatWithAnalysisFlow = ai.defineFlow(
  {
    name: "chatWithAnalysisFlow",
    inputSchema: ChatWithAnalysisInputSchema,
    outputSchema: ChatWithAnalysisOutputSchema,
  },
  async (input) => {
    const { codeContext, finding, userMessage } = input;
    
    // @ts-ignore - Genkit 0.5+ overload resolution
    const response = await ai.generate({
      model: aiModel,
      system: `You are an expert software engineer explaining a code review finding.
      
Code Context:
${codeContext}
      
Finding: "${finding}"
      
Explain the finding clearly and suggest a fix if applicable.`,
      prompt: userMessage,
    });

    return { response: response.text };
  }
);
