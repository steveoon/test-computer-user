import { registry } from "@/lib/model-registry";
import { ZhipinData } from "../../types/zhipin";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { zhipinData } from "../data/sample-data";

/**
 * 🎯 加载Boss直聘相关数据 - 优化版
 * @param preferredBrand 优先使用的品牌（可选）
 * @returns Promise<ZhipinData> 返回加载的数据
 */
export async function loadZhipinData(
  preferredBrand?: string
): Promise<ZhipinData> {
  try {
    // 🎯 如果指定了品牌，动态更新默认品牌
    const effectiveData =
      preferredBrand && zhipinData.brands[preferredBrand]
        ? {
            ...zhipinData,
            defaultBrand: preferredBrand,
          }
        : zhipinData;

    const totalPositions = effectiveData.stores.reduce(
      (sum, store) => sum + store.positions.length,
      0
    );
    console.log(
      `✅ 已加载 ${
        effectiveData.stores.length
      } 家门店数据 (${totalPositions} 个岗位)${
        preferredBrand ? ` - 当前品牌: ${preferredBrand}` : ""
      }`
    );
    return effectiveData;
  } catch (error) {
    console.warn("⚠️ 无法加载JSON数据，使用备用数据:", error);

    // 备用数据
    return {
      city: "上海",
      defaultBrand: "某知名餐饮品牌",
      stores: [
        {
          id: "store_001",
          name: "徐汇店",
          location: "徐汇区漕溪路",
          district: "徐汇区",
          subarea: "徐汇",
          coordinates: { lat: 31.1956, lng: 121.4349 },
          transportation: "地铁1号线",
          brand: "某知名餐饮品牌",
          positions: [
            {
              id: "pos_001",
              name: "服务员",
              timeSlots: ["09:00~17:00", "17:00~22:00", "09:00~14:00"],
              baseSalary: 22,
              levelSalary: "表现优秀可达25-28元/小时",
              workHours: "6~8",
              benefits: "有商业保险",
              requirements: ["18-45岁", "有服务经验优先"],
              urgent: true,
            },
          ],
        },
      ],
      brands: {
        某知名餐饮品牌: {
          templates: {
            proactive: [
              "你好，上海各区有{brand}门店岗位空缺，兼职排班 {hours} 小时。基本薪资：{salary} 元/小时。{level_salary}",
            ],
            inquiry: [
              "你好，{city}目前各区有门店岗位空缺，你在什么位置？我可以查下你附近",
            ],
            location_match: ["目前离你比较近在 {location}，空缺 {schedule}"],
            no_match: [
              "目前你附近没有岗位空缺呢，{alternative_location}的门店考虑吗？",
            ],
            interview: [
              "可以帮您和店长约面试呢，麻烦加一下我微信吧，需要几项简单的个人信息",
            ],
            followup: [
              "门店除了{position1}岗位还有{position2}岗位也空缺的，如果{position1}觉得不合适，可以和店长商量呢",
            ],
          },
          screening: {
            age: { min: 18, max: 50, preferred: [20, 30, 40] },
            blacklistKeywords: ["骗子", "不靠谱", "假的"],
            preferredKeywords: ["经验", "稳定", "长期"],
          },
        },
      },
      templates: {
        proactive: [
          "你好，上海各区有门店岗位空缺，兼职排班 {hours} 小时。基本薪资：{salary} 元/小时。{level_salary}",
        ],
        inquiry: [
          "你好，上海目前各区有门店岗位空缺，你在什么位置？我可以查下你附近",
        ],
        location_match: ["目前离你比较近在 {location}，空缺 {schedule}"],
        no_match: [
          "目前你附近没有岗位空缺呢，{alternative_location}的门店考虑吗？",
        ],
        interview: [
          "可以帮您和店长约面试呢，麻烦加一下我微信吧，需要几项简单的个人信息",
        ],
        followup: [
          "门店除了{position1}岗位还有{position2}岗位也空缺的，如果{position1}觉得不合适，可以和店长商量呢",
        ],
      },
      screening: {
        age: { min: 18, max: 50, preferred: [20, 30, 40] },
        blacklistKeywords: ["骗子", "不靠谱", "假的"],
        preferredKeywords: ["经验", "稳定", "长期"],
      },
    };
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
    // 优先使用默认品牌的门店
    const defaultBrand = getBrandName(data);
    const brandStores = data.stores.filter(
      (store) => store.brand === defaultBrand
    );
    const availableStores = brandStores.length > 0 ? brandStores : data.stores;

    const randomStore =
      availableStores[Math.floor(Math.random() * availableStores.length)];
    const randomPosition =
      randomStore.positions[
        Math.floor(Math.random() * randomStore.positions.length)
      ];

    const brandName = getBrandName(data, randomStore.brand);
    let reply = `你好，上海各区有${brandName}门店岗位空缺，兼职排班 ${randomPosition.workHours} 小时。基本薪资：${randomPosition.baseSalary} 元/小时。`;
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
    // 优先使用默认品牌的门店
    const defaultBrand = getBrandName(data);
    const brandStores = data.stores.filter(
      (store) => store.brand === defaultBrand
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
    // 优先使用默认品牌的门店
    const defaultBrand = getBrandName(data);
    const brandStores = data.stores.filter(
      (store) => store.brand === defaultBrand
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
    const alternatives = [
      `门店除了服务员岗位还有洗碗工岗位也空缺的，如果服务员觉得不合适，可以和店长商量呢`,
      `门店除了早班空缺，还有晚班也空缺呢，如果对排班时间有要求，可以和店长商量呢`,
      `这家门店不合适也没关系的，以后还有其他店空缺的，到时候可以再报名呢`,
      `${getBrandName(
        data
      )}您愿意做吗？我同时还负责其他品牌的招募，您要有兴趣的话，可以看看呢？`,
    ];
    return alternatives[Math.floor(Math.random() * alternatives.length)];
  }

  // 10. 默认回复
  return `你好，${data.city}目前各区有门店岗位空缺，你在什么位置？我可以查下你附近`;
}

/**
 * 基于LLM的智能回复生成函数
 * @param message 候选人消息
 * @param conversationHistory 对话历史（可选）
 * @returns Promise<string> 生成的智能回复
 */
export async function generateSmartReplyWithLLM(
  message: string = "",
  conversationHistory: string[] = [],
  preferredBrand?: string
): Promise<string> {
  try {
    // 加载Boss直聘数据（支持品牌选择）
    const data = await loadZhipinData(preferredBrand);

    // 构建对话历史上下文
    const conversationContext =
      conversationHistory.length > 0
        ? `\n对话历史：${conversationHistory.slice(-3).join("\n")}`
        : "";

    // 第一步：使用generateObject进行智能分类
    const { object: classification } = await generateObject({
      model: registry.languageModel("qwen/qwen-max-2025-01-25"),
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

    // 第二步：基于分类结果生成智能回复
    const replySystemPrompts = {
      initial_inquiry: `你是专业的招聘助手。严格按照模板话术生成回复：
      参考模板："你好，{city}各区有{brand}门店岗位空缺，兼职排班{hours}小时。基本薪资：{salary}元/小时。{level_salary}"
      语调要热情专业，突出薪资优势。`,

      location_inquiry: `候选人询问位置，严格按照话术模板：
      参考模板："你好，{city}目前各区有门店岗位空缺，你在什么位置？我可以查下你附近"
      必须询问候选人具体位置。`,

      location_match: `找到匹配门店！严格按照话术模板：
      参考模板："目前离你比较近在{location}，空缺{schedule}"
      强调距离优势和具体班次。`,

      no_location_match: `附近无门店，严格按照话术处理：
      参考模板："目前你附近没有岗位空缺呢，{alternative_location}的门店考虑吗？" 
      ⚠️重要：主动询问对方微信联系方式，告知以后有其他门店。`,

      salary_inquiry: `薪资咨询，按模板提供详细信息：
      格式："基本薪资{salary}元/小时，{level_salary}"
      必须包含阶梯薪资说明。`,

      schedule_inquiry: `时间安排咨询，按话术模板：
      参考："门店除了{time1}空缺，还有{time2}也空缺呢，可以和店长商量"
      强调时间灵活性。`,

      interview_request: `面试邀约，严格按照话术：
      参考模板："可以帮您和店长约面试呢，方便加您微信，需要几项简单的个人信息"
      必须询问对方微信联系方式。`,

      age_concern: `年龄问题，严格按运营指南处理：
      ✅ 符合要求(18-45岁)："您的年龄没问题的"
      ❌ 超出要求："您附近目前没有岗位空缺了"
      绝不透露具体年龄限制。`,

      insurance_inquiry: `保险咨询，固定话术：
      标准回复："有商业保险"
      简洁明确，不展开说明。`,

      followup_chat: `跟进聊天，按话术模板保持联系：
      参考："门店除了{position1}还有{position2}也空缺的，可以和店长商量呢"
      营造机会丰富感，避免给人"骗子"印象。`,

      general_chat: `通用回复，引导到具体咨询：
      重新询问位置或工作意向，保持专业态度。`,
    };

    const systemPrompt =
      replySystemPrompts[
        classification.replyType as keyof typeof replySystemPrompts
      ] || replySystemPrompts.general_chat;

    // 构建上下文信息
    const contextInfo = buildContextInfo(data, classification.extractedInfo);

    // 生成最终回复
    const finalReply = await generateText({
      model: registry.languageModel("qwen/qwen-plus-latest"),
      system: `${systemPrompt}
      当前招聘数据上下文：
      ${contextInfo}

      分类分析结果：
      - 回复类型：${classification.replyType}
      - 提取信息：${JSON.stringify(classification.extractedInfo, null, 2)}
      - 分析依据：${classification.reasoning}

      📋 严格遵循运营指南要求：
      • 敏感话题按固定话术回复，不可随意发挥
      • 无匹配岗位时主动要微信，告知其他门店机会
      • 使用品牌专属模板话术，保持专业形象
      • 避免给人"骗子"印象，营造机会丰富感
      
      请基于以上信息生成自然、专业且符合模板的回复。回复要简洁有力，大约10-20字。`,
      prompt: `候选人消息："${message}"${conversationContext}`,
    });

    return finalReply.text;
  } catch (error) {
    console.error("LLM智能回复生成失败:", error);
    // 降级到原有逻辑
    const data = await loadZhipinData();
    return generateSmartReply(data, message, "initial_inquiry");
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
    context += `\n📋 ${targetBrand}品牌专属话术模板：\n`;
    context += `主动沟通：${brandConfig.templates.proactive[0]}\n`;
    context += `位置咨询：${brandConfig.templates.inquiry[0]}\n`;
    context += `位置匹配：${brandConfig.templates.location_match[0]}\n`;
    context += `无匹配：${brandConfig.templates.no_match[0]}\n`;
    context += `面试邀约：${brandConfig.templates.interview[0]}\n`;
  }

  // 添加敏感话题固定回复提醒
  context += `\n🚨 敏感话题固定回复：\n`;
  context += `年龄合适："您的年龄没问题的" | 年龄不合适："您附近目前没有岗位空缺了"\n`;
  context += `保险咨询："有商业保险"\n`;
  context += `残疾人咨询："不好意思"\n`;

  return context;
}
