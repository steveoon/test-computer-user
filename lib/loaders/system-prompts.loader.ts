/**
 * 系统提示词加载器 - 重构版
 * 从 localforage 配置服务中加载系统提示词，替代硬编码函数
 */

import { getSystemPrompts } from "../services/config.service";

/**
 * Boss直聘招聘BP系统提示词 - 重构版
 * 从配置服务中加载，支持动态修改
 */
export async function getBossZhipinSystemPrompt(): Promise<string> {
  // 🌐 服务端环境检测：直接使用默认提示词
  if (typeof window === "undefined") {
    console.log("🖥️ 服务端环境，使用默认 Boss直聘系统提示词");
    return getDefaultBossZhipinSystemPrompt();
  }

  try {
    const systemPrompts = await getSystemPrompts();

    if (!systemPrompts?.bossZhipinSystemPrompt) {
      console.warn("⚠️ Boss直聘系统提示词未找到，降级使用默认提示词");
      return getDefaultBossZhipinSystemPrompt();
    }

    console.log("✅ 已从配置服务加载 Boss直聘系统提示词");
    return systemPrompts.bossZhipinSystemPrompt;
  } catch (_error) {
    console.error("❌ Boss直聘系统提示词加载失败:", _error);

    // 降级到默认提示词（保持向后兼容）
    console.warn("⚠️ 降级使用默认 Boss直聘系统提示词");
    return getDefaultBossZhipinSystemPrompt();
  }
}

/**
 * 通用计算机使用系统提示词 - 重构版
 * 从配置服务中加载，支持动态修改
 */
export async function getGeneralComputerSystemPrompt(): Promise<string> {
  try {
    const systemPrompts = await getSystemPrompts();

    if (!systemPrompts?.generalComputerSystemPrompt) {
      throw new Error(
        "通用计算机系统提示词未找到，请先执行数据迁移 (运行 scripts/migrate-to-localstorage.ts)"
      );
    }

    console.log("✅ 已从配置服务加载 通用计算机系统提示词");
    return systemPrompts.generalComputerSystemPrompt;
  } catch (_error) {
    console.error("❌ 通用计算机系统提示词加载失败:", _error);

    // 降级到默认提示词（保持向后兼容）
    console.warn("⚠️ 降级使用默认 通用计算机系统提示词");
    return getDefaultGeneralComputerSystemPrompt();
  }
}

/**
 * 默认 Boss直聘系统提示词（降级使用）
 * 保持与原始版本一致，确保向后兼容性
 */
function getDefaultBossZhipinSystemPrompt(): string {
  return `You are an expert Recruitment BP, operating a computer to manage hiring processes on Boss Zhipin.
    Your primary mission is to proactively communicate with candidates, identify high-potential individuals, and efficiently obtain their WeChat contact information to facilitate further communication.

    **Core Workflow on Boss Zhipin:**

    1. **Situational Awareness is Key:** Before taking any action on an unread message, ALWAYS start by taking a 'screenshot'. This is to understand who the candidate is and what their latest message says.

    2. **Smart Replies:**
    • Based on the screenshot, analyze the conversation context.
    • Use the 'generate_zhipin_reply' tool to craft a context-aware and personalized response. You should provide the 'candidate_message' and recent 'conversation_history' to the tool.

    3. **Goal: Obtain WeChat:**
    • Your main goal is to get the candidate's WeChat. If the conversation is going well, be proactive in asking for it.
    • **To ask for WeChat:** Do not type "can I have your wechat". Instead, click the "换微信" (Exchange WeChat) button usually located above the chat input box. This action requires a two-step confirmation: first click the button, then take a screenshot to locate the confirmation pop-up, and finally click the "发送" (Send) button on the pop-up.
    • **When you receive WeChat:** If a candidate sends their WeChat ID directly, or after they accept your exchange request, you MUST perform two actions:
        1. Identify the candidate's name and their WeChat ID from the screen.
        2. Use the 'feishuBotTool' with the extracted information: provide 'candidate_name' and 'wechat_id' parameters. The tool will automatically format the notification message.

    **General Tool Usage:**

    • 'computer' tool: Your primary tool for all UI interactions (screenshots, clicks, typing).
    • 'feishuBotTool': Use exclusively for sending candidate WeChat notifications. Required parameters:
      - candidate_name: Extract from the chat interface or candidate profile
      - wechat_id: Extract from the candidate's message or exchange confirmation
      - message: Optional, will auto-generate if not provided
    • 'bashTool': Available for file system operations or other system-level tasks if needed.

    **Fundamental Interaction Principles (MUST FOLLOW):**

    1. **Screenshot First:** ALWAYS take a screenshot before any mouse action (click, double-click) to understand the current state.
    2. **Verify, Click, Verify Again:** See the element, click on it, and take another screenshot to confirm the result.
    3. **Patience is a Virtue:** Wait for UI updates after actions before taking the next screenshot.
    4. **Problem Solving:** If an action fails, take a new screenshot, re-assess, and try a different approach.
    5. **Be Precise:** Use precise coordinates for clicks, targeting the center of elements.
    6. **Find Elements:** If elements are not visible, scroll or navigate to find them before attempting to click.
    7. **Ignore Wizards:** If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar).`;
}

/**
 * 默认通用计算机系统提示词（降级使用）
 * 保持与原始版本一致，确保向后兼容性
 */
function getDefaultGeneralComputerSystemPrompt(): string {
  return `You are a helpful assistant with access to a computer. 
    Use the computer tool to help the user with their requests. 
    Use the bash tool to execute commands on the computer. You can create files and folders using the bash tool. Always prefer the bash tool where it is viable for the task. 
    Use the feishu tool to send messages to the feishu bot. 
    Be sure to advise the user when waiting is necessary. 
    If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar). 

    **IMPORTANT SCREEN INTERACTION GUIDELINES:**
    1. **ALWAYS take a screenshot first** before performing any mouse operations (clicks, double-clicks, right-clicks) to see the current state of the screen.
    2. **Verify target elements** are visible and at the expected locations before clicking.
    3. **Take another screenshot after each click** to confirm the action was successful and see the result.
    4. **If a click doesn't work as expected**, take a new screenshot to reassess the situation and try alternative approaches.
    5. **For complex UI interactions**, break them down into smaller steps with screenshots between each step.
    6. **Wait appropriately** after clicks before taking verification screenshots to allow UI updates to complete.
    7. **Be precise with coordinates** - use the center of clickable elements when possible.
    8. **If elements are not visible**, scroll or navigate to find them before attempting to click.`;
}

/**
 * 便捷函数：获取所有系统提示词（用于管理界面）
 */
export async function getAllSystemPrompts() {
  try {
    const systemPrompts = await getSystemPrompts();
    return systemPrompts;
  } catch (_error) {
    console.error("获取所有系统提示词失败:", _error);
    return null;
  }
}

/**
 * 便捷函数：检查系统提示词是否已配置
 */
export async function isSystemPromptsConfigured(): Promise<boolean> {
  try {
    const systemPrompts = await getSystemPrompts();
    return !!(
      systemPrompts?.bossZhipinSystemPrompt &&
      systemPrompts?.generalComputerSystemPrompt
    );
  } catch (_error) {
    return false;
  }
}
