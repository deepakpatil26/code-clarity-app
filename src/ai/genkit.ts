import { GenerationCommonConfigSchema, genkit } from "genkit";
import { openAI } from "genkitx-openai";

const customModelInfo = {
  label: "Llama 3.3 70B Versatile (Groq)",
  supports: {
    multiturn: true,
    tools: true,
    media: false,
    systemRole: true,
    output: ["json", "text"] as ("json" | "text" | "media")[],
  },
};

// Model ID served by Groq (prefixed with "openai/" for Genkit's OpenAI plugin)
export const aiModel = "openai/llama-3.3-70b-versatile";

export const ai = genkit({
  plugins: [
    openAI({
      models: [
        {
          name: "llama-3.3-70b-versatile",
          info: customModelInfo,
          configSchema: GenerationCommonConfigSchema.extend({}),
        },
      ],
    }),
  ],
});

