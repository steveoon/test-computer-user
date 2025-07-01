"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, CheckCircle, XCircle, Eye, EyeOff, TestTube } from "lucide-react";
import { toast } from "sonner";

interface TokenStatus {
  isValid: boolean;
  lastChecked: string;
  error?: string;
}

export const DulidayTokenManager = () => {
  const [token, setToken] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 从本地存储加载token
  useEffect(() => {
    const savedToken = localStorage.getItem("duliday_token");
    const savedStatus = localStorage.getItem("duliday_token_status");

    if (savedToken) {
      setToken(savedToken);
    }

    if (savedStatus) {
      try {
        setTokenStatus(JSON.parse(savedStatus));
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存token到本地存储
  const saveToken = () => {
    if (!token.trim()) {
      toast.error("Token不能为空");
      return;
    }

    localStorage.setItem("duliday_token", token.trim());
    setHasChanges(false);
    toast.success("Duliday Token 已保存到本地存储");
  };

  // 验证token有效性
  const validateToken = async () => {
    if (!token.trim()) {
      toast.error("请先输入Token");
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationIds: [1], // 使用测试ID
          validateOnly: true, // 仅验证，不实际同步
          token: token.trim(), // 传递当前输入的token
        }),
      });

      const data = await response.json();

      const status: TokenStatus = {
        isValid: response.ok && !data.error,
        lastChecked: new Date().toLocaleString("zh-CN"),
        error: data.error || undefined,
      };

      setTokenStatus(status);
      localStorage.setItem("duliday_token_status", JSON.stringify(status));

      if (status.isValid) {
        toast.success("Token验证成功！");
      } else {
        toast.error(`Token验证失败: ${status.error || "未知错误"}`);
      }
    } catch (error) {
      const status: TokenStatus = {
        isValid: false,
        lastChecked: new Date().toLocaleString("zh-CN"),
        error: error instanceof Error ? error.message : "网络错误",
      };

      setTokenStatus(status);
      localStorage.setItem("duliday_token_status", JSON.stringify(status));
      toast.error("Token验证失败: " + status.error);
    } finally {
      setIsValidating(false);
    }
  };

  // 清除token
  const clearToken = () => {
    if (confirm("确定要清除保存的Token吗？")) {
      setToken("");
      setTokenStatus(null);
      setHasChanges(false);
      localStorage.removeItem("duliday_token");
      localStorage.removeItem("duliday_token_status");
      toast.success("Token已清除");
    }
  };

  // 检测token变化
  const handleTokenChange = (value: string) => {
    setToken(value);
    setHasChanges(value !== (localStorage.getItem("duliday_token") || ""));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Duliday Token 管理
        </CardTitle>
        <CardDescription>
          管理用于访问Duliday API的认证Token，Token可能会定期过期需要更新
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Token状态显示 */}
        {tokenStatus && (
          <Alert
            className={
              tokenStatus.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
            }
          >
            <div className="flex items-center gap-2">
              {tokenStatus.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <div className={tokenStatus.isValid ? "text-green-800" : "text-red-800"}>
                    Token状态: {tokenStatus.isValid ? "有效" : "无效"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    最后检查: {tokenStatus.lastChecked}
                  </div>
                  {tokenStatus.error && (
                    <div className="text-sm text-red-700">错误: {tokenStatus.error}</div>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Token输入 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="duliday-token">Duliday API Token</Label>
            <div className="flex items-center gap-2">
              {token && (
                <Badge variant={tokenStatus?.isValid ? "default" : "secondary"}>
                  {tokenStatus?.isValid ? "已验证" : "未验证"}
                </Badge>
              )}
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600">
                  有未保存的更改
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="duliday-token"
                type={isVisible ? "text" : "password"}
                value={token}
                onChange={e => handleTokenChange(e.target.value)}
                placeholder="请输入Duliday API Token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button onClick={saveToken} disabled={!token.trim() || !hasChanges} variant="default">
            保存Token
          </Button>

          <Button
            onClick={validateToken}
            disabled={!token.trim() || isValidating}
            variant="outline"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                验证中...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                验证Token
              </>
            )}
          </Button>

          {token && (
            <Button onClick={clearToken} variant="destructive" size="sm">
              清除Token
            </Button>
          )}
        </div>

        {/* 使用说明 */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">使用说明</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Token保存在浏览器本地存储中，仅在当前设备有效</li>
            <li>• 请定期验证Token状态，确保数据同步功能正常</li>
            <li>• 如果Token过期，请联系相关人员获取新的Token</li>
            <li>• Token仅用于数据读取，不会修改Duliday平台的数据</li>
            <li>• 为确保安全，请不要在公共设备上保存Token</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
