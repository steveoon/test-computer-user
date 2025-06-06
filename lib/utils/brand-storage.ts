import localforage from "localforage";
import { BrandName, AVAILABLE_BRANDS } from "../contexts/brand-context";

// 💾 存储键值
const BRAND_STORAGE_KEY = "selected-brand";
const BRAND_HISTORY_KEY = "brand-history";

// 🔧 配置 localforage 实例
const brandStorage = localforage.createInstance({
  name: "ai-sdk-computer-use",
  storeName: "brand_preferences",
  description: "AI SDK Computer Use - 品牌偏好设置",
});

/**
 * 💾 保存当前选择的品牌
 * @param brand 品牌名称
 */
export async function saveBrandPreference(brand: BrandName): Promise<void> {
  try {
    await brandStorage.setItem(BRAND_STORAGE_KEY, brand);

    // 📊 同时保存到历史记录
    await saveBrandToHistory(brand);
  } catch (error) {
    console.warn("保存品牌偏好失败:", error);
    throw error;
  }
}

/**
 * 📖 读取保存的品牌偏好
 * @returns 保存的品牌名称，如果没有则返回 null
 */
export async function loadBrandPreference(): Promise<BrandName | null> {
  try {
    const savedBrand = await brandStorage.getItem<string>(BRAND_STORAGE_KEY);

    // ✅ 验证品牌是否仍然可用
    if (savedBrand && AVAILABLE_BRANDS.includes(savedBrand)) {
      return savedBrand as BrandName;
    }

    return null;
  } catch (error) {
    console.warn("读取品牌偏好失败:", error);
    return null;
  }
}

/**
 * 📊 保存品牌选择历史
 * @param brand 品牌名称
 */
async function saveBrandToHistory(brand: BrandName): Promise<void> {
  try {
    const history =
      (await brandStorage.getItem<string[]>(BRAND_HISTORY_KEY)) || [];

    // 🔄 去重并添加到历史记录头部
    const newHistory = [brand, ...history.filter((b) => b !== brand)].slice(
      0,
      10
    ); // 保留最近10次选择

    await brandStorage.setItem(BRAND_HISTORY_KEY, newHistory);
  } catch (error) {
    console.warn("保存品牌历史失败:", error);
  }
}

/**
 * 📊 获取品牌选择历史
 * @returns 品牌选择历史数组
 */
export async function getBrandHistory(): Promise<BrandName[]> {
  try {
    const history =
      (await brandStorage.getItem<string[]>(BRAND_HISTORY_KEY)) || [];

    // ✅ 过滤掉无效的品牌
    return history.filter((brand) =>
      AVAILABLE_BRANDS.includes(brand)
    ) as BrandName[];
  } catch (error) {
    console.warn("读取品牌历史失败:", error);
    return [];
  }
}

/**
 * 🗑️ 清除所有品牌偏好数据
 */
export async function clearBrandPreferences(): Promise<void> {
  try {
    await Promise.all([
      brandStorage.removeItem(BRAND_STORAGE_KEY),
      brandStorage.removeItem(BRAND_HISTORY_KEY),
    ]);
  } catch (error) {
    console.warn("清除品牌偏好失败:", error);
    throw error;
  }
}

/**
 * 📈 获取品牌偏好统计信息
 */
export async function getBrandStats(): Promise<{
  currentBrand: BrandName | null;
  historyCount: number;
  availableBrands: readonly string[];
}> {
  try {
    const [currentBrand, history] = await Promise.all([
      loadBrandPreference(),
      getBrandHistory(),
    ]);

    return {
      currentBrand,
      historyCount: history.length,
      availableBrands: AVAILABLE_BRANDS,
    };
  } catch (error) {
    console.warn("获取品牌统计失败:", error);
    return {
      currentBrand: null,
      historyCount: 0,
      availableBrands: AVAILABLE_BRANDS,
    };
  }
}
