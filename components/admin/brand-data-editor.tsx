"use client";

import React, { useEffect } from "react";
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
import { Save, RefreshCw, Eye, Code2, Database, MessageSquare } from "lucide-react";
import { TemplateEditor } from "./template-editor";
import { useBrandEditorStore } from "@/lib/stores/brand-editor-store";
import type { ZhipinData } from "@/types";

interface BrandDataEditorProps {
  data: ZhipinData | undefined;
  onSave: (data: ZhipinData) => Promise<void>;
}

export const BrandDataEditor: React.FC<BrandDataEditorProps> = ({
  data,
  onSave,
}) => {
  const {
    localData,
    jsonData,
    editMode,
    editingBrand,
    isSaving,
    error,
    hasUnsavedChanges,
    initializeData,
    setEditMode,
    setEditingBrand,
    updateJsonData,
    saveData,
    resetData,
  } = useBrandEditorStore();

  // 初始化数据
  useEffect(() => {
    if (data) {
      initializeData(data);
    }
  }, [data, initializeData]);

  // 渲染概览信息
  const renderOverview = () => {
    if (!localData) return null;

    const brandCount = Object.keys(localData.brands).length;
    const storeCount = localData.stores.length;
    const cityInfo = localData.city;

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
            {editingBrand ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">编辑 {editingBrand} 品牌话术</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingBrand(null)}
                  >
                    返回列表
                  </Button>
                </div>
                <TemplateEditor brandName={editingBrand} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(localData.brands).map(([brandName, brandConfig]) => (
                  <div key={brandName} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{brandName}</h3>
                      <Badge variant="outline">
                        {
                          localData.stores.filter((store) => store.brand === brandName)
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setEditingBrand(brandName)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      编辑话术
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
              {localData.stores.map((store, index) => (
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
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-600">
                  未保存的更改
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={resetData}
                disabled={isSaving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重置
              </Button>
              <Button
                onClick={() => saveData(onSave)}
                size="sm"
                disabled={isSaving}
                className="min-w-20"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "保存中..." : "保存"}
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
                onChange={(e) => updateJsonData(e.target.value)}
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