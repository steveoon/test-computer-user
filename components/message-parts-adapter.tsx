"use client";

import type { Message } from "@ai-sdk/react";
import { toolRegistry } from "./tool-messages";
import { Markdown } from "./markdown";

interface MessagePartsAdapterProps {
  message: Message;
  isLatestMessage?: boolean;
  status?: string;
}

export function MessagePartsAdapter({
  message,
  isLatestMessage,
  status,
}: MessagePartsAdapterProps) {
  // 优先检查 parts 数组（新的消息格式）
  const parts = message.parts;
  
  // 如果有 parts 数组，使用它来渲染
  if (parts && Array.isArray(parts) && parts.length > 0) {
    return (
      <div className="w-full">
        {parts.map((part, i) => {
          // 跳过 step-start 类型
          if (part.type === "step-start") {
            return null;
          }

          // 文本消息
          if (part.type === "text" && part.text) {
            return (
              <div key={`text-${i}`} className="mb-2">
                <Markdown>
                  {part.text}
                </Markdown>
              </div>
            );
          }

          // 工具调用消息 - 使用新的 tool-invocation 类型
          if (part.type === "tool-invocation" && part.toolInvocation) {
            const toolInvocation = part.toolInvocation;
            const { toolName, toolCallId, args, state } = toolInvocation;
            
            // 查找对应的工具配置
            const toolConfig = toolRegistry[toolName];
            if (!toolConfig) {
              // 未注册的工具，显示基本信息
              return (
                <div key={`${toolCallId}-${i}`} className="p-3 mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Unknown tool: {toolName}
                  </div>
                </div>
              );
            }

            // 使用工具配置渲染
            const ToolComponent = toolConfig.render;
            return (
              <div key={`${toolCallId}-${i}`} className="mb-3">
                <ToolComponent
                  toolName={toolName}
                  args={args}
                  state={state}
                  result={('result' in toolInvocation) ? (toolInvocation as unknown as Record<string, unknown>).result : undefined}
                  isLatestMessage={isLatestMessage}
                  status={status}
                  messageId={message.id}
                  partIndex={i}
                />
              </div>
            );
          }

          // 未知类型 - 生产环境不显示
          return null;
        })}
      </div>
    );
  }
  
  // 回退到字符串 content（用户消息或旧格式）
  if (typeof message.content === "string") {
    return (
      <Markdown>
        {message.content}
      </Markdown>
    );
  }
  
  // 无内容
  return null;
}