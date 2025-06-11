"use client";

import { PreviewMessage } from "@/components/message";
import { getDesktopURL } from "@/lib/e2b/utils";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProjectInfo } from "@/components/project-info";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ABORTED } from "@/lib/utils";
import { BrandSelector } from "@/components/brand-selector";
import { useBrand } from "@/lib/contexts/brand-context";
import { Bot, Server, Cpu, Loader2 } from "lucide-react";
import type {
  FeishuNotificationType,
  FeishuNotificationOptions,
} from "@/types";
import { FEISHU_NOTIFICATION_LABELS } from "@/types";
import { UserNav } from "@/components/user-nav";
import { StorageDebug } from "@/components/storage-debug";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * 🏠 主聊天界面组件
 *
 * 集成了桌面沙盒、AI助手对话、飞书通知等功能
 * 支持智能载荷管理、任务状态监控和自动通知推送
 */
export default function Chat() {
  // 🔐 用户认证状态
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

  // 🏪 品牌管理
  const { currentBrand } = useBrand();

  // Create separate refs for mobile and desktop to ensure both scroll properly
  const [desktopContainerRef, desktopEndRef] = useScrollToBottom();
  const [mobileContainerRef, mobileEndRef] = useScrollToBottom();

  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<
    "running" | "paused" | "unknown"
  >("unknown");

  // 🎯 检查是否为请求过大错误
  const isPayloadTooLargeError = (error: Error) => {
    return (
      error.message.includes("Request Entity Too Large") ||
      error.message.includes("FUNCTION_PAYLOAD_TOO_LARGE") ||
      error.message.includes("Payload Too Large") ||
      error.message.includes("413")
    );
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
    error,
    reload,
  } = useChat({
    api: "/api/chat",
    id: sandboxId ?? undefined,
    body: {
      sandboxId,
      preferredBrand: currentBrand, // 🎯 传递当前选择的品牌
    },
    maxSteps: 30,
    onError: (error) => {
      console.error("Chat error:", error);

      // 根据AI SDK文档建议，记录详细错误但只向用户显示通用信息
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      // 🎯 处理请求过大错误
      if (isPayloadTooLargeError(error)) {
        console.warn("💾 检测到请求载荷过大错误，准备智能清理");

        // 🚨 发送飞书载荷过大错误通知
        sendFeishuNotification("payload_error", {
          additional_info: `对话历史包含${messages.length}条消息，估算大小${(
            JSON.stringify(messages).length /
            (1024 * 1024)
          ).toFixed(2)}MB，触发载荷过大限制。错误信息：${error.message}`,
        });

        // 延迟执行，确保错误状态已更新
        setTimeout(() => {
          const wasHandled = handlePayloadTooLargeError();
          if (!wasHandled) {
            toast.error("请求过大", {
              description: "请考虑清空部分对话历史后重试",
              richColors: true,
              position: "top-center",
              action: {
                label: "清空对话",
                onClick: clearMessages,
              },
            });
          }
        }, 100);
      } else {
        // 其他类型错误的通用处理
        toast.error("请求失败", {
          description: "请检查网络连接或稍后重试",
          richColors: true,
          position: "top-center",
        });
      }
    },
    onFinish: (message, { finishReason }) => {
      console.log("Chat finished:", message);
      // console.log("Finish reason:", finishReason);

      // 🎯 发送任务完成通知 - 避免飞书通知工具的循环调用
      setTimeout(() => {
        // 检查是否正常停止且不是飞书通知工具调用
        if (finishReason === "stop") {
          // 检查最后一个工具调用是否为飞书工具，避免循环
          const lastToolCall = message.parts?.findLast(
            (part) => part.type === "tool-invocation"
          );

          const isFeishuToolCall =
            lastToolCall?.toolInvocation?.toolName === "feishu";

          // 检查是否包含非飞书的工具调用
          const hasNonFeishuToolUsage = message.parts?.some(
            (part) =>
              part.type === "tool-invocation" &&
              part.toolInvocation?.state === "result" &&
              part.toolInvocation?.toolName !== "feishu"
          );

          // 只有在包含非飞书工具调用且最后一个不是飞书工具时才发送通知
          if (hasNonFeishuToolUsage && !isFeishuToolCall) {
            console.log("📋 检测到业务工具调用完成，发送任务完成通知");
            sendFeishuNotification("task_completed", {
              additional_info: `本轮AI助手任务已完成，共处理${
                messages.length + 1
              }条消息，包含工具调用操作，当前状态已就绪等待新指令`,
            });
          } else if (isFeishuToolCall) {
            console.log("🔄 跳过飞书工具调用的完成通知，避免循环");
          }
        }
      }, 1000); // 延迟1秒确保状态稳定
    },
  });

  // 📢 统一的飞书通知发送函数
  const sendFeishuNotification = useCallback(
    (
      notificationType: FeishuNotificationType,
      options: FeishuNotificationOptions = {}
    ) => {
      const {
        candidate_name,
        wechat_id,
        additional_info,
        message: customMessage,
        messageType = "text",
      } = options;

      // 构建工具参数
      const toolParams: Record<string, string | undefined> = {
        notification_type: notificationType,
        messageType,
      };

      // 根据通知类型添加必要参数
      if (candidate_name) toolParams.candidate_name = candidate_name;
      if (wechat_id) toolParams.wechat_id = wechat_id;
      if (additional_info) toolParams.additional_info = additional_info;
      if (customMessage) toolParams.message = customMessage;

      // 生成格式化的消息内容
      const formattedContent = `请使用feishu工具发送${getNotificationLabel(
        notificationType
      )}：
${JSON.stringify(toolParams, null, 2)}`;

      console.log(`📢 准备发送飞书通知 [${notificationType}]`);

      // 发送消息到LLM
      append({
        role: "user",
        content: formattedContent,
      });
    },
    [append]
  );

  // 🏷️ 获取通知类型的中文标签
  const getNotificationLabel = (type: FeishuNotificationType): string => {
    return FEISHU_NOTIFICATION_LABELS[type] || "通知";
  };

  // 🧹 智能消息清理策略
  const handlePayloadTooLargeError = useCallback(() => {
    const messageCount = messages.length;

    if (messageCount <= 3) {
      // 如果消息很少，说明是单个消息太大
      toast.error("消息内容过大，请尝试分步骤描述或简化需求", {
        description: "建议将复杂任务分解为多个小步骤",
        richColors: true,
        position: "top-center",
        duration: 5000,
      });
      return false; // 不自动清理
    }

    // 计算需要保留的消息数量（保留最近的30%，至少3条）
    const keepCount = Math.max(3, Math.floor(messageCount * 0.3));
    const removeCount = messageCount - keepCount;

    if (
      window.confirm(
        `对话历史过长导致请求失败。是否自动清理前${removeCount}条消息？\n\n` +
          `将保留最近的${keepCount}条消息以维持上下文连续性。`
      )
    ) {
      // 智能保留策略：优先保留最近的消息
      const recentMessages = messages.slice(-keepCount);
      setMessages(recentMessages);

      toast.success(`已清理${removeCount}条历史消息`, {
        description: `保留了最近的${keepCount}条消息`,
        richColors: true,
        position: "top-center",
      });

      return true; // 表示已清理
    }

    return false; // 用户拒绝清理
  }, [messages, setMessages]);

  const stop = () => {
    stopGeneration();

    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...lastMessage.parts.slice(0, -1),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  };

  // 清空对话记录
  const clearMessages = () => {
    if (messages.length === 0) {
      toast.info("对话记录已经为空", {
        richColors: true,
        position: "top-center",
      });
      return;
    }

    // 添加确认提示
    if (window.confirm("确定要清空所有对话记录吗？此操作无法撤销。")) {
      setMessages([]);
      toast.success("对话记录已清空", {
        richColors: true,
        position: "top-center",
      });
    }
  };

  // 🎯 智能部分清理 - 清理一半的历史消息
  const smartClearMessages = useCallback(() => {
    if (messages.length <= 2) {
      toast.info("消息太少，无需清理", {
        richColors: true,
        position: "top-center",
      });
      return;
    }

    const keepCount = Math.ceil(messages.length / 2);
    const recentMessages = messages.slice(-keepCount);

    if (window.confirm(`保留最近的${keepCount}条消息，清理其余历史记录？`)) {
      setMessages(recentMessages);
      toast.success(`已清理${messages.length - keepCount}条历史消息`, {
        description: `保持了最近的${keepCount}条消息`,
        richColors: true,
        position: "top-center",
      });
    }
  }, [messages, setMessages]);

  const isLoading = status !== "ready";

  // 自定义提交处理器，根据AI SDK文档建议在错误时移除最后一条消息
  const customSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // 🔐 检查用户认证状态
    if (!isAuthenticated) {
      event.preventDefault();
      toast.error("请先登录", {
        description: "您需要登录后才能使用AI助手功能",
        richColors: true,
        position: "top-center",
      });
      return;
    }

    // 🎯 预防性检查：估算消息大小
    const messageSize = JSON.stringify(messages).length;
    const estimatedSizeMB = messageSize / (1024 * 1024);

    console.log(
      `📊 消息历史大小: ${estimatedSizeMB.toFixed(2)}MB (${
        messages.length
      }条消息)`
    );

    // 如果消息历史过大，给出警告
    if (estimatedSizeMB > 5) {
      console.warn("⚠️ 消息历史可能过大，建议清理");
      toast.warning("对话历史较长，可能影响响应速度", {
        description: "建议适时清理历史消息以提升性能",
        richColors: true,
        position: "top-center",
        action: {
          label: "智能清理",
          onClick: smartClearMessages,
        },
      });
    }

    if (error != null) {
      console.log("Removing last message due to error before retry");

      // 🎯 特殊处理：如果是载荷过大错误，不重复发送
      if (isPayloadTooLargeError(error)) {
        console.log("🚫 载荷过大错误，跳过重试以避免重复错误");
        event.preventDefault();
        return;
      }

      setMessages(messages.slice(0, -1)); // 移除最后一条消息
    }

    handleSubmit(event);
  };

  // 监听消息数量变化，给出提示
  useEffect(() => {
    if (messages.length > 0 && messages.length % 20 === 0) {
      console.log(`📝 对话已达到${messages.length}条消息`);

      if (messages.length >= 50) {
        toast.info("对话历史较长", {
          description: "建议适时清理以避免请求过大错误",
          richColors: true,
          position: "top-center",
          action: {
            label: "智能清理",
            onClick: smartClearMessages,
          },
        });
      }
    }
  }, [messages.length, smartClearMessages]);

  // 监听错误状态变化
  useEffect(() => {
    if (error) {
      console.log("Error detected:", error);
    }
  }, [error]);

  const refreshDesktop = async () => {
    try {
      setIsInitializing(true);

      // 如果当前状态是暂停，优先尝试恢复
      if (sandboxStatus === "paused" && sandboxId) {
        console.log("Attempting to resume paused sandbox:", sandboxId);
        toast.info("正在恢复暂停的沙盒...", {
          richColors: true,
          position: "top-center",
        });
      }

      const { streamUrl, id } = await getDesktopURL(sandboxId || undefined);
      console.log("Desktop connection established with ID:", id);
      setStreamUrl(streamUrl);
      setSandboxId(id);
      setSandboxStatus("running");

      if (sandboxStatus === "paused") {
        toast.success("沙盒已成功恢复！", {
          richColors: true,
          position: "top-center",
        });
      }
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
      toast.error("恢复沙盒失败，将创建新的沙盒", {
        richColors: true,
        position: "top-center",
      });
      // 如果恢复失败，清除当前sandboxId，强制创建新的
      setSandboxId(null);
      setSandboxStatus("unknown");
    } finally {
      setIsInitializing(false);
    }
  };

  const pauseDesktop = async () => {
    if (!sandboxId || isPausing) return;

    try {
      setIsPausing(true);
      const response = await fetch(
        `/api/pause-desktop?sandboxId=${encodeURIComponent(sandboxId)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Desktop paused:", result);
        setSandboxStatus("paused");
        toast.success("桌面已暂停", {
          description: "你可以稍后恢复使用",
          richColors: true,
          position: "top-center",
        });
      } else {
        throw new Error("Failed to pause desktop");
      }
    } catch (err) {
      console.error("Failed to pause desktop:", err);
      toast.error("暂停桌面失败", {
        description: "请稍后重试",
        richColors: true,
        position: "top-center",
      });
    } finally {
      setIsPausing(false);
    }
  };

  const checkSandboxStatus = useCallback(async () => {
    if (!sandboxId) return;

    try {
      const response = await fetch(
        `/api/sandbox-status?sandboxId=${encodeURIComponent(sandboxId)}`
      );
      if (response.ok) {
        const status = await response.json();
        const newStatus = status.isRunning ? "running" : "paused";

        // 如果沙盒从运行状态变为暂停状态，显示通知
        if (sandboxStatus === "running" && newStatus === "paused") {
          console.log("Sandbox has been paused unexpectedly");
          toast.info("沙盒已暂停", {
            description: "点击'刷新桌面'按钮可以恢复",
            richColors: true,
            position: "top-center",
          });
        }

        setSandboxStatus(newStatus);
      }
    } catch (err) {
      console.error("Failed to check sandbox status:", err);
      setSandboxStatus("unknown");
    }
  }, [sandboxId, sandboxStatus]);

  // Kill desktop on page close
  useEffect(() => {
    if (!sandboxId) return;

    // Function to kill the desktop - just one method to reduce duplicates
    const killDesktop = () => {
      if (!sandboxId) return;

      // Use sendBeacon which is best supported across browsers
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`
      );
    };

    // Detect iOS / Safari
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Choose exactly ONE event handler based on the browser
    if (isIOS || isSafari) {
      // For Safari on iOS, use pagehide which is most reliable
      window.addEventListener("pagehide", killDesktop);

      return () => {
        window.removeEventListener("pagehide", killDesktop);
        // Also kill desktop when component unmounts
        killDesktop();
      };
    } else {
      // For all other browsers, use beforeunload
      window.addEventListener("beforeunload", killDesktop);

      return () => {
        window.removeEventListener("beforeunload", killDesktop);
        // Also kill desktop when component unmounts
        killDesktop();
      };
    }
  }, [sandboxId]);

  // 心跳检测 - 定期检查沙盒状态
  useEffect(() => {
    if (!sandboxId) return;

    // 立即检查一次状态
    checkSandboxStatus();

    // 设置定期检查
    const heartbeatInterval = setInterval(() => {
      checkSandboxStatus();
    }, 60000); // 每分钟检查一次

    return () => clearInterval(heartbeatInterval);
  }, [sandboxId, checkSandboxStatus]);

  useEffect(() => {
    // 只有在用户认证后才初始化E2B桌面
    if (!isAuthenticated || isAuthLoading) {
      // 如果用户未认证或正在加载认证状态，重置E2B相关状态
      setStreamUrl(null);
      setSandboxId(null);
      setSandboxStatus("unknown");
      setIsInitializing(false);
      return;
    }

    // Initialize desktop and get stream URL when user is authenticated
    const init = async () => {
      try {
        setIsInitializing(true);

        // Use the provided ID or create a new one
        const { streamUrl, id } = await getDesktopURL(sandboxId ?? undefined);

        setStreamUrl(streamUrl);
        setSandboxId(id);
        setSandboxStatus("running");
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
        setSandboxStatus("unknown");
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading]);

  return (
    <div className="flex h-dvh relative">
      {/* Mobile/tablet banner */}
      <div className="flex items-center justify-center fixed left-1/2 -translate-x-1/2 top-5 shadow-md text-xs mx-auto rounded-lg h-8 w-fit bg-blue-600 text-white px-3 py-2 text-left z-50 xl:hidden">
        <span>Headless mode</span>
      </div>

      {/* Resizable Panels */}
      <div className="w-full hidden xl:block">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Desktop Stream Panel */}
          <ResizablePanel
            defaultSize={70}
            minSize={40}
            className="bg-black relative items-center justify-center"
          >
            {!isAuthenticated ? (
              // 未登录状态 - 显示登录提示
              <div className="flex flex-col items-center justify-center h-full text-white p-8">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 mx-auto mb-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold mb-3">
                    AI 助手沙盒环境
                  </h2>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    沙盒环境需要用户登录后才能启动。请先登录您的账户以使用完整的
                    AI 助手功能。
                  </p>
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>安全的隔离环境</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>实时屏幕操作</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span>AI 智能控制</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : streamUrl ? (
              // 已登录且有沙盒 - 显示正常界面
              <>
                <iframe
                  src={streamUrl}
                  className="w-full h-full"
                  style={{
                    transformOrigin: "center",
                    width: "100%",
                    height: "100%",
                  }}
                  allow="autoplay"
                />
                <Button
                  onClick={refreshDesktop}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded text-sm z-10"
                  disabled={isInitializing}
                >
                  {isInitializing ? "Creating desktop..." : "New desktop"}
                </Button>

                {/* 状态显示和暂停按钮 */}
                <div className="absolute top-2 left-2 flex gap-2 z-10">
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      sandboxStatus === "running"
                        ? "bg-green-500/80 text-white"
                        : sandboxStatus === "paused"
                        ? "bg-yellow-500/80 text-white"
                        : "bg-gray-500/80 text-white"
                    }`}
                  >
                    {sandboxStatus === "running"
                      ? "运行中"
                      : sandboxStatus === "paused"
                      ? "已暂停"
                      : "未知状态"}
                  </div>

                  {sandboxStatus === "running" && (
                    <Button
                      onClick={pauseDesktop}
                      className="bg-yellow-500/80 hover:bg-yellow-600/80 text-white px-2 py-1 rounded text-xs"
                      disabled={isPausing}
                    >
                      {isPausing ? "暂停中..." : "暂停"}
                    </Button>
                  )}

                  {sandboxStatus === "paused" && (
                    <Button
                      onClick={refreshDesktop}
                      className="bg-blue-500/80 hover:bg-blue-600/80 text-white px-2 py-1 rounded text-xs"
                      disabled={isInitializing}
                    >
                      {isInitializing ? "恢复中..." : "恢复桌面"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              // 已登录但沙盒正在初始化
              <div className="flex items-center justify-center h-full text-white">
                {isInitializing
                  ? "Initializing desktop..."
                  : "Loading stream..."}
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Chat Interface Panel */}
          <ResizablePanel
            defaultSize={30}
            minSize={25}
            className="flex flex-col border-l border-zinc-200"
          >
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 py-3 px-4">
              {/* 主标题行 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <h1 className="text-base font-semibold text-slate-800">
                    AI 助手
                  </h1>
                </div>
                <UserNav />
              </div>

              {/* 控制按钮行 */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/40">
                <div className="flex items-center gap-3">
                  <BrandSelector />
                  <div className="text-xs text-slate-500 bg-white/70 px-2 py-1 rounded-full font-medium">
                    {messages.length} 条消息
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={smartClearMessages}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors font-medium"
                    disabled={isLoading || messages.length <= 2}
                    title="保留最近一半消息，清理其余历史"
                  >
                    智能清理
                  </Button>
                  <Button
                    onClick={clearMessages}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors font-medium"
                    disabled={isLoading}
                  >
                    清空
                  </Button>
                </div>
              </div>

              {/* 状态栏 */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/30">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-3 h-3" />
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        sandboxStatus === "running"
                          ? "bg-green-500"
                          : sandboxStatus === "paused"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="font-medium">
                      {sandboxStatus === "running"
                        ? "运行中"
                        : sandboxStatus === "paused"
                        ? "已暂停"
                        : "未知"}
                    </span>
                  </div>
                  {currentBrand && (
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3 h-3" />
                      <span className="font-medium">{currentBrand}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {isLoading && (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="font-medium">思考中...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="flex-1 space-y-6 py-4 overflow-y-auto px-4"
              ref={desktopContainerRef}
            >
              {messages.length === 0 ? <ProjectInfo /> : null}
              {messages.map((message, i) => (
                <PreviewMessage
                  message={message}
                  key={message.id}
                  isLoading={isLoading}
                  status={status}
                  isLatestMessage={i === messages.length - 1}
                />
              ))}
              <div ref={desktopEndRef} className="pb-2" />
            </div>

            {/* 错误状态显示 - 根据AI SDK文档建议 */}
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
                          onClick={smartClearMessages}
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

            {/* PromptSuggestions 始终显示在输入框上方 */}
            <PromptSuggestions
              disabled={isInitializing || !isAuthenticated}
              submitPrompt={(prompt: string) => {
                if (!isAuthenticated) {
                  toast.error("请先登录", {
                    description: "您需要登录后才能使用AI助手功能",
                    richColors: true,
                    position: "top-center",
                  });
                  return;
                }
                append({ role: "user", content: prompt });
              }}
            />

            <div className="bg-white">
              <form onSubmit={customSubmit} className="p-4">
                <Input
                  handleInputChange={handleInputChange}
                  input={input}
                  isInitializing={isInitializing}
                  isLoading={isLoading}
                  status={status}
                  stop={stop}
                  error={error}
                  isAuthenticated={isAuthenticated}
                />
              </form>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile View (Chat Only) */}
      <div className="w-full xl:hidden flex flex-col">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 py-3 px-4">
          {/* 主标题行 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <h1 className="text-sm font-semibold text-slate-800">AI 助手</h1>
            </div>
            <UserNav />
          </div>

          {/* 控制按钮行 - 移动端采用垂直排列 */}
          <div className="mt-3 pt-2 border-t border-white/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrandSelector />
                <div className="text-xs text-slate-500 bg-white/70 px-2 py-1 rounded-full font-medium">
                  {messages.length}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={smartClearMessages}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors font-medium"
                  disabled={isLoading || messages.length <= 2}
                  title="智能清理"
                >
                  清理
                </Button>
                <Button
                  onClick={clearMessages}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors font-medium"
                  disabled={isLoading}
                >
                  清空
                </Button>
              </div>
            </div>

            {/* 移动端状态栏 */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Server className="w-3 h-3" />
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      sandboxStatus === "running"
                        ? "bg-green-500"
                        : sandboxStatus === "paused"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="font-medium">
                    {sandboxStatus === "running"
                      ? "运行中"
                      : sandboxStatus === "paused"
                      ? "已暂停"
                      : "未知"}
                  </span>
                </div>
                {currentBrand && (
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" />
                    <span className="font-medium">{currentBrand}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">
                {isLoading && (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="font-medium">思考中...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex-1 space-y-6 py-4 overflow-y-auto px-4"
          ref={mobileContainerRef}
        >
          {messages.length === 0 ? <ProjectInfo /> : null}
          {messages.map((message, i) => (
            <PreviewMessage
              message={message}
              key={message.id}
              isLoading={isLoading}
              status={status}
              isLatestMessage={i === messages.length - 1}
            />
          ))}
          <div ref={mobileEndRef} className="pb-2" />
        </div>

        {/* PromptSuggestions 始终显示在输入框上方 */}
        <PromptSuggestions
          disabled={isInitializing || !isAuthenticated}
          submitPrompt={(prompt: string) => {
            if (!isAuthenticated) {
              toast.error("请先登录", {
                description: "您需要登录后才能使用AI助手功能",
                richColors: true,
                position: "top-center",
              });
              return;
            }
            append({ role: "user", content: prompt });
          }}
        />

        <div className="bg-white">
          <form onSubmit={customSubmit} className="p-4">
            <Input
              handleInputChange={handleInputChange}
              input={input}
              isInitializing={isInitializing}
              isLoading={isLoading}
              status={status}
              stop={stop}
              error={error}
              isAuthenticated={isAuthenticated}
            />
          </form>
        </div>
      </div>

      {/* Debug component - remove in production */}
      {process.env.NODE_ENV === "development" && <StorageDebug />}
    </div>
  );
}
