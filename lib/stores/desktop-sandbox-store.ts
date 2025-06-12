import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface DesktopSandboxState {
  // 状态
  sandboxId: string | null;
  streamUrl: string | null;
  sandboxStatus: "running" | "paused" | "unknown";
  isInitializing: boolean;
  isPausing: boolean;

  // Actions
  setSandboxId: (id: string | null) => void;
  setStreamUrl: (url: string | null) => void;
  setSandboxStatus: (status: "running" | "paused" | "unknown") => void;
  setIsInitializing: (initializing: boolean) => void;
  setIsPausing: (pausing: boolean) => void;
  reset: () => void;
}

const initialState = {
  sandboxId: null,
  streamUrl: null,
  sandboxStatus: "unknown" as const,
  isInitializing: false,
  isPausing: false,
};

export const useDesktopSandboxStore = create<DesktopSandboxState>()(
  devtools(
    (set) => ({
      ...initialState,

      setSandboxId: (id) => set({ sandboxId: id }),
      setStreamUrl: (url) => set({ streamUrl: url }),
      setSandboxStatus: (status) => set({ sandboxStatus: status }),
      setIsInitializing: (initializing) =>
        set({ isInitializing: initializing }),
      setIsPausing: (pausing) => set({ isPausing: pausing }),

      reset: () => set(initialState),
    }),
    {
      name: "desktop-sandbox-store",
    }
  )
);
