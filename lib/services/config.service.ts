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
   * 更新活动系统提示词
   */
  async updateActiveSystemPrompt(promptType: keyof SystemPromptsConfig): Promise<void> {
    const currentConfig = await this.getConfig();
    if (!currentConfig) {
      throw new Error("配置数据不存在，请先进行初始化");
    }

    await this.saveConfig({
      ...currentConfig,
      activeSystemPrompt: promptType,
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

/**
 * 便捷函数：获取活动系统提示词类型
 */
export async function getActiveSystemPromptType(): Promise<keyof SystemPromptsConfig> {
  const config = await configService.getConfig();
  return config?.activeSystemPrompt || "bossZhipinSystemPrompt";
}

/**
 * 浏览器环境迁移函数
 * 从硬编码数据创建配置，仅在浏览器环境中使用
 */
export async function migrateFromHardcodedData(): Promise<void> {
  // 检查是否在浏览器环境
  if (typeof window === "undefined") {
    throw new Error("迁移功能只能在浏览器环境中使用");
  }

  try {
    // 动态导入硬编码数据（仅在浏览器中）
    const [
      { zhipinData },
      { getBossZhipinSystemPrompt, getGeneralComputerSystemPrompt },
    ] = await Promise.all([
      import("../../lib/data/sample-data"),
      import("../../lib/system-prompts"),
    ]);

    // 智能回复指令配置
    const replyPromptsConfig: ReplyPromptsConfig = {
      initial_inquiry: `作为招聘助手，参考这个模板回复: "你好，{city}各区有{brand}门店在招人，排班{hours}小时，时薪{salary}元，{level_salary}"。语气要自然，突出薪资。`,
      location_inquiry: `候选人问位置，用这个模板回复: "你好，{city}各区都有门店，你在什么位置？我帮你查下附近"。必须问对方位置。`,
      location_match: `找到匹配门店，用这个模板回复: "离你比较近在{location}，空缺{schedule}"。强调距离近和具体班次。`,
      no_location_match: `附近无门店，按这个话术处理: "你附近暂时没岗位，{alternative_location}的门店考虑吗？"。同时，主动询问是否可以加微信，告知以后有其他机会可以推荐。`,
      salary_inquiry: `薪资咨询，按这个模板提供信息: "基本薪资{salary}元/小时，{level_salary}"。需要包含阶梯薪资说明。`,
      schedule_inquiry: `时间安排咨询，参考这个话术: "门店除了{time1}空缺，还有{time2}也空缺呢，可以和店长商量"。强调时间灵活性。`,
      interview_request: `面试邀约，严格按照这个话术: "可以帮你和店长约面试，方便加下微信吗，需要几项简单的个人信息"。必须主动要微信。`,
      age_concern: `年龄问题，严格按运营指南处理：
      - 符合要求(18-45岁): "你的年龄没问题的"
      - 超出要求: "你附近目前没有岗位空缺了"
      绝不透露具体年龄限制。`,
      insurance_inquiry: `保险咨询，使用固定话术:
      - 标准回复: "有商业保险"
      简洁明确，不展开说明。`,
      followup_chat: `跟进聊天，参考这个话术模板保持联系: "门店除了{position1}还有{position2}也空缺的，可以和店长商量"。营造机会丰富的感觉。`,
      general_chat: `通用回复，引导到具体咨询。重新询问位置或工作意向，保持专业。`,
    };

    // 聚合所有配置数据
    const configData: AppConfigData = {
      // 品牌和门店数据
      brandData: zhipinData,

      // 系统级提示词
      systemPrompts: {
        bossZhipinSystemPrompt: getBossZhipinSystemPrompt(),
        generalComputerSystemPrompt: getGeneralComputerSystemPrompt(),
      },

      // 智能回复指令
      replyPrompts: replyPromptsConfig,

      // 活动系统提示词（默认使用Boss直聘）
      activeSystemPrompt: "bossZhipinSystemPrompt",

      // 配置元信息
      metadata: {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        migratedAt: new Date().toISOString(),
      },
    };

    // 保存到 localforage
    await configService.saveConfig(configData);

    console.log("✅ 浏览器环境数据迁移成功！");
  } catch (error) {
    console.error("❌ 浏览器环境数据迁移失败:", error);
    throw error;
  }
}
