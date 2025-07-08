import { tool } from 'ai';
import { z } from 'zod';
import { UNREAD_SELECTORS } from './constants';
import { getPuppeteerMCPClient } from '@/lib/mcp/client-manager';

export const getUnreadCandidatesImprovedTool = tool({
  description: `获取当前聊天列表中所有未读候选人的改进版
  
  改进特性：
  - 使用更精确的选择器查找名字元素
  - 更准确的未读状态检测
  - 返回更详细的候选人信息
  - 支持过滤和排序选项
  `,
  
  parameters: z.object({
    selector: z.string()
      .optional()
      .default(UNREAD_SELECTORS.unreadCandidates)
      .describe('CSS选择器用于查找候选人项'),
      
    max: z.number()
      .optional()
      .describe('返回的最大候选人数量'),
      
    onlyUnread: z.boolean()
      .optional()
      .default(false)
      .describe('是否只返回有未读消息的候选人'),
      
    sortBy: z.enum(['time', 'unreadCount', 'name'])
      .optional()
      .default('time')
      .describe('排序方式')
  }),
  
  execute: async ({ selector = UNREAD_SELECTORS.unreadCandidates, max, onlyUnread = false, sortBy = 'time' }) => {
    try {
      const client = await getPuppeteerMCPClient();
      
      // 创建脚本 - 需要包含 return 语句
      const script = `
        const selector = '${selector}';
        const max = ${max || 'null'};
        const onlyUnread = ${onlyUnread};
        const sortBy = '${sortBy}';
        
        // 获取所有候选人项
        const elements = document.querySelectorAll(selector);
        const candidates = [];
        
        console.log('Found ' + elements.length + ' candidate elements');
        
        // 处理每个元素
        elements.forEach((element, index) => {
          try {
            // 使用改进的选择器查找名字
            const nameElement = element.querySelector('${UNREAD_SELECTORS.candidateNameSelectors}');
            const name = nameElement ? nameElement.textContent.trim() : '';
            
            // 如果找不到名字，尝试从文本中提取
            let extractedName = name;
            if (!extractedName) {
              const textContent = element.textContent || '';
              const nameMatch = textContent.match(/[\\u4e00-\\u9fa5]{2,4}/);
              extractedName = nameMatch ? nameMatch[0] : '';
            }
            
            // 检查未读状态 - 根据实际 HTML 结构，badge-count 类表示有未读消息
            const hasUnread = !!(
              element.querySelector('${UNREAD_SELECTORS.unreadBadge}') ||  // .badge-count
              element.querySelector('${UNREAD_SELECTORS.unreadBadgeNew}') ||  // .badge-count.badge-count-common-less
              element.querySelector('${UNREAD_SELECTORS.unreadBadgeWithData}') ||  // [data-v-ddb4f62c].badge-count
              element.querySelector('${UNREAD_SELECTORS.unreadBadgeSpan}') ||  // .badge-count span
              element.querySelector('${UNREAD_SELECTORS.unreadDot}')  // .red-dot
            );
            
            // 获取未读数量
            let unreadCount = 0;
            const badgeElements = [
              element.querySelector('${UNREAD_SELECTORS.unreadBadgeSpan}'),  // .badge-count span (优先查找 span 内的数字)
              element.querySelector('${UNREAD_SELECTORS.unreadBadgeNew}'),  // .badge-count.badge-count-common-less
              element.querySelector('${UNREAD_SELECTORS.unreadBadgeWithData}'),  // [data-v-ddb4f62c].badge-count
              element.querySelector('${UNREAD_SELECTORS.unreadBadge}')  // .badge-count
            ].filter(Boolean);
            
            if (badgeElements.length > 0) {
              const badgeElement = badgeElements[0];
              const badgeText = badgeElement.textContent?.trim();
              if (badgeText) {
                const countMatch = badgeText.match(/\\d+/);
                unreadCount = countMatch ? parseInt(countMatch[0], 10) : 1;
              } else {
                unreadCount = 1;
              }
            }
            
            // 获取时间
            const timeMatch = element.textContent?.match(/\\d{1,2}:\\d{2}/);
            const time = timeMatch ? timeMatch[0] : '';
            
            // 获取消息预览
            let preview = '';
            const textContent = element.textContent || '';
            preview = textContent
              .replace(extractedName, '')
              .replace(/\\d{1,2}:\\d{2}/, '')
              .replace(/\\d+/, '')
              .trim()
              .substring(0, 100);
            
            // 根据条件添加候选人
            const shouldAdd = onlyUnread ? hasUnread : true;
            
            if (extractedName && shouldAdd) {
              candidates.push({
                name: extractedName,
                time: time,
                preview: preview,
                hasUnread: hasUnread,
                unreadCount: unreadCount,
                index: index
              });
            }
          } catch (err) {
            console.error('Error processing candidate element at index ' + index + ':', err);
          }
        });
        
        // 排序
        if (sortBy === 'unreadCount') {
          candidates.sort((a, b) => b.unreadCount - a.unreadCount);
        } else if (sortBy === 'name') {
          candidates.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        }
        
        // 限制数量
        const finalCandidates = max ? candidates.slice(0, max) : candidates;
        
        console.log('Successfully processed ' + finalCandidates.length + ' candidates');
        
        // 统计信息
        const stats = {
          total: elements.length,
          withName: candidates.length,
          withUnread: candidates.filter(c => c.hasUnread).length,
          returned: finalCandidates.length
        };
        
        // 返回结果对象
        return {
          success: true,
          candidates: finalCandidates,
          count: finalCandidates.length,
          stats: stats,
          selector: selector,
          filters: {
            onlyUnread: onlyUnread,
            sortBy: sortBy,
            max: max
          }
        };
      `;
      
      // 执行脚本
      const tools = await client.tools();
      const toolName = 'puppeteer_evaluate';
      
      if (!tools[toolName]) {
        throw new Error(`MCP tool ${toolName} not available`);
      }
      
      const tool = tools[toolName];
      
      // 执行脚本
      const result = await tool.execute({ script });
      
      // 解析结果
      const mcpResult = result as any;
      if (mcpResult?.content?.[0]?.text) {
        const resultText = mcpResult.content[0].text;
        
        try {
          // 尝试从 "Execution result:" 后面提取实际结果
          const executionMatch = resultText.match(/Execution result:\s*\n([\s\S]*?)(\n\nConsole output|$)/);
          
          if (executionMatch && executionMatch[1].trim() !== 'undefined') {
            const jsonResult = executionMatch[1].trim();
            // 结果已经是 JSON 字符串，直接解析
            const parsedResult = JSON.parse(jsonResult);
            
            return {
              ...parsedResult,
              message: parsedResult.success ? 
                `成功获取 ${parsedResult.count} 个候选人 (总计: ${parsedResult.stats.total}, 有名字: ${parsedResult.stats.withName}, 未读: ${parsedResult.stats.withUnread})` :
                '获取候选人失败'
            };
          }
          
          // 如果执行结果是 undefined，可能是脚本执行有问题
          console.error('Script execution returned undefined');
          return {
            success: false,
            candidates: [],
            count: 0,
            error: 'Script execution returned undefined',
            rawResult: resultText
          };
        } catch (e) {
          console.error('Failed to parse script result:', e);
          // 尝试直接提取 JSON 部分
          try {
            // 查找 JSON 对象的开始和结束
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsedResult = JSON.parse(jsonMatch[0]);
              return {
                ...parsedResult,
                message: parsedResult.success ? 
                  `成功获取 ${parsedResult.count} 个候选人` :
                  '获取候选人失败'
              };
            }
          } catch (e2) {
            // 忽略二次解析错误
          }
          
          return {
            success: false,
            candidates: [],
            count: 0,
            error: 'Failed to parse result: ' + e,
            rawResult: resultText
          };
        }
      }
      
      return {
        success: false,
        candidates: [],
        count: 0,
        error: 'Unexpected result format'
      };
      
    } catch (error) {
      console.error('Failed to get unread candidates:', error);
      
      return {
        success: false,
        candidates: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: '获取未读候选人时发生错误'
      };
    }
  },
});

// 导出工具动作名称
export const GET_UNREAD_CANDIDATES_IMPROVED_ACTION = 'get_unread_candidates_improved';