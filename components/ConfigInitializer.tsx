"use client";

import { useConfigMigration } from "@/hooks/useConfigMigration";
import { useEffect } from "react";

/**
 * 🔧 配置初始化组件
 * 在应用启动时自动处理配置数据迁移
 */
export function ConfigInitializer() {
  const { isSuccess, isError, error } = useConfigMigration();

  useEffect(() => {
    if (isSuccess) {
      console.log("✅ 应用配置初始化完成");
    }

    if (isError && error) {
      console.error("❌ 应用配置初始化失败:", error);
    }
  }, [isSuccess, isError, error]);

  // 不渲染任何 UI，只处理配置逻辑
  return null;
}
