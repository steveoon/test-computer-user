"use client";

import type { Message } from "@ai-sdk/react";
import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import equal from "fast-deep-equal";
import { cn } from "@/lib/utils";
import { MessagePartsAdapter } from "./message-parts-adapter";

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
            "flex gap-4 rounded-xl",
            message.role === "user"
              ? "justify-end pt-5"
              : "justify-start pt-2"
          )}
        >
          {message.role === "assistant" && (
            <div className="flex flex-col w-full space-y-2">
              <MessagePartsAdapter
                message={message}
                isLatestMessage={isLatestMessage}
                status={status}
              />
            </div>
          )}

          {message.role === "user" && (
            <div className="max-w-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md">
              <div className="prose dark:prose-invert text-zinc-900 dark:text-zinc-50">
                {message.content}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLatestMessage !== nextProps.isLatestMessage) return false;
    if (prevProps.status !== nextProps.status) return false;
    return equal(prevProps.message, nextProps.message);
  }
);

export function Messages({
  messages,
  isLoading,
  status,
}: {
  messages: Message[];
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
}) {
  return (
    <div className="flex flex-col gap-0 h-full">
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          message={message}
          isLoading={isLoading}
          status={status}
          isLatestMessage={index === messages.length - 1}
        />
      ))}
    </div>
  );
}