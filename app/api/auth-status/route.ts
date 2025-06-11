import { createClient } from "@/lib/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // 获取用户信息
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // 获取session信息
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    return NextResponse.json({
      success: true,
      user: user
        ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          }
        : null,
      session: session
        ? {
            access_token: session.access_token ? "exists" : "missing",
            refresh_token: session.refresh_token ? "exists" : "missing",
            expires_at: session.expires_at,
          }
        : null,
      error: error?.message || sessionError?.message || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AUTH STATUS] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
