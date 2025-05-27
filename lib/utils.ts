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
