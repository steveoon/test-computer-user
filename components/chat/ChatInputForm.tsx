"use client";

import { Input } from "@/components/input";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import { toast } from "sonner";
import { useInputHistoryStore } from "@/lib/stores/input-history-store";

interface ChatInputFormProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isInitializing: boolean;
  isLoading: boolean;
  status: "ready" | "error" | "submitted" | "streaming";
  stop: () => void;
  error: Error | undefined;
  isAuthenticated: boolean;
  append: (message: { role: "user"; content: string }) => void;
}

export function ChatInputForm({
  input,
  handleInputChange,
  handleSubmit,
  isInitializing,
  isLoading,
  status,
  stop,
  error,
  isAuthenticated,
  append,
}: ChatInputFormProps) {
  const { addToHistory } = useInputHistoryStore();
  
  const submitPrompt = (prompt: string) => {
    if (!isAuthenticated) {
      toast.error("请先登录", {
        description: "您需要登录后才能使用AI助手功能",
        richColors: true,
        position: "top-center",
      });
      return;
    }
    append({ role: "user", content: prompt });
  };

  return (
    <>
      {/* PromptSuggestions 始终显示在输入框上方 */}
      <PromptSuggestions
        disabled={isInitializing || !isAuthenticated}
        submitPrompt={submitPrompt}
      />

      <div className="bg-white">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            addToHistory(input);
          }
          handleSubmit(e);
        }} className="p-4">
          <Input
            handleInputChange={handleInputChange}
            input={input}
            isInitializing={isInitializing}
            isLoading={isLoading}
            status={status}
            stop={stop}
            error={error}
            isAuthenticated={isAuthenticated}
          />
        </form>
      </div>
    </>
  );
}
