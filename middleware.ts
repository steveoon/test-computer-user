import { updateSession } from "./lib/utils/supabase/middleware";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  return response;
}

// 🎯 配置middleware匹配规则
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - 公开的API路由（不需要认证检查）
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth-status|api/diagnose|api/sandbox-status|api/kill-desktop|api/pause-desktop).*)",
  ],
};
