import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createProviderRegistry } from "ai";

export const registry = createProviderRegistry(
  {
    // register provider with prefix and default setup:
    anthropic: createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://api.ohmygpt.com/v1",
    }),
  },
  { separator: "/" }
);

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});
