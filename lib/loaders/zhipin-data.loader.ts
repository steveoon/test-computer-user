/**
 * 🎯 Boss直聘数据加载器 - 重构版
 * 从 localforage 配置服务中加载数据，替代硬编码文件
 */

import { getDynamicRegistry } from "@/lib/model-registry/dynamic-registry";
import { ZhipinData, MessageClassification, Templates } from "../../types/zhipin";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import {
  getBrandData,
  getReplyPrompts,
  migrateFromHardcodedData,
  needsMigration,
} from "../services/config.service";
import type { ReplyPromptsConfig } from "../../types/config";
import {
  DEFAULT_PROVIDER_CONFIGS,
  DEFAULT_MODEL_CONFIG,
} from "@/lib/config/models";
import type { ModelConfig } from "@/lib/config/models";

/**
 * 🎯 加载Boss直聘相关数据 - 重构版
 * 优先使用传入的配置数据，仅在浏览器环境中作为备用加载器
 * @param preferredBrand 优先使用的品牌（可选）
 * @param configData 预加载的配置数据（服务端调用时必须提供）
 * @returns Promise<ZhipinData> 返回加载的数据
 */
export async function loadZhipinData(
  preferredBrand?: string,
  configData?: ZhipinData
): Promise<ZhipinData> {
  try {
    // 🎯 如果提供了配置数据，优先使用
    if (configData) {
      console.log("✅ 使用传入的配置数据");

      // 如果指定了品牌，动态更新默认品牌
      const effectiveData =
        preferredBrand && configData.brands[preferredBrand]
          ? {
              ...configData,
              defaultBrand: preferredBrand,
            }
          : configData;

      const totalPositions = effectiveData.stores.reduce(
        (sum, store) => sum + store.positions.length,
        0
      );
      console.log(
        `📊 数据统计: ${
          effectiveData.stores.length
        } 家门店，${totalPositions} 个岗位${
          preferredBrand ? ` - 当前品牌: ${preferredBrand}` : ""
        }`
      );
      return effectiveData;
    }

    // 🌐 浏览器环境备用逻辑：从 localforage 加载
    if (typeof window !== "undefined") {
      console.log("🌐 浏览器环境，从 localforage 加载配置");

      // 检查是否需要迁移
      if (await needsMigration()) {
        console.log("🔄 检测到首次使用，正在自动执行数据迁移...");
        try {
          await migrateFromHardcodedData();
          console.log("✅ 数据迁移完成");
        } catch (migrationError) {
          console.error("❌ 自动迁移失败:", migrationError);
          throw new Error("浏览器环境数据迁移失败");
        }
      }

      // 从配置服务加载品牌数据
      const brandData = await getBrandData();
      if (!brandData) {
        throw new Error("浏览器环境配置数据未找到");
      }

      // 应用品牌选择
      const effectiveData =
        preferredBrand && brandData.brands[preferredBrand]
          ? { ...brandData, defaultBrand: preferredBrand }
          : brandData;

      const totalPositions = effectiveData.stores.reduce(
        (sum, store) => sum + store.positions.length,
        0
      );
      console.log(
        `✅ 已从配置服务加载 ${
          effectiveData.stores.length
        } 家门店数据 (${totalPositions} 个岗位)${
          preferredBrand ? ` - 当前品牌: ${preferredBrand}` : ""
        }`
      );
      return effectiveData;
    }

    // 🚨 服务端环境必须提供配置数据
    throw new Error(
      "服务端环境必须提供 configData 参数，不再支持硬编码数据读取"
    );
  } catch (error) {
    console.error("❌ 数据加载失败:", error);
    throw error; // 不再降级，明确报错
  }
}

/**
 * 获取品牌名称（支持多品牌结构）
 * @param data Boss直聘数据
 * @param preferredBrand 优先使用的品牌
 * @returns 品牌名称
 */
function getBrandName(data: ZhipinData, preferredBrand?: string): string {
  if (preferredBrand && data.brands[preferredBrand]) {
    return preferredBrand;
  }
  return data.defaultBrand || Object.keys(data.brands)[0] || "未知品牌";
}

/**
 * 根据消息内容和上下文生成智能回复
 * @param data Boss直聘数据
 * @param message 候选人消息
 * @param context 回复上下文
 * @returns 生成的回复内容
 */
export function generateSmartReply(
  data: ZhipinData,
  message: string = "",
  context: string = "initial_inquiry"
): string {
  const msg = message.toLowerCase();

  // 1. 主动沟通/初次咨询场景
  if (
    context === "initial_inquiry" ||
    msg.includes("咨询") ||
    msg.includes("兼职") ||
    msg.includes("工作")
  ) {
    // 🎯 使用数据对象中的默认品牌（已在 loadZhipinData 中设置为用户选择的品牌）
    const targetBrand = getBrandName(data);
    const brandStores = data.stores.filter(
      (store) => store.brand === targetBrand
    );
    const availableStores = brandStores.length > 0 ? brandStores : data.stores;

    const randomStore =
      availableStores[Math.floor(Math.random() * availableStores.length)];
    const randomPosition =
      randomStore.positions[
        Math.floor(Math.random() * randomStore.positions.length)
      ];

    const brandName = getBrandName(data);
    let reply = `你好，${data.city}各区有${brandName}门店岗位空缺，兼职排班 ${randomPosition.workHours} 小时。基本薪资：${randomPosition.baseSalary} 元/小时。`;
    if (randomPosition.levelSalary) {
      reply += `阶梯薪资：${randomPosition.levelSalary}`;
    }
    return reply;
  }

  // 2. 位置咨询场景
  if (
    context === "location_inquiry" ||
    msg.includes("位置") ||
    msg.includes("在哪") ||
    msg.includes("地址")
  ) {
    return `你好，${data.city}目前各区有门店岗位空缺，你在什么位置？我可以查下你附近`;
  }

  // 3. 具体位置匹配场景
  if (
    msg.includes("徐汇") ||
    msg.includes("静安") ||
    msg.includes("浦东") ||
    msg.includes("黄浦") ||
    msg.includes("长宁")
  ) {
    const targetStore =
      data.stores.find((store) =>
        msg.includes(store.district.substring(0, 2))
      ) || data.stores[0];

    const position = targetStore.positions[0];
    const timeSlot = position.timeSlots[0];

    return `目前离你比较近在 ${targetStore.location}，空缺 ${timeSlot}`;
  }

  // 4. 时间安排咨询
  if (
    context === "schedule_inquiry" ||
    msg.includes("时间") ||
    msg.includes("班次") ||
    msg.includes("排班")
  ) {
    // 🎯 使用数据对象中的默认品牌（已在 loadZhipinData 中设置为用户选择的品牌）
    const targetBrand = getBrandName(data);
    const brandStores = data.stores.filter(
      (store) => store.brand === targetBrand
    );
    const availableStores = brandStores.length > 0 ? brandStores : data.stores;

    const randomStore =
      availableStores[Math.floor(Math.random() * availableStores.length)];
    const position = randomStore.positions[0];

    return `门店除了${position.timeSlots[0]}空缺，还有${
      position.timeSlots[1] || position.timeSlots[0]
    }也空缺呢，如果对排班时间有要求，可以和店长商量呢`;
  }

  // 5. 面试邀约场景
  if (
    context === "interview_request" ||
    msg.includes("面试") ||
    msg.includes("去店里") ||
    msg.includes("什么时候")
  ) {
    return "可以帮您和店长约面试呢，麻烦加一下我微信吧，需要几项简单的个人信息";
  }

  // 6. 年龄相关问题处理
  if (msg.includes("年龄") || msg.includes("岁")) {
    if (
      msg.includes("50") ||
      msg.includes("五十") ||
      msg.includes("18") ||
      msg.includes("十八")
    ) {
      return "您附近目前没有岗位空缺了";
    }
    return "您的年龄没问题的";
  }

  // 7. 社保相关问题
  if (msg.includes("社保") || msg.includes("保险")) {
    return "有商业保险";
  }

  // 8. 薪资咨询
  if (msg.includes("工资") || msg.includes("薪资") || msg.includes("多少钱")) {
    // 🎯 使用数据对象中的默认品牌（已在 loadZhipinData 中设置为用户选择的品牌）
    const targetBrand = getBrandName(data);
    const brandStores = data.stores.filter(
      (store) => store.brand === targetBrand
    );
    const availableStores = brandStores.length > 0 ? brandStores : data.stores;

    const randomStore =
      availableStores[Math.floor(Math.random() * availableStores.length)];
    const position = randomStore.positions[0];

    let reply = `基本薪资是 ${position.baseSalary} 元/小时`;
    if (position.levelSalary) {
      reply += `，${position.levelSalary}`;
    }
    return reply;
  }

  // 9. 通用私聊话术（保持联系）
  if (context === "general_chat") {
    // 🎯 使用数据对象中的默认品牌（已在 loadZhipinData 中设置为用户选择的品牌）
    const brandName = getBrandName(data);

    const alternatives = [
      `门店除了服务员岗位还有洗碗工岗位也空缺的，如果服务员觉得不合适，可以和店长商量呢`,
      `门店除了早班空缺，还有晚班也空缺呢，如果对排班时间有要求，可以和店长商量呢`,
      `这家门店不合适也没关系的，以后还有其他店空缺的，到时候可以再报名呢`,
      `${brandName}您愿意做吗？我同时还负责其他品牌的招募，您要有兴趣的话，可以看看呢？`,
    ];
    return alternatives[Math.floor(Math.random() * alternatives.length)];
  }

  // 10. 默认回复
  return `你好，${data.city}目前各区有门店岗位空缺，你在什么位置？我可以查下你附近`;
}

/**
 * 使用LLM分析候选人消息的意图和提取关键信息
 * @param message 候选人消息
 * @param conversationHistory 对话历史（可选）
 * @param data Boss直聘数据
 * @param modelConfig 模型配置（可选）
 * @returns Promise<Classification> 分类结果
 */
export async function classifyUserMessage(
  message: string = "",
  conversationHistory: string[] = [],
  data: ZhipinData,
  modelConfig?: ModelConfig
): Promise<MessageClassification> {
  // 🎯 获取配置的模型和provider设置
  const classifyModel =
    modelConfig?.classifyModel || DEFAULT_MODEL_CONFIG.classifyModel;
  const providerConfigs =
    modelConfig?.providerConfigs || DEFAULT_PROVIDER_CONFIGS;

  // 使用动态registry
  const dynamicRegistry = getDynamicRegistry(providerConfigs);

  console.log(`[CLASSIFY] 使用模型: ${classifyModel}`);

  // 构建对话历史上下文
  const conversationContext =
    conversationHistory.length > 0
      ? `\n对话历史：${conversationHistory.slice(-3).join("\n")}`
      : "";

  // 使用generateObject进行智能分类
  const { object: classification } = await generateObject({
    model: dynamicRegistry.languageModel(classifyModel),
    schema: z.object({
      replyType: z
        .enum([
          "initial_inquiry", // 初次咨询
          "location_inquiry", // 位置咨询
          "location_match", // 位置匹配
          "no_location_match", // 无位置匹配
          "schedule_inquiry", // 时间安排咨询
          "interview_request", // 面试邀约
          "salary_inquiry", // 薪资咨询
          "age_concern", // 年龄相关
          "insurance_inquiry", // 保险咨询
          "followup_chat", // 跟进聊天
          "general_chat", // 一般聊天
        ])
        .describe("回复类型分类"),
      extractedInfo: z
        .object({
          mentionedBrand: z
            .string()
            .nullable()
            .optional()
            .describe("提到的品牌名称"),
          city: z.string().nullable().optional().describe("提到的工作城市"),
          mentionedLocations: z
            .array(
              z.object({
                location: z.string().describe("地点名称"),
                confidence: z
                  .number()
                  .min(0)
                  .max(1)
                  .describe("地点识别置信度 0-1"),
              })
            )
            .max(3)
            .nullable()
            .optional()
            .describe("提到的具体位置（按置信度排序，最多3个）"),
          mentionedDistrict: z
            .string()
            .nullable()
            .optional()
            .describe("提到的区域"),
          specificAge: z
            .number()
            .nullable()
            .optional()
            .describe("提到的具体年龄"),
          hasUrgency: z
            .boolean()
            .nullable()
            .optional()
            .describe("是否表达紧急需求"),
          preferredSchedule: z
            .string()
            .nullable()
            .optional()
            .describe("偏好的工作时间"),
        })
        .describe("从消息中提取的关键信息"),
      reasoning: z.string().describe("分类依据和分析过程"),
    }),
    prompt: `分析这条候选人消息的意图类型，并提取关键信息：

    候选人消息："${message}"${conversationContext}

    当前可招聘的品牌和门店信息：
    ${Object.keys(data.brands)
      .map((brand) => {
        const brandStores = data.stores.filter(
          (store) => store.brand === brand
        );
        return `\n【${brand}】- ${brandStores.length}家门店：
    ${brandStores
      .map(
        (store) =>
          `  • ${store.name}（${store.district}${store.subarea}）：${
            store.location
          }
        职位：${store.positions
          .map(
            (pos) =>
              `${pos.name}（${pos.timeSlots.join("、")}，${
                pos.baseSalary
              }元/时）`
          )
          .join("、")}`
      )
      .join("\n")}`;
      })
      .join("\n")}

    🏷️ 品牌关键词：${Object.keys(data.brands)
      .map((brand) => `"${brand}"`)
      .join("、")}
    ⭐ 默认品牌：${data.defaultBrand || getBrandName(data)}
    🌍 工作城市：${data.city}

    ⚠️ 重要提示：
    - 品牌名称中可能包含城市名（如"成都你六姐"），请勿将品牌名中的城市误识别为工作地点
    - 实际工作城市是：${data.city}
    - 只有候选人明确询问具体区域/位置时，才提取为mentionedLocations
    - 品牌名中的地点信息不应影响地点识别

    分类规则：
    - initial_inquiry: 初次咨询工作机会，没有具体指向
    - location_inquiry: 询问位置信息，但没提到具体位置
    - location_match: 同时提到品牌和具体位置，可以精确匹配
    - no_location_match: 提到位置但无法匹配到门店
    - salary_inquiry: 询问薪资待遇
    - schedule_inquiry: 询问工作时间安排
    - interview_request: 表达面试意向
    - age_concern: 询问年龄要求（敏感话题，需按固定话术回复）
    - insurance_inquiry: 询问保险福利（敏感话题，固定回复"有商业保险"）
    - followup_chat: 需要跟进的聊天
    - general_chat: 一般性对话
    
    🚨 敏感话题识别关键词：
    年龄相关：年龄、岁、多大、老了、小了
    保险相关：保险、社保、五险一金
    身体相关：残疾、身体、健康问题

    请准确识别意图类型，提取关键信息，并说明分类依据。`,
  });

  return classification;
}

/**
 * 基于LLM的智能回复生成函数 - 重构版
 * 优先使用传入的配置数据，服务端调用时必须提供
 * @param message 候选人消息
 * @param conversationHistory 对话历史（可选）
 * @param preferredBrand 优先使用的品牌（可选）
 * @param modelConfig 模型配置（可选）
 * @param configData 预加载的配置数据（服务端调用时必须提供）
 * @param replyPrompts 预加载的回复指令（服务端调用时必须提供）
 * @returns Promise<string> 生成的智能回复
 */
export async function generateSmartReplyWithLLM(
  message: string = "",
  conversationHistory: string[] = [],
  preferredBrand?: string,
  modelConfig?: ModelConfig,
  configData?: ZhipinData,
  replyPrompts?: ReplyPromptsConfig
): Promise<string> {
  try {
    // 🎯 获取配置的模型和provider设置
    const replyModel =
      modelConfig?.replyModel || DEFAULT_MODEL_CONFIG.replyModel;
    const providerConfigs =
      modelConfig?.providerConfigs || DEFAULT_PROVIDER_CONFIGS;

    // 使用动态registry
    const dynamicRegistry = getDynamicRegistry(providerConfigs);

    console.log(`[REPLY] 使用模型: ${replyModel}`);

    // 🎯 优先使用传入的配置数据
    let data: ZhipinData;
    let effectiveReplyPrompts: ReplyPromptsConfig;

    if (configData && replyPrompts) {
      console.log("✅ 使用传入的配置数据和回复指令");
      data = await loadZhipinData(preferredBrand, configData);
      effectiveReplyPrompts = replyPrompts;
    } else if (typeof window !== "undefined") {
      // 🌐 浏览器环境备用：从 localforage 加载
      console.log("🌐 浏览器环境，从配置服务加载数据");
      data = await loadZhipinData(preferredBrand);

      const loadedReplyPrompts = await getReplyPrompts();
      if (!loadedReplyPrompts) {
        throw new Error("浏览器环境回复指令配置未找到");
      }
      effectiveReplyPrompts = loadedReplyPrompts;
    } else {
      // 🚨 服务端环境必须提供配置数据
      throw new Error("服务端环境必须提供 configData 和 replyPrompts 参数");
    }

    // 第一步：使用独立的分类函数进行智能分类
    const classification = await classifyUserMessage(
      message,
      conversationHistory,
      data,
      modelConfig // 传递模型配置
    );

    const systemPromptInstruction =
      effectiveReplyPrompts[
        classification.replyType as keyof typeof effectiveReplyPrompts
      ] || effectiveReplyPrompts.general_chat;

    // 构建上下文信息
    const contextInfo = buildContextInfo(data, classification.extractedInfo);

    // 生成最终回复
    const finalReply = await generateText({
      model: dynamicRegistry.languageModel(replyModel),
      system: `你是专业的招聘助手。

      # 回复规则
      1.  **优先使用品牌专属话术**: 如果"当前招聘数据上下文"中包含当前品牌的专属话术，必须优先使用该模板生成回复。
      2.  **参考通用指令**: 如果没有品牌专属话术，或专属话术不适用，则遵循下面的"通用回复指令"。
      3.  **保持真人语气**: 回复要自然、口语化，像真人对话。避免使用"您"、感叹号或过于官方、热情的词汇。
      4.  **严格遵守敏感话题规则**: 遇到年龄、社保等敏感问题，必须使用固定的安全话术。

      # 通用回复指令
      ${systemPromptInstruction}

      # 当前招聘数据上下文
      ${contextInfo}

      # LLM分析过程
      - 回复类型: ${classification.replyType}
      - 提取信息: ${JSON.stringify(classification.extractedInfo, null, 2)}
      - 分析依据: ${classification.reasoning}

      📋 核心要求:
      - 严格遵循回复规则的优先级。
      - 回复必须简洁、自然，像一个正在打字的真人。
      - 根据候选人消息和上下文，将模板中的 {placeholder} 替换为具体信息。
      - 控制字数在10-20字以内。
      - 如果候选人询问的品牌不是当前品牌的，则告知对方，我们目前只招聘{brand}品牌的岗位。

      请生成最终回复。`,
      prompt: `候选人消息："${message}"${
        conversationHistory.length > 0
          ? `\n对话历史：${conversationHistory.slice(-3).join("\n")}`
          : ""
      }`,
    });

    return finalReply.text;
  } catch (error) {
    console.error("LLM智能回复生成失败:", error);

    try {
      // 降级逻辑：仅在浏览器环境中尝试
      if (typeof window !== "undefined") {
        console.log("🔄 降级模式：尝试从浏览器配置加载");
        const data = await loadZhipinData(preferredBrand);

        // 尝试使用分类功能确定回复类型
        let replyContext = "initial_inquiry"; // 默认值

        try {
          const classification = await classifyUserMessage(
            message,
            conversationHistory,
            data,
            modelConfig // 传递模型配置
          );
          replyContext = classification.replyType;
          console.log(`✅ 降级模式使用分类结果: ${replyContext}`);
        } catch (classificationError) {
          console.error("分类功能也失败，使用默认分类:", classificationError);
          // 保持默认值 "initial_inquiry"
        }

        return generateSmartReply(data, message, replyContext);
      } else {
        // 服务端环境降级：返回错误回复
        console.error("服务端环境无法降级，缺少必要的配置数据");
        return "抱歉，当前系统繁忙，请稍后再试或直接联系我们的客服。";
      }
    } catch (dataError) {
      console.error("降级模式数据加载失败，返回通用错误回复:", dataError);
      // 最终降级：返回通用错误回复
      return "抱歉，当前系统繁忙，请稍后再试或直接联系我们的客服。";
    }
  }
}

/**
 * 构建上下文信息，根据提取的信息筛选相关数据
 */
function buildContextInfo(
  data: ZhipinData,
  extractedInfo: {
    mentionedBrand?: string | null;
    city?: string | null;
    mentionedLocations?: Array<{
      location: string;
      confidence: number;
    }> | null;
    mentionedDistrict?: string | null;
    specificAge?: number | null;
    hasUrgency?: boolean | null;
    preferredSchedule?: string | null;
  }
): string {
  const { mentionedBrand, city, mentionedLocations, mentionedDistrict } =
    extractedInfo;

  // 根据提到的品牌过滤门店
  let targetBrand = data.defaultBrand || getBrandName(data);
  let relevantStores = data.stores;

  if (mentionedBrand && data.brands[mentionedBrand]) {
    // 有明确提到的品牌，使用该品牌
    relevantStores = data.stores.filter(
      (store) => store.brand === mentionedBrand
    );
    targetBrand = mentionedBrand;
  } else {
    // 没有提到品牌，使用默认品牌的门店
    relevantStores = data.stores.filter((store) => store.brand === targetBrand);
  }

  // 优先使用明确提到的工作城市进行过滤
  if (city && city !== data.city) {
    // 如果提到的城市与数据城市不匹配，记录但不过滤（避免误判）
    console.warn(`候选人提到的城市 "${city}" 与数据城市 "${data.city}" 不匹配`);
  }

  // 根据提到的位置进一步过滤（按置信度排序）
  if (mentionedLocations && mentionedLocations.length > 0) {
    // 按置信度降序排序
    const sortedLocations = mentionedLocations.sort(
      (a, b) => b.confidence - a.confidence
    );

    // 尝试按置信度匹配位置
    for (const { location, confidence } of sortedLocations) {
      const filteredStores = relevantStores.filter(
        (store) =>
          store.name.includes(location) ||
          store.location.includes(location) ||
          store.district.includes(location) ||
          store.subarea.includes(location)
      );

      if (filteredStores.length > 0) {
        relevantStores = filteredStores;
        console.log(`✅ 位置匹配成功: ${location} (置信度: ${confidence})`);
        break;
      } else {
        console.log(`❌ 位置匹配失败: ${location} (置信度: ${confidence})`);
      }
    }
  }

  // 如果还有mentionedDistrict，作为补充过滤条件
  if (mentionedDistrict && relevantStores.length === data.stores.length) {
    const districtFiltered = relevantStores.filter(
      (store) =>
        store.district.includes(mentionedDistrict) ||
        store.subarea.includes(mentionedDistrict)
    );
    if (districtFiltered.length > 0) {
      relevantStores = districtFiltered;
    }
  }

  // 构建上下文信息
  let context = `默认推荐品牌：${targetBrand}\n`;

  if (relevantStores.length > 0) {
    context += `匹配到的门店信息：\n`;
    relevantStores.slice(0, 3).forEach((store) => {
      context += `• ${store.name}（${store.district}${store.subarea}）：${store.location}\n`;
      store.positions.forEach((pos) => {
        context += `  职位：${pos.name}，时间：${pos.timeSlots.join(
          "、"
        )}，薪资：${pos.baseSalary}元/时\n`;
        if (pos.levelSalary) {
          context += `  阶梯薪资：${pos.levelSalary}\n`;
        }
        if (pos.benefits && pos.benefits !== "无") {
          context += `  福利：${pos.benefits}\n`;
        }
      });
    });
  } else {
    context += `暂无完全匹配的门店，可推荐其他区域门店\n`;
    context += `⚠️ 无匹配时必须：主动要微信联系方式，告知"以后有其他门店空了可以再推给你"\n`;
  }

  // 添加品牌专属模板话术参考
  const brandConfig = data.brands[targetBrand];
  if (brandConfig && brandConfig.templates) {
    const templateMap: { [key: string]: string } = {
      proactive: "主动沟通",
      inquiry: "位置咨询",
      location_match: "位置匹配",
      no_match: "无匹配",
      interview: "面试邀约",
      salary_inquiry: "薪资咨询",
      schedule_inquiry: "排班咨询",
      followup: "跟进话术",
    };

    context += `\n📋 ${targetBrand}品牌专属话术模板：\n`;
    for (const key in templateMap) {
      if (
        Object.prototype.hasOwnProperty.call(brandConfig.templates, key) &&
        brandConfig.templates[key as keyof Templates] &&
        (brandConfig.templates[key as keyof Templates] as string[]).length > 0
      ) {
        const templateName = templateMap[key];
        const templateContent =
          brandConfig.templates[key as keyof typeof brandConfig.templates]?.[0];
        if (templateContent) {
          context += `${templateName}：${templateContent}\n`;
        }
      }
    }
  }

  // 添加敏感话题固定回复提醒
  context += `\n🚨 敏感话题固定回复：\n`;
  context += `年龄合适："你的年龄没问题的" | 年龄不合适："你附近目前没有岗位空缺了"\n`;
  context += `保险咨询："有商业保险"\n`;
  context += `残疾人咨询："不好意思"\n`;

  return context;
}
