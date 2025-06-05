import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createProviderRegistry } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createQwen } from "qwen-ai-provider";

export type OpenRouterChatModelId =
  | "openrouter/anthropic/claude-3.7-sonnet"
  | (string & {});

export const registry = createProviderRegistry(
  {
    // register provider with prefix and default setup:
    anthropic: createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://apic.ohmygpt.com/v1",
    }),
    openai: createOpenAI({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://c-z0-api-01.hash070.com/v1",
    }),
    ohmygpt: createOpenAICompatible({
      name: "ohmygpt",
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://c-z0-api-01.hash070.com/v1",
    }),
    openrouter: createOpenAICompatible({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    }),
    google: createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    qwen: createQwen({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    }),
  },
  { separator: "/" }
);
