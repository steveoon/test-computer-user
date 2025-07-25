import { tool } from "ai";
import { z } from "zod";
import { getPuppeteerMCPClient } from "@/lib/mcp/client-manager";
import { EXCHANGE_WECHAT_SELECTORS } from "./constants";
import { wrapAntiDetectionScript, randomDelay, clickWithMouseTrajectory } from "./anti-detection-utils";

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
      waitBetweenClicksMin: z
        .number()
        .optional()
        .default(400)
        .describe("两次点击之间的最小等待时间（毫秒）"),
      waitBetweenClicksMax: z
        .number()
        .optional()
        .default(800)
        .describe("两次点击之间的最大等待时间（毫秒）"),
      waitAfterExchangeMin: z
        .number()
        .optional()
        .default(800)
        .describe("交换完成后的最小等待时间（毫秒）"),
      waitAfterExchangeMax: z
        .number()
        .optional()
        .default(1500)
        .describe("交换完成后的最大等待时间（毫秒）"),
    }),

    execute: async ({ waitBetweenClicksMin = 400, waitBetweenClicksMax = 800, waitAfterExchangeMin = 800, waitAfterExchangeMax = 1500 }) => {
      try {
        const client = await getPuppeteerMCPClient();
        const tools = await client.tools();

        // 检查必需的工具是否可用
        const requiredTools = ["puppeteer_click", "puppeteer_evaluate"] as const;
        for (const toolName of requiredTools) {
          if (!tools[toolName]) {
            throw new Error(`MCP tool ${toolName} not available`);
          }
        }
        
        // 类型断言：在检查后这些工具一定存在
        const puppeteerEvaluate = tools.puppeteer_evaluate as NonNullable<typeof tools.puppeteer_evaluate>;

        // 添加初始延迟
        await randomDelay(100, 300);

        // 第一步：批量查找交换微信按钮
        const exchangeButtonSelectors = [
          EXCHANGE_WECHAT_SELECTORS.exchangeButtonPath,
          EXCHANGE_WECHAT_SELECTORS.exchangeButton,
          ".operate-exchange-left .operate-btn",
        ];

        // 批量查找按钮
        const findExchangeButtonScript = wrapAntiDetectionScript(`
          const selectors = ${JSON.stringify(exchangeButtonSelectors)};
          
          // 先尝试直接选择器
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
              return { 
                exists: true, 
                selector: selector,
                text: element.textContent?.trim() || ''
              };
            }
          }
          
          // 如果没找到，尝试文本匹配
          const spans = document.querySelectorAll('span.operate-btn');
          for (let i = 0; i < spans.length; i++) {
            const span = spans[i];
            if (span.textContent && span.textContent.includes('换微信')) {
              return { 
                exists: true, 
                selector: 'span.operate-btn',
                index: i,
                text: span.textContent.trim()
              };
            }
          }
          
          return { exists: false };
        `);

        const exchangeResult = await puppeteerEvaluate.execute({ script: findExchangeButtonScript });
        const exchangeData = parseEvaluateResult(exchangeResult);

        if (!exchangeData?.exists) {
          return {
            success: false,
            error: '未找到"换微信"按钮',
            triedSelectors: exchangeButtonSelectors,
            message: "请确保已打开候选人聊天窗口",
          };
        }

        // 点击交换按钮 - 使用带鼠标轨迹的点击
        let exchangeClicked = false;
        try {
          if (exchangeData.index !== undefined && typeof exchangeData.index === 'number') {
            // 如果是通过索引找到的，使用nth-child
            const selector = `span.operate-btn:nth-child(${exchangeData.index + 1})`;
            await clickWithMouseTrajectory(client, selector, {
              preClickDelay: 100,
              moveSteps: 20
            });
            exchangeClicked = true;
          } else if (exchangeData.selector && typeof exchangeData.selector === 'string') {
            // 直接使用选择器
            await clickWithMouseTrajectory(client, exchangeData.selector, {
              preClickDelay: 100,
              moveSteps: 20
            });
            exchangeClicked = true;
          }
        } catch (_error) {
          // 如果点击失败，尝试备用方案 - 返回选择器让外部使用 puppeteer_click
          const fallbackScript = wrapAntiDetectionScript(`
            const spans = document.querySelectorAll('span.operate-btn');
            for (let i = 0; i < spans.length; i++) {
              const span = spans[i];
              if (span.textContent && span.textContent.includes('换微信')) {
                return { success: true, selector: 'span.operate-btn', index: i };
              }
            }
            return { success: false };
          `);
          
          const fallbackResult = await puppeteerEvaluate.execute({ script: fallbackScript });
          const fallbackData = parseEvaluateResult(fallbackResult);
          
          if (fallbackData?.success && typeof fallbackData.index === 'number') {
            // 使用带鼠标轨迹的点击而不是直接 click()
            // 注意：使用更精确的选择器来避免问题
            const allOperateBtns = await puppeteerEvaluate.execute({ 
              script: wrapAntiDetectionScript(`
                const btns = Array.from(document.querySelectorAll('span.operate-btn'));
                const targetBtn = btns.find(btn => btn.textContent && btn.textContent.includes('换微信'));
                if (targetBtn) {
                  // 为目标按钮添加一个临时的 data 属性
                  targetBtn.setAttribute('data-exchange-btn-temp', 'true');
                  return { success: true };
                }
                return { success: false };
              `)
            });
            
            const markResult = parseEvaluateResult(allOperateBtns);
            if (markResult && typeof markResult === 'object' && 'success' in markResult && markResult.success) {
              try {
                // 使用临时属性选择器
                await clickWithMouseTrajectory(client, 'span.operate-btn[data-exchange-btn-temp="true"]', {
                  preClickDelay: 100,
                  moveSteps: 20
                });
                exchangeClicked = true;
                
                // 清理临时属性
                await puppeteerEvaluate.execute({ 
                  script: wrapAntiDetectionScript(`
                    const btn = document.querySelector('span.operate-btn[data-exchange-btn-temp="true"]');
                    if (btn) btn.removeAttribute('data-exchange-btn-temp');
                  `)
                });
              } catch (_err) {
                exchangeClicked = false;
              }
            }
          }
        }

        if (!exchangeClicked) {
          return {
            success: false,
            error: '点击交换微信按钮失败',
            message: "请确保已打开候选人聊天窗口",
          };
        }

        // 等待弹窗出现（随机延迟）
        await randomDelay(waitBetweenClicksMin, waitBetweenClicksMax);
        
        // 检查弹窗是否出现
        const checkTooltipScript = wrapAntiDetectionScript(`
          const tooltip = document.querySelector('.exchange-tooltip');
          const isVisible = tooltip && tooltip.offsetParent !== null;
          // 同时检查确认按钮是否已经渲染
          const confirmBtn = tooltip ? tooltip.querySelector('.boss-btn-primary') : null;
          return { 
            exists: !!tooltip, 
            visible: isVisible,
            hasConfirmButton: !!confirmBtn
          };
        `);
        
        const tooltipCheck = await puppeteerEvaluate.execute({ script: checkTooltipScript });
        const tooltipData = parseEvaluateResult(tooltipCheck);
        
        if (!tooltipData?.visible || !tooltipData?.hasConfirmButton) {
          // 如果弹窗还没出现或按钮还没渲染，再等待一下
          await randomDelay(500, 800);
        }

        // 第二步：批量查找确认按钮
        const confirmButtonSelectors = [
          EXCHANGE_WECHAT_SELECTORS.confirmButtonPath, // 使用constants中定义的完整路径
          EXCHANGE_WECHAT_SELECTORS.confirmButton,
          ".exchange-tooltip .btn-box span.boss-btn-primary",
          ".exchange-tooltip span.boss-btn-primary",
          "span.boss-btn-primary.boss-btn",
        ];

        // 批量查找确认按钮
        const findConfirmButtonScript = wrapAntiDetectionScript(`
          const selectors = ${JSON.stringify(confirmButtonSelectors)};
          
          // 先尝试直接选择器
          for (const selector of selectors) {
            try {
              const element = document.querySelector(selector);
              if (element && element.offsetParent !== null) {
                // 确保元素可见且可点击
                const rect = element.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 && 
                                rect.top >= 0 && rect.left >= 0 &&
                                rect.bottom <= window.innerHeight && 
                                rect.right <= window.innerWidth;
                                
                if (isVisible) {
                  return { 
                    exists: true, 
                    selector: selector,
                    text: element.textContent?.trim() || '',
                    isVisible: true
                  };
                }
              }
            } catch (e) {
              // 忽略无效选择器的错误
            }
          }
          
          // 如果没找到，尝试文本匹配
          const buttons = document.querySelectorAll('span.boss-btn-primary');
          for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            if (btn.textContent && btn.textContent.includes('确定') && btn.offsetParent !== null) {
              // 检查是否在弹窗内
              const inTooltip = btn.closest('.exchange-tooltip');
              if (inTooltip) {
                return { 
                  exists: true, 
                  selector: 'span.boss-btn-primary',
                  index: i,
                  text: btn.textContent.trim()
                };
              }
            }
          }
          
          return { exists: false };
        `);

        const confirmResult = await puppeteerEvaluate.execute({ script: findConfirmButtonScript });
        const confirmData = parseEvaluateResult(confirmResult);

        if (!confirmData?.exists) {
          return {
            success: false,
            error: '未找到确认对话框中的"确定"按钮',
            triedSelectors: confirmButtonSelectors,
            exchangeButtonClicked: true,
            message: "已点击交换微信按钮，但未能找到确认按钮",
          };
        }

        // 添加点击前延迟
        await randomDelay(200, 400);

        // 点击确认按钮
        let confirmClicked = false;
        try {
          if (confirmData.index !== undefined && typeof confirmData.index === 'number') {
            // 使用nth-of-type避免nth-child问题 - 使用带鼠标轨迹的点击
            const selector = `.exchange-tooltip span.boss-btn-primary:nth-of-type(${confirmData.index + 1})`;
            await clickWithMouseTrajectory(client, selector, {
              preClickDelay: 150,
              moveSteps: 15
            });
            confirmClicked = true;
          } else if (confirmData.selector && typeof confirmData.selector === 'string') {
            // 直接使用选择器 - 使用带鼠标轨迹的点击
            await clickWithMouseTrajectory(client, confirmData.selector, {
              preClickDelay: 150,
              moveSteps: 15
            });
            confirmClicked = true;
          }
        } catch (_error) {
          // 如果点击失败，尝试备用方案 - 返回选择器让外部使用 puppeteer_click
          const fallbackScript = wrapAntiDetectionScript(`
            const buttons = document.querySelectorAll('.exchange-tooltip span.boss-btn-primary');
            for (let i = 0; i < buttons.length; i++) {
              const btn = buttons[i];
              if (btn.textContent && btn.textContent.includes('确定')) {
                return { success: true, selector: '.exchange-tooltip span.boss-btn-primary', index: i };
              }
            }
            return { success: false };
          `);
          
          const fallbackResult = await puppeteerEvaluate.execute({ script: fallbackScript });
          const fallbackData = parseEvaluateResult(fallbackResult);
          
          if (fallbackData?.success && typeof fallbackData.index === 'number') {
            // 使用带鼠标轨迹的点击而不是直接 click()
            // 使用更可靠的方法来选择确认按钮
            const markConfirmBtn = await puppeteerEvaluate.execute({ 
              script: wrapAntiDetectionScript(`
                const btns = Array.from(document.querySelectorAll('.exchange-tooltip span.boss-btn-primary'));
                const targetBtn = btns.find(btn => btn.textContent && btn.textContent.includes('确定'));
                if (targetBtn) {
                  targetBtn.setAttribute('data-confirm-btn-temp', 'true');
                  return { success: true };
                }
                return { success: false };
              `)
            });
            
            const markResult = parseEvaluateResult(markConfirmBtn);
            if (markResult && typeof markResult === 'object' && 'success' in markResult && markResult.success) {
              try {
                await clickWithMouseTrajectory(client, '.exchange-tooltip span.boss-btn-primary[data-confirm-btn-temp="true"]', {
                  preClickDelay: 150,
                  moveSteps: 15
                });
                confirmClicked = true;
                
                // 清理临时属性
                await puppeteerEvaluate.execute({ 
                  script: wrapAntiDetectionScript(`
                    const btn = document.querySelector('.exchange-tooltip span.boss-btn-primary[data-confirm-btn-temp="true"]');
                    if (btn) btn.removeAttribute('data-confirm-btn-temp');
                  `)
                });
              } catch (_err) {
                confirmClicked = false;
              }
            }
          }
        }

        if (!confirmClicked) {
          return {
            success: false,
            error: '点击确认按钮失败',
            exchangeButtonClicked: true,
            message: "已点击交换微信按钮，但未能点击确认按钮",
          };
        }

        // 等待交换完成（随机延迟）
        await randomDelay(waitAfterExchangeMin, waitAfterExchangeMax);

        return {
          success: true,
          message: "成功交换微信",
          details: {
            exchangeButtonSelector: exchangeData.selector as string || 'unknown',
            confirmButtonSelector: confirmData.selector as string || 'unknown',
          },
        };
      } catch (error) {
        // 静默处理错误

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
