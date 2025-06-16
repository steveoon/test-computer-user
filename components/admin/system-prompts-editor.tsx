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
import { Save, RefreshCw, Cpu } from "lucide-react";
import type { SystemPromptsConfig } from "@/types/config";

interface SystemPromptsEditorProps {
  data: SystemPromptsConfig | undefined;
  onSave: (data: SystemPromptsConfig) => Promise<void>;
}

export const SystemPromptsEditor: React.FC<SystemPromptsEditorProps> = ({
  data,
  onSave,
}) => {
  const [prompts, setPrompts] = useState<SystemPromptsConfig>(
    () =>
      data || {
        bossZhipinSystemPrompt: "",
        generalComputerSystemPrompt: "",
      }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 同步数据到编辑器
  React.useEffect(() => {
    if (data) {
      setPrompts(data);
    }
  }, [data]);

  // 保存配置
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      // 基本验证
      if (
        !prompts.bossZhipinSystemPrompt.trim() ||
        !prompts.generalComputerSystemPrompt.trim()
      ) {
        throw new Error("系统提示词不能为空");
      }

      await onSave(prompts);
      console.log("✅ 系统提示词保存成功");
    } catch (error) {
      console.error("❌ 系统提示词保存失败:", error);
      setError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }, [prompts, onSave]);

  // 重置到原始数据
  const handleReset = useCallback(() => {
    if (data) {
      setPrompts(data);
      setError(null);
    }
  }, [data]);

  // 更新提示词
  const updatePrompt = useCallback(
    (key: keyof SystemPromptsConfig, value: string) => {
      setPrompts((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>系统提示词编辑器</CardTitle>
          <CardDescription>配置AI助手的系统级行为指令</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">没有系统提示词数据</p>
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
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-6 w-6" />
                系统提示词编辑器
              </CardTitle>
              <CardDescription>
                配置AI助手在不同场景下的系统级行为指令
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

      {/* Boss直聘系统提示词 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Boss直聘招聘助手</CardTitle>
          <CardDescription>
            专用于Boss直聘平台的招聘沟通系统提示词，定义AI在招聘场景下的行为规范
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={prompts.bossZhipinSystemPrompt}
            onChange={(e) =>
              updatePrompt("bossZhipinSystemPrompt", e.target.value)
            }
            className="w-full h-64 p-4 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入Boss直聘系统提示词..."
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>定义AI在Boss直聘平台上的招聘行为、沟通策略和操作流程</span>
            <span>{prompts.bossZhipinSystemPrompt.length} 字符</span>
          </div>
        </CardContent>
      </Card>

      {/* 通用计算机操作提示词 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">通用计算机助手</CardTitle>
          <CardDescription>
            通用计算机操作的系统提示词，适用于一般的桌面操作和任务执行
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={prompts.generalComputerSystemPrompt}
            onChange={(e) =>
              updatePrompt("generalComputerSystemPrompt", e.target.value)
            }
            className="w-full h-64 p-4 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入通用计算机操作提示词..."
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>定义AI在执行一般计算机操作时的行为准则和交互方式</span>
            <span>{prompts.generalComputerSystemPrompt.length} 字符</span>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>编辑说明</CardTitle>
          <CardDescription>系统提示词的作用和编辑注意事项</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-3">
            <div>
              <h4 className="font-medium mb-1">🎯 Boss直聘提示词</h4>
              <p className="text-muted-foreground">
                控制AI在Boss直聘平台上的行为，包括候选人沟通策略、信息收集方式、微信获取流程等关键环节。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">💻 通用计算机提示词</h4>
              <p className="text-muted-foreground">
                定义AI执行桌面操作、文件管理、系统命令等通用计算机任务时的行为准则。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">📝 编辑建议</h4>
              <ul className="text-muted-foreground space-y-1 ml-4">
                <li>• 保持提示词的清晰性和具体性</li>
                <li>• 包含明确的行为指导和目标导向</li>
                <li>• 考虑异常情况的处理策略</li>
                <li>• 修改后及时保存并测试效果</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
