"use client";

import { Bot } from "lucide-react";
import { BaseToolMessage } from "./base-tool-message";
import { themes, type ToolMessageProps } from "./types";
import { useMemo } from "react";
import { REPLY_TYPE_NAMES, type ReplyContext } from "@/types/zhipin";

export function ZhipinReplyToolMessage(props: ToolMessageProps) {
  const { args, state, result, isLatestMessage, status, messageId, partIndex } = props;
  const candidateMessage = args.candidate_message as string | undefined;
  const brand = args.brand as string | undefined;
  const includeStats = args.include_stats as boolean | undefined;
  
  // 从结果中提取分类信息
  const { replyType, reasoning } = useMemo(() => {
    if (result && typeof result === 'object' && 'replyType' in result) {
      const typedResult = result as { replyType?: string; reasoning?: string };
      return {
        replyType: typedResult.replyType,
        reasoning: typedResult.reasoning,
      };
    }
    return { replyType: undefined, reasoning: undefined };
  }, [result]);
  

  const details: string[] = [];
  if (candidateMessage) {
    const truncated = candidateMessage.length > 20 
      ? candidateMessage.substring(0, 20) + "..." 
      : candidateMessage;
    details.push(`"${truncated}"`);
  }
  if (brand) details.push(brand);
  if (includeStats) details.push("含统计");
  
  // 添加分类信息到详情
  if (replyType) {
    const typeName = REPLY_TYPE_NAMES[replyType as ReplyContext] || replyType;
    details.push(`🎯 ${typeName}`);
  }

  const detail = details.join(" · ");

  return (
    <>
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
      {reasoning && state === "result" && (
        <div className="mt-2 ml-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium text-gray-600 dark:text-gray-400">📊 分类依据：</span>
            <span className="text-gray-700 dark:text-gray-300 flex-1">{reasoning}</span>
          </div>
        </div>
      )}
    </>
  );
}