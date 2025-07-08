"use client";

import { Bot } from "lucide-react";
import { BaseToolMessage } from "./base-tool-message";
import { themes, type ToolMessageProps } from "./types";

export function ZhipinReplyToolMessage(props: ToolMessageProps) {
  const { args, state, result, isLatestMessage, status, messageId, partIndex } = props;
  const candidateMessage = args.candidate_message as string | undefined;
  const brand = args.brand as string | undefined;
  const includeStats = args.include_stats as boolean | undefined;

  const details: string[] = [];
  if (candidateMessage) {
    const truncated = candidateMessage.length > 20 
      ? candidateMessage.substring(0, 20) + "..." 
      : candidateMessage;
    details.push(`"${truncated}"`);
  }
  if (brand) details.push(brand);
  if (includeStats) details.push("含统计");

  const detail = details.join(" · ");

  return (
    <BaseToolMessage
      icon={Bot}
      label="生成智能回复"
      detail={detail}
      theme={themes.yellow}
      state={state}
      result={result}
      isLatestMessage={isLatestMessage}
      status={status}
      messageId={messageId}
      partIndex={partIndex}
    />
  );
}