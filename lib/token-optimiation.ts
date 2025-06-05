import type { Message, ToolInvocation } from "ai";
import { encodeTextServer, cleanupEncodingServer } from "./token-server";

// 🧠 智能Token分析器 v2.3 (服务端优化版)
export class TokenAnalyzer {
  /**
   * 🧹 清理资源
   */
  public async cleanup(): Promise<void> {
    try {
      await cleanupEncodingServer();
    } catch (error) {
      console.warn("⚠️ 清理服务端资源失败:", error);
    }
  }

  /**
   * 🔧 安全编码文本内容 (使用服务端)
   */
  private async safeEncode(text: string): Promise<number> {
    try {
      return await encodeTextServer(text);
    } catch (error) {
      console.warn("⚠️ 服务端编码失败，使用本地估算:", error);
      // 降级估算: 1 token ≈ 4 字符
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * 🛠️ 精确计算工具调用的Token消耗
   */
  private async calculateToolInvocationTokens(
    toolInvocation: ToolInvocation
  ): Promise<{
    tokens: number;
    imageTokens: number;
  }> {
    let tokens = 0;
    let imageTokens = 0;

    try {
      // 1. 🏷️ 工具名称 tokens
      if (toolInvocation.toolName) {
        tokens += await this.safeEncode(toolInvocation.toolName);
      }

      // 2. 📝 工具参数 tokens
      if (toolInvocation.args) {
        try {
          const argsString = JSON.stringify(toolInvocation.args);
          tokens += await this.safeEncode(argsString);
        } catch (error) {
          console.warn("⚠️ 序列化工具参数失败:", error);
          // 降级估算: 假设args占用约20个token
          tokens += 20;
        }
      }

      // 3. 📊 工具调用ID和状态的结构开销
      tokens += 10; // 固定开销：tool_call_id, state等字段

      // 4. 🎯 工具结果 tokens (最重要的部分)
      if (toolInvocation.state === "result" && toolInvocation.result) {
        const result = toolInvocation.result;

        if (typeof result === "string") {
          // 简单字符串结果 (如bash命令输出)
          tokens += await this.safeEncode(result);
        } else if (result && typeof result === "object") {
          // 结构化结果对象
          if (result.type === "image" && result.data) {
            // 🖼️ 图片结果处理
            const base64Data = result.data as string;
            const imageKB = (base64Data.length * 3) / 4 / 1024;
            const imageTokens_calc = Math.round(imageKB * 15); // 约15 tokens per KB

            imageTokens += imageTokens_calc;
            tokens += imageTokens_calc;

            // 图片元数据的少量token开销
            tokens += 5;
          } else if (result.type === "text" && result.data) {
            // 📝 文本结果处理
            tokens += await this.safeEncode(result.data);
            tokens += 3; // type字段等结构开销
          } else {
            // 其他类型的结构化结果
            try {
              const resultString = JSON.stringify(result);
              tokens += await this.safeEncode(resultString);
            } catch (error) {
              console.warn("⚠️ 序列化工具结果失败:", error);
              tokens += 50; // 降级估算
            }
          }
        }
      } else if (toolInvocation.state === "call") {
        // 工具调用请求阶段(还没有结果)
        tokens += 2; // state字段开销
      }
    } catch (error) {
      console.warn("⚠️ 计算工具调用token失败:", error);
      // 降级到改进的固定估算
      tokens = 80; // 比原来的50稍高，考虑到实际情况
    }

    return { tokens, imageTokens };
  }

  /**
   * 📊 估算消息的Token使用情况 (服务端版本)
   */
  async estimateMessageTokens(
    messages: Message[],
    optimizationThreshold: number = 80000
  ): Promise<{
    totalTokens: number;
    needsOptimization: boolean;
    imageTokens: number;
    breakdown?: {
      textTokens: number;
      toolTokens: number;
      imageTokens: number;
    };
  }> {
    let totalTokens = 0;
    let imageTokens = 0;
    let textTokens = 0;
    let toolTokens = 0;

    try {
      for (const message of messages) {
        // 📝 基础文本内容
        if (message.content && typeof message.content === "string") {
          const tokens = await this.safeEncode(message.content);
          textTokens += tokens;
          totalTokens += tokens;
        }

        // 🔍 分析parts中的内容
        if (message.parts) {
          for (const part of message.parts) {
            if (part.type === "text" && part.text) {
              const tokens = await this.safeEncode(part.text);
              textTokens += tokens;
              totalTokens += tokens;
            } else if (part.type === "tool-invocation") {
              // 🛠️ 精确计算工具调用tokens
              const toolResult = await this.calculateToolInvocationTokens(
                part.toolInvocation
              );

              toolTokens += toolResult.tokens;
              totalTokens += toolResult.tokens;

              if (toolResult.imageTokens > 0) {
                imageTokens += toolResult.imageTokens;
                // 注意：imageTokens已经包含在toolResult.tokens中，不要重复计算
              }
            } else if (part.type === "step-start") {
              // step-start标记的小开销
              totalTokens += 2;
              textTokens += 2;
            }
          }
        }

        // 🏷️ 消息角色和元数据的开销
        totalTokens += 5; // role字段等基础结构
      }
    } catch (error) {
      console.error("🚨 Token分析失败:", error);
      // 降级到改进的简单估算
      const estimatedTokens = this.fallbackTokenEstimation(messages);
      return {
        totalTokens: estimatedTokens,
        imageTokens: Math.round(estimatedTokens * 0.3), // 假设30%是图片
        needsOptimization: estimatedTokens > optimizationThreshold,
        breakdown: {
          textTokens: Math.round(estimatedTokens * 0.5),
          toolTokens: Math.round(estimatedTokens * 0.2),
          imageTokens: Math.round(estimatedTokens * 0.3),
        },
      };
    }

    return {
      totalTokens,
      imageTokens,
      needsOptimization: totalTokens > optimizationThreshold,
      breakdown: {
        textTokens,
        toolTokens,
        imageTokens,
      },
    };
  }

  /**
   * 🆘 降级token估算方法 (改进版)
   */
  private fallbackTokenEstimation(messages: Message[]): number {
    let totalChars = 0;

    messages.forEach((message) => {
      // 基础内容
      if (message.content && typeof message.content === "string") {
        totalChars += message.content.length;
      }

      if (message.parts) {
        message.parts.forEach((part) => {
          if (part.type === "text" && part.text) {
            totalChars += part.text.length;
          } else if (part.type === "tool-invocation") {
            // 改进的工具调用估算
            let toolChars = 50; // 基础结构

            // 工具名称
            if (part.toolInvocation.toolName) {
              toolChars += part.toolInvocation.toolName.length;
            }

            // 工具参数
            if (part.toolInvocation.args) {
              try {
                toolChars += JSON.stringify(part.toolInvocation.args).length;
              } catch {
                toolChars += 100; // 估算
              }
            }

            // 工具结果
            if (
              part.toolInvocation.state === "result" &&
              part.toolInvocation.result
            ) {
              const result = part.toolInvocation.result;
              if (typeof result === "string") {
                toolChars += result.length;
              } else if (result && typeof result === "object") {
                if (result.type === "image" && result.data) {
                  const imageKB = (result.data.length * 3) / 4 / 1024;
                  toolChars += imageKB * 60; // 粗略估算图片字符数
                } else if (result.type === "text" && result.data) {
                  toolChars += result.data.length;
                } else {
                  try {
                    toolChars += JSON.stringify(result).length;
                  } catch {
                    toolChars += 200; // 估算
                  }
                }
              }
            }

            totalChars += toolChars;
          }
        });
      }
    });

    // 1 token ≈ 4 字符 (保守估算)
    return Math.ceil(totalChars / 4);
  }
}

export const analyzer = new TokenAnalyzer();
