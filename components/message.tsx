"use client";

import type { Message } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import equal from "fast-deep-equal";

import { Markdown } from "./markdown";
import { ABORTED, cn } from "@/lib/utils";
import {
  Camera,
  CheckCircle,
  CircleSlash,
  Clock,
  Keyboard,
  KeyRound,
  Loader2,
  MousePointer,
  MousePointerClick,
  ScrollText,
  StopCircle,
  MessageCircle,
} from "lucide-react";

const PurePreviewMessage = ({
  message,
  isLatestMessage,
  status,
}: {
  message: Message;
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  isLatestMessage: boolean;
}) => {
  return (
    <AnimatePresence key={message.id}>
      <motion.div
        className="w-full mx-auto px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        key={`message-${message.id}`}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            "group-data-[role=user]/message:w-fit"
          )}
        >
          {/* {message.role === "assistant" && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )} */}

          <div className="flex flex-col w-full">
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`message-${message.id}-part-${i}`}
                      className="flex flex-row gap-2 items-start w-full pb-4"
                    >
                      <div
                        className={cn("flex flex-col gap-4", {
                          "bg-secondary text-secondary-foreground px-3 py-2 rounded-xl":
                            message.role === "user",
                        })}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                    </motion.div>
                  );
                case "tool-invocation":
                  const { toolName, toolCallId, state, args } =
                    part.toolInvocation;

                  if (toolName === "computer") {
                    const {
                      action,
                      coordinate,
                      text,
                      duration,
                      scroll_amount,
                      scroll_direction,
                    } = args;
                    let actionLabel = "";
                    let actionDetail = "";
                    let ActionIcon = null;

                    switch (action) {
                      case "screenshot":
                        actionLabel = "Taking screenshot";
                        ActionIcon = Camera;
                        break;
                      case "left_click":
                        actionLabel = "Left clicking";
                        actionDetail = coordinate
                          ? `at (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointer;
                        break;
                      case "right_click":
                        actionLabel = "Right clicking";
                        actionDetail = coordinate
                          ? `at (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointerClick;
                        break;
                      case "double_click":
                        actionLabel = "Double clicking";
                        actionDetail = coordinate
                          ? `at (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointerClick;
                        break;
                      case "mouse_move":
                        actionLabel = "Moving mouse";
                        actionDetail = coordinate
                          ? `to (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointer;
                        break;
                      case "type":
                        actionLabel = "Typing";
                        actionDetail = text ? `"${text}"` : "";
                        ActionIcon = Keyboard;
                        break;
                      case "key":
                        actionLabel = "Pressing key";
                        actionDetail = text ? `"${text}"` : "";
                        ActionIcon = KeyRound;
                        break;
                      case "wait":
                        actionLabel = "Waiting";
                        actionDetail = duration ? `${duration} seconds` : "";
                        ActionIcon = Clock;
                        break;
                      case "scroll":
                        actionLabel = "Scrolling";
                        actionDetail =
                          scroll_direction && scroll_amount
                            ? `${scroll_direction} by ${scroll_amount}`
                            : "";
                        ActionIcon = ScrollText;
                        break;
                      default:
                        actionLabel = action;
                        ActionIcon = MousePointer;
                        break;
                    }

                    return (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                        className="flex flex-col gap-2 p-2 mb-3 text-sm bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="flex-1 flex items-center justify-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-zinc-50 dark:bg-zinc-800 rounded-full">
                            {ActionIcon && <ActionIcon className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium font-mono flex items-baseline gap-2">
                              {actionLabel}
                              {actionDetail && (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                                  {actionDetail}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-5 h-5 flex items-center justify-center">
                            {state === "call" ? (
                              isLatestMessage && status !== "ready" ? (
                                <Loader2 className="animate-spin h-4 w-4 text-zinc-500" />
                              ) : (
                                <StopCircle className="h-4 w-4 text-red-500" />
                              )
                            ) : state === "result" ? (
                              part.toolInvocation.result === ABORTED ? (
                                <CircleSlash
                                  size={14}
                                  className="text-amber-600"
                                />
                              ) : (
                                <CheckCircle
                                  size={14}
                                  className="text-green-600"
                                />
                              )
                            ) : null}
                          </div>
                        </div>
                        {state === "result" ? (
                          part.toolInvocation.result.type === "image" && (
                            <div className="p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`data:image/jpeg;base64,${part.toolInvocation.result.data}`}
                                alt="Generated Image"
                                className="w-full aspect-[1024/768] rounded-sm"
                              />
                            </div>
                          )
                        ) : action === "screenshot" ? (
                          <div className="w-full aspect-[1024/768] rounded-sm bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                        ) : null}
                      </motion.div>
                    );
                  }
                  if (toolName === "bash") {
                    const { command } = args;

                    return (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                        className="flex items-center gap-2 p-2 mb-3 text-sm bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-zinc-50 dark:bg-zinc-800 rounded-full">
                          <ScrollText className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-baseline gap-2">
                            Running command
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                              {command.slice(0, 40)}...
                            </span>
                          </div>
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center">
                          {state === "call" ? (
                            isLatestMessage && status !== "ready" ? (
                              <Loader2 className="animate-spin h-4 w-4 text-zinc-500" />
                            ) : (
                              <StopCircle className="h-4 w-4 text-red-500" />
                            )
                          ) : state === "result" ? (
                            <CheckCircle size={14} className="text-green-600" />
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  }
                  if (toolName === "feishu") {
                    const {
                      notification_type,
                      message: msgContent,
                      candidate_name,
                      wechat_id,
                    } = args;

                    // 根据通知类型设置图标和样式
                    let bgColor = "bg-blue-50 dark:bg-blue-900/20";
                    let borderColor = "border-blue-200 dark:border-blue-800";
                    let iconBgColor = "bg-blue-100 dark:bg-blue-800";
                    let iconColor = "text-blue-600 dark:text-blue-400";
                    let textColor = "text-blue-800 dark:text-blue-200";
                    let label = "发送飞书消息";
                    let detail = "";

                    if (notification_type === "candidate_wechat") {
                      label = "推送候选人微信";
                      detail = candidate_name || wechat_id || "";
                      bgColor = "bg-green-50 dark:bg-green-900/20";
                      borderColor = "border-green-200 dark:border-green-800";
                      iconBgColor = "bg-green-100 dark:bg-green-800";
                      iconColor = "text-green-600 dark:text-green-400";
                      textColor = "text-green-800 dark:text-green-200";
                    } else if (notification_type === "payload_error") {
                      label = "系统错误警告";
                      detail = "载荷过大错误";
                      bgColor = "bg-red-50 dark:bg-red-900/20";
                      borderColor = "border-red-200 dark:border-red-800";
                      iconBgColor = "bg-red-100 dark:bg-red-800";
                      iconColor = "text-red-600 dark:text-red-400";
                      textColor = "text-red-800 dark:text-red-200";
                    } else if (notification_type === "task_completed") {
                      label = "任务完成通知";
                      detail = "AI助手任务已完成";
                      bgColor = "bg-green-50 dark:bg-green-900/20";
                      borderColor = "border-green-200 dark:border-green-800";
                      iconBgColor = "bg-green-100 dark:bg-green-800";
                      iconColor = "text-green-600 dark:text-green-400";
                      textColor = "text-green-800 dark:text-green-200";
                    } else if (notification_type === "task_interrupted") {
                      label = "任务中断通知";
                      detail = "AI助手任务被中断";
                      bgColor = "bg-yellow-50 dark:bg-yellow-900/20";
                      borderColor = "border-yellow-200 dark:border-yellow-800";
                      iconBgColor = "bg-yellow-100 dark:bg-yellow-800";
                      iconColor = "text-yellow-600 dark:text-yellow-400";
                      textColor = "text-yellow-800 dark:text-yellow-200";
                    } else if (notification_type === "system_warning") {
                      label = "系统警告通知";
                      detail = "系统异常警告";
                      bgColor = "bg-orange-50 dark:bg-orange-900/20";
                      borderColor = "border-orange-200 dark:border-orange-800";
                      iconBgColor = "bg-orange-100 dark:bg-orange-800";
                      iconColor = "text-orange-600 dark:text-orange-400";
                      textColor = "text-orange-800 dark:text-orange-200";
                    }

                    if (msgContent) {
                      detail =
                        msgContent.slice(0, 30) +
                        (msgContent.length > 30 ? "..." : "");
                    }

                    return (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                        className={`flex items-center gap-2 p-2 mb-3 text-sm ${bgColor} rounded-md border ${borderColor}`}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 ${iconBgColor} rounded-full flex-shrink-0`}
                        >
                          <MessageCircle className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium flex items-baseline gap-2 ${textColor}`}
                          >
                            <span className="truncate">{label}</span>
                            {detail && (
                              <span
                                className={`text-xs ${iconColor} font-normal max-w-[200px] truncate flex-shrink-0`}
                              >
                                "{detail}"
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {state === "call" ? (
                            isLatestMessage && status !== "ready" ? (
                              <Loader2 className="animate-spin h-4 w-4 text-blue-500" />
                            ) : (
                              <StopCircle className="h-4 w-4 text-red-500" />
                            )
                          ) : state === "result" ? (
                            part.toolInvocation.result === ABORTED ? (
                              <CircleSlash
                                size={14}
                                className="text-amber-600"
                              />
                            ) : (
                              <CheckCircle
                                size={14}
                                className="text-green-600"
                              />
                            )
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  }
                  return (
                    <div key={toolCallId}>
                      <h3>
                        {toolName}: {state}
                      </h3>
                      <pre>{JSON.stringify(args, null, 2)}</pre>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.message.annotations !== nextProps.message.annotations)
      return false;
    // if (prevProps.message.content !== nextProps.message.content) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

    return true;
  }
);
