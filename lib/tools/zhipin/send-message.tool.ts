import { tool } from "ai";
import { z } from "zod";
import { getPuppeteerMCPClient } from "@/lib/mcp/client-manager";
import { CHAT_SELECTORS } from "./constants";

/**
 * 解析 puppeteer_evaluate 的结果
 */
function parseEvaluateResult(result: unknown): Record<string, unknown> | null {
  try {
    const mcpResult = result as { content?: Array<{ text?: string }> };
    if (mcpResult?.content?.[0]?.text) {
      const resultText = mcpResult.content[0].text;
      const executionMatch = resultText.match(
        /Execution result:\s*\n([\s\S]*?)(\n\nConsole output|$)/
      );

      if (executionMatch && executionMatch[1].trim() !== "undefined") {
        const jsonResult = executionMatch[1].trim();
        return JSON.parse(jsonResult) as Record<string, unknown>;
      }
    }
  } catch (e) {
    console.error("Failed to parse evaluate result:", e);
  }
  return null;
}

/**
 * 发送消息工具
 *
 * 功能：
 * - 使用 Puppeteer MCP 的 click 和 fill 方法
 * - 在输入框中输入消息
 * - 点击发送按钮发送消息
 * - 支持多种发送按钮选择器
 * - 验证消息是否成功发送
 */
export const zhipinSendMessageTool = () =>
  tool({
    description: `发送消息到BOSS直聘聊天窗口
    
    功能：
    - 在聊天输入框中输入消息
    - 自动查找并点击发送按钮
    - 验证消息是否成功发送
    
    注意：
    - 需要先打开候选人聊天窗口
    - 支持多行消息（使用\\n分隔）
    - 会自动等待消息发送完成`,

    parameters: z.object({
      message: z.string().describe("要发送的消息内容"),
      clearBefore: z.boolean().optional().default(true).describe("发送前是否清空输入框"),
      waitAfterSend: z.number().optional().default(1000).describe("发送后等待时间（毫秒）"),
    }),

    execute: async ({ message, clearBefore = true, waitAfterSend = 1000 }) => {
      try {
        const client = await getPuppeteerMCPClient();
        const tools = await client.tools();

        // 检查必需的工具是否可用
        const requiredTools = ["puppeteer_click", "puppeteer_fill", "puppeteer_evaluate"];
        for (const toolName of requiredTools) {
          if (!tools[toolName]) {
            throw new Error(`MCP tool ${toolName} not available`);
          }
        }

        // 输入框选择器列表
        const inputSelectors = [
          CHAT_SELECTORS.inputEditorId, // 优先使用ID选择器
          CHAT_SELECTORS.inputTextarea,
          CHAT_SELECTORS.inputBox,
          'textarea[placeholder*="输入"]',
          ".conversation-editor textarea",
          "textarea",
        ];

        // 发送按钮选择器列表
        const sendButtonSelectors = [
          CHAT_SELECTORS.submitContent,
          CHAT_SELECTORS.sendButtonAlt,
          CHAT_SELECTORS.sendButton,
          CHAT_SELECTORS.sendIcon,
          ".submit-content",
          ".btn-send",
          'button[type="submit"]',
          ".conversation-editor .submit-content",
          '[class*="send"]',
          CHAT_SELECTORS.sendButtonPath, // 完整路径作为最后的备选
        ];

        // 步骤1: 查找输入框
        let inputFound = false;
        let usedInputSelector = "";

        for (const selector of inputSelectors) {
          const checkScript = `
            const element = document.querySelector('${selector}');
            return element ? { exists: true, tagName: element.tagName, id: element.id } : { exists: false };
          `;

          const checkResult = await tools.puppeteer_evaluate.execute({ script: checkScript });
          const checkData = parseEvaluateResult(checkResult);

          if (checkData?.exists) {
            inputFound = true;
            usedInputSelector = selector;
            console.log(`Found input element with selector: ${selector}`);
            break;
          }
        }

        if (!inputFound) {
          return {
            success: false,
            error: "Input element not found",
            triedSelectors: inputSelectors,
            message: "未找到输入框",
          };
        }

        // 步骤2: 点击输入框获取焦点
        try {
          await tools.puppeteer_click.execute({ selector: usedInputSelector });
          console.log("Clicked on input element");
        } catch {
          console.log("Failed to click input, continuing anyway");
        }

        // 步骤3: 清空输入框（如果需要）
        if (clearBefore) {
          // 先尝试清空
          try {
            await tools.puppeteer_fill.execute({ selector: usedInputSelector, value: "" });
            console.log("Cleared input field");
          } catch {
            console.log("Failed to clear input, continuing anyway");
          }
        }

        // 步骤4: 填充消息
        try {
          await tools.puppeteer_fill.execute({ selector: usedInputSelector, value: message });
          console.log(`Filled message: ${message}`);
        } catch (error) {
          return {
            success: false,
            error: `Failed to fill message: ${error instanceof Error ? error.message : "Unknown error"}`,
            message: "填充消息失败",
          };
        }

        // 等待一下确保文本已填充
        await new Promise(resolve => setTimeout(resolve, 500));

        // 步骤5: 查找并点击发送按钮
        let sendButtonClicked = false;
        let usedSendSelector = "";
        let lastError = "";

        for (const selector of sendButtonSelectors) {
          try {
            // 先检查按钮是否存在
            const checkScript = `
              const element = document.querySelector('${selector}');
              return element ? { exists: true, visible: element.offsetParent !== null } : { exists: false };
            `;

            const checkResult = await tools.puppeteer_evaluate.execute({ script: checkScript });
            const checkData = parseEvaluateResult(checkResult);

            if (checkData?.exists) {
              // 尝试点击
              await tools.puppeteer_click.execute({ selector });
              sendButtonClicked = true;
              usedSendSelector = selector;
              console.log(`Successfully clicked send button with selector: ${selector}`);
              break;
            }
          } catch (error) {
            lastError = error instanceof Error ? error.message : "Unknown error";
            console.log(`Failed to click with selector ${selector}: ${lastError}`);
          }
        }

        if (!sendButtonClicked) {
          return {
            success: false,
            error: `Send button not found or click failed. Last error: ${lastError}`,
            triedSelectors: sendButtonSelectors,
            inputSelector: usedInputSelector,
            message: "未找到发送按钮或点击失败",
          };
        }

        // 等待消息发送完成
        if (waitAfterSend > 0) {
          await new Promise(resolve => setTimeout(resolve, waitAfterSend));
        }

        return {
          success: true,
          message: `成功发送消息: "${message}"`,
          details: {
            sentText: message,
            inputSelector: usedInputSelector,
            sendButtonSelector: usedSendSelector,
          },
        };
      } catch (error) {
        console.error("Failed to send message:", error);

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          message: "发送消息时发生错误",
        };
      }
    },
  });

/**
 * 快捷创建函数
 */
export const createZhipinSendMessageTool = zhipinSendMessageTool;
