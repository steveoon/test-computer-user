"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { zhipinData } from "../data/sample-data";
import {
  saveBrandPreference,
  loadBrandPreference,
} from "../utils/brand-storage";

// 🎯 可用的品牌列表
export const AVAILABLE_BRANDS = Object.keys(zhipinData.brands);
export type BrandName = keyof typeof zhipinData.brands;

// 🔧 品牌上下文类型定义
interface BrandContextType {
  currentBrand: BrandName;
  setCurrentBrand: (brand: BrandName) => void;
  availableBrands: readonly string[];
  isLoaded: boolean;
}

// 🎨 创建上下文
const BrandContext = createContext<BrandContextType | undefined>(undefined);

// 🏗️ 品牌提供者组件
interface BrandProviderProps {
  children: ReactNode;
}

export function BrandProvider({ children }: BrandProviderProps) {
  // 💡 使用原始默认品牌作为初始值
  const [currentBrand, setCurrentBrand] = useState<BrandName>(
    zhipinData.defaultBrand as BrandName
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // 🔄 从本地存储读取品牌选择
  useEffect(() => {
    const loadSavedBrand = async () => {
      try {
        const savedBrand = await loadBrandPreference();
        if (savedBrand) {
          setCurrentBrand(savedBrand);
        }
      } catch (error) {
        console.warn("读取保存的品牌选择失败:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSavedBrand();
  }, []);

  // 💾 品牌切换时保存到本地存储
  const handleSetCurrentBrand = async (brand: BrandName) => {
    setCurrentBrand(brand);
    try {
      await saveBrandPreference(brand);
    } catch (error) {
      console.warn("保存品牌选择失败:", error);
    }
  };

  const value: BrandContextType = {
    currentBrand,
    setCurrentBrand: handleSetCurrentBrand,
    availableBrands: AVAILABLE_BRANDS,
    isLoaded,
  };

  // 🔄 在加载完成前显示默认品牌（避免闪烁）
  if (!isLoaded) {
    return (
      <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
    );
  }

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
  const { currentBrand } = useBrand();
  return {
    brandName: currentBrand,
    brandData: zhipinData.brands[currentBrand],
    storesForBrand: zhipinData.stores.filter(
      (store) => store.brand === currentBrand
    ),
  };
}
