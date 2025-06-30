import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SyncRecord, saveSyncRecord, getSyncHistory } from '@/lib/services/duliday-sync.service';
import { configService, getBrandData } from '@/lib/services/config.service';
import { ZhipinData } from '@/types/zhipin';
import { getAvailableBrands } from '@/lib/constants/organization-mapping';
import { toast } from 'sonner';

/**
 * 同步状态接口
 */
interface SyncState {
  // 同步状态
  isSyncing: boolean;
  currentStep: string;
  overallProgress: number;
  currentOrganization: number;
  
  // 选中的品牌
  selectedBrands: number[];
  
  // 同步历史
  syncHistory: SyncRecord[];
  
  // 当前同步结果
  currentSyncResult: SyncRecord | null;
  
  // 错误状态
  error: string | null;
  
  // Actions
  setSelectedBrands: (brands: number[]) => void;
  toggleBrand: (brandId: number) => void;
  selectAllBrands: () => void;
  clearSelectedBrands: () => void;
  
  startSync: () => Promise<void>;
  updateProgress: (progress: number, currentOrg: number, message: string) => void;
  setSyncResult: (result: SyncRecord) => void;
  
  loadSyncHistory: () => void;
  clearHistory: () => void;
  
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * 同步状态管理 Store
 */
export const useSyncStore = create<SyncState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      isSyncing: false,
      currentStep: '',
      overallProgress: 0,
      currentOrganization: 0,
      selectedBrands: [],
      syncHistory: [],
      currentSyncResult: null,
      error: null,

      // 品牌选择相关操作
      setSelectedBrands: (brands) => {
        set({ selectedBrands: brands });
      },

      toggleBrand: (brandId) => {
        const { selectedBrands } = get();
        const newSelectedBrands = selectedBrands.includes(brandId)
          ? selectedBrands.filter(id => id !== brandId)
          : [...selectedBrands, brandId];
        set({ selectedBrands: newSelectedBrands });
      },

      selectAllBrands: () => {
        const allBrands = getAvailableBrands().map(brand => brand.id);
        set({ selectedBrands: allBrands });
      },

      clearSelectedBrands: () => {
        set({ selectedBrands: [] });
      },

      // 同步操作
      startSync: async () => {
        const { selectedBrands } = get();
        
        if (selectedBrands.length === 0) {
          set({ error: '请至少选择一个品牌进行同步' });
          toast.error('请至少选择一个品牌进行同步');
          return;
        }

        set({ 
          isSyncing: true, 
          error: null, 
          overallProgress: 0, 
          currentStep: '准备开始同步...',
          currentSyncResult: null 
        });

        try {
          // 验证 API 配置
          set({ currentStep: '验证 Duliday Token...' });
          const configResponse = await fetch('/api/sync');
          const configData = await configResponse.json();
          
          if (!configData.configured || !configData.tokenValid) {
            throw new Error('Duliday Token 配置无效，请检查环境变量');
          }

          toast.info('开始数据同步...', {
            description: `将同步 ${selectedBrands.length} 个品牌的数据`,
          });

          set({ currentStep: '正在同步数据...', overallProgress: 10 });

          // 调用 API 端点进行同步
          const syncResponse = await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              organizationIds: selectedBrands,
            }),
          });

          if (!syncResponse.ok) {
            const errorData = await syncResponse.json();
            throw new Error(errorData.error || '同步请求失败');
          }

          const { data: result } = await syncResponse.json();

          // 处理转换后的数据并保存到本地配置
          set({ currentStep: '正在保存数据到本地...', overallProgress: 90 });
          
          try {
            await mergeAndSaveSyncData(result.results);
          } catch (saveError) {
            console.warn('数据保存失败，但同步已完成:', saveError);
            // 即使保存失败，也不影响同步的成功状态
          }

          // 保存同步记录
          saveSyncRecord(result);
          
          set({ 
            currentSyncResult: result,
            isSyncing: false,
            currentStep: '同步完成',
            overallProgress: 100 
          });

          // 刷新历史记录
          get().loadSyncHistory();

          // 显示结果通知
          if (result.overallSuccess) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalStores = result.results.reduce((sum: number, r: any) => sum + r.storeCount, 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalRecords = result.results.reduce((sum: number, r: any) => sum + r.processedRecords, 0);
            
            toast.success('数据同步成功！', {
              description: `共同步 ${totalRecords} 条记录，${totalStores} 家门店`,
            });
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const failedBrands = result.results.filter((r: any) => !r.success).length;
            toast.warning('数据同步部分成功', {
              description: `${failedBrands} 个品牌同步失败，请查看详细信息`,
            });
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '同步过程中发生未知错误';
          
          set({ 
            error: errorMessage,
            isSyncing: false,
            currentStep: '同步失败',
          });

          toast.error('数据同步失败', {
            description: errorMessage,
          });
        }
      },

      updateProgress: (progress, currentOrg, message) => {
        set({ 
          overallProgress: progress, 
          currentOrganization: currentOrg,
          currentStep: message 
        });
      },

      setSyncResult: (result) => {
        set({ currentSyncResult: result });
      },

      // 历史记录操作
      loadSyncHistory: () => {
        const history = getSyncHistory();
        set({ syncHistory: history });
      },

      clearHistory: () => {
        try {
          // Dynamic import to avoid require()
          import('@/lib/services/duliday-sync.service').then(({ clearSyncHistory }) => {
            clearSyncHistory();
            set({ syncHistory: [] });
            toast.success('同步历史已清除');
          });
        } catch {
          toast.error('清除历史记录失败');
        }
      },

      // 错误处理
      setError: (error) => {
        set({ error });
      },

      // 重置状态
      reset: () => {
        set({
          isSyncing: false,
          currentStep: '',
          overallProgress: 0,
          currentOrganization: 0,
          currentSyncResult: null,
          error: null,
        });
      },
    }),
    {
      name: 'sync-store',
    }
  )
);

/**
 * 格式化同步持续时间
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}

/**
 * 获取同步状态文本
 */
export function getSyncStatusText(isSuccess: boolean): string {
  return isSuccess ? '成功' : '失败';
}

/**
 * 获取同步状态颜色
 */
export function getSyncStatusColor(isSuccess: boolean): string {
  return isSuccess ? 'text-green-600' : 'text-red-600';
}

/**
 * 合并并保存同步数据到本地配置
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mergeAndSaveSyncData(syncResults: any[]): Promise<void> {
  // 获取现有配置
  const existingData = await getBrandData();
  
  // 合并所有同步结果的数据
  const allConvertedData: Partial<ZhipinData>[] = syncResults
    .filter(result => result.success && result.convertedData)
    .map(result => result.convertedData);
  
  if (allConvertedData.length === 0) {
    console.log('没有需要保存的转换数据');
    return;
  }
  
  // 合并数据
  const mergedStores = [...(existingData?.stores || [])];
  const mergedBrands = { ...(existingData?.brands || {}) };
  let mergedCity = existingData?.city || "上海市";
  let mergedDefaultBrand = existingData?.defaultBrand;
  
  // 合并每个同步结果的数据
  for (const data of allConvertedData) {
    // 合并城市（使用第一个非空的）
    if (data.city && !mergedCity) {
      mergedCity = data.city;
    }
    
    // 合并默认品牌（使用第一个非空的）
    if (data.defaultBrand && !mergedDefaultBrand) {
      mergedDefaultBrand = data.defaultBrand;
    }
    
    // 合并品牌
    Object.assign(mergedBrands, data.brands || {});
    
    // 合并门店（去重）
    if (data.stores) {
      for (const newStore of data.stores) {
        const existingIndex = mergedStores.findIndex(store => store.id === newStore.id);
        if (existingIndex >= 0) {
          // 更新现有门店
          mergedStores[existingIndex] = newStore;
        } else {
          // 添加新门店
          mergedStores.push(newStore);
        }
      }
    }
  }
  
  // 构建最终数据
  const finalData: ZhipinData = {
    city: mergedCity,
    stores: mergedStores,
    brands: mergedBrands,
    defaultBrand: mergedDefaultBrand,
  };
  
  // 保存到配置
  await configService.updateBrandData(finalData);
  console.log(`✅ 已保存 ${mergedStores.length} 个门店，${Object.keys(mergedBrands).length} 个品牌`);
}