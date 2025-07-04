"use client";

import {
  Globe,
  Camera,
  MousePointerClick,
  Keyboard,
  Hand,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { BaseToolMessage } from "./base-tool-message";
import { themes, type ToolMessageProps } from "./types";
import Image from "next/image";

const actionIcons: Record<string, LucideIcon> = {
  connect: Globe,
  navigate: Globe,
  screenshot: Camera,
  click: MousePointerClick,
  fill: Keyboard,
  hover: Hand,
  evaluate: Terminal,
};

const actionLabels: Record<string, string> = {
  connect: "连接浏览器",
  navigate: "访问页面",
  screenshot: "截屏",
  click: "点击元素",
  fill: "填写表单",
  hover: "悬停",
  evaluate: "执行脚本",
};

export function PuppeteerToolMessage(props: ToolMessageProps) {
  const { args, state, result, isLatestMessage, status, messageId, partIndex } = props;
  const action = (args.action as string) || "navigate";
  const url = args.url as string | undefined;
  const selector = args.selector as string | undefined;
  const value = args.value as string | undefined;

  const Icon = actionIcons[action] || Globe;
  const label = actionLabels[action] || action;

  let detail = "";
  if (action === "navigate" && url) {
    // 提取域名显示
    try {
      const urlObj = new URL(url);
      detail = urlObj.hostname;
    } catch {
      detail = url.length > 30 ? url.substring(0, 30) + "..." : url;
    }
  } else if (selector) {
    detail = selector.length > 30 ? selector.substring(0, 30) + "..." : selector;
  } else if (value && action === "fill") {
    detail = value.length > 20 ? value.substring(0, 20) + "..." : value;
  }

  const content =
    action === "screenshot" && state === "result" && result ? (
      <div className="mt-2 relative rounded-sm overflow-hidden">
        <Image
          src={`data:image/png;base64,${result as string}`}
          alt="Puppeteer Screenshot"
          className="w-full rounded-sm"
        />
      </div>
    ) : action === "screenshot" && state === "call" ? (
      <div className="w-full aspect-video rounded-sm bg-purple-200 dark:bg-purple-800 animate-pulse mt-2"></div>
    ) : null;

  return (
    <BaseToolMessage
      icon={Icon}
      label={label}
      detail={detail}
      theme={themes.purple}
      state={state}
      result={result}
      isLatestMessage={isLatestMessage}
      status={status}
      messageId={messageId}
      partIndex={partIndex}
    >
      {content}
    </BaseToolMessage>
  );
}
