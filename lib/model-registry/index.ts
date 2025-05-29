import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createProviderRegistry } from "ai";

export const registry = createProviderRegistry(
  {
    // register provider with prefix and default setup:
    anthropic: createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://c-z0-api-01.hash070.com/v1",
    }),
    openai: createOpenAI({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://c-z0-api-01.hash070.com/v1",
    }),
  },
  { separator: "/" }
);

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});
