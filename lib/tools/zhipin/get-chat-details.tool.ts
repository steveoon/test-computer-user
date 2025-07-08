import { tool } from "ai";
import { z } from "zod";
import { getPuppeteerMCPClient } from "@/lib/mcp/client-manager";
import { CHAT_DETAILS_SELECTORS } from "./constants";

/**
 * 获取聊天详情工具
 *
 * 功能：
 * - 获取候选人基本信息（姓名、职位、年龄、经验等）
 * - 获取完整的聊天记录
 * - 自动判断消息发送者（候选人/招聘者）
 * - 提取消息时间戳
 */
export const zhipinGetChatDetailsTool = () =>
  tool({
    description: `获取BOSS直聘聊天窗口的候选人信息和聊天记录
    
    功能：
    - 提取候选人基本信息（姓名、职位、年龄、经验等）
    - 获取完整的聊天历史记录
    - 自动识别消息发送者
    - 包含消息时间戳
    
    注意：
    - 需要先打开候选人聊天窗口
    - 返回结构化的候选人信息和聊天记录`,

    parameters: z.object({
      includeHtml: z.boolean().optional().default(false).describe("是否包含原始HTML（用于调试）"),
    }),

    execute: async ({ includeHtml = false }) => {
      try {
        const client = await getPuppeteerMCPClient();
        const tools = await client.tools();

        if (!tools.puppeteer_evaluate) {
          throw new Error("MCP tool puppeteer_evaluate not available");
        }

        // 创建获取聊天详情的脚本
        const script = `
          // 获取候选人基本信息
          const candidateInfoElement = document.querySelector('${CHAT_DETAILS_SELECTORS.candidateInfoContainer}');
          
          let candidateInfo = null;
          if (candidateInfoElement) {
            // 提取候选人姓名
            const nameElement = candidateInfoElement.querySelector('${CHAT_DETAILS_SELECTORS.candidateName}');
            const name = nameElement ? nameElement.textContent.trim() : '';
            
            // 提取年龄、经验等信息
            const infoElements = candidateInfoElement.querySelectorAll('${CHAT_DETAILS_SELECTORS.candidateInfoItem}, ${CHAT_DETAILS_SELECTORS.candidateTag}');
            const infoTexts = Array.from(infoElements).map(el => el.textContent.trim()).filter(text => text);
            
            // 提取职位信息
            const positionElement = candidateInfoElement.querySelector('${CHAT_DETAILS_SELECTORS.candidatePosition}, ${CHAT_DETAILS_SELECTORS.candidatePositionAlt}');
            const position = positionElement ? positionElement.textContent.trim() : '';
            
            // 尝试从完整文本中提取更多信息
            const fullText = candidateInfoElement.textContent.trim();
            
            // 解析年龄
            const ageMatch = fullText.match(/(\\d{2,3})岁/);
            const age = ageMatch ? ageMatch[1] : '';
            
            // 解析经验
            const experienceMatch = fullText.match(/(\\d+年|\\d+年以上|应届生|在校生)/);
            const experience = experienceMatch ? experienceMatch[1] : '';
            
            // 解析学历
            const educationMatch = fullText.match(/(初中|高中|中专|大专|本科|硕士|博士|初中及以下|高中及以下)/);
            const education = educationMatch ? educationMatch[1] : '';
            
            candidateInfo = {
              name: name || '未知',
              position: position,
              age: age,
              experience: experience,
              education: education,
              info: infoTexts,
              fullText: fullText
            };
          }
          
          // 获取聊天记录
          const chatContainer = document.querySelector('${CHAT_DETAILS_SELECTORS.chatMessageContainer}');
          
          let chatMessages = [];
          if (chatContainer) {
            // 使用多种选择器尝试获取消息
            const messageElements = chatContainer.querySelectorAll('${CHAT_DETAILS_SELECTORS.messageItem}');
            
            chatMessages = Array.from(messageElements).map((msgEl, index) => {
              // 获取时间戳
              const timeElement = msgEl.querySelector('${CHAT_DETAILS_SELECTORS.messageTime}');
              const time = timeElement ? timeElement.textContent.trim() : '';
              
              // 判断消息类型和发送者
              let sender = 'unknown';
              let content = '';
              let messageType = 'text';
              
              // 系统消息
              if (msgEl.querySelector('${CHAT_DETAILS_SELECTORS.systemMessage}')) {
                sender = 'system';
                messageType = 'system';
                content = msgEl.textContent.trim().replace(time, '').trim();
              }
              // 候选人消息（左侧）
              else if (msgEl.querySelector('${CHAT_DETAILS_SELECTORS.friendMessage}')) {
                sender = 'candidate';
                const textEl = msgEl.querySelector('${CHAT_DETAILS_SELECTORS.friendMessage} ${CHAT_DETAILS_SELECTORS.messageTextSpan}');
                content = textEl ? textEl.textContent.trim() : msgEl.querySelector('${CHAT_DETAILS_SELECTORS.friendMessage}').textContent.trim();
              }
              // 招聘者消息（右侧）
              else if (msgEl.querySelector('${CHAT_DETAILS_SELECTORS.myMessage}')) {
                sender = 'recruiter';
                const textEl = msgEl.querySelector('${CHAT_DETAILS_SELECTORS.myMessage} ${CHAT_DETAILS_SELECTORS.messageTextSpan}');
                content = textEl ? textEl.textContent.trim() : msgEl.querySelector('${CHAT_DETAILS_SELECTORS.myMessage}').textContent.trim();
                
                // 检查是否已读
                const isRead = msgEl.querySelector('${CHAT_DETAILS_SELECTORS.readStatus}') !== null;
                if (isRead) {
                  content = content.replace('已读', '').trim();
                }
              }
              // 简历卡片
              else if (msgEl.querySelector('${CHAT_DETAILS_SELECTORS.resumeMessage}')) {
                sender = 'system';
                messageType = 'resume';
                content = msgEl.textContent.trim().replace(time, '').trim();
              }
              
              return {
                index: index,
                sender: sender,
                messageType: messageType,
                content: content,
                time: time,
                hasTime: !!time
              };
            }).filter(msg => msg.content && msg.content.length > 0);
          }
          
          // 统计信息
          const stats = {
            totalMessages: chatMessages.length,
            candidateMessages: chatMessages.filter(m => m.sender === 'candidate').length,
            recruiterMessages: chatMessages.filter(m => m.sender === 'recruiter').length,
            systemMessages: chatMessages.filter(m => m.sender === 'system').length,
            messagesWithTime: chatMessages.filter(m => m.hasTime).length
          };
          
          // 格式化为conversation_history格式
          const formattedHistory = chatMessages
            .filter(m => m.sender === 'candidate' || m.sender === 'recruiter')
            .map(m => {
              const prefix = m.sender === 'candidate' ? '求职者' : '我';
              return \`\${prefix}: \${m.content}\`;
            });
          
          return {
            candidateInfo: candidateInfo,
            chatMessages: chatMessages,
            formattedHistory: formattedHistory,
            stats: stats,
            candidateInfoFound: !!candidateInfoElement,
            chatContainerFound: !!chatContainer,
            extractedAt: new Date().toISOString()
          };
        `;

        // 执行脚本
        const result = await tools.puppeteer_evaluate.execute({ script });

        // 解析结果
        const mcpResult = result as { content?: Array<{ text?: string }> };
        if (mcpResult?.content?.[0]?.text) {
          const resultText = mcpResult.content[0].text;

          try {
            const executionMatch = resultText.match(
              /Execution result:\s*\n([\s\S]*?)(\n\nConsole output|$)/
            );

            if (executionMatch && executionMatch[1].trim() !== "undefined") {
              const jsonResult = executionMatch[1].trim();
              const parsedResult = JSON.parse(jsonResult);

              if (parsedResult.candidateInfoFound || parsedResult.chatContainerFound) {
                return {
                  success: true,
                  message: "成功获取聊天详情",
                  data: parsedResult,
                  summary: {
                    candidateName: parsedResult.candidateInfo?.name || "未知",
                    candidatePosition: parsedResult.candidateInfo?.position || "未知职位",
                    totalMessages: parsedResult.stats?.totalMessages || 0,
                    lastMessageTime:
                      parsedResult.chatMessages?.[parsedResult.chatMessages.length - 1]?.time ||
                      "无",
                  },
                  formattedHistory: parsedResult.formattedHistory || [],
                };
              } else {
                return {
                  success: false,
                  error: "未找到聊天窗口或候选人信息",
                  message: "请确保已打开候选人聊天窗口",
                };
              }
            }
          } catch (e) {
            console.error("Failed to parse result:", e);
          }

          return {
            success: false,
            error: "Failed to parse chat details",
            rawResult: includeHtml ? resultText : undefined,
          };
        }

        return {
          success: false,
          error: "Unexpected result format",
          message: "获取聊天详情时出现未知错误",
        };
      } catch (error) {
        console.error("Failed to get chat details:", error);

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          message: "获取聊天详情时发生错误",
        };
      }
    },
  });

/**
 * 快捷创建函数
 */
export const createZhipinGetChatDetailsTool = zhipinGetChatDetailsTool;
