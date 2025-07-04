import { tool } from 'ai';
import { z } from 'zod';
import { CandidateDetail } from './types';
import { CANDIDATE_SELECTORS, TIMING } from './constants';
import { getPuppeteerMCPClient } from '@/lib/mcp/client-manager';

export const extractCandidateInfoTool = tool({
  description: 'Extract detailed candidate information from the current page',
  parameters: z.object({
    selectorOverride: z.string()
      .optional()
      .describe('Override selector for candidate detail container'),
    includeWorkHistory: z.boolean()
      .optional()
      .default(true)
      .describe('Whether to extract work history information'),
    timeout: z.number()
      .optional()
      .default(TIMING.elementWait)
      .describe('Timeout for element extraction in milliseconds'),
  }),
  execute: async ({ selectorOverride: _selectorOverride, includeWorkHistory = true, timeout = TIMING.elementWait }) => {
    try {
      // Get MCP client for puppeteer operations
      const client = await getPuppeteerMCPClient();
      
      // Create JavaScript script for extracting candidate information
      const script = `
        (function() {
          const timeout = ${timeout};
          const includeWorkHistory = ${includeWorkHistory};
          
          // Helper function to try multiple selectors
          function trySelectors(selectors, root = document) {
            for (const selector of selectors) {
              try {
                const element = root.querySelector(selector);
                if (element && element.textContent && element.textContent.trim()) {
                  return element.textContent.trim();
                }
              } catch (e) {
                // Continue to next selector
              }
            }
            return null;
          }
          
          // Helper function to extract age from text
          function extractAge(text) {
            if (!text) return null;
            const ageMatch = text.match(/(\\d+)岁/);
            return ageMatch ? ageMatch[1] : null;
          }
          
          // Helper function to extract experience from text
          function extractExperience(text) {
            if (!text) return null;
            const expMatch = text.match(/(\\d+)年/);
            return expMatch ? text : null;
          }
          
          // Helper function to extract work history
          function extractWorkHistory() {
            if (!includeWorkHistory) return null;
            
            const workHistorySelectors = [
              '.work-experience',
              '.job-history',
              '.experience-list',
              '[class*="work"]',
              '[class*="experience"]',
              '.resume-section'
            ];
            
            const workHistory = [];
            
            // Try to find work history sections
            workHistorySelectors.forEach(selector => {
              try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                  const text = element.textContent?.trim();
                  if (text && text.includes('-') && (text.includes('20') || text.includes('19'))) {
                    workHistory.push(text);
                  }
                });
              } catch (e) {
                // Continue to next selector
              }
            });
            
            // If no structured work history found, try to extract from general text
            if (workHistory.length === 0) {
              const bodyText = document.body.textContent || '';
              const lines = bodyText.split('\\n');
              
              lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.length > 10 && 
                    trimmedLine.includes('-') && 
                    (trimmedLine.includes('20') || trimmedLine.includes('19')) &&
                    (trimmedLine.includes('公司') || trimmedLine.includes('职位'))) {
                  workHistory.push(trimmedLine);
                }
              });
            }
            
            return workHistory.length > 0 ? workHistory.join('; ') : null;
          }
          
          // Main extraction logic
          const candidateInfo = {};
          
          // Name extraction with multiple strategies
          const nameSelectors = [
            '${CANDIDATE_SELECTORS.name}',
            '${CANDIDATE_SELECTORS.nameAlt}',
            '.geek-name',
            '.candidate-name',
            '.name-text',
            '.user-name',
            '.profile-name',
            '[class*="name"]',
            'h1',
            'h2',
            '.title'
          ];
          
          candidateInfo.name = trySelectors(nameSelectors) || '未知';
          
          // Position extraction
          const positionSelectors = [
            '${CANDIDATE_SELECTORS.position}',
            '.position-name',
            '.job-title',
            '.current-position',
            '.position-text',
            '[class*="position"]',
            '[class*="job"]'
          ];
          
          candidateInfo.position = trySelectors(positionSelectors) || '';
          
          // Company extraction
          const companySelectors = [
            '${CANDIDATE_SELECTORS.company}',
            '.company-name',
            '.current-company',
            '.company-text',
            '[class*="company"]'
          ];
          
          candidateInfo.company = trySelectors(companySelectors) || '';
          
          // Salary extraction
          const salarySelectors = [
            '${CANDIDATE_SELECTORS.salary}',
            '.salary-text',
            '.expected-salary',
            '.salary-range',
            '[class*="salary"]',
            '[class*="pay"]'
          ];
          
          candidateInfo.salary = trySelectors(salarySelectors) || '';
          
          // Experience extraction
          const experienceSelectors = [
            '${CANDIDATE_SELECTORS.experience}',
            '.experience-text',
            '.work-experience',
            '.exp-text',
            '[class*="experience"]',
            '[class*="exp"]'
          ];
          
          const experienceText = trySelectors(experienceSelectors);
          candidateInfo.experience = extractExperience(experienceText) || experienceText || '';
          
          // Education extraction
          const educationSelectors = [
            '${CANDIDATE_SELECTORS.education}',
            '.education-text',
            '.edu-info',
            '.degree-text',
            '[class*="education"]',
            '[class*="edu"]',
            '[class*="degree"]'
          ];
          
          candidateInfo.education = trySelectors(educationSelectors) || '';
          
          // Location extraction
          const locationSelectors = [
            '${CANDIDATE_SELECTORS.location}',
            '.location-text',
            '.address',
            '.city-text',
            '.area-text',
            '[class*="location"]',
            '[class*="address"]',
            '[class*="city"]'
          ];
          
          candidateInfo.location = trySelectors(locationSelectors) || '';
          
          // Age extraction
          const ageSelectors = [
            '${CANDIDATE_SELECTORS.age}',
            '.age-text',
            '.basic-info',
            '.personal-info',
            '[class*="age"]',
            '[class*="basic"]'
          ];
          
          const ageText = trySelectors(ageSelectors);
          candidateInfo.age = extractAge(ageText) || ageText || '';
          
          // Status extraction
          const statusSelectors = [
            '${CANDIDATE_SELECTORS.status}',
            '.status-text',
            '.work-status',
            '.job-status',
            '[class*="status"]'
          ];
          
          candidateInfo.status = trySelectors(statusSelectors) || '';
          
          // Expected position extraction
          const expectedPositionSelectors = [
            '${CANDIDATE_SELECTORS.expectedPosition}',
            '.expect-position',
            '.target-position',
            '.desired-position',
            '[class*="expect"]',
            '[class*="target"]',
            '[class*="desired"]'
          ];
          
          candidateInfo.expectedPosition = trySelectors(expectedPositionSelectors) || '';
          
          // Expected salary extraction
          const expectedSalarySelectors = [
            '${CANDIDATE_SELECTORS.expectedSalary}',
            '.expect-salary',
            '.target-salary',
            '.desired-salary',
            '[class*="expect-salary"]',
            '[class*="target-salary"]'
          ];
          
          candidateInfo.expectedSalary = trySelectors(expectedSalarySelectors) || '';
          
          // Skills extraction
          const skillsSelectors = [
            '${CANDIDATE_SELECTORS.skillsList}',
            '.skills-list',
            '.skill-tags',
            '.tech-skills',
            '[class*="skills"]',
            '[class*="skill"]'
          ];
          
          let skills = [];
          skillsSelectors.forEach(selector => {
            try {
              const skillsContainer = document.querySelector(selector);
              if (skillsContainer) {
                const skillItems = skillsContainer.querySelectorAll('${CANDIDATE_SELECTORS.skillItem}, .skill-item, .skill-tag, .tag');
                skillItems.forEach(item => {
                  const skillText = item.textContent?.trim();
                  if (skillText && skillText.length > 0) {
                    skills.push(skillText);
                  }
                });
              }
            } catch (e) {
              // Continue to next selector
            }
          });
          
          candidateInfo.skills = skills.length > 0 ? skills : undefined;
          
          // Introduction extraction
          const introductionSelectors = [
            '${CANDIDATE_SELECTORS.introduction}',
            '${CANDIDATE_SELECTORS.introductionAlt}',
            '.self-introduction',
            '.candidate-intro',
            '.personal-intro',
            '.profile-intro',
            '[class*="introduction"]',
            '[class*="intro"]',
            '[class*="summary"]'
          ];
          
          candidateInfo.introduction = trySelectors(introductionSelectors) || '';
          
          // Work history extraction
          if (includeWorkHistory) {
            const workHistory = extractWorkHistory();
            if (workHistory) {
              candidateInfo.workHistory = workHistory;
            }
          }
          
          return candidateInfo;
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
      let candidateDetail: CandidateDetail = {
        name: '未知',
        position: '',
        company: '',
        salary: '',
        experience: '',
        education: '',
        location: ''
      };
      
      if (mcpResult && mcpResult.content && mcpResult.content.length > 0) {
        const textContent = mcpResult.content.find((content) => content.type === "text");
        if (textContent && textContent.text) {
          try {
            const parsedResult = JSON.parse(textContent.text);
            candidateDetail = { ...candidateDetail, ...parsedResult };
          } catch (e) {
            console.error('Failed to parse candidate info script result:', e);
          }
        }
      }
      
      return {
        success: true,
        detail: candidateDetail,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to extract candidate info:', error);
      
      return {
        success: false,
        detail: {
          name: '未知',
          position: '',
          company: '',
          salary: '',
          experience: '',
          education: '',
          location: ''
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Export the tool action name for consistency
export const EXTRACT_CANDIDATE_INFO_ACTION = 'extract_candidate_info';