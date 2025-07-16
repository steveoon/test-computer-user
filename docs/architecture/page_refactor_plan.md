# Chat 页面重构行动计划

> 目标：将 `app/page.tsx` 从 ~1300 行拆分至 < 150 行，仅保留页面装配职责；其余逻辑、UI 和副作用下沉到组件 / Hook / 工具函数。
>
> 规则：单一职责 · 高内聚低耦合 · 不超过 200 行/文件 · React 19/Next 15 最佳实践

---

## 🗂️ 最终目录结构（目标状态）

```
components/
  desktop/
    DesktopStream.tsx        # iframe + 控制按钮 + 状态徽标
    DesktopStatusBar.tsx     # 运行/暂停/未知 状态提示
  chat/
    ChatHeader.tsx           # 头部（品牌选择、模型配置…）
    ChatMessages.tsx         # 消息列表 + 滚动锚点
    ChatInputForm.tsx        # 输入框 + 提交逻辑
    ChatStatusBar.tsx        # "思考中…" 等状态
    ChatPanel.tsx            # 组合 Header+Messages+Input+StatusBar
    MobileChatLayout.tsx     # 移动端专用组合
hooks/
  useDesktopSandbox.ts       # 桌面沙盒管理
  useSmartClean.ts           # 智能清理策略
  useFeishuNotification.ts   # 飞书通知封装
  useCustomChat.ts           # 对 ai-sdk/useChat 的二次封装
```

---

## 🚧 分阶段实施步骤

### Phase-0：准备

1. 新建本文件，记录行动计划 ✅ (已完成)
2. 创建 `feature/refactor-chat-page` 分支（由平台或 Agent 执行）
3. 安装任何可能的新依赖（暂无）

### Phase-1：抽离纯展示组件

| Task | 目标文件                               | 关键点                                                                                                             |
| ---- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1    | `components/desktop/DesktopStream.tsx` | 接收 `streamUrl`, `sandboxStatus`, `isInitializing`, 回调：`onRefresh`, `onPause`, `onResume`；无副作用            |
| 2    | `components/chat/ChatHeader.tsx`       | 接收 `currentBrand`, `messagesCount`, `onSmartClean`, `onClear`；包含 `BrandSelector`、模型配置 Popover、`UserNav` |
| 3    | `components/chat/ChatStatusBar.tsx`    | 纯显示：运行状态、环境、加载动画                                                                                   |

完成后：在 `page.tsx` 中引入并替换对应 JSX，确认 UI 无回归。

### Phase-2：抽离桌面沙盒逻辑

1. 新建 `hooks/useDesktopSandbox.ts`
   ```ts
   interface UseDesktopSandboxReturn {
     sandboxId: string | null;
     streamUrl: string | null;
     sandboxStatus: "running" | "paused" | "unknown";
     isInitializing: boolean;
     isPausing: boolean;
     refreshDesktop: () => Promise<void>;
     pauseDesktop: () => Promise<void>;
   }
   ```
2. 移动 `getDesktopURL` 调用、heartbeat、beforeunload/pagehide 监听、pause/resume/refresh 逻辑到该 Hook。
3. `page.tsx` 和 `DesktopStream` 通过该 Hook 获取状态与操作。

### Phase-3：抽离智能清理与 Toast 封装

1. 创建 `hooks/useSmartClean.ts`
   - 输入：`messages`, `envLimits`, `envInfo`
   - 输出：`smartClean(auto:boolean)`, `manualClean()`, `handlePayloadTooLarge()`
   - 内部封装所有 Toast 逻辑与阈值判断
2. 从 `page.tsx` 中移除对应代码，改为调用 Hook。

### Phase-4：封装 Chat 逻辑 Hook

1. `hooks/useCustomChat.ts`
   - 对 `useChat` 进行包装
   - 集成 `useSmartClean`, `useFeishuNotification`
   - 暴露：`messages`, `input`, `handlers`, `status`, `error` 等
2. 把 `onError`, `onFinish`, `customSubmit`, `stop` 等逻辑迁入 Hook。

### Phase-5：组装 ChatPanel

1. 创建 `components/chat/ChatMessages.tsx`：使用 `useScrollToBottom` 渲染 `PreviewMessage` 列表。
2. 创建 `components/chat/ChatInputForm.tsx`：渲染 `Input`，处理提交 / stop。
3. 创建 `components/chat/ChatPanel.tsx`：组合 `ChatHeader + ChatMessages + ChatInputForm + ChatStatusBar`。
4. 创建 `components/chat/MobileChatLayout.tsx`：复用 `ChatPanel`，去掉 Desktop 区域。

### Phase-6：精简 `app/page.tsx`

1. 删除已迁出的逻辑和状态，只保留：
   ```tsx
   const desktop = useDesktopSandbox();
   const chat = useCustomChat(desktop.sandboxId);
   ```
2. 页面 JSX：
   - Desktop 区域：`<DesktopStream {...desktop} />`
   - Chat 区域：`<ChatPanel {...chat} envInfo={desktop.envInfo} />`
   - Mobile：`<MobileChatLayout ... />`
3. 文件行数目标：< 150 行。

### Phase-7：测试 & 回归

1. 单元测试：
   - `useDesktopSandbox`：模拟 fetch/heartbeat
   - `useSmartClean`：边界值测试
2. UI 回归：在开发环境逐步验证 Desktop + Chat 正常。
3. CI 通过后合并主干。

---

## 📝 备注

- 每个 Hook/组件初版可直接迁移代码，待功能稳定后再进行进一步抽象与类型收敛。
- 拆分过程中，优先保证 **功能不变**，之后再做微调优化。
- 若遇到跨组件共享状态，考虑 Context 或继续留在 `useCustomChat` 统一管理。

---

✅ **完成此计划后，`page.tsx` 将恢复简洁、可维护，整体架构分层清晰，易于后续功能扩展。**
