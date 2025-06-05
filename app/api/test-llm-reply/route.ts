import { NextRequest, NextResponse } from "next/server";
import { generateSmartReplyWithLLM } from "../../../lib/utils/zhipin-data-loader";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "请提供有效的消息内容" },
        { status: 400 }
      );
    }

    // 调用LLM智能回复生成函数
    const reply = await generateSmartReplyWithLLM(message.trim());

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("LLM回复生成API错误:", error);

    return NextResponse.json(
      {
        error: "回复生成失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "请使用 POST 方法调用此 API",
    usage: 'POST /api/test-llm-reply with { message: "候选人消息" }',
  });
}
