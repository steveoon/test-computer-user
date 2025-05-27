import { getDesktop, pauseDesktop } from "@/lib/e2b/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const sandboxId = searchParams.get("sandboxId");

  if (!sandboxId) {
    return NextResponse.json(
      { error: "No sandboxId provided" },
      { status: 400 }
    );
  }

  try {
    const desktop = await getDesktop(sandboxId);
    const pausedSandboxId = await pauseDesktop(desktop);

    return NextResponse.json(
      {
        success: true,
        pausedSandboxId,
        message: "Desktop paused successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Failed to pause desktop: ${sandboxId}`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
