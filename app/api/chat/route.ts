import { streamText, UIMessage } from "ai";
import { killDesktop } from "@/lib/e2b/utils";
import { bashTool, computerTool } from "@/lib/e2b/tool";
import { feishuBotTool } from "@/lib/tools/feishu-bot-tool";
import { puppeteerTool } from "@/lib/tools/puppeteer-tool";
import { weChatBotTool } from "@/lib/tools/wechat-bot-tool";
import { zhipinTools } from "@/lib/tools/zhipin";
import { prunedMessages, shouldCleanupSandbox } from "@/lib/utils";
import { getDynamicRegistry } from "@/lib/model-registry/dynamic-registry";
import { getBossZhipinSystemPrompt } from "@/lib/loaders/system-prompts.loader";
import { DEFAULT_PROVIDER_CONFIGS, DEFAULT_MODEL_CONFIG } from "@/lib/config/models";
import type { ModelConfig } from "@/lib/config/models";
import type { ZhipinData, SystemPromptsConfig, ReplyPromptsConfig } from "@/types";

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

// 清理沙箱的公共函数
async function cleanupSandboxIfNeeded(sandboxId: string, error: unknown, context: string) {
  if (shouldCleanupSandbox(error)) {
    try {
      console.log(`🧹 开始清理沙箱: ${sandboxId} (${context})`);
      await killDesktop(sandboxId);
      console.log(`✅ 沙箱清理完成: ${sandboxId}`);
    } catch (cleanupError) {
      console.warn(`Failed to cleanup sandbox in ${context}:`, cleanupError);
    }
  } else {
    console.log(`🔄 保留沙箱环境，可继续使用: ${sandboxId} (${context})`);
  }
}

export async function POST(req: Request) {
  const {
    messages,
    sandboxId,
    preferredBrand,
    modelConfig,
    configData,
    systemPrompts,
    replyPrompts,
    activeSystemPrompt,
  }: {
    messages: UIMessage[];
    sandboxId: string;
    preferredBrand: string;
    modelConfig?: ModelConfig;
    configData?: ZhipinData; // Boss直聘配置数据
    systemPrompts?: SystemPromptsConfig; // 系统提示词配置
    replyPrompts?: ReplyPromptsConfig; // 回复指令配置
    activeSystemPrompt?: keyof SystemPromptsConfig; // 活动系统提示词类型
  } = await req.json();

  try {
    // 🎯 获取配置的模型和provider设置
    const chatModel = modelConfig?.chatModel || DEFAULT_MODEL_CONFIG.chatModel;
    const providerConfigs = modelConfig?.providerConfigs || DEFAULT_PROVIDER_CONFIGS;

    // 使用动态registry
    const dynamicRegistry = getDynamicRegistry(providerConfigs);

    console.log(`[CHAT API] 使用模型: ${chatModel}`);

    // 🎯 获取系统提示词 - 根据activeSystemPrompt选择
    let systemPrompt: string;
    const promptType = activeSystemPrompt || "bossZhipinSystemPrompt";

    if (systemPrompts && systemPrompts[promptType]) {
      console.log(
        `✅ 使用客户端传入的${
          promptType === "bossZhipinSystemPrompt" ? "Boss直聘" : "通用计算机"
        }系统提示词`
      );
      systemPrompt = systemPrompts[promptType];
    } else {
      console.log(
        `⚠️ 使用默认${
          promptType === "bossZhipinSystemPrompt" ? "Boss直聘" : "通用计算机"
        }系统提示词（降级模式）`
      );
      // 降级到默认提示词
      if (promptType === "bossZhipinSystemPrompt") {
        systemPrompt = await getBossZhipinSystemPrompt();
      } else {
        // 需要导入getGeneralComputerSystemPrompt
        const { getGeneralComputerSystemPrompt } = await import(
          "@/lib/loaders/system-prompts.loader"
        );
        systemPrompt = await getGeneralComputerSystemPrompt();
      }
    }

    // 🎯 对历史消息应用智能Token优化 (10K tokens阈值)
    const processedMessages = await prunedMessages(messages, {
      maxTokens: 15000, // 硬限制：15K tokens
      targetTokens: 8000, // 目标：8K tokens时开始优化
      preserveRecentMessages: 2, // 保护最近2条消息
    });

    // 估算消息大小并记录优化效果
    const originalSize = JSON.stringify(messages).length;
    const processedSize = JSON.stringify(processedMessages).length;
    const savedPercent = (((originalSize - processedSize) / originalSize) * 100).toFixed(2);

    console.log(
      `📊 消息优化: ${(originalSize / 1024).toFixed(2)}KB -> ${(processedSize / 1024).toFixed(
        2
      )}KB (节省 ${savedPercent}%) | 消息数: ${messages.length} -> ${processedMessages.length}`
    );

    const result = streamText({
      model: dynamicRegistry.languageModel(chatModel), // 使用配置的模型
      system: systemPrompt,
      messages: processedMessages,
      tools: {
        computer: computerTool(
          sandboxId,
          preferredBrand,
          modelConfig || DEFAULT_MODEL_CONFIG,
          configData, // 传递配置数据
          replyPrompts // 传递回复指令
        ),
        bash: bashTool(sandboxId),
        feishu: feishuBotTool(),
        wechat: weChatBotTool(),
        puppeteer: puppeteerTool(),
        // Zhipin automation tools
        zhipin_get_unread_candidates: zhipinTools.getUnreadCandidates,
        zhipin_extract_candidate_info: zhipinTools.extractCandidateInfo,
        zhipin_extract_chat_messages: zhipinTools.extractChatMessages,
        zhipin_open_candidate_chat: zhipinTools.openCandidateChat,
        zhipin_process_all_unread: zhipinTools.processAllUnread,
        zhipin_process_all_unread_with_progress: zhipinTools.processAllUnreadWithProgress,
      },
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
      onFinish: async ({ usage, toolResults }) => {
        console.log("📊 usage", usage);
        console.log("🛠️ toolResults", toolResults);
      },
      onError: async error => {
        console.error("Stream generation error:", error);

        // 清理沙箱
        await cleanupSandboxIfNeeded(sandboxId, error, "Stream generation");
      },
    });

    // Create response stream with proper error handling
    const response = result.toDataStreamResponse({
      getErrorMessage(error: unknown) {
        console.error("Stream error:", error);

        // 记录详细的错误信息
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });

          // 检查是否是工具调用错误
          if (error.name === "AI_ToolExecutionError") {
            return `工具执行失败: ${error.message}`;
          }

          // 检查是否是网络相关错误
          if (
            error.message.includes("SocketError") ||
            error.message.includes("terminated") ||
            error.message.includes("other side closed")
          ) {
            return "网络连接中断，请重试";
          }

          return error.message;
        }

        if (typeof error === "string") {
          return error;
        }
        if (error && typeof error === "object" && "message" in error) {
          return String((error as { message: unknown }).message);
        }
        return "发生未知错误，请重试";
      },
    });

    return response;
  } catch (error) {
    console.error("Chat API error:", error);

    // 清理沙箱
    await cleanupSandboxIfNeeded(sandboxId, error, "Chat API");

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
