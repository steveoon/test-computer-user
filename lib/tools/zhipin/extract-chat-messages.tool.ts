import { tool } from 'ai';
import { z } from 'zod';
import { ChatMsg } from './types';
import { CHAT_SELECTORS, TIMING } from './constants';
import { getPuppeteerMCPClient } from '../../mcp/client-manager';

export const extractChatMessagesTool = tool({
  description: 'Extract chat messages from the current chat conversation page',
  parameters: z.object({
    limit: z.number()
      .optional()
      .default(20)
      .describe('Maximum number of messages to extract'),
    direction: z.enum(['newest', 'oldest'])
      .optional()
      .default('newest')
      .describe('Direction to extract messages from'),
    timeout: z.number()
      .optional()
      .default(TIMING.elementWait)
      .describe('Timeout for element extraction in milliseconds'),
  }),
  execute: async ({ limit = 20, direction = 'newest', timeout = TIMING.elementWait }) => {
    try {
      // Get MCP client for puppeteer operations
      const client = await getPuppeteerMCPClient();
      
      // Create JavaScript script for extracting chat messages
      const script = `
        (function() {
          const limit = ${limit};
          const direction = "${direction}";
          const timeout = ${timeout};
          const maxMessageLength = 2000;
          
          console.log('Starting chat message extraction...');
          
          // Helper function to determine sender type
          function determineSender(messageElement) {
            const userClasses = ['message-right', 'message-self', 'msg-right', 'send-msg'];
            const candidateClasses = ['message-left', 'message-other', 'msg-left', 'receive-msg'];
            
            const className = messageElement.className || '';
            const classNames = className.toLowerCase();
            
            if (userClasses.some(cls => classNames.includes(cls))) {
              return 'user';
            }
            
            if (candidateClasses.some(cls => classNames.includes(cls))) {
              return 'candidate';
            }
            
            // Check position-based determination
            const rect = messageElement.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            
            if (rect.left > windowWidth * 0.5) {
              return 'user';
            }
            
            return 'candidate';
          }
          
          // Helper function to extract message time
          function extractMessageTime(messageElement) {
            const timeSelectors = [
              '.message-time',
              '.msg-time',
              '.time-text',
              '.timestamp',
              '[class*="time"]'
            ];
            
            for (const selector of timeSelectors) {
              const timeElement = messageElement.querySelector(selector);
              if (timeElement && timeElement.textContent) {
                return timeElement.textContent.trim();
              }
            }
            
            return null;
          }
          
          // Helper function to generate timestamp
          function generateTimestamp(timeString) {
            if (!timeString) return null;
            
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (timeString.includes(':')) {
              const timeParts = timeString.split(':');
              const hours = parseInt(timeParts[0]);
              const minutes = parseInt(timeParts[1]);
              if (!isNaN(hours) && !isNaN(minutes)) {
                const messageTime = new Date(today);
                messageTime.setHours(hours, minutes, 0, 0);
                return messageTime.toISOString();
              }
            }
            
            return now.toISOString();
          }
          
          // Helper function to truncate long messages
          function truncateMessage(content) {
            if (!content || content.length <= maxMessageLength) {
              return content;
            }
            
            return content.substring(0, maxMessageLength) + '...(truncated)';
          }
          
          // Strategy 1: Extract from standard message bubbles
          function extractFromMessageBubbles() {
            console.log('Trying Strategy 1: Extract from message bubbles...');
            
            const messageBubbleSelectors = [
              '${CHAT_SELECTORS.messageItem}',
              '.message-bubble',
              '.msg-bubble',
              '.chat-message',
              '.conversation-message',
              '[class*="message"]',
              '[class*="msg"]'
            ];
            
            let messages = [];
            
            for (const selector of messageBubbleSelectors) {
              const messageElements = document.querySelectorAll(selector);
              console.log('Found ' + messageElements.length + ' elements with selector: ' + selector);
              
              if (messageElements.length > 0) {
                messageElements.forEach((element, index) => {
                  try {
                    const contentSelectors = [
                      '${CHAT_SELECTORS.messageContent}',
                      '${CHAT_SELECTORS.messageText}',
                      '.msg-content',
                      '.text-content',
                      '.message-text',
                      '.chat-text'
                    ];
                    
                    let content = '';
                    
                    for (const contentSelector of contentSelectors) {
                      const contentElement = element.querySelector(contentSelector);
                      if (contentElement && contentElement.textContent) {
                        content = contentElement.textContent.trim();
                        break;
                      }
                    }
                    
                    if (!content) {
                      content = element.textContent ? element.textContent.trim() : '';
                    }
                    
                    if (!content || content.length < 2) {
                      return;
                    }
                    
                    if (content.includes('系统消息') || 
                        content.includes('撤回了') ||
                        content.includes('加入了')) {
                      return;
                    }
                    
                    const sender = determineSender(element);
                    const timeString = extractMessageTime(element);
                    const timestamp = generateTimestamp(timeString);
                    const truncatedContent = truncateMessage(content);
                    
                    messages.push({
                      sender: sender,
                      message: truncatedContent,
                      timestamp: timestamp,
                      time: timeString,
                      isSystemMessage: false
                    });
                  } catch (e) {
                    console.error('Error processing message element:', e);
                  }
                });
                
                if (messages.length > 0) {
                  console.log('Successfully extracted ' + messages.length + ' messages using Strategy 1');
                  return messages;
                }
              }
            }
            
            console.log('Strategy 1 failed: No message bubbles found');
            return [];
          }
          
          // Strategy 2: Parse from chat area text
          function extractFromChatText() {
            console.log('Trying Strategy 2: Parse from chat area text...');
            
            const chatAreaSelectors = [
              '${CHAT_SELECTORS.chatContainer}',
              '${CHAT_SELECTORS.messageList}',
              '.chat-area',
              '.conversation-area',
              '.message-area',
              '.chat-content',
              '[class*="chat"]',
              '[class*="conversation"]',
              '[class*="message"]'
            ];
            
            let chatText = '';
            
            for (const selector of chatAreaSelectors) {
              const chatArea = document.querySelector(selector);
              if (chatArea && chatArea.textContent) {
                chatText = chatArea.textContent;
                console.log('Found chat area with selector: ' + selector);
                break;
              }
            }
            
            if (!chatText) {
              console.log('Strategy 2 failed: No chat area found');
              return [];
            }
            
            const lines = chatText.split('\\n')
              .map(line => line.trim())
              .filter(line => line.length > 0);
            
            const messages = [];
            let currentMessage = null;
            
            for (const line of lines) {
              if (line.includes('系统消息') || 
                  line.includes('撤回了') ||
                  line.includes('加入了') ||
                  line.length < 2) {
                continue;
              }
              
              const timePattern = /\\d{1,2}:\\d{2}/;
              const hasTime = timePattern.test(line);
              
              if (hasTime) {
                if (currentMessage) {
                  messages.push(currentMessage);
                }
                
                const timeMatch = line.match(timePattern);
                const timeString = timeMatch ? timeMatch[0] : null;
                const content = line.replace(timePattern, '').trim();
                
                if (content) {
                  currentMessage = {
                    sender: 'candidate',
                    message: truncateMessage(content),
                    timestamp: generateTimestamp(timeString),
                    time: timeString,
                    isSystemMessage: false
                  };
                }
              } else if (currentMessage && line.length > 5) {
                currentMessage.message = truncateMessage(currentMessage.message + ' ' + line);
              } else if (line.length > 5) {
                messages.push({
                  sender: 'candidate',
                  message: truncateMessage(line),
                  timestamp: generateTimestamp(null),
                  time: null,
                  isSystemMessage: false
                });
              }
            }
            
            if (currentMessage) {
              messages.push(currentMessage);
            }
            
            console.log('Successfully extracted ' + messages.length + ' messages using Strategy 2');
            return messages;
          }
          
          // Main extraction logic
          let messages = [];
          
          // Try Strategy 1 first
          messages = extractFromMessageBubbles();
          
          // If Strategy 1 fails, try Strategy 2
          if (messages.length === 0) {
            messages = extractFromChatText();
          }
          
          // Apply limit and direction sorting
          if (messages.length > 0) {
            messages.sort((a, b) => {
              if (a.timestamp && b.timestamp) {
                return direction === 'newest' ? 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() :
                  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
              }
              return 0;
            });
            
            if (messages.length > limit) {
              messages = messages.slice(0, limit);
            }
          }
          
          console.log('Final result: ' + messages.length + ' messages extracted');
          
          return {
            success: true,
            messages: messages,
            count: messages.length,
            extractionMethod: messages.length > 0 ? 'successful' : 'failed'
          };
        })();
      `;
      
      // Get MCP tools and execute script
      const tools = await client.tools();
      const toolName = 'puppeteer_evaluate';
      
      if (!tools[toolName]) {
        throw new Error(`MCP tool ${toolName} not available`);
      }
      
      const tool = tools[toolName];
      const result = await tool.execute({ script });
      
      // Parse and validate the result
      const mcpResult = result as { content?: Array<{ type: string; text?: string }> };
      let extractedData: {
        success: boolean;
        messages: ChatMsg[];
        count: number;
        extractionMethod: string;
      } = {
        success: false,
        messages: [],
        count: 0,
        extractionMethod: 'failed'
      };
      
      if (mcpResult && mcpResult.content && mcpResult.content.length > 0) {
        const textContent = mcpResult.content.find((content) => content.type === "text");
        if (textContent && textContent.text) {
          try {
            const parsedResult = JSON.parse(textContent.text);
            extractedData = parsedResult;
          } catch (e) {
            console.error('Failed to parse chat messages script result:', e);
          }
        }
      }
      
      // Transform the data to match expected ChatMsg format
      const transformedMessages: ChatMsg[] = extractedData.messages.map(msg => ({
        sender: msg.sender as 'user' | 'candidate',
        message: msg.message,
        timestamp: msg.timestamp,
        isSystemMessage: msg.isSystemMessage
      }));
      
      return {
        success: extractedData.success,
        messages: transformedMessages,
        count: transformedMessages.length,
        extractionMethod: extractedData.extractionMethod,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to extract chat messages:', error);
      
      return {
        success: false,
        messages: [],
        count: 0,
        extractionMethod: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Export the tool action name for consistency
export const EXTRACT_CHAT_MESSAGES_ACTION = 'extract_chat_messages';