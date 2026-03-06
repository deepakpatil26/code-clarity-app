import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

async function listModels() {
  try {
    // In Genkit, models are registered in the registry
    const models = ai.registry.listEntries().filter(e => e.type === "model");
    console.log("Available Models in Genkit Registry:");
    models.forEach(m => console.log(`- ${m.name}`));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
