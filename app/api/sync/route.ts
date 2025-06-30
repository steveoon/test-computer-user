import { NextRequest, NextResponse } from "next/server";
import { createSyncService } from "@/lib/services/duliday-sync.service";
import { z } from "zod";

/**
 * 同步请求体 Schema
 */
const SyncRequestSchema = z.object({
  organizationIds: z.array(z.number()).min(1, "至少需要选择一个组织ID"),
  pageSize: z.number().optional().default(100),
});

/**
 * POST /api/sync
 * 
 * 执行数据同步
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { organizationIds } = SyncRequestSchema.parse(body);

    // 验证环境变量
    const dulidayToken = process.env.DULIDAY_TOKEN;
    if (!dulidayToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: "DULIDAY_TOKEN 环境变量未配置",
          code: "MISSING_TOKEN" 
        },
        { status: 500 }
      );
    }

    // 创建同步服务
    const syncService = createSyncService(dulidayToken);

    // 验证 Token 有效性
    const isTokenValid = await syncService.validateToken();
    if (!isTokenValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Duliday Token 无效或已过期",
          code: "INVALID_TOKEN" 
        },
        { status: 401 }
      );
    }

    // 执行数据同步
    console.log(`[SYNC API] 开始同步组织: ${organizationIds.join(", ")}`);
    
    const syncRecord = await syncService.syncMultipleOrganizations(
      organizationIds,
      (progress, currentOrg, message) => {
        console.log(`[SYNC API] 进度: ${progress}% - 组织 ${currentOrg}: ${message}`);
      }
    );

    console.log(`[SYNC API] 同步完成`, {
      success: syncRecord.overallSuccess,
      totalDuration: syncRecord.totalDuration,
      processedBrands: syncRecord.results.length,
    });

    return NextResponse.json({
      success: true,
      data: syncRecord,
    });

  } catch (error) {
    console.error("[SYNC API] 同步失败:", error);
    
    // 处理 Zod 验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "请求参数验证失败",
          details: error.errors,
          code: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    // 处理其他错误
    const errorMessage = error instanceof Error ? error.message : "同步过程中发生未知错误";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: "SYNC_ERROR"
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync
 * 
 * 获取同步状态或配置信息
 */
export async function GET() {
  try {
    const dulidayToken = process.env.DULIDAY_TOKEN;
    
    // 检查 Token 配置
    if (!dulidayToken) {
      return NextResponse.json({
        configured: false,
        error: "DULIDAY_TOKEN 环境变量未配置",
      });
    }

    // 验证 Token 有效性
    const syncService = createSyncService(dulidayToken);
    const isTokenValid = await syncService.validateToken();

    return NextResponse.json({
      configured: true,
      tokenValid: isTokenValid,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[SYNC API] 状态检查失败:", error);
    
    return NextResponse.json(
      { 
        configured: false,
        error: error instanceof Error ? error.message : "状态检查失败",
      },
      { status: 500 }
    );
  }
}