/**
 * 🔧 统一配置服务
 * 封装所有 localforage 操作，提供配置数据的读写接口
 */

import localforage from "localforage";
import type {
  AppConfigData,
  ConfigService,
  SystemPromptsConfig,
  ReplyPromptsConfig,
  ZhipinData,
  CONFIG_STORAGE_KEY,
  CONFIG_VERSION,
} from "../../types/config";

// 创建专门的配置存储实例
const configStorage = localforage.createInstance({
  name: "ai-sdk-computer-use",
  storeName: "app_config",
  description: "应用配置数据存储",
});

/**
 * 核心配置服务实现
 */
class AppConfigService implements ConfigService {
  private readonly storageKey = "APP_CONFIG_DATA" as typeof CONFIG_STORAGE_KEY;

  /**
   * 获取完整配置数据
   */
  async getConfig(): Promise<AppConfigData | null> {
    try {
      const config = await configStorage.getItem<AppConfigData>(
        this.storageKey
      );

      if (config) {
        console.log("✅ 配置数据已从 localforage 加载");
        return config;
      }

      console.log("ℹ️ 未找到配置数据，可能是首次使用");
      return null;
    } catch (error) {
      console.error("❌ 配置数据读取失败:", error);
      throw new Error("配置数据读取失败");
    }
  }

  /**
   * 保存完整配置数据
   */
  async saveConfig(data: AppConfigData): Promise<void> {
    try {
      // 更新元信息
      const configWithMetadata: AppConfigData = {
        ...data,
        metadata: {
          ...data.metadata,
          version: "1.0.0" as typeof CONFIG_VERSION,
          lastUpdated: new Date().toISOString(),
        },
      };

      await configStorage.setItem(this.storageKey, configWithMetadata);
      console.log("✅ 配置数据已保存到 localforage");
    } catch (error) {
      console.error("❌ 配置数据保存失败:", error);
      throw new Error("配置数据保存失败");
    }
  }

  /**
   * 更新品牌数据
   */
  async updateBrandData(brandData: ZhipinData): Promise<void> {
    const currentConfig = await this.getConfig();
    if (!currentConfig) {
      throw new Error("配置数据不存在，请先进行初始化");
    }

    await this.saveConfig({
      ...currentConfig,
      brandData,
    });
  }

  /**
   * 更新系统提示词
   */
  async updateSystemPrompts(prompts: SystemPromptsConfig): Promise<void> {
    const currentConfig = await this.getConfig();
    if (!currentConfig) {
      throw new Error("配置数据不存在，请先进行初始化");
    }

    await this.saveConfig({
      ...currentConfig,
      systemPrompts: prompts,
    });
  }

  /**
   * 更新智能回复指令
   */
  async updateReplyPrompts(prompts: ReplyPromptsConfig): Promise<void> {
    const currentConfig = await this.getConfig();
    if (!currentConfig) {
      throw new Error("配置数据不存在，请先进行初始化");
    }

    await this.saveConfig({
      ...currentConfig,
      replyPrompts: prompts,
    });
  }

  /**
   * 清除所有配置数据
   */
  async clearConfig(): Promise<void> {
    try {
      await configStorage.removeItem(this.storageKey);
      console.log("✅ 配置数据已清除");
    } catch (error) {
      console.error("❌ 配置数据清除失败:", error);
      throw new Error("配置数据清除失败");
    }
  }

  /**
   * 检查是否已配置
   */
  async isConfigured(): Promise<boolean> {
    try {
      const config = await configStorage.getItem<AppConfigData>(
        this.storageKey
      );
      return config !== null;
    } catch (error) {
      console.warn("检查配置状态失败:", error);
      return false;
    }
  }

  /**
   * 获取配置统计信息（调试用）
   */
  async getConfigStats(): Promise<{
    isConfigured: boolean;
    version?: string;
    lastUpdated?: string;
    brandCount?: number;
    storeCount?: number;
  }> {
    try {
      const config = await this.getConfig();

      if (!config) {
        return { isConfigured: false };
      }

      return {
        isConfigured: true,
        version: config.metadata.version,
        lastUpdated: config.metadata.lastUpdated,
        brandCount: Object.keys(config.brandData.brands).length,
        storeCount: config.brandData.stores.length,
      };
    } catch (error) {
      console.error("获取配置统计失败:", error);
      return { isConfigured: false };
    }
  }
}

// 导出单例实例
export const configService = new AppConfigService();

/**
 * 便捷函数：检查是否需要迁移
 */
export async function needsMigration(): Promise<boolean> {
  return !(await configService.isConfigured());
}

/**
 * 便捷函数：获取品牌数据
 */
export async function getBrandData(): Promise<ZhipinData | null> {
  const config = await configService.getConfig();
  return config?.brandData || null;
}

/**
 * 便捷函数：获取系统提示词
 */
export async function getSystemPrompts(): Promise<SystemPromptsConfig | null> {
  const config = await configService.getConfig();
  return config?.systemPrompts || null;
}

/**
 * 便捷函数：获取回复提示词
 */
export async function getReplyPrompts(): Promise<ReplyPromptsConfig | null> {
  const config = await configService.getConfig();
  return config?.replyPrompts || null;
}
