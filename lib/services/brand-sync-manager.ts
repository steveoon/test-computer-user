import { getAvailableBrands } from "@/lib/constants/organization-mapping";
import { configService } from "@/lib/services/config.service";
import { DulidaySyncService } from "@/lib/services/duliday-sync.service";
import { mergeAndSaveSyncData } from "@/lib/stores/sync-store";
import type { SyncResult } from "@/lib/services/duliday-sync.service";

/**
 * 品牌同步管理器
 * 确保 ORGANIZATION_MAPPING 中的所有品牌都被同步到本地
 */
export class BrandSyncManager {
  /**
   * 检查并同步缺失的品牌
   * @param dulidayToken Duliday API Token
   * @param forceSync 是否强制同步所有品牌
   * @returns 同步结果
   */
  static async syncMissingBrands(
    dulidayToken?: string,
    forceSync: boolean = false
  ): Promise<{
    syncedBrands: string[];
    failedBrands: string[];
    errors: Record<string, string>;
  }> {
    const syncedBrands: string[] = [];
    const failedBrands: string[] = [];
    const errors: Record<string, string> = {};

    try {
      // 获取当前配置
      const config = await configService.getConfig();
      const existingBrands = Object.keys(config?.brandData?.brands || {});

      // 获取所有映射的品牌
      const mappedBrands = getAvailableBrands();

      // 找出缺失的品牌
      const missingBrands = forceSync
        ? mappedBrands
        : mappedBrands.filter((brand) => !existingBrands.includes(brand.name));

      if (missingBrands.length === 0) {
        console.log("✅ 所有映射的品牌都已存在，无需同步");
        return { syncedBrands, failedBrands, errors };
      }

      console.log(
        `🔍 发现 ${missingBrands.length} 个${forceSync ? "" : "缺失的"}品牌需要同步:`,
        missingBrands.map((b) => b.name).join(", ")
      );

      // 获取 token
      const token = dulidayToken || localStorage.getItem("duliday_token") || process.env.DULIDAY_TOKEN;
      if (!token) {
        throw new Error("未找到 Duliday Token，请先配置 Token");
      }

      // 创建同步服务
      const syncService = new DulidaySyncService(token);

      // 同步每个缺失的品牌
      const syncResults: SyncResult[] = [];
      for (const brand of missingBrands) {
        try {
          console.log(`📥 正在同步品牌: ${brand.name} (ID: ${brand.id})`);
          const result = await syncService.syncOrganization(brand.id);

          if (result.success && result.convertedData) {
            syncResults.push(result);
            syncedBrands.push(brand.name);
            console.log(`✅ 成功同步品牌: ${brand.name}`);
          } else {
            failedBrands.push(brand.name);
            errors[brand.name] = result.errors.join(", ") || "同步失败";
            console.error(`❌ 同步品牌失败: ${brand.name}`, result.errors);
          }
        } catch (error) {
          failedBrands.push(brand.name);
          errors[brand.name] = error instanceof Error ? error.message : "未知错误";
          console.error(`❌ 同步品牌异常: ${brand.name}`, error);
        }
      }

      // 保存同步的数据
      if (syncResults.length > 0) {
        console.log(`💾 保存 ${syncResults.length} 个品牌的数据...`);
        await mergeAndSaveSyncData(syncResults);
        console.log("✅ 品牌数据保存成功");
      }

      return { syncedBrands, failedBrands, errors };
    } catch (error) {
      console.error("❌ 品牌同步管理器错误:", error);
      throw error;
    }
  }

  /**
   * 获取品牌同步状态
   * @returns 同步状态信息
   */
  static async getBrandSyncStatus(): Promise<{
    totalMapped: number;
    totalSynced: number;
    missingBrands: string[];
    syncedBrands: string[];
  }> {
    const config = await configService.getConfig();
    const existingBrands = Object.keys(config?.brandData?.brands || {});
    const mappedBrands = getAvailableBrands();

    const missingBrands = mappedBrands
      .filter((brand) => !existingBrands.includes(brand.name))
      .map((brand) => brand.name);

    const syncedBrands = mappedBrands
      .filter((brand) => existingBrands.includes(brand.name))
      .map((brand) => brand.name);

    return {
      totalMapped: mappedBrands.length,
      totalSynced: syncedBrands.length,
      missingBrands,
      syncedBrands,
    };
  }
}

// 导出便捷函数
export const syncMissingBrands = BrandSyncManager.syncMissingBrands;
export const getBrandSyncStatus = BrandSyncManager.getBrandSyncStatus;