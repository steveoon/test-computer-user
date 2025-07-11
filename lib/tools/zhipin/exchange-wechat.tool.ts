import { tool } from "ai";
import { z } from "zod";
import { getPuppeteerMCPClient } from "@/lib/mcp/client-manager";
import { EXCHANGE_WECHAT_SELECTORS } from "./constants";

/**
 * 交换微信工具
 *
 * 功能：
 * - 点击"换微信"按钮
 * - 在弹出的确认对话框中点击"确定"
 * - 完成微信交换流程
 */
export const zhipinExchangeWechatTool = () =>
  tool({
    description: `BOSS直聘交换微信功能
    
    功能：
    - 自动点击"换微信"按钮
    - 在确认对话框中点击"确定"按钮
    - 完成微信号交换流程
    
    注意：
    - 需要先打开候选人聊天窗口
    - 需要确保当前聊天对象支持交换微信
    - 操作有先后顺序，会自动等待弹窗出现`,

    parameters: z.object({
      waitBetweenClicks: z
        .number()
        .optional()
        .default(500)
        .describe("两次点击之间的等待时间（毫秒）"),
      waitAfterExchange: z
        .number()
        .optional()
        .default(1000)
        .describe("交换完成后的等待时间（毫秒）"),
    }),

    execute: async ({ waitBetweenClicks = 500, waitAfterExchange = 1000 }) => {
      try {
        const client = await getPuppeteerMCPClient();
        const tools = await client.tools();

        // 检查必需的工具是否可用
        const requiredTools = ["puppeteer_click", "puppeteer_evaluate"];
        for (const toolName of requiredTools) {
          if (!tools[toolName]) {
            throw new Error(`MCP tool ${toolName} not available`);
          }
        }

        // 第一步：点击"换微信"按钮
        const exchangeButtonSelectors = [
          EXCHANGE_WECHAT_SELECTORS.exchangeButtonPath,
          EXCHANGE_WECHAT_SELECTORS.exchangeButton,
          '.operate-icon-item span.operate-btn:contains("换微信")',
          'span:contains("换微信").operate-btn',
          ".operate-exchange-left .operate-btn",
        ];

        let exchangeClicked = false;
        let usedExchangeSelector = "";

        // 尝试点击交换微信按钮
        for (const selector of exchangeButtonSelectors) {
          try {
            // 先检查按钮是否存在
            const checkScript = `
              const element = document.querySelector('${selector}');
              if (!element && selector.includes(':contains')) {
                // 处理 :contains 伪选择器
                const spans = document.querySelectorAll('span.operate-btn');
                for (const span of spans) {
                  if (span.textContent && span.textContent.includes('换微信')) {
                    return { exists: true, text: span.textContent.trim() };
                  }
                }
              }
              return element ? { exists: true, text: element.textContent ? element.textContent.trim() : '' } : { exists: false };
            `;

            const checkResult = await tools.puppeteer_evaluate.execute({ script: checkScript });
            const checkData = parseEvaluateResult(checkResult);

            if (checkData?.exists || selector.includes(":contains")) {
              // 如果是 :contains 选择器，需要用特殊方式点击
              if (selector.includes(":contains")) {
                const clickScript = `
                  const spans = document.querySelectorAll('span.operate-btn');
                  for (const span of spans) {
                    if (span.textContent && span.textContent.includes('换微信')) {
                      span.click();
                      return { success: true, text: span.textContent.trim() };
                    }
                  }
                  return { success: false };
                `;
                const clickResult = await tools.puppeteer_evaluate.execute({ script: clickScript });
                const clickData = parseEvaluateResult(clickResult);
                if (clickData?.success) {
                  exchangeClicked = true;
                  usedExchangeSelector = selector;
                  console.log(`Successfully clicked exchange button with text: ${clickData.text}`);
                  break;
                }
              } else {
                // 普通选择器直接点击
                await tools.puppeteer_click.execute({ selector });
                exchangeClicked = true;
                usedExchangeSelector = selector;
                console.log(`Successfully clicked exchange button with selector: ${selector}`);
                break;
              }
            }
          } catch (error) {
            console.log(`Failed to click with selector ${selector}: ${error}`);
          }
        }

        if (!exchangeClicked) {
          return {
            success: false,
            error: '未找到"换微信"按钮',
            triedSelectors: exchangeButtonSelectors,
            message: "请确保已打开候选人聊天窗口",
          };
        }

        // 等待弹窗出现并确保其完全显示
        await new Promise(resolve => setTimeout(resolve, waitBetweenClicks));
        
        // 额外检查弹窗是否真的出现了
        const checkTooltipScript = `
          const tooltip = document.querySelector('.exchange-tooltip');
          const isVisible = tooltip && tooltip.offsetParent !== null;
          return { exists: !!tooltip, visible: isVisible };
        `;
        
        const tooltipCheck = await tools.puppeteer_evaluate.execute({ script: checkTooltipScript });
        const tooltipData = parseEvaluateResult(tooltipCheck);
        
        if (!tooltipData?.visible) {
          // 如果弹窗还没出现，再等待一下
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 第二步：点击确认对话框中的"确定"按钮
        const confirmButtonSelectors = [
          ".exchange-tooltip .btn-box .boss-btn-primary.boss-btn",  // 最准确的选择器放在前面
          ".exchange-tooltip .btn-box span.boss-btn-primary",
          EXCHANGE_WECHAT_SELECTORS.confirmButton,
          EXCHANGE_WECHAT_SELECTORS.confirmButtonPath,
          '.btn-box span.boss-btn-primary:contains("确定")',
          'span.boss-btn-primary:contains("确定")',
        ];

        let confirmClicked = false;
        let usedConfirmSelector = "";

        // 尝试点击确定按钮
        for (const selector of confirmButtonSelectors) {
          try {
            // 检查按钮是否存在且可见
            const checkScript = `
              const element = document.querySelector('${selector}');
              if (!element && selector.includes(':contains')) {
                // 处理 :contains 伪选择器
                const buttons = document.querySelectorAll('span.boss-btn-primary');
                for (const btn of buttons) {
                  if (btn.textContent && btn.textContent.includes('确定')) {
                    return { exists: true, visible: btn.offsetParent !== null, text: btn.textContent.trim() };
                  }
                }
              }
              return element ? { exists: true, visible: element.offsetParent !== null } : { exists: false };
            `;

            const checkResult = await tools.puppeteer_evaluate.execute({ script: checkScript });
            const checkData = parseEvaluateResult(checkResult);

            if (checkData?.exists && checkData?.visible) {
              // 如果是 :contains 选择器，需要用特殊方式点击
              if (selector.includes(":contains")) {
                const clickScript = `
                  const buttons = document.querySelectorAll('span.boss-btn-primary');
                  for (const btn of buttons) {
                    if (btn.textContent && btn.textContent.includes('确定')) {
                      btn.click();
                      return { success: true };
                    }
                  }
                  return { success: false };
                `;
                const clickResult = await tools.puppeteer_evaluate.execute({ script: clickScript });
                const clickData = parseEvaluateResult(clickResult);
                if (clickData?.success) {
                  confirmClicked = true;
                  usedConfirmSelector = selector;
                  console.log("Successfully clicked confirm button");
                  break;
                }
              } else {
                // 普通选择器直接点击
                await tools.puppeteer_click.execute({ selector });
                confirmClicked = true;
                usedConfirmSelector = selector;
                console.log(`Successfully clicked confirm button with selector: ${selector}`);
                break;
              }
            }
          } catch (error) {
            console.log(`Failed to click confirm with selector ${selector}: ${error}`);
          }
        }

        if (!confirmClicked) {
          return {
            success: false,
            error: '未找到确认对话框中的"确定"按钮',
            triedSelectors: confirmButtonSelectors,
            exchangeButtonClicked: true,
            message: "已点击交换微信按钮，但未能找到确认按钮",
          };
        }

        // 等待交换完成
        if (waitAfterExchange > 0) {
          await new Promise(resolve => setTimeout(resolve, waitAfterExchange));
        }

        // 验证是否成功（可选）
        // 可以检查是否出现了成功提示或微信号显示

        return {
          success: true,
          message: "成功交换微信",
          details: {
            exchangeButtonSelector: usedExchangeSelector,
            confirmButtonSelector: usedConfirmSelector,
            waitTime: waitBetweenClicks + waitAfterExchange,
          },
        };
      } catch (error) {
        console.error("Failed to exchange WeChat:", error);

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          message: "交换微信时发生错误",
        };
      }
    },
  });

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
 * 快捷创建函数
 */
export const createZhipinExchangeWechatTool = zhipinExchangeWechatTool;
