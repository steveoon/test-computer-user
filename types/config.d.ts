/**
 * 统一配置数据类型定义
 * 用于 localforage 存储的品牌数据和提示词配置
 */

// 重新导出zhipin相关类型，避免重复定义
export type {
  Position,
  Store,
  Templates,
  ScreeningRules,
  BrandConfig,
  ZhipinData,
  ReplyContext,
  MessageClassification,
} from "./zhipin";

/**
 * 系统提示词配置
 */
export interface SystemPromptsConfig {
  bossZhipinSystemPrompt: string;
  generalComputerSystemPrompt: string;
}

/**
 * 智能回复指令配置
 * 使用映射类型确保与 ReplyContext 类型一致
 */
export type ReplyPromptsConfig = Record<ReplyContext, string>;

/**
 * 统一应用配置数据结构
 * 所有配置数据都存储在这个结构中
 */
export interface AppConfigData {
  // 品牌和门店数据
  brandData: ZhipinData;

  // 系统级提示词
  systemPrompts: SystemPromptsConfig;

  // 智能回复指令
  replyPrompts: ReplyPromptsConfig;

  // 活动系统提示词选择
  activeSystemPrompt?: keyof SystemPromptsConfig;

  // 配置元信息
  metadata: {
    version: string;
    lastUpdated: string;
    migratedAt?: string;
  };
}

/**
 * 配置服务接口
 */
export interface ConfigService {
  getConfig(): Promise<AppConfigData | null>;
  saveConfig(data: AppConfigData): Promise<void>;
  updateBrandData(brandData: ZhipinData): Promise<void>;
  updateSystemPrompts(prompts: SystemPromptsConfig): Promise<void>;
  updateReplyPrompts(prompts: ReplyPromptsConfig): Promise<void>;
  updateActiveSystemPrompt(promptType: keyof SystemPromptsConfig): Promise<void>;
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
export const CONFIG_VERSION = "1.0.0" as const;
