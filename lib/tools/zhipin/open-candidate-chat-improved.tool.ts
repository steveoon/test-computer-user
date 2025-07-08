import { tool } from "ai";
import { z } from "zod";
import { UNREAD_SELECTORS } from "./constants";
import { getPuppeteerMCPClient } from "@/lib/mcp/client-manager";

export const openCandidateChatImprovedTool = tool({
  description: `打开指定候选人的聊天窗口（改进版）
  
  功能特性：
  - 支持按候选人姓名查找并点击
  - 支持按索引点击（第N个未读）
  - 自动检测未读徽章
  - 返回详细的候选人信息
  - 使用更精确的选择器
  `,

  parameters: z.object({
    candidateName: z.string().optional().describe("要打开的候选人姓名（支持部分匹配）"),

    index: z.number().optional().describe("要打开的候选人索引（0开始，如果不指定姓名）"),

    preferUnread: z.boolean().optional().default(true).describe("是否优先选择有未读消息的候选人"),

    listOnly: z.boolean().optional().default(false).describe("仅列出候选人，不执行点击操作"),
  }),

  execute: async ({ candidateName, index, preferUnread = true, listOnly = false }) => {
    try {
      const client = await getPuppeteerMCPClient();

      // 创建脚本 - 需要包含 return 语句
      const script = `
          const candidateName = ${candidateName ? `'${candidateName}'` : "null"};
          const targetIndex = ${index !== undefined ? index : "null"};
          const preferUnread = ${preferUnread};
          const listOnly = ${listOnly};
          
          // 获取所有聊天项
          const chatItems = document.querySelectorAll('${UNREAD_SELECTORS.unreadCandidates}');
          const candidates = [];
          
          console.log('Found ' + chatItems.length + ' chat items');
          
          // 处理每个聊天项
          chatItems.forEach((item, idx) => {
            try {
              // 查找名字元素 - 使用多个可能的选择器
              const nameElement = item.querySelector('${UNREAD_SELECTORS.candidateNameSelectors}');
              const name = nameElement ? nameElement.textContent.trim() : '';
              
              // 检查未读状态 - 根据实际 HTML 结构更新
              const hasUnreadBadge = !!(
                item.querySelector('${UNREAD_SELECTORS.unreadBadge}') ||  // .badge-count
                item.querySelector('${UNREAD_SELECTORS.unreadBadgeNew}') ||  // .badge-count.badge-count-common-less
                item.querySelector('${UNREAD_SELECTORS.unreadBadgeWithData}') ||  // [data-v-ddb4f62c].badge-count
                item.querySelector('${UNREAD_SELECTORS.unreadBadgeSpan}') ||  // .badge-count span
                item.querySelector('${UNREAD_SELECTORS.unreadDot}')  // .red-dot
              );
              
              // 获取未读数量
              let unreadCount = 0;
              const badgeElements = [
                item.querySelector('${UNREAD_SELECTORS.unreadBadgeSpan}'),  // .badge-count span (优先查找 span 内的数字)
                item.querySelector('${UNREAD_SELECTORS.unreadBadgeNew}'),  // .badge-count.badge-count-common-less
                item.querySelector('${UNREAD_SELECTORS.unreadBadgeWithData}'),  // [data-v-ddb4f62c].badge-count
                item.querySelector('${UNREAD_SELECTORS.unreadBadge}')  // .badge-count
              ].filter(Boolean);
              
              const badgeElement = badgeElements[0];
              if (badgeElement) {
                const badgeText = badgeElement.textContent?.trim();
                if (badgeText) {
                  const countMatch = badgeText.match(/\\d+/);
                  unreadCount = countMatch ? parseInt(countMatch[0], 10) : 1;
                } else {
                  unreadCount = 1;
                }
              }
              
              // 获取最后消息时间
              const timeMatch = item.textContent?.match(/\\d{1,2}:\\d{2}/);
              const lastMessageTime = timeMatch ? timeMatch[0] : '';
              
              // 获取消息预览
              const messagePreview = item.textContent
                ?.replace(name, '')
                ?.replace(/\\d{1,2}:\\d{2}/, '')
                ?.trim()
                ?.substring(0, 50) || '';
              
              if (name) {
                candidates.push({
                  name: name,
                  index: idx,
                  hasUnread: hasUnreadBadge,
                  unreadCount: unreadCount,
                  lastMessageTime: lastMessageTime,
                  messagePreview: messagePreview,
                  element: item
                });
              }
            } catch (err) {
              console.error('Error processing chat item:', err);
            }
          });
          
          console.log('Processed ' + candidates.length + ' valid candidates');
          
          // 如果只是列出候选人
          if (listOnly) {
            return {
              success: true,
              action: 'list',
              candidates: candidates.map(c => ({
                name: c.name,
                index: c.index,
                hasUnread: c.hasUnread,
                unreadCount: c.unreadCount,
                lastMessageTime: c.lastMessageTime,
                messagePreview: c.messagePreview
              })),
              totalCount: candidates.length
            };
          }
          
          // 查找目标候选人
          let targetCandidate = null;
          
          if (candidateName) {
            // 按名字查找
            targetCandidate = candidates.find(c => 
              c.name.includes(candidateName) || candidateName.includes(c.name)
            );
            
            // 如果没找到完全匹配，尝试模糊匹配
            if (!targetCandidate) {
              targetCandidate = candidates.find(c => {
                const nameChars = candidateName.split('');
                return nameChars.every(char => c.name.includes(char));
              });
            }
          } else if (targetIndex !== null) {
            // 按索引查找
            if (preferUnread) {
              // 只考虑未读的
              const unreadCandidates = candidates.filter(c => c.hasUnread);
              targetCandidate = unreadCandidates[targetIndex];
            } else {
              targetCandidate = candidates[targetIndex];
            }
          } else if (preferUnread) {
            // 默认选择第一个未读的
            targetCandidate = candidates.find(c => c.hasUnread);
          }
          
          // 执行点击
          if (targetCandidate) {
            targetCandidate.element.click();
            
            return {
              success: true,
              action: 'clicked',
              clickedCandidate: {
                name: targetCandidate.name,
                index: targetCandidate.index,
                hasUnread: targetCandidate.hasUnread,
                unreadCount: targetCandidate.unreadCount,
                lastMessageTime: targetCandidate.lastMessageTime,
                messagePreview: targetCandidate.messagePreview
              },
              totalCandidates: candidates.length,
              message: '成功点击候选人: ' + targetCandidate.name
            };
          } else {
            // 没找到目标，返回候选人列表供参考
            return {
              success: false,
              action: 'not_found',
              candidates: candidates.map(c => ({
                name: c.name,
                index: c.index,
                hasUnread: c.hasUnread,
                unreadCount: c.unreadCount
              })),
              totalCandidates: candidates.length,
              message: candidateName ? 
                '未找到候选人: ' + candidateName :
                '未找到符合条件的候选人'
            };
          }
      `;

      // 执行脚本
      const tools = await client.tools();
      const toolName = "puppeteer_evaluate";

      if (!tools[toolName]) {
        throw new Error(`MCP tool ${toolName} not available`);
      }

      const tool = tools[toolName];
      const result = await tool.execute({ script });

      // 解析结果
      const mcpResult = result as { content?: Array<{ text?: string }> };
      if (mcpResult?.content?.[0]?.text) {
        const resultText = mcpResult.content[0].text;

        try {
          // 尝试从 "Execution result:" 后面提取实际结果
          const executionMatch = resultText.match(
            /Execution result:\s*\n([\s\S]*?)(\n\nConsole output|$)/
          );

          if (executionMatch && executionMatch[1].trim() !== "undefined") {
            const jsonResult = executionMatch[1].trim();
            const parsedResult = JSON.parse(jsonResult);
            return parsedResult;
          }

          // 如果执行结果是 undefined，可能是脚本执行有问题
          console.error("Script execution returned undefined");
          return {
            success: false,
            error: "Script execution returned undefined",
            rawResult: resultText,
          };
        } catch (e) {
          console.error("Failed to parse result:", e);
          return {
            success: false,
            error: "Failed to parse script result",
            rawResult: resultText,
          };
        }
      }

      return {
        success: false,
        error: "Unexpected result format",
        rawResult: result,
      };
    } catch (error) {
      console.error("Failed to open candidate chat:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "打开候选人聊天失败",
      };
    }
  },
});

// 导出工具
export const OPEN_CANDIDATE_CHAT_IMPROVED_ACTION = "open_candidate_chat_improved";
