"use client";

import { Loader2 } from "lucide-react";

interface ChatStatusBarProps {
  isLoading: boolean;
}

export function ChatStatusBar({ isLoading }: ChatStatusBarProps) {
  if (!isLoading) return null;

  return (
    <div className="text-xs text-slate-500">
      <div className="flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="font-medium">思考中...</span>
      </div>
    </div>
  );
}
