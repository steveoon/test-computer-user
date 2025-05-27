"use client";

import { PreviewMessage } from "@/components/message";
import { getDesktopURL } from "@/lib/e2b/utils";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DeployButton, ProjectInfo } from "@/components/project-info";
import { AISDKLogo } from "@/components/icons";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ABORTED } from "@/lib/utils";

export default function Chat() {
  // Create separate refs for mobile and desktop to ensure both scroll properly
  const [desktopContainerRef, desktopEndRef] = useScrollToBottom();
  const [mobileContainerRef, mobileEndRef] = useScrollToBottom();

  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<
    "running" | "paused" | "unknown"
  >("unknown");

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: sandboxId ?? undefined,
    body: {
      sandboxId,
    },
    maxSteps: 30,
    onError: (error) => {
      console.error(error);
      toast.error("There was an error", {
        description: "Please try again later.",
        richColors: true,
        position: "top-center",
      });
    },
  });

  const stop = () => {
    stopGeneration();

    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...lastMessage.parts.slice(0, -1),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  };

  const isLoading = status !== "ready";

  const refreshDesktop = async () => {
    try {
      setIsInitializing(true);

      // 如果当前状态是暂停，优先尝试恢复
      if (sandboxStatus === "paused" && sandboxId) {
        console.log("Attempting to resume paused sandbox:", sandboxId);
        toast.info("正在恢复暂停的沙盒...", {
          richColors: true,
          position: "top-center",
        });
      }

      const { streamUrl, id } = await getDesktopURL(sandboxId || undefined);
      console.log("Desktop connection established with ID:", id);
      setStreamUrl(streamUrl);
      setSandboxId(id);
      setSandboxStatus("running");

      if (sandboxStatus === "paused") {
        toast.success("沙盒已成功恢复！", {
          richColors: true,
          position: "top-center",
        });
      }
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
      toast.error("恢复沙盒失败，将创建新的沙盒", {
        richColors: true,
        position: "top-center",
      });
      // 如果恢复失败，清除当前sandboxId，强制创建新的
      setSandboxId(null);
      setSandboxStatus("unknown");
    } finally {
      setIsInitializing(false);
    }
  };

  const pauseDesktop = async () => {
    if (!sandboxId || isPausing) return;

    try {
      setIsPausing(true);
      const response = await fetch(
        `/api/pause-desktop?sandboxId=${encodeURIComponent(sandboxId)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Desktop paused:", result);
        setSandboxStatus("paused");
        toast.success("桌面已暂停", {
          description: "你可以稍后恢复使用",
          richColors: true,
          position: "top-center",
        });
      } else {
        throw new Error("Failed to pause desktop");
      }
    } catch (err) {
      console.error("Failed to pause desktop:", err);
      toast.error("暂停桌面失败", {
        description: "请稍后重试",
        richColors: true,
        position: "top-center",
      });
    } finally {
      setIsPausing(false);
    }
  };

  const checkSandboxStatus = async () => {
    if (!sandboxId) return;

    try {
      const response = await fetch(
        `/api/sandbox-status?sandboxId=${encodeURIComponent(sandboxId)}`
      );
      if (response.ok) {
        const status = await response.json();
        const newStatus = status.isRunning ? "running" : "paused";

        // 如果沙盒从运行状态变为暂停状态，显示通知
        if (sandboxStatus === "running" && newStatus === "paused") {
          console.log("Sandbox has been paused unexpectedly");
          toast.info("沙盒已暂停", {
            description: "点击'刷新桌面'按钮可以恢复",
            richColors: true,
            position: "top-center",
          });
        }

        setSandboxStatus(newStatus);
      }
    } catch (err) {
      console.error("Failed to check sandbox status:", err);
      setSandboxStatus("unknown");
    }
  };

  // Kill desktop on page close
  useEffect(() => {
    if (!sandboxId) return;

    // Function to kill the desktop - just one method to reduce duplicates
    const killDesktop = () => {
      if (!sandboxId) return;

      // Use sendBeacon which is best supported across browsers
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`
      );
    };

    // Detect iOS / Safari
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Choose exactly ONE event handler based on the browser
    if (isIOS || isSafari) {
      // For Safari on iOS, use pagehide which is most reliable
      window.addEventListener("pagehide", killDesktop);

      return () => {
        window.removeEventListener("pagehide", killDesktop);
        // Also kill desktop when component unmounts
        killDesktop();
      };
    } else {
      // For all other browsers, use beforeunload
      window.addEventListener("beforeunload", killDesktop);

      return () => {
        window.removeEventListener("beforeunload", killDesktop);
        // Also kill desktop when component unmounts
        killDesktop();
      };
    }
  }, [sandboxId]);

  // 心跳检测 - 定期检查沙盒状态
  useEffect(() => {
    if (!sandboxId) return;

    // 立即检查一次状态
    checkSandboxStatus();

    // 设置定期检查
    const heartbeatInterval = setInterval(() => {
      checkSandboxStatus();
    }, 60000); // 每分钟检查一次

    return () => clearInterval(heartbeatInterval);
  }, [sandboxId]); // 移除sandboxStatus依赖避免循环

  useEffect(() => {
    // Initialize desktop and get stream URL when the component mounts
    const init = async () => {
      try {
        setIsInitializing(true);

        // Use the provided ID or create a new one
        const { streamUrl, id } = await getDesktopURL(sandboxId ?? undefined);

        setStreamUrl(streamUrl);
        setSandboxId(id);
        setSandboxStatus("running");
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
        setSandboxStatus("unknown");
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-dvh relative">
      {/* Mobile/tablet banner */}
      <div className="flex items-center justify-center fixed left-1/2 -translate-x-1/2 top-5 shadow-md text-xs mx-auto rounded-lg h-8 w-fit bg-blue-600 text-white px-3 py-2 text-left z-50 xl:hidden">
        <span>Headless mode</span>
      </div>

      {/* Resizable Panels */}
      <div className="w-full hidden xl:block">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Desktop Stream Panel */}
          <ResizablePanel
            defaultSize={70}
            minSize={40}
            className="bg-black relative items-center justify-center"
          >
            {streamUrl ? (
              <>
                <iframe
                  src={streamUrl}
                  className="w-full h-full"
                  style={{
                    transformOrigin: "center",
                    width: "100%",
                    height: "100%",
                  }}
                  allow="autoplay"
                />
                <Button
                  onClick={refreshDesktop}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded text-sm z-10"
                  disabled={isInitializing}
                >
                  {isInitializing ? "Creating desktop..." : "New desktop"}
                </Button>

                {/* 状态显示和暂停按钮 */}
                <div className="absolute top-2 left-2 flex gap-2 z-10">
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      sandboxStatus === "running"
                        ? "bg-green-500/80 text-white"
                        : sandboxStatus === "paused"
                        ? "bg-yellow-500/80 text-white"
                        : "bg-gray-500/80 text-white"
                    }`}
                  >
                    {sandboxStatus === "running"
                      ? "运行中"
                      : sandboxStatus === "paused"
                      ? "已暂停"
                      : "未知状态"}
                  </div>

                  {sandboxStatus === "running" && (
                    <Button
                      onClick={pauseDesktop}
                      className="bg-yellow-500/80 hover:bg-yellow-600/80 text-white px-2 py-1 rounded text-xs"
                      disabled={isPausing}
                    >
                      {isPausing ? "暂停中..." : "暂停"}
                    </Button>
                  )}

                  {sandboxStatus === "paused" && (
                    <Button
                      onClick={refreshDesktop}
                      className="bg-blue-500/80 hover:bg-blue-600/80 text-white px-2 py-1 rounded text-xs"
                      disabled={isInitializing}
                    >
                      {isInitializing ? "恢复中..." : "恢复桌面"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                {isInitializing
                  ? "Initializing desktop..."
                  : "Loading stream..."}
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Chat Interface Panel */}
          <ResizablePanel
            defaultSize={30}
            minSize={25}
            className="flex flex-col border-l border-zinc-200"
          >
            <div className="bg-white py-4 px-4 flex justify-between items-center">
              <AISDKLogo />
              <DeployButton />
            </div>

            <div
              className="flex-1 space-y-6 py-4 overflow-y-auto px-4"
              ref={desktopContainerRef}
            >
              {messages.length === 0 ? <ProjectInfo /> : null}
              {messages.map((message, i) => (
                <PreviewMessage
                  message={message}
                  key={message.id}
                  isLoading={isLoading}
                  status={status}
                  isLatestMessage={i === messages.length - 1}
                />
              ))}
              <div ref={desktopEndRef} className="pb-2" />
            </div>

            {messages.length === 0 && (
              <PromptSuggestions
                disabled={isInitializing}
                submitPrompt={(prompt: string) =>
                  append({ role: "user", content: prompt })
                }
              />
            )}
            <div className="bg-white">
              <form onSubmit={handleSubmit} className="p-4">
                <Input
                  handleInputChange={handleInputChange}
                  input={input}
                  isInitializing={isInitializing}
                  isLoading={isLoading}
                  status={status}
                  stop={stop}
                />
              </form>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile View (Chat Only) */}
      <div className="w-full xl:hidden flex flex-col">
        <div className="bg-white py-4 px-4 flex justify-between items-center">
          <AISDKLogo />
          <DeployButton />
        </div>

        <div
          className="flex-1 space-y-6 py-4 overflow-y-auto px-4"
          ref={mobileContainerRef}
        >
          {messages.length === 0 ? <ProjectInfo /> : null}
          {messages.map((message, i) => (
            <PreviewMessage
              message={message}
              key={message.id}
              isLoading={isLoading}
              status={status}
              isLatestMessage={i === messages.length - 1}
            />
          ))}
          <div ref={mobileEndRef} className="pb-2" />
        </div>

        {messages.length === 0 && (
          <PromptSuggestions
            disabled={isInitializing}
            submitPrompt={(prompt: string) =>
              append({ role: "user", content: prompt })
            }
          />
        )}
        <div className="bg-white">
          <form onSubmit={handleSubmit} className="p-4">
            <Input
              handleInputChange={handleInputChange}
              input={input}
              isInitializing={isInitializing}
              isLoading={isLoading}
              status={status}
              stop={stop}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
