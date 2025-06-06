"use server";

import { Sandbox } from "@e2b/desktop";
import { resolution } from "./tool";

// 扩展E2B Sandbox类型定义
interface SandboxWithExtensions extends E2BDesktop {
  pause?: () => Promise<string>;
}

interface SandboxConstructor {
  create: (options: {
    resolution: [number, number];
    timeoutMs: number;
  }) => Promise<SandboxWithExtensions>;
  connect: (id: string) => Promise<SandboxWithExtensions>;
  resume?: (id: string) => Promise<SandboxWithExtensions>;
}

// E2B Desktop 基本类型定义
export interface E2BDesktop {
  screenshot: () => Promise<Buffer>;
  moveMouse: (x: number, y: number) => Promise<void>;
  leftClick: () => Promise<void>;
  rightClick: () => Promise<void>;
  doubleClick: () => Promise<void>;
  // 可选的鼠标方法（某些E2B版本可能不支持）
  middleClick?: () => Promise<void>;
  mouseDown?: () => Promise<void>;
  mouseUp?: () => Promise<void>;
  press: (key: string) => Promise<void>;
  write: (text: string) => Promise<void>;
  scroll: (
    direction: "up" | "down" | "left" | "right",
    amount: number
  ) => Promise<void>;
  drag: (start: [number, number], end: [number, number]) => Promise<void>;
  commands: {
    run: (
      command: string,
      options?: { timeoutMs?: number }
    ) => Promise<{
      stdout?: string;
      stderr?: string;
      exitCode: number;
    }>;
  };
  launch: (appName: string) => Promise<void>;
  sandboxId: string;
  isRunning: () => Promise<boolean>;
  kill: () => Promise<void>;
  stream: {
    url: string;
    getUrl: () => string;
    start: () => Promise<void>;
  };
}

// 沙盒持久化相关函数 - 使用beta版本API
export const pauseDesktop = async (desktop: E2BDesktop) => {
  try {
    // 检查pause方法是否存在
    const extendedDesktop = desktop as unknown as SandboxWithExtensions;
    if (typeof extendedDesktop.pause !== "function") {
      throw new Error(
        "Pause method not available in current @e2b/desktop version"
      );
    }

    const sandboxId = await extendedDesktop.pause();
    console.log("Sandbox paused with ID:", sandboxId);
    return sandboxId;
  } catch (error) {
    console.error("Error pausing desktop:", error);
    throw error;
  }
};

export const resumeDesktop = async (sandboxId: string) => {
  try {
    // 检查resume方法是否存在
    const sandboxConstructor = Sandbox as unknown as SandboxConstructor;
    if (typeof sandboxConstructor.resume !== "function") {
      throw new Error(
        "Resume method not available in current @e2b/desktop version"
      );
    }

    const desktop = await sandboxConstructor.resume(sandboxId);
    console.log("Sandbox resumed with ID:", desktop.sandboxId);
    await desktop.stream.start();
    return desktop;
  } catch (error) {
    console.error("Error resuming desktop:", error);
    throw error;
  }
};

export const getDesktop = async (sandboxId?: string): Promise<E2BDesktop> => {
  try {
    if (sandboxId) {
      // 首先尝试连接到现有的沙盒
      try {
        const connected = await (
          Sandbox as unknown as SandboxConstructor
        ).connect(sandboxId);
        const isRunning = await connected.isRunning();
        if (isRunning) {
          console.log("Connected to existing running sandbox:", sandboxId);
          return connected;
        } else {
          console.log("Sandbox not running, attempting to resume...");

          // 尝试恢复暂停的沙盒
          try {
            const resumed = await resumeDesktop(sandboxId);
            console.log("Successfully resumed sandbox:", sandboxId);
            return resumed;
          } catch (resumeError) {
            console.log(
              "Failed to resume sandbox, creating new one:",
              resumeError
            );
          }
        }
      } catch (connectError) {
        console.log(
          "Failed to connect to sandbox, creating new one:",
          connectError
        );
      }
    }

    // 创建新的沙盒
    const desktop = await (Sandbox as unknown as SandboxConstructor).create({
      resolution: [resolution.x, resolution.y],
      timeoutMs: 3600000, // 延长到1小时 (3600000毫秒)
    });
    await desktop.stream.start();

    console.log("Created new sandbox with ID:", desktop.sandboxId);
    return desktop;
  } catch (error) {
    console.error("Error in getDesktop:", error);
    // 添加重试逻辑或更详细的错误信息
    if (error instanceof Error && error.message.includes("cache key")) {
      console.error("Cache key generation failed - check E2B API key");
    }
    throw error;
  }
};

export const getDesktopURL = async (id?: string) => {
  try {
    const desktop = await getDesktop(id);
    const streamUrl = desktop.stream.getUrl();

    return { streamUrl, id: desktop.sandboxId };
  } catch (error) {
    console.error("Error in getDesktopURL:", error);
    throw error;
  }
};

export const killDesktop = async (id: string = "desktop") => {
  try {
    const desktop = await getDesktop(id);
    await desktop.kill();
    console.log("Desktop killed successfully:", id);
  } catch (error) {
    console.error("Error killing desktop:", error);
    throw error;
  }
};

// 检查沙盒状态的工具函数
export const checkSandboxStatus = async (id: string) => {
  try {
    const connected = await (Sandbox as unknown as SandboxConstructor).connect(
      id
    );
    const isRunning = await connected.isRunning();
    return { isRunning, sandboxId: id };
  } catch (error) {
    console.error("Error checking sandbox status:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { isRunning: false, sandboxId: id, error: errorMessage };
  }
};

// 为诊断操作添加超时保护
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]);
};
