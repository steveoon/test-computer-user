import { tool } from 'ai';
import { z } from 'zod';
import { Conversation, CandidateDetail } from './types';
import { TIMING, UNREAD_SELECTORS } from './constants';
import { sleep, withRetry, formatTimestamp } from './helpers';
import { getUnreadCandidatesTool } from './get-unread-candidates.tool';
import { extractCandidateInfoTool } from './extract-candidate-info.tool';
import { extractChatMessagesTool } from './extract-chat-messages.tool';
import { getPuppeteerMCPClient } from '@/lib/mcp/client-manager';

/**
 * Helper function to open candidate chat using MCP client
 */
async function openCandidateChat(candidateIndex: number, candidateName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getPuppeteerMCPClient();
    const tools = await client.tools();
    const clickTool = tools['puppeteer_click'];
    
    if (!clickTool) {
      throw new Error('MCP click tool not available');
    }

    // Try to click the candidate by index
    const candidateSelector = `.recommend-card-list .card-item:nth-child(${candidateIndex + 1})`;
    
    console.log(`Attempting to click candidate ${candidateIndex + 1} with selector: ${candidateSelector}`);
    
    await clickTool.execute({ selector: candidateSelector });
    
    // Wait for chat to load
    await sleep(TIMING.pageLoad);
    
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to open chat for ${candidateName}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Process all unread candidates tool
 * This tool orchestrates multiple other tools to batch process unread candidates
 */
export const processAllUnreadTool = tool({
  description: 'Process all unread candidates by extracting their information and chat messages',
  parameters: z.object({
    maxCandidates: z.number()
      .optional()
      .default(10)
      .describe('Maximum number of candidates to process'),
    messageLimit: z.number()
      .optional()
      .default(20)
      .describe('Maximum number of messages to extract per candidate'),
    delayBetweenCandidates: z.number()
      .optional()
      .default(500)
      .describe('Delay between processing candidates in milliseconds'),
    continueOnError: z.boolean()
      .optional()
      .default(true)
      .describe('Whether to continue processing if one candidate fails'),
    includeWorkHistory: z.boolean()
      .optional()
      .default(false)
      .describe('Whether to include work history in candidate info'),
    skipCandidateInfo: z.boolean()
      .optional()
      .default(false)
      .describe('Skip candidate info extraction (only extract messages)'),
  }),
  execute: async ({ 
    maxCandidates = 10, 
    messageLimit = 20, 
    delayBetweenCandidates = 500,
    continueOnError = true,
    includeWorkHistory = false,
    skipCandidateInfo = false
  }) => {
    const processingStart = Date.now();
    console.log(`Starting batch processing of up to ${maxCandidates} unread candidates...`);
    
    const results: {
      conversations: Conversation[];
      processedCount: number;
      failedCount: number;
      errors: Array<{ candidateIndex: number; error: string }>;
      processingTime: number;
    } = {
      conversations: [],
      processedCount: 0,
      failedCount: 0,
      errors: [],
      processingTime: 0
    };

    try {
      // Step 1: Get list of unread candidates
      console.log('📋 Step 1: Getting unread candidates list...');
      const unreadResult = await withRetry(
        async () => {
          const result = await getUnreadCandidatesTool.execute({ 
            selector: UNREAD_SELECTORS.unreadCandidates,
            max: maxCandidates 
          }, { 
            toolCallId: 'process-all-unread-get-candidates', 
            messages: [] 
          });
          return result;
        },
        { actionName: 'get unread candidates' }
      );

      if (!unreadResult.success || !unreadResult.candidates || unreadResult.candidates.length === 0) {
        return {
          success: false,
          conversations: [],
          processedCount: 0,
          failedCount: 0,
          errors: [],
          processingTime: Date.now() - processingStart,
          message: 'No unread candidates found or failed to get candidates list'
        };
      }

      const candidatesToProcess = unreadResult.candidates.slice(0, maxCandidates);
      console.log(`📨 Found ${candidatesToProcess.length} unread candidates to process`);

      // Step 2: Process each candidate
      for (let i = 0; i < candidatesToProcess.length; i++) {
        const candidate = candidatesToProcess[i];
        const candidateIndex = candidate.index;
        
        console.log(`\n🔄 Processing candidate ${i + 1}/${candidatesToProcess.length}: ${candidate.name}`);
        
        try {
          // Step 2a: Open candidate chat
          console.log(`  📱 Opening chat for ${candidate.name}...`);
          const chatResult = await withRetry(
            async () => await openCandidateChat(candidateIndex, candidate.name),
            { actionName: `open chat for ${candidate.name}` }
          );

          if (!chatResult.success) {
            throw new Error(`Failed to open chat: ${chatResult.error || 'Unknown error'}`);
          }

          // Wait for chat to load
          await sleep(TIMING.pageLoad);

          // Step 2b: Extract candidate information (optional)
          let candidateDetail: CandidateDetail | null = null;
          if (!skipCandidateInfo) {
            console.log(`  👤 Extracting candidate info for ${candidate.name}...`);
            try {
              const infoResult = await withRetry(
                async () => {
                  const result = await extractCandidateInfoTool.execute({ 
                    includeWorkHistory,
                    timeout: TIMING.elementWait 
                  }, { 
                    toolCallId: `process-all-unread-extract-info-${candidateIndex}`, 
                    messages: [] 
                  });
                  return result;
                },
                { actionName: `extract info for ${candidate.name}` }
              );

              if (infoResult.success && infoResult.detail) {
                candidateDetail = infoResult.detail;
                console.log(`  ✅ Extracted info for ${candidateDetail.name}`);
              } else {
                console.warn(`  ⚠️ Failed to extract candidate info: ${infoResult.error}`);
              }
            } catch (infoError) {
              console.warn(`  ⚠️ Error extracting candidate info: ${infoError}`);
              // Continue with message extraction even if info extraction fails
            }
          }

          // Step 2c: Extract chat messages
          console.log(`  💬 Extracting chat messages for ${candidate.name}...`);
          const messagesResult = await withRetry(
            async () => {
              const result = await extractChatMessagesTool.execute({ 
                limit: messageLimit,
                direction: 'newest',
                timeout: TIMING.elementWait 
              }, { 
                toolCallId: `process-all-unread-extract-messages-${candidateIndex}`, 
                messages: [] 
              });
              return result;
            },
            { actionName: `extract messages for ${candidate.name}` }
          );

          if (!messagesResult.success) {
            throw new Error(`Failed to extract messages: ${messagesResult.error || 'Unknown error'}`);
          }

          // Step 2d: Create conversation object
          const conversation: Conversation = {
            candidateName: candidateDetail?.name || candidate.name,
            messages: messagesResult.messages || [],
            lastMessageTime: messagesResult.messages?.[0]?.timestamp,
            unreadCount: candidate.unreadCount,
            ...(candidateDetail && { candidateDetail })
          };

          results.conversations.push(conversation);
          results.processedCount++;

          console.log(`  ✅ Successfully processed ${candidate.name} (${messagesResult.messages?.length || 0} messages)`);

          // Add delay between candidates to avoid overwhelming the site
          if (i < candidatesToProcess.length - 1) {
            console.log(`  ⏱️ Waiting ${delayBetweenCandidates}ms before next candidate...`);
            await sleep(delayBetweenCandidates);
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`  ❌ Failed to process candidate ${candidate.name}: ${errorMsg}`);
          
          results.failedCount++;
          results.errors.push({
            candidateIndex,
            error: errorMsg
          });

          // Check if we should continue or stop
          if (!continueOnError) {
            console.log('🛑 Stopping processing due to error (continueOnError=false)');
            break;
          }

          // Add delay before next candidate even on error
          if (i < candidatesToProcess.length - 1) {
            console.log(`  ⏱️ Waiting ${delayBetweenCandidates}ms before next candidate...`);
            await sleep(delayBetweenCandidates);
          }
        }
      }

      results.processingTime = Date.now() - processingStart;

      console.log(`\n📊 Processing complete:`);
      console.log(`  ✅ Successfully processed: ${results.processedCount} candidates`);
      console.log(`  ❌ Failed: ${results.failedCount} candidates`);
      console.log(`  ⏱️ Total time: ${results.processingTime}ms`);

      return {
        success: true,
        conversations: results.conversations,
        processedCount: results.processedCount,
        failedCount: results.failedCount,
        errors: results.errors,
        processingTime: results.processingTime,
        timestamp: formatTimestamp(),
        message: `Successfully processed ${results.processedCount} out of ${candidatesToProcess.length} candidates`
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Critical error during batch processing:', errorMsg);
      
      results.processingTime = Date.now() - processingStart;
      
      return {
        success: false,
        conversations: results.conversations,
        processedCount: results.processedCount,
        failedCount: results.failedCount,
        errors: results.errors,
        processingTime: results.processingTime,
        timestamp: formatTimestamp(),
        error: errorMsg,
        message: `Processing failed after ${results.processedCount} candidates: ${errorMsg}`
      };
    }
  },
});


/**
 * Progress callback interface for tracking processing
 */
export interface ProcessingProgress {
  currentIndex: number;
  totalCandidates: number;
  currentCandidateName: string;
  step: 'opening_chat' | 'extracting_info' | 'extracting_messages' | 'completed' | 'failed';
  error?: string;
}

/**
 * Enhanced version with progress callback
 */
export const processAllUnreadWithProgressTool = tool({
  description: 'Process all unread candidates with progress tracking',
  parameters: z.object({
    maxCandidates: z.number().optional().default(10),
    messageLimit: z.number().optional().default(20),
    delayBetweenCandidates: z.number().optional().default(500),
    continueOnError: z.boolean().optional().default(true),
    includeWorkHistory: z.boolean().optional().default(false),
    skipCandidateInfo: z.boolean().optional().default(false),
  }),
  execute: async (params, options) => {
    // For now, just call the main tool
    // In future, this could be enhanced to support real-time progress reporting
    return await processAllUnreadTool.execute(params, options);
  },
});

// Export the tool action name for consistency
export const PROCESS_ALL_UNREAD_ACTION = 'process_all_unread';