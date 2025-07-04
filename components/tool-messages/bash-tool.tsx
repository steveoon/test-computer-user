"use client";

import { ScrollText } from "lucide-react";
import { BaseToolMessage } from "./base-tool-message";
import { themes, type ToolMessageProps } from "./types";

export function BashToolMessage(props: ToolMessageProps) {
  const { args, state, result, isLatestMessage, status, messageId, partIndex } = props;
  const command = args.command as string | undefined;

  const truncatedCommand = command && command.length > 50 
    ? command.substring(0, 50) + "..." 
    : command;

  return (
    <BaseToolMessage
      icon={ScrollText}
      label="执行命令"
      detail={truncatedCommand}
      theme={themes.zinc}
      state={state}
      result={result}
      isLatestMessage={isLatestMessage}
      status={status}
      messageId={messageId}
      partIndex={partIndex}
    />
  );
}