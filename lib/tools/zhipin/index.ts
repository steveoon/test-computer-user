/**
 * Zhipin automation tools exports
 */

export * from './types';
export * from './constants';
export * from './helpers';
export * from './get-unread-candidates.tool';
export * from './extract-candidate-info.tool';
export * from './extract-chat-messages.tool';
export * from './open-candidate-chat.tool';
export * from './process-all-unread.tool';

// Re-export tools for convenience
import { getUnreadCandidatesTool } from './get-unread-candidates.tool';
import { extractCandidateInfoTool } from './extract-candidate-info.tool';
import { extractChatMessagesTool } from './extract-chat-messages.tool';
import { openCandidateChatTool } from './open-candidate-chat.tool';
import { processAllUnreadTool, processAllUnreadWithProgressTool } from './process-all-unread.tool';

/**
 * All available Zhipin tools
 */
export const zhipinTools = {
  getUnreadCandidates: getUnreadCandidatesTool,
  extractCandidateInfo: extractCandidateInfoTool,
  extractChatMessages: extractChatMessagesTool,
  openCandidateChat: openCandidateChatTool,
  processAllUnread: processAllUnreadTool,
  processAllUnreadWithProgress: processAllUnreadWithProgressTool,
  // Add more tools here as they are created
} as const;