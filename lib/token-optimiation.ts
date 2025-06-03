import { get_encoding, type Tiktoken } from "tiktoken";
import type { Message } from "ai";

// 🧠 智能Token分析器 v2.0 (改进版)
export class TokenAnalyzer {
  private encoding: Tiktoken | null = null;

  /**
   * 🚀 初始化tokenizer (懒加载)
   */
  private getEncoding(): Tiktoken {
    if (!this.encoding) {
      try {
        this.encoding = get_encoding("cl100k_base");
      } catch (error) {
        console.error("❌ tiktoken初始化失败:", error);
        throw new Error("无法初始化token分析器");
      }
    }
    return this.encoding;
  }

  /**
   * 🧹 清理资源
   */
  public cleanup(): void {
    if (this.encoding) {
      try {
        this.encoding.free();
        this.encoding = null;
      } catch (error) {
        console.warn("⚠️ tiktoken清理失败:", error);
      }
    }
  }

  /**
   * 📊 估算消息的Token使用情况
   */
  estimateMessageTokens(
    messages: Message[],
    optimizationThreshold: number = 80000
  ): {
    totalTokens: number;
    needsOptimization: boolean;
    imageTokens: number;
  } {
    let totalTokens = 0;
    let imageTokens = 0;

    try {
      const encoding = this.getEncoding();

      messages.forEach((message) => {
        // 基础文本内容
        if (message.content && typeof message.content === "string") {
          try {
            totalTokens += encoding.encode(message.content).length;
          } catch (error) {
            console.warn("⚠️ 编码文本内容失败:", error);
            // 降级估算: 1 token ≈ 4 字符
            totalTokens += Math.ceil(message.content.length / 4);
          }
        }

        // 分析parts中的内容
        if (message.parts) {
          message.parts.forEach((part) => {
            if (part.type === "text" && part.text) {
              try {
                totalTokens += encoding.encode(part.text).length;
              } catch (error) {
                console.warn("⚠️ 编码part文本失败:", error);
                totalTokens += Math.ceil(part.text.length / 4);
              }
            } else if (part.type === "tool-invocation") {
              // Tool调用基础token
              totalTokens += 50;
              const { state } = part.toolInvocation;

              // 检查图片
              if (
                state === "result" &&
                part.toolInvocation.result.type === "image" &&
                part.toolInvocation.result.data
              ) {
                const base64Data = part.toolInvocation.result.data as string;
                const imageKB = (base64Data.length * 3) / 4 / 1024;
                const tokens = Math.round(imageKB * 15); // 约15 tokens per KB

                imageTokens += tokens;
                totalTokens += tokens;
              }
            }
          });
        }
      });
    } catch (error) {
      console.error("🚨 Token分析失败:", error);
      // 降级到简单估算
      const estimatedTokens = this.fallbackTokenEstimation(messages);
      return {
        totalTokens: estimatedTokens,
        imageTokens: Math.round(estimatedTokens * 0.3), // 假设30%是图片
        needsOptimization: estimatedTokens > optimizationThreshold,
      };
    }

    return {
      totalTokens,
      imageTokens,
      needsOptimization: totalTokens > optimizationThreshold, // 使用配置的阈值
    };
  }

  /**
   * 🆘 降级token估算方法
   */
  private fallbackTokenEstimation(messages: Message[]): number {
    let totalChars = 0;

    messages.forEach((message) => {
      if (message.content && typeof message.content === "string") {
        totalChars += message.content.length;
      }

      if (message.parts) {
        message.parts.forEach((part) => {
          if (part.type === "text" && part.text) {
            totalChars += part.text.length;
          } else if (part.type === "tool-invocation") {
            totalChars += 200; // 估算tool调用占用
            const { state } = part.toolInvocation;

            if (
              state === "result" &&
              part.toolInvocation.result.type === "image" &&
              part.toolInvocation.result.data
            ) {
              const imageKB =
                (part.toolInvocation.result.data.length * 3) / 4 / 1024;
              totalChars += imageKB * 60; // 粗略估算图片字符数
            }
          }
        });
      }
    });

    // 1 token ≈ 4 字符 (保守估算)
    return Math.ceil(totalChars / 4);
  }
}

export const analyzer = new TokenAnalyzer();
