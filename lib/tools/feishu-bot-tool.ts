import { tool } from "ai";
import { z } from "zod";
import { sendFeishuMessage } from "../send-feishu-message";

// 飞书机器人工具
export const feishuBotTool = () =>
  tool({
    description:
      "向飞书机器人发送通知消息，支持候选人微信信息推送、系统警告、任务完成提醒等多种场景",
    parameters: z.object({
      notification_type: z
        .enum([
          "candidate_wechat", // 候选人微信信息
          "payload_error", // 载荷过大错误
          "task_completed", // 任务完成
          "task_interrupted", // 任务中断
          "system_warning", // 系统警告
          "custom", // 自定义消息
        ])
        .describe("通知类型"),
      candidate_name: z
        .string()
        .optional()
        .describe("候选人姓名（candidate_wechat类型时必需）"),
      wechat_id: z
        .string()
        .optional()
        .describe("候选人微信号（candidate_wechat类型时必需）"),
      message: z
        .string()
        .optional()
        .describe("自定义消息内容，如果不提供将根据通知类型自动生成标准格式"),
      messageType: z
        .enum(["text", "rich_text"])
        .optional()
        .default("text")
        .describe("消息类型，默认为text"),
      additional_info: z
        .string()
        .optional()
        .describe("附加信息，用于生成更详细的通知内容"),
    }),
    execute: async ({
      notification_type,
      candidate_name,
      wechat_id,
      message,
      messageType = "text",
      additional_info,
    }) => {
      // 根据通知类型进行参数验证
      if (notification_type === "candidate_wechat") {
        if (!candidate_name || candidate_name.trim() === "") {
          return {
            type: "text" as const,
            text: "❌ 候选人微信信息推送需要提供候选人姓名",
          };
        }
        if (!wechat_id || wechat_id.trim() === "") {
          return {
            type: "text" as const,
            text: "❌ 候选人微信信息推送需要提供微信号",
          };
        }
      }

      // 根据通知类型生成消息内容
      let finalMessage = message;

      if (!finalMessage) {
        const timestamp = new Date().toLocaleString("zh-CN");

        switch (notification_type) {
          case "candidate_wechat":
            finalMessage = `【候选人微信】\n👤 姓名: ${candidate_name?.trim()}\n💬 微信: ${wechat_id?.trim()}\n⏰ 时间: ${timestamp}`;
            break;

          case "payload_error":
            finalMessage = `🚨 【系统警告】载荷过大错误\n\n📝 检测到对话历史过长导致请求失败\n⚠️ 需要手动清理聊天历史记录\n⏰ 发生时间: ${timestamp}${
              additional_info ? `\n📋 详细信息: ${additional_info}` : ""
            }`;
            break;

          case "task_completed":
            finalMessage = `✅ 【任务完成】AI助手任务执行完毕\n\n🎯 本轮任务已成功完成\n📊 状态: 就绪等待新指令\n⏰ 完成时间: ${timestamp}${
              additional_info ? `\n📋 任务详情: ${additional_info}` : ""
            }`;
            break;

          case "task_interrupted":
            finalMessage = `⚠️ 【任务中断】AI助手任务意外中断\n\n🔄 任务执行过程中发生中断\n📊 状态: 需要检查或重新启动\n⏰ 中断时间: ${timestamp}${
              additional_info ? `\n📋 中断原因: ${additional_info}` : ""
            }`;
            break;

          case "system_warning":
            finalMessage = `⚠️ 【系统警告】\n\n${
              additional_info || "系统检测到异常情况"
            }\n⏰ 警告时间: ${timestamp}`;
            break;

          case "custom":
            finalMessage =
              additional_info || `📢 【自定义通知】\n⏰ 发送时间: ${timestamp}`;
            break;

          default:
            finalMessage = `📢 【通知消息】\n⏰ 发送时间: ${timestamp}`;
        }
      }

      console.log(
        `🤖 准备发送飞书通知 [${notification_type}]: ${finalMessage.substring(
          0,
          100
        )}${finalMessage.length > 100 ? "..." : ""}`
      );

      // 发送消息
      const result = await sendFeishuMessage(finalMessage, messageType);

      if (result.success) {
        const successText = `✅ 飞书通知发送成功！\n\n📋 通知类型: ${notification_type}\n📝 消息内容: ${finalMessage}\n📊 响应状态: ${
          result.data?.StatusMessage || result.data?.msg || "success"
        }\n⏰ 发送时间: ${new Date().toLocaleString("zh-CN")}`;

        return {
          type: "text" as const,
          text: successText,
        };
      } else {
        const errorText = `❌ 飞书通知发送失败\n\n📋 通知类型: ${notification_type}\n🔍 错误信息: ${result.error}\n📝 尝试发送的消息: ${finalMessage}\n💡 请检查FEISHU_BOT_WEBHOOK环境变量是否正确配置`;

        return {
          type: "text" as const,
          text: errorText,
        };
      }
    },
  });
