import localforage from "localforage";
import type { StateStorage } from "zustand/middleware";

/**
 * 🔒 安全存储适配器
 * 使用 IndexedDB 存储敏感数据，比 localStorage 更安全
 */
class SecureStorage {
  private storage: LocalForage;

  constructor(storeName: string) {
    this.storage = localforage.createInstance({
      name: "ai-sdk-secure-storage",
      storeName: storeName,
      driver: [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE, // 后备方案
      ],
      description: "安全存储用户认证状态",
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = await this.storage.getItem<string>(key);
      return value;
    } catch (error) {
      console.error("[SECURE STORAGE] Error getting item:", error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.storage.setItem(key, value);
    } catch (error) {
      console.error("[SECURE STORAGE] Error setting item:", error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
    } catch (error) {
      console.error("[SECURE STORAGE] Error removing item:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear();
    } catch (error) {
      console.error("[SECURE STORAGE] Error clearing storage:", error);
      throw error;
    }
  }
}

/**
 * 🎯 创建用于 Zustand persist 的存储适配器
 */
export const createSecureStorage = (storeName: string): StateStorage => {
  const secureStorage = new SecureStorage(storeName);

  return {
    getItem: (name: string): string | null | Promise<string | null> => {
      return secureStorage.getItem(name);
    },
    setItem: (name: string, value: string): void | Promise<void> => {
      return secureStorage.setItem(name, value);
    },
    removeItem: (name: string): void | Promise<void> => {
      return secureStorage.removeItem(name);
    },
  };
};

/**
 * 🧹 清理旧的 localStorage 数据
 * 将现有的 localStorage 数据迁移到 IndexedDB 并清理
 */
export const migrateFromLocalStorage = async (
  localStorageKey: string,
  secureStorage: StateStorage
): Promise<void> => {
  try {
    // 检查 localStorage 中是否有旧数据
    const oldData = localStorage.getItem(localStorageKey);

    if (oldData) {
      console.log("[SECURE STORAGE] 发现旧的localStorage数据，开始迁移...");

      // 将数据迁移到安全存储
      await secureStorage.setItem(localStorageKey, oldData);

      // 清理 localStorage 中的敏感数据
      localStorage.removeItem(localStorageKey);

      console.log("[SECURE STORAGE] 数据迁移完成，localStorage已清理");
    }
  } catch (error) {
    console.error("[SECURE STORAGE] 数据迁移失败:", error);
  }
};
