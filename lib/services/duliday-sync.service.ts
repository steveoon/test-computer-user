import { DulidayRaw, ZhipinData } from "@/types/zhipin";
import { convertDulidayListToZhipinData } from "@/lib/mappers/duliday-to-zhipin.mapper";
// 注意：服务器端不使用 configService，数据保存逻辑在客户端处理

/**
 * Duliday API 端点配置
 */
const DULIDAY_API_BASE = "https://k8s.duliday.com/persistence/a";
const DULIDAY_LIST_ENDPOINT = `${DULIDAY_API_BASE}/job-requirement/hiring/list`;

/**
 * 同步结果接口
 */
export interface SyncResult {
  success: boolean;
  totalRecords: number;
  processedRecords: number;
  storeCount: number;
  brandName: string;
  errors: string[];
  duration: number;
  convertedData?: Partial<ZhipinData>; // 可选：转换后的数据
}

/**
 * 同步历史记录接口
 */
export interface SyncRecord {
  id: string;
  timestamp: string;
  organizationIds: number[];
  results: SyncResult[];
  totalDuration: number;
  overallSuccess: boolean;
}

/**
 * 数据同步服务类
 */
export class DulidaySyncService {
  private dulidayToken: string;

  constructor(token?: string) {
    this.dulidayToken = token || process.env.DULIDAY_TOKEN || "";
    if (!this.dulidayToken) {
      throw new Error("DULIDAY_TOKEN is required for data synchronization");
    }
  }

  /**
   * 从 Duliday API 获取岗位列表
   */
  async fetchJobList(
    organizationIds: number[],
    pageSize: number = 100
  ): Promise<DulidayRaw.ListResponse> {
    const requestBody = {
      organizationIds,
      pageNum: 0,
      pageSize,
      listOrderBy: 0,
      supportSupplier: null,
    };

    try {
      const response = await fetch(DULIDAY_LIST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Duliday-Token": this.dulidayToken,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // 使用 Zod 验证响应数据格式
      try {
        return DulidayRaw.ListResponseSchema.parse(data);
      } catch (validationError) {
        console.error("API response validation failed:", validationError);
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("Failed to fetch job list from Duliday API:", error);
      throw error;
    }
  }

  /**
   * 同步单个组织的数据（仅获取和转换，不保存）
   */
  async syncOrganization(
    organizationId: number,
    onProgress?: (progress: number, message: string) => void
  ): Promise<SyncResult & { convertedData?: Partial<ZhipinData> }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      onProgress?.(
        10,
        `正在从 Duliday API 获取组织 ${organizationId} 的数据...`
      );

      // 获取数据
      const dulidayResponse = await this.fetchJobList([organizationId]);

      onProgress?.(
        50,
        `获取到 ${dulidayResponse.data.total} 条记录，正在转换数据格式...`
      );

      // 转换数据格式
      const zhipinData = convertDulidayListToZhipinData(
        dulidayResponse,
        organizationId
      );

      onProgress?.(100, `数据转换完成！`);

      const duration = Date.now() - startTime;
      const brandName = Object.keys(zhipinData.brands || {})[0] || "未知品牌";

      return {
        success: true,
        totalRecords: dulidayResponse.data.total,
        processedRecords: dulidayResponse.data.result.length,
        storeCount: zhipinData.stores?.length || 0,
        brandName,
        errors,
        duration,
        convertedData: zhipinData, // 返回转换后的数据，但不保存
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);

      const duration = Date.now() - startTime;

      return {
        success: false,
        totalRecords: 0,
        processedRecords: 0,
        storeCount: 0,
        brandName: "同步失败",
        errors,
        duration,
      };
    }
  }

  /**
   * 同步多个组织的数据
   */
  async syncMultipleOrganizations(
    organizationIds: number[],
    onProgress?: (
      overallProgress: number,
      currentOrg: number,
      message: string
    ) => void
  ): Promise<SyncRecord> {
    const startTime = Date.now();
    const syncId = `sync_${Date.now()}`;
    const results: SyncResult[] = [];

    for (let i = 0; i < organizationIds.length; i++) {
      const orgId = organizationIds[i];
      const orgProgress = Math.floor((i / organizationIds.length) * 100);

      onProgress?.(orgProgress, orgId, `开始同步组织 ${orgId}...`);

      try {
        const result = await this.syncOrganization(
          orgId,
          (progress, message) => {
            const currentOrgProgress = Math.floor(
              (i / organizationIds.length) * 100 +
                progress / organizationIds.length
            );
            onProgress?.(currentOrgProgress, orgId, message);
          }
        );

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          totalRecords: 0,
          processedRecords: 0,
          storeCount: 0,
          brandName: `组织 ${orgId}`,
          errors: [error instanceof Error ? error.message : String(error)],
          duration: 0,
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    const overallSuccess = results.every((r) => r.success);

    onProgress?.(100, 0, `所有同步任务完成！`);

    return {
      id: syncId,
      timestamp: new Date().toISOString(),
      organizationIds,
      results,
      totalDuration,
      overallSuccess,
    };
  }

  /**
   * 验证 Duliday Token 是否有效
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(DULIDAY_LIST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Duliday-Token": this.dulidayToken,
        },
        body: JSON.stringify({
          organizationIds: [1], // 使用一个测试的组织ID
          pageNum: 0,
          pageSize: 1,
        }),
      });

      // 如果返回 401 或 403，说明 token 无效
      return ![401, 403].includes(response.status);
    } catch {
      return false;
    }
  }
}

/**
 * 创建同步服务实例
 */
export function createSyncService(token?: string): DulidaySyncService {
  return new DulidaySyncService(token);
}

/**
 * 存储同步历史记录到 localStorage
 */
export function saveSyncRecord(record: SyncRecord): void {
  try {
    const existingRecords = getSyncHistory();
    const updatedRecords = [record, ...existingRecords].slice(0, 50); // 只保留最近50条记录
    localStorage.setItem("sync_history", JSON.stringify(updatedRecords));
  } catch (error) {
    console.error("Failed to save sync record:", error);
  }
}

/**
 * 从 localStorage 获取同步历史记录
 */
export function getSyncHistory(): SyncRecord[] {
  try {
    const records = localStorage.getItem("sync_history");
    return records ? JSON.parse(records) : [];
  } catch (error) {
    console.error("Failed to load sync history:", error);
    return [];
  }
}

/**
 * 清除同步历史记录
 */
export function clearSyncHistory(): void {
  try {
    localStorage.removeItem("sync_history");
  } catch (error) {
    console.error("Failed to clear sync history:", error);
  }
}
