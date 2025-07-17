"use client";

import { Calendar } from "lucide-react";
import { BaseToolMessage } from "./base-tool-message";
import { themes, type ToolMessageProps } from "./types";

export function DulidayInterviewBookingToolMessage(props: ToolMessageProps) {
  const { args, state, result, isLatestMessage, status, messageId, partIndex } = props;
  const name = args.name as string | undefined;
  const jobId = args.jobId as number | undefined;
  const interviewTime = args.interviewTime as string | undefined;
  const education = args.education as string | undefined;

  const details: string[] = [];
  if (name) details.push(name);
  if (education) details.push(education);
  if (jobId) details.push(`岗位${jobId}`);
  if (interviewTime) {
    // 格式化时间显示
    try {
      const date = new Date(interviewTime);
      const formattedTime = date.toLocaleString("zh-CN", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      details.push(formattedTime);
    } catch {
      details.push(interviewTime);
    }
  }

  const detail = details.length > 0 ? details.join(" · ") : "预约面试";

  return (
    <BaseToolMessage
      icon={Calendar}
      label="预约面试"
      detail={detail}
      theme={themes.green}
      state={state}
      result={result}
      isLatestMessage={isLatestMessage}
      status={status}
      messageId={messageId}
      partIndex={partIndex}
    />
  );
}