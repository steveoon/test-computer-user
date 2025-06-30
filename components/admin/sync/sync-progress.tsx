"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Server,
  Database
} from "lucide-react";
import { useSyncStore, formatDuration } from "@/lib/stores/sync-store";
import { getAvailableBrands } from "@/lib/constants/organization-mapping";

export const SyncProgress = () => {
  const {
    isSyncing,
    currentStep,
    overallProgress,
    currentOrganization,
    selectedBrands,
    currentSyncResult,
  } = useSyncStore();

  const availableBrands = getAvailableBrands();

  // 获取当前正在同步的品牌名称
  const getCurrentBrandName = () => {
    if (currentOrganization === 0) return "";
    const brand = availableBrands.find(b => b.id === currentOrganization);
    return brand?.name || `组织 ${currentOrganization}`;
  };

  if (!isSyncing && !currentSyncResult) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 总体进度 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            ) : currentSyncResult?.overallSuccess ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="font-medium">
              {isSyncing ? "同步进行中..." : "同步已完成"}
            </span>
          </div>
          <Badge variant={isSyncing ? "default" : currentSyncResult?.overallSuccess ? "default" : "destructive"}>
            {overallProgress}%
          </Badge>
        </div>
        
        <Progress value={overallProgress} className="w-full" />
        
        <div className="text-sm text-muted-foreground">
          {currentStep}
        </div>
      </div>

      {/* 当前同步的品牌信息 */}
      {isSyncing && currentOrganization > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              <div>
                <div className="font-medium">正在同步: {getCurrentBrandName()}</div>
                <div className="text-sm text-muted-foreground">
                  组织ID: {currentOrganization}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 同步统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Server className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">品牌数量</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {selectedBrands.length}
          </div>
        </div>

        {currentSyncResult && (
          <>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Database className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">处理记录</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {currentSyncResult.results.reduce((sum, r) => sum + r.processedRecords, 0)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">门店数量</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {currentSyncResult.results.reduce((sum, r) => sum + r.storeCount, 0)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">耗时</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatDuration(currentSyncResult.totalDuration)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 品牌同步状态列表 */}
      {currentSyncResult && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">各品牌同步状态</h4>
          <div className="space-y-2">
            {currentSyncResult.results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  result.success 
                    ? "border-green-200 bg-green-50" 
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium text-sm">{result.brandName}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {result.processedRecords} 条记录
                  </span>
                  <Badge 
                    variant={result.success ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {result.success ? "成功" : "失败"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};