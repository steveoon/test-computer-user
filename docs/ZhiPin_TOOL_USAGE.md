### 一、需求背景

通过 @API_DOCUMENTATION_CN.md 文档你可以知道使用puppeteer mcp可以操作浏览器

在 @puppeteer-tool.ts 中定义了LLM可以调用这个MCP server作为工具, 让LLM来操作浏览器 (MCP服务可以了解@client-manager.ts )

我在测试时让LLM打开本地浏览器并访问了zhipin.com,然后进入到一个与求职者聊天的页面,在这个页面中,我通过告诉LLM使用`div[role="listitem"]:has(.badge-count)`这个选择器是否可以选中未读消息(截图1),结果是可以的,随后我有让LLM尝试批量处理这些未读消息,比如逐个查看聊天内容,LLM在经过尝试后通过执行js的方式获取到了所有未读消息的候选人信息和聊天内容(截图2)

然后我告诉它我希望把这些操作单独设计成一个或多个小工具,这样每次让LLM获取未读求职者消息时,调用对应工具即可,于是它给我下面这些脚本的逻辑分析:

1. 选中未读消息候选人的逻辑

```
// 第一步：识别所有有未读消息的候选人 const unreadItems = document.querySelectorAll('div[role="listitem"]:has(.badge-count)'); // 第二步：提取候选人基本信息 const candidateInfo = Array.from(unreadItems).map((item, index) => { const nameSelectors = ['.geek-name', '.name', '[class*="name"]', '.geek-item .name']; let name = '未知姓名'; // 多重选择器策略，提高匹配成功率 for (let selector of nameSelectors) { const nameElement = item.querySelector(selector); if (nameElement && nameElement.textContent.trim()) { name = nameElement.textContent.trim(); break; } } // 备用方案：从文本内容中提取 if (name === '未知姓名') { const allText = item.textContent; const lines = allText.split('\n').filter(line => line.trim()); if (lines.length > 0) { name = lines[0].trim(); } } return { index: index, name: name, unreadCount: item.querySelector('.badge-count')?.textContent || '0', element: item // 保存DOM元素引用 }; }); // 第三步：点击特定候选人 function clickCandidate(candidateIndex) { const chatItems = document.querySelectorAll('.chat-list-item, [class*="chat-item"], [class*="geek-item"]'); if (chatItems[candidateIndex]) { chatItems[candidateIndex].click(); return true; } return false; }
```

2. 获取候选人详细信息的逻辑

```
// 右侧候选人详情区域信息提取 function extractCandidateInfo() { const candidateInfo = { // 基本信息选择器策略 name: document.querySelector('.geek-name')?.textContent?.trim() || document.querySelector('[class*="name"]')?.textContent?.trim() || '未知', // 年龄信息 - 多种可能的位置 age: document.querySelector('[class*="age"]')?.textContent?.trim() || document.querySelector('.basic-info')?.textContent?.match(/(\d+岁)/)?.[1] || '', // 工作经验 experience: document.querySelector('[class*="experience"]')?.textContent?.trim() || document.querySelector('.work-exp')?.textContent?.trim() || '', // 学历信息 education: document.querySelector('[class*="education"]')?.textContent?.trim() || document.querySelector('.edu-info')?.textContent?.trim() || '', // 职位信息 position: document.querySelector('[class*="position"]')?.textContent?.trim() || document.querySelector('.job-title')?.textContent?.trim() || '', // 地区信息 location: document.querySelector('[class*="location"]')?.textContent?.trim() || document.querySelector('.address')?.textContent?.trim() || '', // 工作经历 - 通常在详情区域 workHistory: extractWorkHistory() }; return candidateInfo; } // 工作经历提取函数 function extractWorkHistory() { const workElements = document.querySelectorAll('[class*="work"], [class*="experience"], .job-history'); const workHistory = []; workElements.forEach(element => { const text = element.textContent?.trim(); if (text && text.includes('-') && (text.includes('20') || text.includes('19'))) { workHistory.push(text); } }); return workHistory.join('; ') || ''; }
```

3. 聊天记录提取逻辑

```
function extractChatMessages() { const messages = []; // 策略1：标准消息气泡 const messageElements = document.querySelectorAll('[class*="message"], .chat-item, [class*="bubble"]'); if (messageElements.length > 0) { messageElements.forEach((msg, index) => { const isFromCandidate = !msg.classList.contains('right') && !msg.classList.contains('sent') && !msg.classList.contains('recruiter'); const timeElement = msg.querySelector('[class*="time"]') || msg.querySelector('.timestamp'); const textElement = msg.querySelector('[class*="text"]') || msg.querySelector('[class*="content"]') || msg; if (textElement?.textContent?.trim()) { messages.push({ sender: isFromCandidate ? 'candidate' : 'recruiter', content: textElement.textContent.trim(), time: timeElement?.textContent?.trim() || '', timestamp: new Date().toISOString() }); } }); } else { // 策略2：从聊天区域整体文本中解析 const chatArea = document.querySelector('.chat-conversation') || document.querySelector('[class*="chat-area"]'); if (chatArea) { messages.push(...parseMessagesFromText(chatArea.textContent)); } } return messages; }
```

基于这些背景, 请你思考一个工具设计方案: 1.利用 AI SDK 现有 @puppeteer-tool.ts 的模式2.拆分为独立的小工具; 3.每个小工具可以让LLM调用时直接传参,而逻辑是固定的,不需要每次都让LLM尝试多次才找到对应的选择器并执行操作,但允许修正;

---

## 详细需求文档：Zhipin Chat Automation Tools

### 1. 目标

构建一组基于 **AI SDK + Puppeteer MCP** 的微工具，支持 LLM 在 Boss 直聘 Web 端自动完成以下任务：

1. 获取所有未读候选人列表
2. 打开指定候选人聊天窗口
3. 提取候选人详细资料
4. 提取双方聊天记录
5. 批量处理所有未读会话（可选）

### 2. 目录结构

```
lib/tools/zhipin/
  ├─ get-unread-candidates.tool.ts
  ├─ open-candidate-chat.tool.ts
  ├─ extract-candidate-info.tool.ts
  ├─ extract-chat-messages.tool.ts
  └─ process-all-unread.tool.ts   // 聚合，可选
```

### 3. 公共常量与辅助函数

```
lib/tools/zhipin/constants.ts
  - DEFAULT_SELECTORS = { unreadItem, name, ... }
lib/tools/zhipin/helpers.ts
  - safeEvaluate(script, timeout)
  - waitForSelector(selector, timeout)
```

### 4. 微工具接口规范

| 工具文件                        | action                   | 入参                                       | 返回                              | 核心实现                                              |
| ------------------------------- | ------------------------ | ------------------------------------------ | --------------------------------- | ----------------------------------------------------- |
| get-unread-candidates.tool.ts   | `get_unread_candidates`  | selector?:string, max?:number              | { candidates: UnreadCandidate[] } | `evaluate` 预置脚本①                                  |
| open-candidate-chat.tool.ts     | `open_candidate_chat`    | index:number                               | { success:boolean }               | 先 `click`, 失败 fallback `evaluate clickCandidate()` |
| extract-candidate-info.tool.ts  | `extract_candidate_info` | 无                                         | { detail: CandidateDetail }       | `evaluate` 预置脚本②                                  |
| extract-chat-messages.tool.ts   | `extract_chat_messages`  | limit?:number, direction?:"newest\|oldest" | { messages: ChatMsg[] }           | `evaluate` 预置脚本③ + limit/sort                     |
| process-all-unread.tool.ts (选) | `process_all_unread`     | 无                                         | { conversations: Conversation[] } | 内部串联1→2→3→4                                       |

> 说明：预置脚本①②③即为你提供的逻辑代码，需封装为字符串常量。

### 5. TypeScript 类型

```ts
// types/zhipin-chat.ts
export interface UnreadCandidate {
  index: number;
  name: string;
  unreadCount: number;
}
export interface CandidateDetail {
  name: string;
  age?: string;
  experience?: string;
  education?: string;
  position?: string;
  location?: string;
  workHistory?: string;
}
export interface ChatMsg {
  sender: "candidate" | "recruiter";
  content: string;
  time?: string;
  timestamp: string;
}
export interface Conversation {
  candidate: CandidateDetail & { unreadCount: number };
  messages: ChatMsg[];
}
```

### 6. 关键实现细节

1. **选择器覆写**：所有工具的参数列表中预留 `selectorOverride`（可选），便于快速热修。
2. **错误处理**
   - 捕获 `evaluate` 抛错，返回 `{ success:false, error:"..." }`
   - 超时统一用 `safeEvaluate` 内部封装（默认 8 s）。
3. **节流与重试**
   - 批处理时每 500 ms 打开下一会话；失败自动重试 2 次。
4. **登录检测**（扩展）
   - 在 `process_all_unread` 前检测 `document.cookie` 或登录按钮，若未登录抛出 `NEED_LOGIN` 错。
5. **数据量控制**
   - `extract_chat_messages` 默认 `limit=20`；超长文本截断为 2 k chars 并标记 `(truncated)`。
6. **测试用例**
   - 使用 Vitest / Jest：模拟返回 DOM 结构，确保脚本③ 能正确解析消息数组。
