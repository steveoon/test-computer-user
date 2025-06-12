/**
 * 🌍 环境检测和配置工具
 * 用于识别运行环境并提供相应的限制配置
 */

export interface EnvironmentLimits {
  maxMessageCount: number;
  maxSizeMB: number;
  warningMessageCount: number;
  warningSizeMB: number;
  autoCleanThreshold: number;
  compressionTargetKB: number;
  compressionMaxKB: number;
}

/**
 * 检测当前运行环境
 */
export const detectEnvironment = () => {
  /* 服务端检测 */
  if (typeof process !== "undefined") {
    if (
      process.env.VERCEL_ENV ||
      process.env.VERCEL_TARGET_ENV ||
      process.env.VERCEL
    ) {
      return "vercel";
    }
  }

  /* 浏览器端检测（公开变量） */
  if (typeof process !== "undefined") {
    if (
      process.env.NEXT_PUBLIC_VERCEL_ENV ||
      process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV
    ) {
      return "vercel";
    }
  }

  /* 本地开发 */
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host.startsWith("127.")) return "local";
  }

  return "unknown";
};

/**
 * 根据环境获取相应的限制配置
 */
export const getEnvironmentLimits = (): EnvironmentLimits => {
  const env = detectEnvironment();

  switch (env) {
    case "vercel":
      return {
        maxMessageCount: 25, // Vercel 严格限制
        maxSizeMB: 3, // Vercel 请求大小限制
        warningMessageCount: 12, // 早期警告
        warningSizeMB: 1.5, // 早期警告
        autoCleanThreshold: 40, // 自动清理阈值
        compressionTargetKB: 120, // 图片压缩目标
        compressionMaxKB: 150, // 图片压缩上限
      };

    case "local":
      return {
        maxMessageCount: 80, // 本地环境较宽松
        maxSizeMB: 8, // 本地环境较宽松
        warningMessageCount: 50, // 本地环境较宽松
        warningSizeMB: 5, // 本地环境较宽松
        autoCleanThreshold: 100, // 本地环境较宽松
        compressionTargetKB: 200, // 本地环境较宽松
        compressionMaxKB: 250, // 本地环境较宽松
      };

    default:
      // 未知环境使用保守设置
      return {
        maxMessageCount: 30,
        maxSizeMB: 4,
        warningMessageCount: 20,
        warningSizeMB: 2,
        autoCleanThreshold: 50,
        compressionTargetKB: 150,
        compressionMaxKB: 200,
      };
  }
};

/**
 * 获取环境描述信息
 */
export const getEnvironmentInfo = () => {
  const env = detectEnvironment();
  const limits = getEnvironmentLimits();

  return {
    environment: env,
    limits,
    description: {
      vercel: "Vercel 部署环境 - 严格的请求大小限制",
      local: "本地开发环境 - 较宽松的限制",
      unknown: "未知环境 - 使用保守设置",
    }[env],
  };
};
