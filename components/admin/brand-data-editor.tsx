"use client";

import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RefreshCw, Eye, Code2, Database } from "lucide-react";
import type { ZhipinData } from "@/types/config";

interface BrandDataEditorProps {
  data: ZhipinData | undefined;
  onSave: (data: ZhipinData) => Promise<void>;
}

export const BrandDataEditor: React.FC<BrandDataEditorProps> = ({
  data,
  onSave,
}) => {
  const [editMode, setEditMode] = useState<"overview" | "json">("overview");
  const [jsonData, setJsonData] = useState<string>(() =>
    data ? JSON.stringify(data, null, 2) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 同步数据到编辑器
  React.useEffect(() => {
    if (data) {
      setJsonData(JSON.stringify(data, null, 2));
    }
  }, [data]);

  // 保存配置
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      let dataToSave: ZhipinData;

      // 解析JSON数据
      try {
        dataToSave = JSON.parse(jsonData);
      } catch (_parseError) {
        throw new Error("JSON格式错误，请检查语法");
      }

      // 基本验证
      if (!dataToSave.brands || !dataToSave.stores) {
        throw new Error("数据格式不正确，必须包含brands和stores字段");
      }

      await onSave(dataToSave);
      console.log("✅ 品牌数据保存成功");
    } catch (error) {
      console.error("❌ 品牌数据保存失败:", error);
      setError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }, [jsonData, onSave]);

  // 重置到原始数据
  const handleReset = useCallback(() => {
    if (data) {
      setJsonData(JSON.stringify(data, null, 2));
      setError(null);
    }
  }, [data]);

  // 渲染概览信息
  const renderOverview = () => {
    if (!data) return null;

    const brandCount = Object.keys(data.brands).length;
    const storeCount = data.stores.length;
    const cityInfo = data.city;

    return (
      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">品牌数量</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brandCount}</div>
              <p className="text-xs text-muted-foreground">个配置品牌</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">门店数量</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeCount}</div>
              <p className="text-xs text-muted-foreground">家门店</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">覆盖城市</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cityInfo}</div>
              <p className="text-xs text-muted-foreground">主要城市</p>
            </CardContent>
          </Card>
        </div>

        {/* 品牌列表 */}
        <Card>
          <CardHeader>
            <CardTitle>品牌配置</CardTitle>
            <CardDescription>当前配置的品牌及其基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.brands).map(([brandName, brandConfig]) => (
                <div key={brandName} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{brandName}</h3>
                    <Badge variant="outline">
                      {
                        data.stores.filter((store) => store.brand === brandName)
                          .length
                      }{" "}
                      门店
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      模板：{Object.keys(brandConfig.templates).length} 类
                    </div>
                    <div>
                      筛选：年龄 {brandConfig.screening.age.min}-
                      {brandConfig.screening.age.max}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 门店列表 */}
        <Card>
          <CardHeader>
            <CardTitle>门店配置</CardTitle>
            <CardDescription>门店分布和基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.stores.map((store, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{store.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {store.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{store.brand}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {store.district}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>岗位：{store.positions.length} 个</div>
                    <div>交通：{store.transportation}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>编辑说明</CardTitle>
            <CardDescription>如何编辑品牌数据配置</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>• 切换到 "JSON编辑" 标签页可以直接编辑原始数据</p>
              <p>• 修改后请点击 "保存" 按钮保存更改</p>
              <p>• 支持添加新品牌、修改门店信息、调整筛选规则等</p>
              <p>• 保存前请确保JSON格式正确，避免数据损坏</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>品牌数据编辑器</CardTitle>
          <CardDescription>配置品牌信息和门店数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">没有品牌数据可编辑</p>
            <p className="text-sm text-muted-foreground mt-2">
              请确保已完成数据迁移或重新初始化配置
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>品牌数据编辑器</CardTitle>
              <CardDescription>
                管理品牌配置和门店信息，支持概览查看和JSON编辑
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重置
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={saving}
                className="min-w-20"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 编辑模式切换 */}
      <Tabs
        value={editMode}
        onValueChange={(value) => setEditMode(value as "overview" | "json")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            数据概览
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            JSON编辑
          </TabsTrigger>
        </TabsList>

        {/* 概览模式 */}
        <TabsContent value="overview">{renderOverview()}</TabsContent>

        {/* JSON编辑模式 */}
        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">JSON 数据编辑</CardTitle>
              <CardDescription>
                直接编辑品牌数据的JSON格式，请确保语法正确
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="输入品牌数据的JSON格式..."
              />
              <div className="mt-2 text-xs text-muted-foreground">
                提示：修改后请点击"保存"按钮保存更改
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
