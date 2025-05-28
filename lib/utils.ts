import { UIMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ABORTED = "User aborted";

export const prunedMessages = (messages: UIMessage[]): UIMessage[] => {
  if (messages.at(-1)?.role === "assistant") {
    return messages;
  }

  return messages.map((message) => {
    // check if last message part is a tool invocation in a call state, then append a part with the tool result
    message.parts = message.parts.map((part) => {
      if (part.type === "tool-invocation") {
        if (
          part.toolInvocation.toolName === "computer" &&
          part.toolInvocation.args.action === "screenshot"
        ) {
          return {
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              result: {
                type: "text",
                text: "Image redacted to save input tokens",
              },
            },
          };
        }
        return part;
      }
      return part;
    });
    return message;
  });
};

// 图片压缩处理函数
export const compressImage = (
  base64Data: string,
  maxSizeKB: number = 500
): string => {
  // 计算当前图片大小（KB）
  const currentSizeKB = (base64Data.length * 3) / 4 / 1024;

  if (currentSizeKB <= maxSizeKB) {
    return base64Data;
  }

  // 如果图片太大，可以考虑以下策略：
  // 1. 返回缩略图信息
  // 2. 降低质量
  // 3. 裁剪图片

  console.log(
    `Image size: ${currentSizeKB.toFixed(2)}KB, exceeds ${maxSizeKB}KB limit`
  );

  // 目前先返回原图，后续可以添加真实的压缩逻辑
  return base64Data;
};

// 判断是否需要清理沙箱的公共函数
export function shouldCleanupSandbox(error: any): boolean {
  // 如果是字符串错误，检查是否包含沙箱相关的关键词
  if (typeof error === "string") {
    return (
      error.includes("sandbox") ||
      error.includes("desktop") ||
      error.includes("connection lost") ||
      error.includes("timeout")
    );
  }

  // 如果是对象错误，检查错误类型
  if (error && typeof error === "object") {
    const errorType = error.type || error.error?.type;
    const errorMessage = error.message || error.error?.message || "";

    // 这些错误类型不需要清理沙箱（外部服务问题）
    const externalServiceErrors = [
      "overloaded_error", // API服务过载
      "rate_limit_error", // 速率限制
      "authentication_error", // 认证错误
      "invalid_request_error", // 请求格式错误
      "api_error", // 通用API错误
      "network_error", // 网络错误（临时）
      "billing_error", // 计费问题
    ];

    if (externalServiceErrors.includes(errorType)) {
      console.log(`🔄 外部服务错误 (${errorType}), 保留沙箱环境`);
      return false;
    }

    // 这些错误类型需要清理沙箱（沙箱环境问题）
    const sandboxErrors = [
      "sandbox_error",
      "execution_error",
      "timeout_error",
      "connection_error",
    ];

    if (sandboxErrors.includes(errorType)) {
      console.log(`🧹 沙箱环境错误 (${errorType}), 需要清理`);
      return true;
    }

    // 检查错误消息中是否包含沙箱相关内容
    const sandboxRelatedKeywords = [
      "sandbox",
      "desktop",
      "e2b",
      "command execution",
      "screenshot failed",
      "mouse click failed",
      "connection lost",
      "session expired",
    ];

    const messageContainsSandboxIssue = sandboxRelatedKeywords.some((keyword) =>
      errorMessage.toLowerCase().includes(keyword.toLowerCase())
    );

    if (messageContainsSandboxIssue) {
      console.log(`🧹 检测到沙箱相关错误，需要清理: ${errorMessage}`);
      return true;
    }
  }

  // 对于严重的系统错误（如内存不足等），也进行清理
  if (error instanceof Error) {
    const criticalErrors = [
      "out of memory",
      "system error",
      "fatal error",
      "process crashed",
    ];

    const isCritical = criticalErrors.some((keyword) =>
      error.message.toLowerCase().includes(keyword)
    );

    if (isCritical) {
      console.log(`🧹 检测到严重系统错误，需要清理: ${error.message}`);
      return true;
    }
  }

  // 默认情况下不清理沙箱，避免误杀
  console.log(`⚡ 未知错误类型，保留沙箱环境，错误详情:`, error);
  return false;
}
