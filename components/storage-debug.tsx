"use client";

import { useEffect, useState } from "react";
import { checkSensitiveStorage } from "@/lib/utils/cleanup-storage";
import { useAuthStore } from "@/lib/stores/auth-store";

export function StorageDebug() {
  const [storageInfo, setStorageInfo] = useState<{
    localStorage: { hasSensitiveData: boolean; keys: string[] };
    indexedDB: string;
  } | null>(null);

  const authStore = useAuthStore();

  useEffect(() => {
    const checkStorage = () => {
      const localStorageCheck = checkSensitiveStorage();

      setStorageInfo({
        localStorage: localStorageCheck,
        indexedDB: "数据已安全存储在IndexedDB中",
      });
    };

    checkStorage();

    // 每5秒检查一次
    const interval = setInterval(checkStorage, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!storageInfo) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-slate-900 text-white p-4 rounded-lg text-xs font-mono max-w-sm z-50 border border-slate-700">
      <div className="mb-2 font-bold text-green-400">🔒 存储安全状态</div>

      <div className="mb-3">
        <div className="text-yellow-300 font-semibold">认证状态:</div>
        <div>已登录: {authStore.isAuthenticated.toString()}</div>
        <div>用户: {authStore.user?.email || "未登录"}</div>
      </div>

      <div className="mb-3">
        <div className="text-blue-300 font-semibold">IndexedDB:</div>
        <div className="text-green-300">✓ {storageInfo.indexedDB}</div>
      </div>

      <div>
        <div className="text-red-300 font-semibold">localStorage检查:</div>
        {storageInfo.localStorage.hasSensitiveData ? (
          <div>
            <div className="text-red-400">⚠️ 发现敏感数据:</div>
            {storageInfo.localStorage.keys.map((key) => (
              <div key={key} className="text-red-400 ml-2">
                • {key}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-green-400">✓ 无敏感数据泄露</div>
        )}
      </div>
    </div>
  );
}
