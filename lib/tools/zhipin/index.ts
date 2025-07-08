/**
 * Zhipin automation tools exports
 */

export * from './types';
export * from './constants';
export * from './helpers';
export * from './get-unread-candidates-improved.tool';
export * from './open-candidate-chat-improved.tool';
export * from './send-message.tool';
export * from './get-chat-details.tool';
export * from './exchange-wechat.tool';

// Re-export tools for convenience
import { getUnreadCandidatesImprovedTool } from './get-unread-candidates-improved.tool';
import { openCandidateChatImprovedTool } from './open-candidate-chat-improved.tool';
import { zhipinSendMessageTool } from './send-message.tool';
import { zhipinGetChatDetailsTool } from './get-chat-details.tool';
import { zhipinExchangeWechatTool } from './exchange-wechat.tool';

/**
 * All available Zhipin tools
 */
export const zhipinTools = {
  getUnreadCandidatesImproved: getUnreadCandidatesImprovedTool,
  openCandidateChatImproved: openCandidateChatImprovedTool,
  sendMessage: zhipinSendMessageTool,
  getChatDetails: zhipinGetChatDetailsTool,
  exchangeWechat: zhipinExchangeWechatTool,
  // Add more tools here as they are created
} as const;