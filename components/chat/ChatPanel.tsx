"use client";

import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInputForm } from "./ChatInputForm";
import { ChatStatusBar } from "./ChatStatusBar";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { Button } from "@/components/ui/button";
import type { Message } from "@ai-sdk/react";
import type { ModelId } from "@/lib/config/models";

interface ChatPanelProps {
  // 来自 useCustomChat
  messages: Message[];
  input: string;
  status: "ready" | "error" | "submitted" | "streaming";
  error: Error | undefined;
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: () => void;
  append: (message: { role: "user"; content: string }) => void;
  reload: () => void;
  clearMessages: () => void;
  smartClean: () => void;
  envInfo: {
    environment: string;
    description: string;
  };

  // 来自其他地方
  currentBrand?: string;
  sandboxStatus: "running" | "paused" | "unknown";
  isInitializing: boolean;
  isAuthenticated: boolean;
  chatModel: ModelId;
  classifyModel: ModelId;
  replyModel: ModelId;
}

export function ChatPanel({
  messages,
  input,
  status,
  error,
  isLoading,
  handleInputChange,
  handleSubmit,
  stop,
  append,
  reload,
  clearMessages,
  smartClean,
  envInfo,
  currentBrand,
  sandboxStatus,
  isInitializing,
  isAuthenticated,
  chatModel,
  classifyModel,
  replyModel,
}: ChatPanelProps) {
  const [containerRef, endRef] = useScrollToBottom();

  // 🎯 检查是否为请求过大错误
  const isPayloadTooLargeError = (error: Error | undefined) => {
    if (!error) return false;
    return (
      error.message.includes("Request Entity Too Large") ||
      error.message.includes("FUNCTION_PAYLOAD_TOO_LARGE") ||
      error.message.includes("Payload Too Large") ||
      error.message.includes("413")
    );
  };

  return (
    <div className="flex flex-col border-l border-zinc-200 h-full">
      <ChatHeader
        currentBrand={currentBrand}
        messagesCount={messages.length}
        sandboxStatus={sandboxStatus}
        isLoading={isLoading}
        chatModel={chatModel}
        classifyModel={classifyModel}
        replyModel={replyModel}
        envInfo={envInfo}
        onSmartClean={smartClean}
        onClear={clearMessages}
      />

      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        status={status}
        containerRef={containerRef}
        endRef={endRef}
      />

      {/* 错误状态显示 */}
      {error && (
        <div className="mx-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-700 font-medium">
                  {isPayloadTooLargeError(error)
                    ? "请求内容过大"
                    : "Something went wrong"}
                </span>
              </div>
              <div className="flex gap-2">
                {isPayloadTooLargeError(error) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={smartClean}
                    className="text-xs h-7 px-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    智能清理
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reload()}
                  className="text-xs h-7 px-2 border-red-200 text-red-700 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </div>
            <p className="text-xs text-red-600 mt-1">
              {isPayloadTooLargeError(error)
                ? "对话历史过长，请清理部分消息后重试"
                : "Please try again. If the problem persists, refresh the page."}
            </p>
          </div>
        </div>
      )}

      <ChatInputForm
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isInitializing={isInitializing}
        isLoading={isLoading}
        status={status}
        stop={stop}
        error={error}
        isAuthenticated={isAuthenticated}
        append={append}
      />

      {/* 状态栏 - 移动端显示 */}
      <div className="flex items-center justify-end px-4 pb-2 xl:hidden">
        <ChatStatusBar isLoading={isLoading} />
      </div>
    </div>
  );
}
