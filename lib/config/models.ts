/**
 * 🤖 AI模型配置和数据字典
 */

// 模型数据字典
export const MODEL_DICTIONARY = {
  // Qwen 模型
  "qwen/qwen-max-latest": {
    provider: "qwen",
    name: "Qwen Max Latest",
    description: "阿里云通义千问最新旗舰模型",
    category: "general",
  },
  "qwen/qwen-plus-latest": {
    provider: "qwen",
    name: "Qwen Plus Latest",
    description: "阿里云通义千问增强版模型",
    category: "general",
  },

  // Google 模型
  "google/gemini-2.5-flash-preview-04-17": {
    provider: "google",
    name: "Gemini 2.5 Flash Preview",
    description: "Google Gemini 2.5 Flash 预览版",
    category: "general",
  },
  "google/gemini-2.5-pro-preview-05-06": {
    provider: "google",
    name: "Gemini 2.5 Pro Preview",
    description: "Google Gemini 2.5 Pro 预览版",
    category: "general",
  },

  // Anthropic 模型
  "anthropic/claude-3-7-sonnet-20250219": {
    provider: "anthropic",
    name: "Claude 3.7 Sonnet",
    description: "Anthropic Claude 3.7 Sonnet",
    category: "chat",
  },
  "anthropic/claude-sonnet-4-20250514": {
    provider: "anthropic",
    name: "Claude Sonnet 4",
    description: "Anthropic Claude Sonnet 4 (最新)",
    category: "chat",
  },

  // OpenAI 模型
  "openai/gpt-4.1": {
    provider: "openai",
    name: "GPT-4.1",
    description: "OpenAI GPT-4.1",
    category: "general",
  },
  "openai/gpt-4o": {
    provider: "openai",
    name: "GPT-4o",
    description: "OpenAI GPT-4o",
    category: "general",
  },
  "openai/gpt-4o-mini": {
    provider: "openai",
    name: "GPT-4o Mini",
    description: "OpenAI GPT-4o Mini (轻量版)",
    category: "general",
  },

  // OpenRouter 模型
  "openrouter/qwen/qwen3-235b-a22b": {
    provider: "openrouter",
    name: "Qwen3 235B",
    description: "通过OpenRouter访问的Qwen3 235B",
    category: "general",
  },
  "openrouter/qwen/qwen-max": {
    provider: "openrouter",
    name: "Qwen Max (OpenRouter)",
    description: "通过OpenRouter访问的Qwen Max",
    category: "general",
  },
  "openrouter/deepseek/deepseek-chat-v3-0324": {
    provider: "openrouter",
    name: "DeepSeek Chat v3",
    description: "通过OpenRouter访问的DeepSeek Chat v3",
    category: "general",
  },
  "openrouter/deepseek/deepseek-r1-0528": {
    provider: "openrouter",
    name: "DeepSeek R1",
    description: "通过OpenRouter访问的DeepSeek R1",
    category: "general",
  },
  "openrouter/anthropic/claude-3.7-sonnet": {
    provider: "openrouter",
    name: "Claude 3.7 Sonnet (OpenRouter)",
    description: "通过OpenRouter访问的Claude 3.7 Sonnet",
    category: "chat",
  },
  "openrouter/anthropic/claude-sonnet-4": {
    provider: "openrouter",
    name: "Claude Sonnet 4 (OpenRouter)",
    description: "通过OpenRouter访问的Claude Sonnet 4",
    category: "chat",
  },
  "openrouter/openai/gpt-4.1": {
    provider: "openrouter",
    name: "GPT-4.1 (OpenRouter)",
    description: "通过OpenRouter访问的GPT-4.1",
    category: "general",
  },
  "openrouter/openai/gpt-4o": {
    provider: "openrouter",
    name: "GPT-4o (OpenRouter)",
    description: "通过OpenRouter访问的GPT-4o",
    category: "general",
  },
} as const;

// 模型ID类型
export type ModelId = keyof typeof MODEL_DICTIONARY;

// 模型提供商配置
export interface ProviderConfig {
  name: string;
  baseURL: string;
  description: string;
}

// 默认Provider配置
export const DEFAULT_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  anthropic: {
    name: "Anthropic",
    baseURL: "https://c-z0-api-01.hash070.com/v1",
    description: "Anthropic Claude 模型",
  },
  openai: {
    name: "OpenAI",
    baseURL: "https://c-z0-api-01.hash070.com/v1",
    description: "OpenAI GPT 模型",
  },
  openrouter: {
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    description: "OpenRouter 统一接口",
  },
  qwen: {
    name: "Qwen",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    description: "阿里云通义千问",
  },
  google: {
    name: "Google",
    baseURL: "", // Google 使用默认配置
    description: "Google Gemini 模型",
  },
};

// 获取聊天模型列表（仅Anthropic模型）
export function getChatModels(): ModelId[] {
  return Object.keys(MODEL_DICTIONARY).filter(
    (modelId) => MODEL_DICTIONARY[modelId as ModelId].category === "chat"
  ) as ModelId[];
}

// 获取通用模型列表
export function getGeneralModels(): ModelId[] {
  return Object.keys(MODEL_DICTIONARY).filter(
    (modelId) => MODEL_DICTIONARY[modelId as ModelId].category === "general"
  ) as ModelId[];
}

// 获取所有模型列表
export function getAllModels(): ModelId[] {
  return Object.keys(MODEL_DICTIONARY) as ModelId[];
}

// 根据提供商获取模型
export function getModelsByProvider(provider: string): ModelId[] {
  return Object.keys(MODEL_DICTIONARY).filter(
    (modelId) => MODEL_DICTIONARY[modelId as ModelId].provider === provider
  ) as ModelId[];
}

// 默认配置
export const DEFAULT_MODEL_CONFIG = {
  chatModel: "anthropic/claude-sonnet-4-20250514" as ModelId,
  classifyModel: "qwen/qwen-max-latest" as ModelId,
  replyModel: "qwen/qwen-plus-latest" as ModelId,
} as const;
