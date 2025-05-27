import { streamText, UIMessage } from "ai";
import { killDesktop } from "@/lib/e2b/utils";
import { bashTool, computerTool } from "@/lib/e2b/tool";
import { prunedMessages } from "@/lib/utils";
import { openrouter } from "@/lib/model-registry";
import { registry } from "@/lib/model-registry";

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, sandboxId }: { messages: UIMessage[]; sandboxId: string } =
    await req.json();
  try {
    const result = streamText({
      // model: openrouter("anthropic/claude-3.5-sonnet"), // Use OpenRouter with universal tools
      model: registry.languageModel("anthropic/claude-3-5-sonnet-latest"), // Using Sonnet for computer use
      system:
        "You are a helpful assistant with access to a computer. " +
        "Use the computer tool to help the user with their requests. " +
        "Use the bash tool to execute commands on the computer. You can create files and folders using the bash tool. Always prefer the bash tool where it is viable for the task. " +
        "Be sure to advise the user when waiting is necessary. " +
        "If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar).",
      messages: prunedMessages(messages),
      tools: {
        computer: computerTool(sandboxId),
        bash: bashTool(sandboxId),
      },
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
      onFinish: async ({ usage, toolResults }) => {
        console.log("📊 usage", usage);
        console.log("🛠️ toolResults", toolResults);
      },
    });

    // Create response stream
    const response = result.toDataStreamResponse({
      getErrorMessage(error) {
        console.error(error);
        if (error instanceof Error) {
          return error.message;
        }
        if (typeof error === "string") {
          return error;
        }
        if (error && typeof error === "object" && "message" in error) {
          return String(error.message);
        }
        return "An unexpected error occurred";
      },
    });

    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    await killDesktop(sandboxId); // Force cleanup on error
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
