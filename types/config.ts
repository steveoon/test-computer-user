/**
 * 统一配置数据类型定义
 * 用于 localforage 存储的品牌数据和提示词配置
 */

import { z } from "zod";
import {
  // 从zhipin导入所需类型
  ZhipinDataSchema,
  ReplyContextSchema,
  ZhipinData,
} from "./zhipin";

// 🔧 配置相关 Zod Schema 定义

// 系统提示词配置Schema
export const SystemPromptsConfigSchema = z.object({
  bossZhipinSystemPrompt: z.string(),
  generalComputerSystemPrompt: z.string(),
});

// 智能回复指令配置Schema
export const ReplyPromptsConfigSchema = z.record(
  ReplyContextSchema,
  z.string()
);

// 统一应用配置数据Schema
export const AppConfigDataSchema = z.object({
  brandData: ZhipinDataSchema,
  systemPrompts: SystemPromptsConfigSchema,
  replyPrompts: ReplyPromptsConfigSchema,
  activeSystemPrompt: z
    .enum(["bossZhipinSystemPrompt", "generalComputerSystemPrompt"])
    .optional(),
  metadata: z.object({
    version: z.string(),
    lastUpdated: z.string(),
    migratedAt: z.string().optional(),
    upgradedAt: z.string().optional(),
  }),
});

// 配置服务接口Schema（仅用于接口定义，不用于数据验证）
export const ConfigServiceSchema = z.object({
  getConfig: z.function().returns(z.promise(AppConfigDataSchema.nullable())),
  saveConfig: z
    .function()
    .args(AppConfigDataSchema)
    .returns(z.promise(z.void())),
  updateBrandData: z
    .function()
    .args(ZhipinDataSchema)
    .returns(z.promise(z.void())),
  updateSystemPrompts: z
    .function()
    .args(SystemPromptsConfigSchema)
    .returns(z.promise(z.void())),
  updateReplyPrompts: z
    .function()
    .args(ReplyPromptsConfigSchema)
    .returns(z.promise(z.void())),
  updateActiveSystemPrompt: z
    .function()
    .args(z.enum(["bossZhipinSystemPrompt", "generalComputerSystemPrompt"]))
    .returns(z.promise(z.void())),
  clearConfig: z.function().returns(z.promise(z.void())),
  isConfigured: z.function().returns(z.promise(z.boolean())),
});

// 🔧 通过 z.infer 生成 TypeScript 类型

/**
 * 系统提示词配置
 */
export type SystemPromptsConfig = z.infer<typeof SystemPromptsConfigSchema>;

/**
 * 智能回复指令配置
 * 使用映射类型确保与 ReplyContext 类型一致
 */
export type ReplyPromptsConfig = z.infer<typeof ReplyPromptsConfigSchema>;

/**
 * 统一应用配置数据结构
 * 所有配置数据都存储在这个结构中
 */
export type AppConfigData = z.infer<typeof AppConfigDataSchema>;

/**
 * 配置服务接口
 */
export interface ConfigService {
  getConfig(): Promise<AppConfigData | null>;
  saveConfig(data: AppConfigData): Promise<void>;
  updateBrandData(brandData: ZhipinData): Promise<void>;
  updateSystemPrompts(prompts: SystemPromptsConfig): Promise<void>;
  updateReplyPrompts(prompts: ReplyPromptsConfig): Promise<void>;
  updateActiveSystemPrompt(
    promptType: keyof SystemPromptsConfig
  ): Promise<void>;
  clearConfig(): Promise<void>;
  isConfigured(): Promise<boolean>;
}

/**
 * 配置管理 Hook 返回类型
 */
export interface ConfigManagerState {
  config: AppConfigData | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;

  // 操作方法
  updateBrandData: (brandData: ZhipinData) => Promise<void>;
  updateSystemPrompts: (prompts: SystemPromptsConfig) => Promise<void>;
  updateReplyPrompts: (prompts: ReplyPromptsConfig) => Promise<void>;
  reloadConfig: () => Promise<void>;
  clearConfig: () => Promise<void>;
}

/**
 * LocalForage 存储键名常量
 */
export const CONFIG_STORAGE_KEY = "APP_CONFIG_DATA" as const;
export const CONFIG_VERSION = "1.1.2" as const;

// 不再重新导出zhipin中的类型，使用时直接从 './zhipin' 导入
