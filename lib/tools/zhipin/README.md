# Zhipin Automation Tools

基于 AI SDK + Puppeteer MCP 的Boss直聘自动化工具集。

## 📁 文件结构

```
lib/tools/zhipin/
├── README.md                      # 使用说明文档
├── index.ts                       # 工具导出文件
├── types.ts                       # TypeScript 类型定义
├── constants.ts                   # 选择器常量
├── helpers.ts                     # 辅助函数
├── get-unread-candidates.tool.ts  # 获取未读候选人列表
├── open-candidate-chat.tool.ts    # 打开候选人聊天窗口
├── extract-candidate-info.tool.ts # 提取候选人详细信息
├── extract-chat-messages.tool.ts  # 提取聊天记录
└── process-all-unread.tool.ts     # 批量处理所有未读消息
```

## 🔧 工具概览

| 工具名称 | Action | 功能描述 | 输入参数 | 输出 |
|---------|--------|----------|----------|------|
| **get-unread-candidates** | `get_unread_candidates` | 获取所有未读候选人列表 | `selector?`, `max?` | `UnreadCandidate[]` |
| **open-candidate-chat** | `open_candidate_chat` | 打开指定候选人聊天窗口 | `index` | `{success, message, screenshot}` |
| **extract-candidate-info** | `extract_candidate_info` | 提取候选人详细信息 | `selectorOverride?`, `includeWorkHistory?` | `CandidateDetail` |
| **extract-chat-messages** | `extract_chat_messages` | 提取聊天记录 | `limit?`, `direction?` | `ChatMsg[]` |
| **process-all-unread** | `process_all_unread` | 批量处理所有未读消息 | `maxCandidates?`, `messageLimit?` | `Conversation[]` |

## 📋 类型定义

### UnreadCandidate
```typescript
export interface UnreadCandidate {
  index: number;
  name: string;
  unreadCount: number;
  element?: any;
}
```

### CandidateDetail
```typescript
export interface CandidateDetail {
  name: string;
  position?: string;
  company?: string;
  salary?: string;
  experience?: string;
  education?: string;
  location?: string;
  age?: string;
  status?: string;
  expectedPosition?: string;
  expectedSalary?: string;
  skills?: string[];
  introduction?: string;
  workHistory?: string;
}
```

### ChatMsg
```typescript
export interface ChatMsg {
  sender: 'user' | 'candidate';
  message: string;
  timestamp: string;
  isSystemMessage?: boolean;
}
```

### Conversation
```typescript
export interface Conversation {
  candidate: CandidateDetail & { unreadCount: number };
  messages: ChatMsg[];
  processingTime?: number;
  error?: string;
}
```

## 🚀 使用示例

### 1. 获取未读候选人列表

```typescript
import { zhipinTools } from '@/lib/tools/zhipin';

const result = await zhipinTools.getUnreadCandidates.execute({
  max: 10 // 最多获取10个候选人
});

console.log(result.candidates);
```

### 2. 打开候选人聊天

```typescript
const result = await zhipinTools.openCandidateChat.execute({
  index: 0 // 打开第一个候选人的聊天
});

if (result.success) {
  console.log('聊天窗口已打开');
}
```

### 3. 提取候选人信息

```typescript
const candidateInfo = await zhipinTools.extractCandidateInfo.execute({
  includeWorkHistory: true // 包含工作经历
});

console.log(candidateInfo);
```

### 4. 提取聊天记录

```typescript
const messages = await zhipinTools.extractChatMessages.execute({
  limit: 20,
  direction: 'newest' // 最新消息优先
});

console.log(messages);
```

### 5. 批量处理未读消息

```typescript
const conversations = await zhipinTools.processAllUnread.execute({
  maxCandidates: 5,
  messageLimit: 20,
  continueOnError: true // 遇到错误继续处理
});

console.log(conversations);
```

## 🔍 工具特性

### 1. 多重选择器策略
- 每个工具都使用多个CSS选择器作为备选方案
- 支持选择器覆写，便于快速修复

### 2. 错误处理
- 完善的错误捕获和处理机制
- 自动重试逻辑
- 详细的错误信息反馈

### 3. 性能优化
- 批量处理时加入延迟，避免过载
- 智能等待机制
- 资源自动清理

### 4. 类型安全
- 完整的TypeScript类型定义
- Zod schema验证
- 运行时类型检查

## 📝 注意事项

1. **登录状态**: 使用前确保已登录Boss直聘
2. **页面准备**: 需要在聊天列表页面使用工具
3. **网络稳定**: 建议在网络稳定的环境下使用
4. **频率控制**: 避免过于频繁的操作，以免触发网站限制

## 🔧 配置项

### 默认选择器
可以在 `constants.ts` 中修改默认选择器：

```typescript
export const DEFAULT_SELECTORS = {
  UNREAD_ITEM: 'div[role="listitem"]:has(.badge-count)',
  CANDIDATE_NAME: '.geek-name, .candidate-name, [class*="name"]',
  CHAT_MESSAGE: '[class*="message"], .chat-item, [class*="bubble"]',
  // ... 更多选择器
};
```

### 时间配置
可以在 `constants.ts` 中调整时间相关配置：

```typescript
export const TIMING = {
  DEFAULT_TIMEOUT: 3000,
  RETRY_DELAY: 500,
  NAVIGATION_DELAY: 1000,
  BATCH_DELAY: 500,
};
```

## 🤝 扩展开发

要添加新的工具，请遵循以下步骤：

1. 在 `types.ts` 中定义相关类型
2. 在 `constants.ts` 中添加必要的选择器
3. 创建工具文件，遵循现有的命名模式
4. 在 `index.ts` 中导出新工具
5. 更新此README文档

## 📈 版本历史

- **v1.0.0**: 初始版本，包含5个核心工具
  - 获取未读候选人列表
  - 打开候选人聊天
  - 提取候选人信息
  - 提取聊天记录
  - 批量处理未读消息

---

*本工具集专为Boss直聘平台优化，支持中文内容处理和复杂的DOM结构解析。*