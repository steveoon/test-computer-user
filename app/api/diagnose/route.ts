import { NextRequest, NextResponse } from "next/server";
import { diagnoseE2BEnvironment } from "@/lib/e2b/diagnostic";

export async function POST(req: NextRequest) {
  try {
    const { sandboxId } = await req.json();

    console.log("开始 E2B 环境诊断...");

    // 运行诊断
    await diagnoseE2BEnvironment(sandboxId);

    return NextResponse.json({
      success: true,
      message: "诊断完成，请查看控制台输出",
    });
  } catch (error) {
    console.error("诊断 API 错误:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
