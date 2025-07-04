import { tool } from 'ai';
import { z } from 'zod';
import { UnreadCandidate } from './types';
import { UNREAD_SELECTORS } from './constants';
import { getPuppeteerMCPClient } from '@/lib/mcp/client-manager';

export const getUnreadCandidatesTool = tool({
  description: 'Get a list of all unread candidates in the current chat list',
  parameters: z.object({
    selector: z.string()
      .optional()
      .default(UNREAD_SELECTORS.unreadCandidates)
      .describe('CSS selector to find unread candidates'),
    max: z.number()
      .optional()
      .describe('Maximum number of candidates to return'),
  }),
  execute: async ({ selector = UNREAD_SELECTORS.unreadCandidates, max }) => {
    try {
      // Get MCP client for puppeteer operations
      const client = await getPuppeteerMCPClient();
      
      // Create optimized JavaScript script based on testing results
      const script = `
        (function() {
          const selector = '${selector}';
          const max = ${max || 'null'};
          
          // Query for all geek items (optimized based on testing)
          const elements = document.querySelectorAll(selector);
          const candidates = [];
          
          console.log('Found ' + elements.length + ' candidate elements');
          
          // Process each element
          Array.from(elements).slice(0, max || elements.length).forEach((element, index) => {
            try {
              const text = element.textContent || '';
              
              // Extract name using Chinese character pattern
              const nameMatch = text.match(/[\u4e00-\u9fa5]{2,4}/);
              const name = nameMatch ? nameMatch[0] : '';
              
              // Extract time pattern (HH:MM format)
              const timeMatch = text.match(/\d{1,2}:\d{2}/);
              const time = timeMatch ? timeMatch[0] : '';
              
              // Check for unread badge
              const badgeElement = element.querySelector('.badge');
              const hasUnread = !!badgeElement;
              
              // Extract unread count if available
              let unreadCount = 0;
              if (hasUnread) {
                const badgeText = badgeElement.textContent?.trim();
                if (badgeText && badgeText !== '') {
                  const countMatch = badgeText.match(/\d+/);
                  unreadCount = countMatch ? parseInt(countMatch[0], 10) : 1;
                } else {
                  unreadCount = 1; // Default to 1 if badge exists but no count
                }
              }
              
              // Extract message preview (limit to 100 chars)
              const preview = text.replace(/[\u4e00-\u9fa5]{2,4}/, '').replace(/\d{1,2}:\d{2}/, '').trim().substring(0, 100);
              
              // Only add if we have a name and unread indicator
              if (name && hasUnread) {
                candidates.push({
                  name: name,
                  time: time,
                  preview: preview || '',
                  hasUnread: hasUnread,
                  unreadCount: unreadCount,
                  index: index
                });
              }
            } catch (err) {
              console.error('Error processing candidate element:', err);
            }
          });
          
          console.log('Successfully processed ' + candidates.length + ' unread candidates');
          
          return {
            success: true,
            candidates: candidates,
            count: candidates.length,
            totalElements: elements.length,
            selector: selector
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
      const mcpResult = result as unknown;
      let parsedResult: {
        success: boolean;
        candidates: UnreadCandidate[];
        count: number;
        totalElements: number;
        selector: string;
      } = {
        success: false,
        candidates: [],
        count: 0,
        totalElements: 0,
        selector: selector
      };
      
      if (mcpResult && typeof mcpResult === 'object' && 'content' in mcpResult && Array.isArray((mcpResult as {content: unknown[]}).content) && (mcpResult as {content: unknown[]}).content.length > 0) {
        const textContent = (mcpResult as {content: {type: string, text: string}[]}).content.find((content: {type: string, text: string}) => content.type === "text");
        if (textContent && textContent.text) {
          try {
            const scriptResult = JSON.parse(textContent.text);
            if (scriptResult && typeof scriptResult === 'object') {
              parsedResult = {
                success: scriptResult.success || false,
                candidates: Array.isArray(scriptResult.candidates) ? scriptResult.candidates : [],
                count: scriptResult.count || 0,
                totalElements: scriptResult.totalElements || 0,
                selector: scriptResult.selector || selector
              };
            }
          } catch (e) {
            console.error('Failed to parse script result:', e);
          }
        }
      }
      
      return {
        success: parsedResult.success,
        candidates: parsedResult.candidates as UnreadCandidate[],
        count: parsedResult.count,
        totalElements: parsedResult.totalElements,
        selector: parsedResult.selector,
        message: parsedResult.success ? 
          `Successfully found ${parsedResult.count} unread candidates out of ${parsedResult.totalElements} total elements` :
          'Failed to extract candidates'
      };
      
    } catch (error) {
      console.error('Failed to get unread candidates:', error);
      
      return {
        success: false,
        candidates: [],
        count: 0,
        totalElements: 0,
        selector: selector,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Error occurred while fetching unread candidates'
      };
    }
  },
});

// Export the tool action name for consistency
export const GET_UNREAD_CANDIDATES_ACTION = 'get_unread_candidates';