import { z } from "zod";
import { tool } from "ai";
import { getPuppeteerMCPClient } from "@/lib/mcp/client-manager";

export const openCandidateChatTool = tool({
  description: "打开指定候选人的聊天窗口",
  parameters: z.object({
    index: z.number().min(0).describe("要打开的候选人索引（从0开始）"),
  }),
  execute: async ({ index }) => {
    try {
      console.log(`正在打开索引为 ${index} 的候选人聊天窗口...`);

      const mcpClient = await getPuppeteerMCPClient();

      // 首先尝试使用 CSS 选择器点击（优化后的选择器）
      const candidateSelector = `.geek-item:nth-child(${index + 1})`;

      try {
        // 使用MCP工具点击候选人卡片
        const tools = await mcpClient.tools();
        const clickTool = tools["puppeteer_click"];

        if (clickTool) {
          await clickTool.execute({ selector: candidateSelector });
          console.log("使用 CSS 选择器成功点击候选人");
        } else {
          throw new Error("MCP click tool not available");
        }
      } catch (_clickError) {
        console.log("CSS 选择器点击失败，尝试 JavaScript 方法...");

        // 方法2：使用 JavaScript 评估点击（优化后的选择器）
        const clickScript = `
          (function(idx) {
            const cards = document.querySelectorAll('.geek-item, .geek-list .geek-item, [class*="chat-item"]');
            if (cards.length > idx) {
              const card = cards[idx];
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // 尝试多种点击方式
              const clickableElements = [
                card.querySelector('.card-content'),
                card.querySelector('.geek-name'),
                card.querySelector('.position-name'),
                card.querySelector('.chat-item-content'),
                card
              ];
              
              for (const element of clickableElements) {
                if (element) {
                  element.click();
                  return true;
                }
              }
              
              return false;
            }
            return false;
          })(${index})
        `;

        const tools = await mcpClient.tools();
        const evaluateTool = tools["puppeteer_evaluate"];

        if (!evaluateTool) {
          throw new Error("MCP evaluate tool not available");
        }

        const result = await evaluateTool.execute({ script: clickScript });

        // 解析结果
        const success =
          result &&
          typeof result === "object" &&
          "content" in result &&
          Array.isArray((result as { content: unknown[] }).content) &&
          (result as { content: { type: string; text: string }[] }).content.find(
            c => c.type === "text"
          )?.text === "true";

        if (!success) {
          throw new Error(`无法点击索引为 ${index} 的候选人`);
        }
      }

      // 等待聊天窗口加载
      try {
        // 简化等待逻辑，给页面加载时间
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("等待聊天页面加载完成");
      } catch (_waitError) {
        console.warn("等待聊天界面加载超时，但可能已经打开");
      }

      console.log("聊天窗口已成功打开");

      // 截图验证
      const tools = await mcpClient.tools();
      const screenshotTool = tools["puppeteer_screenshot"];

      let screenshotBase64 = "";
      if (screenshotTool) {
        try {
          const screenshot = await screenshotTool.execute({ name: `chat-opened-${index}` });
          if (screenshot && typeof screenshot === "object" && "data" in screenshot) {
            screenshotBase64 = (screenshot as { data: string }).data;
          }
        } catch (screenshotError) {
          console.warn("截图失败:", screenshotError);
        }
      }

      return {
        success: true,
        candidateIndex: index,
        message: `成功打开候选人 ${index} 的聊天窗口`,
        screenshot: screenshotBase64,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("打开候选人聊天窗口失败:", error);

      return {
        success: false,
        candidateIndex: index,
        message: `打开候选人 ${index} 的聊天窗口失败`,
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      };
    }
  },
});

export const OPEN_CANDIDATE_CHAT_ACTION = "open_candidate_chat";
