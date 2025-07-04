"use client";

import { Briefcase } from "lucide-react";
import { BaseToolMessage } from "./base-tool-message";
import { themes, type ToolMessageProps } from "./types";

export function JobPostingToolMessage(props: ToolMessageProps) {
  const { args, state, result, isLatestMessage, status, messageId, partIndex } = props;
  const positionType = args.positionType as string | undefined;
  const brand = args.brand as string | undefined;
  const limit = args.limit as number | undefined;

  const details: string[] = [];
  if (positionType) details.push(`${positionType}岗位`);
  if (brand) details.push(brand);
  if (limit) details.push(`最多${limit}个`);

  const detail = details.join(" · ");

  return (
    <BaseToolMessage
      icon={Briefcase}
      label="生成岗位推送消息"
      detail={detail}
      theme={themes.indigo}
      state={state}
      result={result}
      isLatestMessage={isLatestMessage}
      status={status}
      messageId={messageId}
      partIndex={partIndex}
    />
  );
}