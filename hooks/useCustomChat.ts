"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ABORTED } from "@/lib/utils";
import { useSmartClean } from "./useSmartClean";
import { useFeishuNotification } from "./useFeishuNotification";
import { useBrand } from "@/lib/contexts/brand-context";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useModelConfig } from "@/lib/stores/model-config-store";
import { useConfigDataForChat } from "./useConfigDataForChat";
import {
  getEnvironmentLimits,
  detectEnvironment,
} from "@/lib/utils/environment";

interface UseCustomChatProps {
  sandboxId: string | null;
  sandboxStatus: "running" | "paused" | "unknown";
}

export function useCustomChat({
  sandboxId,
  sandboxStatus: _sandboxStatus,
}: UseCustomChatProps) {
  // 🔐 用户认证状态
  const { isAuthenticated } = useAuthStore();

  // 🏪 品牌管理
  const { currentBrand } = useBrand();

  // 🤖 模型配置
  const { chatModel, classifyModel, replyModel, providerConfigs } =
    useModelConfig();

  // 🔧 配置数据 - 从 localforage 加载
  const {
    configData,
    systemPrompts,
    replyPrompts,
    activeSystemPrompt,
    isLoading: configLoading,
    error: configError,
  } = useConfigDataForChat();

  // 🔄 防止飞书通知循环调用的标志
  const [isProcessingError, setIsProcessingError] = useState(false);
  
  // 🛡️ 防止短时间内重复处理载荷错误的时间戳
  const [lastPayloadErrorTime, setLastPayloadErrorTime] = useState<number>(0);

  // 🌍 环境信息状态 - 避免 hydration 不匹配
  const [envInfo, setEnvInfo] = useState(() => {
    // 初始值使用安全的默认值
    return {
      environment: "unknown" as "unknown" | "vercel" | "local",
      limits: getEnvironmentLimits(),
      description: "未知环境 - 使用保守设置",
    };
  });

  // 🌍 在客户端 hydration 后更新正确的环境信息
  useEffect(() => {
    const actualEnv = detectEnvironment();
    const actualLimits = getEnvironmentLimits();
    const actualDescription = {
      vercel: "Vercel 部署环境 - 严格的请求大小限制",
      local: "本地开发环境 - 较宽松的限制",
      unknown: "未知环境 - 使用保守设置",
    }[actualEnv];

    setEnvInfo({
      environment: actualEnv,
      limits: actualLimits,
      description: actualDescription,
    });
  }, []);

  const envLimits = envInfo.limits;

  // 🎯 检查是否为请求过大错误
  const isPayloadTooLargeError = (error: Error) => {
    return (
      error.message.includes("Request Entity Too Large") ||
      error.message.includes("FUNCTION_PAYLOAD_TOO_LARGE") ||
      error.message.includes("Payload Too Large") ||
      error.message.includes("413")
    );
  };

  // 🎯 检查是否为服务过载错误
  const isOverloadedError = (error: Error) => {
    return error.message.includes("AI服务当前负载过高");
  };

  // 🎯 检查是否为频率限制错误
  const isRateLimitError = (error: Error) => {
    return error.message.includes("请求频率过高");
  };

  // 从 localStorage 获取 dulidayToken
  const [dulidayToken, setDulidayToken] = useState<string | null>(null);
  
  useEffect(() => {
    // 在客户端获取 token
    const token = localStorage.getItem("duliday_token");
    setDulidayToken(token);
  }, []);

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
      preferredBrand: currentBrand,
      modelConfig: {
        chatModel,
        classifyModel,
        replyModel,
        providerConfigs,
      },
      // 🔧 传递配置数据到服务端
      configData,
      systemPrompts,
      replyPrompts,
      activeSystemPrompt,
      dulidayToken,
    },
    maxSteps: 30,
  });

  // 使用智能清理 Hook
  const {
    smartClean,
    clearMessages,
    handlePayloadTooLargeError,
    checkCleanThreshold,
  } = useSmartClean({
    messages,
    setMessages,
    envLimits,
    envInfo,
  });

  // 使用飞书通知 Hook
  const { sendFeishuNotification } = useFeishuNotification({ append });

  // 设置 onError 和 onFinish 回调
  useEffect(() => {
    if (!error) return;

    console.error("Chat error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // 🔄 防止错误处理循环
    if (isProcessingError) {
      console.warn("🚫 正在处理错误中，跳过重复处理");
      return;
    }

    // 🎯 处理请求过大错误
    if (isPayloadTooLargeError(error)) {
      const now = Date.now();
      
      // 🛡️ 防止短时间内重复处理同样的错误（30秒内）
      if (now - lastPayloadErrorTime < 30000) {
        console.warn("🚫 短时间内已处理过载荷错误，跳过重复处理");
        return;
      }
      
      setIsProcessingError(true);
      setLastPayloadErrorTime(now);
      console.warn("💾 检测到请求载荷过大错误，准备智能清理");

      // 🎯 立即尝试清理，不先发送通知避免循环
      console.log("🔄 优先执行清理操作，避免通知循环");
      
      const wasHandled = handlePayloadTooLargeError();
      
      if (wasHandled) {
        // 🎯 清理成功，准备重试
        console.log("✅ 载荷清理成功，准备自动重试");
        
        setTimeout(() => {
          console.log("🔄 载荷过大错误处理完成，自动重试请求");
          setIsProcessingError(false);
          reload();
        }, 1000);
      } else {
        // 🚨 清理失败，现在发送通知并显示错误
        console.warn("❌ 载荷清理失败，发送通知并显示错误提示");
        
        // 只有在清理失败时才发送飞书通知
        sendFeishuNotification("payload_error", {
          additional_info: `对话历史包含${messages.length}条消息，估算大小${(
            JSON.stringify(messages).length /
            (1024 * 1024)
          ).toFixed(2)}MB，清理失败，仍然触发载荷过大限制。错误信息：${error.message}`,
        });
        
        setIsProcessingError(false);
        toast.error("请求过大", {
          description: "智能清理失败，请考虑手动清空部分对话历史后重试",
          richColors: true,
          position: "top-center",
          action: {
            label: "清空对话",
            onClick: clearMessages,
          },
        });
      }
    } else if (isOverloadedError(error)) {
      // 处理服务过载错误
      console.warn("🔄 AI服务过载，建议稍后重试");
      toast.warning("服务繁忙", {
        description: "AI服务当前负载较高，建议稍后重试",
        richColors: true,
        position: "top-center",
        duration: 5000,
      });
      
      // 发送飞书通知
      sendFeishuNotification("system_warning", {
        additional_info: `AI服务过载，错误信息：${error.message}`,
      });
    } else if (isRateLimitError(error)) {
      // 处理频率限制错误
      console.warn("⏱️ 请求频率过高");
      toast.warning("请求过于频繁", {
        description: "您的请求频率过高，请稍后再试",
        richColors: true,
        position: "top-center",
        duration: 5000,
      });
    } else {
      // 其他类型错误的通用处理
      toast.error("请求失败", {
        description: error.message || "请检查网络连接或稍后重试",
        richColors: true,
        position: "top-center",
      });
    }
  }, [
    error,
    isProcessingError,
    messages,
    sendFeishuNotification,
    handlePayloadTooLargeError,
    reload,
    clearMessages,
  ]);

  // 停止生成
  const stop = useCallback(() => {
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
  }, [stopGeneration, messages, setMessages]);

  // 自定义提交处理器
  const customSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
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

      // 移除预防性检查，只在真正遇到错误时才清理

      if (error != null) {
        console.log("Removing last message due to error before retry");

        // 对于某些错误类型，不应该立即重试
        if (isPayloadTooLargeError(error)) {
          console.log("🚫 载荷过大错误，跳过重试以避免重复错误");
          event.preventDefault();
          return;
        }
        
        if (isOverloadedError(error)) {
          console.log("🚫 服务过载错误，请稍后重试");
          event.preventDefault();
          toast.info("请稍等片刻", {
            description: "AI服务正在恢复中，请稍后再试",
            position: "top-center",
          });
          return;
        }
        
        if (isRateLimitError(error)) {
          console.log("🚫 频率限制错误，请稍后重试");
          event.preventDefault();
          toast.info("请慢一点", {
            description: "请求过于频繁，请稍后再试",
            position: "top-center",
          });
          return;
        }

        setMessages(messages.slice(0, -1));
      }

      handleSubmit(event);
    },
    [
      isAuthenticated,
      error,
      handleSubmit,
      messages,
      setMessages,
    ]
  );

  // 监听消息数量变化
  useEffect(() => {
    checkCleanThreshold();
  }, [messages.length, checkCleanThreshold]);

  // 监听错误状态变化
  useEffect(() => {
    if (error) {
      console.log("Error detected:", error);
    }
  }, [error]);

  const isLoading = status !== "ready" || configLoading;

  // 🔧 配置错误处理
  useEffect(() => {
    if (configError) {
      console.error("配置数据加载错误:", configError);
      toast.error("配置加载失败", {
        description: "使用默认配置，部分功能可能受限",
        richColors: true,
        position: "top-center",
      });
    }
  }, [configError]);

  return {
    // 状态
    messages,
    input,
    status,
    error,
    isLoading,

    // 🔧 配置状态
    configLoading,
    configError,

    // 方法
    handleInputChange,
    handleSubmit: customSubmit,
    stop,
    append,
    reload,

    // 清理相关
    clearMessages,
    smartClean: () => smartClean(false),

    // 通知相关
    sendFeishuNotification,

    // 环境信息
    envInfo,
  };
}
