import { genkit } from "genkit";
import { gemini15Flash, googleAI } from "@genkit-ai/googleai";

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

export const geminiModel = "googleai/gemini-2.0-flash";
