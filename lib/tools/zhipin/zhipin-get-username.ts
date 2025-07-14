import { tool } from "ai";
import { z } from "zod";
import { getPuppeteerMCPClient } from "@/lib/mcp/client-manager";

/**
 * 解析 puppeteer_evaluate 的结果
 */
function parseEvaluateResult(result: unknown): Record<string, unknown> | null {
  try {
    const mcpResult = result as { content?: Array<{ text?: string }> };
    if (mcpResult?.content?.[0]?.text) {
      const resultText = mcpResult.content[0].text;
      
      // 首先尝试标准格式解析（包含 "Execution result:"）
      const executionMatch = resultText.match(
        /Execution result:\s*\n([\s\S]*?)(\n\nConsole output|$)/
      );

      if (executionMatch) {
        const executionResult = executionMatch[1].trim();
        // 跳过 "undefined" 结果
        if (executionResult !== "undefined" && executionResult !== "") {
          try {
            return JSON.parse(executionResult) as Record<string, unknown>;
          } catch (e) {
            console.log("Failed to parse execution result as JSON:", executionResult);
          }
        }
      }
      
      // 如果标准格式解析失败，尝试查找 JSON 对象
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        } catch (e) {
          console.log("Failed to parse found JSON object:", jsonMatch[0]);
        }
      }
      
      // 最后尝试直接解析整个文本
      try {
        const parsed = JSON.parse(resultText);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // 忽略错误
      }
    }
  } catch (e) {
    console.error("Failed to parse evaluate result:", e);
  }
  return null;
}

/**
 * 获取BOSS直聘当前登录账号的用户名
 */
export const zhipinGetUsername = tool({
  description: "获取BOSS直聘当前登录账号的用户名",
  parameters: z.object({}),
  execute: async () => {
    try {
      const client = await getPuppeteerMCPClient();
      const tools = await client.tools();
      
      if (!tools.puppeteer_evaluate) {
        throw new Error("MCP tool puppeteer_evaluate not available");
      }
      
      // 执行获取用户名的脚本
      const script = `
        // 尝试获取用户名
        const userNameElement = document.querySelector(
          '#header > div > div > div.nav-item.nav-logout > div.top-profile-logout.ui-dropmenu.ui-dropmenu-drop-arrow > div.ui-dropmenu-label > div > span.user-name'
        );

        if (userNameElement) {
          return {
            success: true,
            userName: userNameElement.textContent?.trim() || "",
            elementFound: true,
          };
        }
        
        // 如果找不到，尝试查找其他可能的用户名元素
        const alternativeSelectors = [
          ".user-name",
          '[class*="user-name"]',
          '[class*="username"]',
          ".nav-logout .user-name",
          "#header .user-name",
          // 添加更多可能的选择器
          ".nav-user .user-name",
          ".top-profile .user-name",
          '[data-qa="user-name"]',
          ".header-user-name",
        ];

        for (let selector of alternativeSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            return {
              success: true,
              userName: element.textContent.trim(),
              elementFound: true,
              usedSelector: selector,
            };
          }
        }

        // 如果还是找不到，尝试获取页面上任何包含用户信息的元素
        const userInfoPatterns = [
          /^[\u4e00-\u9fa5]{2,4}$/, // 2-4个中文字符（常见中文名）
          /^[A-Za-z\s]+$/, // 英文名
        ];

        const allElements = document.querySelectorAll("*");
        for (let element of allElements) {
          const text = element.textContent?.trim();
          if (
            text &&
            text.length > 0 &&
            text.length < 20 &&
            userInfoPatterns.some((pattern) => pattern.test(text)) &&
            element.childElementCount === 0 && // 确保是叶子节点
            (element.className?.includes("user") ||
              element.className?.includes("name") ||
              element.id?.includes("user") ||
              element.id?.includes("name"))
          ) {
            return {
              success: true,
              userName: text,
              elementFound: true,
              foundByPattern: true,
            };
          }
        }

        return {
          success: false,
          userName: null,
          elementFound: false,
          message: "未找到用户名元素",
        };
      `;
      
      // 执行脚本
      const scriptResult = await tools.puppeteer_evaluate.execute({ script });

      // 解析结果
      const result = parseEvaluateResult(scriptResult);
      
      if (!result) {
        // 如果解析失败，打印原始结果用于调试
        console.error("Failed to parse result. Raw scriptResult:", JSON.stringify(scriptResult, null, 2));
        throw new Error("未能解析执行结果");
      }

      if (result.success && result.userName) {
        let successMessage = `✅ 成功获取BOSS直聘用户名：${result.userName}`;
        
        if (result.usedSelector) {
          successMessage += `\n🔍 使用选择器：${result.usedSelector}`;
        }
        
        if (result.foundByPattern) {
          successMessage += `\n⚠️ 通过模式匹配找到，可能需要确认`;
        }

        return {
          type: "text" as const,
          text: successMessage,
        };
      } else {
        return {
          type: "text" as const,
          text: `❌ 获取用户名失败：${result.message || "未知错误"}\n💡 提示：请确保已登录BOSS直聘账号`,
        };
      }
    } catch (error) {
      console.error("获取BOSS直聘用户名失败:", error);
      
      let errorMessage = "❌ 获取用户名时发生错误";
      if (error instanceof Error) {
        errorMessage += `：${error.message}`;
      }
      
      return {
        type: "text" as const,
        text: errorMessage,
      };
    }
  },
});

// 导出别名，方便使用
export const zhipin_get_username = zhipinGetUsername;