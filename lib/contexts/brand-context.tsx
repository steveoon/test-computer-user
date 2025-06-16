"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getBrandData } from "../services/config.service";
import {
  saveBrandPreference,
  loadBrandPreference,
} from "../utils/brand-storage";
import type { ZhipinData } from "../../types/config";

// 🔧 品牌上下文类型定义
interface BrandContextType {
  currentBrand: string;
  setCurrentBrand: (brand: string) => void;
  availableBrands: readonly string[];
  brandData: ZhipinData | null;
  isLoaded: boolean;
  isConfigLoaded: boolean;
}

// 🎨 创建上下文
const BrandContext = createContext<BrandContextType | undefined>(undefined);

// 🏗️ 品牌提供者组件
interface BrandProviderProps {
  children: ReactNode;
}

export function BrandProvider({ children }: BrandProviderProps) {
  const [brandData, setBrandData] = useState<ZhipinData | null>(null);
  const [currentBrand, setCurrentBrand] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // 🔄 从配置服务加载品牌数据
  useEffect(() => {
    const loadConfigData = async () => {
      try {
        console.log("🔄 品牌上下文：开始加载配置数据...");

        const configData = await getBrandData();

        if (configData) {
          setBrandData(configData);

          // 设置默认品牌
          const defaultBrand =
            configData.defaultBrand || Object.keys(configData.brands)[0] || "";
          setCurrentBrand(defaultBrand);

          console.log("✅ 品牌上下文：配置数据加载成功", {
            brands: Object.keys(configData.brands),
            defaultBrand,
            stores: configData.stores.length,
          });
        } else {
          console.warn("⚠️ 品牌上下文：未找到配置数据");
        }
      } catch (error) {
        console.error("❌ 品牌上下文：配置数据加载失败:", error);
      } finally {
        setIsConfigLoaded(true);
      }
    };

    loadConfigData();
  }, []);

  // 🔄 从本地存储读取品牌选择（在配置数据加载后）
  useEffect(() => {
    if (!isConfigLoaded || !brandData) return;

    const loadSavedBrand = async () => {
      try {
        const savedBrand = await loadBrandPreference();

        // 验证保存的品牌是否在可用品牌列表中
        if (savedBrand && brandData.brands[savedBrand]) {
          setCurrentBrand(savedBrand);
          console.log("✅ 品牌上下文：已恢复保存的品牌选择:", savedBrand);
        }
      } catch (error) {
        console.warn("品牌上下文：读取保存的品牌选择失败:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSavedBrand();
  }, [isConfigLoaded, brandData]);

  // 💾 品牌切换时保存到本地存储
  const handleSetCurrentBrand = async (brand: string) => {
    // 验证品牌是否存在
    if (!brandData || !brandData.brands[brand]) {
      console.warn("品牌上下文：尝试设置不存在的品牌:", brand);
      return;
    }

    setCurrentBrand(brand);
    try {
      await saveBrandPreference(brand);
      console.log("✅ 品牌上下文：品牌选择已保存:", brand);
    } catch (error) {
      console.warn("品牌上下文：保存品牌选择失败:", error);
    }
  };

  const availableBrands = brandData ? Object.keys(brandData.brands) : [];

  const value: BrandContextType = {
    currentBrand,
    setCurrentBrand: handleSetCurrentBrand,
    availableBrands,
    brandData,
    isLoaded,
    isConfigLoaded,
  };

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

// 🎯 Hook：使用品牌上下文
export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}

// 🔧 Hook：获取当前品牌的数据
export function useCurrentBrandData() {
  const { currentBrand, brandData } = useBrand();

  if (!brandData) {
    return {
      brandName: currentBrand,
      brandData: null,
      storesForBrand: [],
    };
  }

  return {
    brandName: currentBrand,
    brandData: brandData.brands[currentBrand] || null,
    storesForBrand: brandData.stores.filter(
      (store) => store.brand === currentBrand
    ),
  };
}

// 🎯 动态导出可用品牌列表（向后兼容）
export function getAvailableBrands(): string[] {
  // 这个函数现在只是一个占位符，实际的品牌列表通过 useBrand Hook 获取
  console.warn(
    "getAvailableBrands 已废弃，请使用 useBrand Hook 的 availableBrands 属性"
  );
  return [];
}
