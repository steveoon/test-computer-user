import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface InputHistoryState {
  readonly history: string[];
  readonly currentIndex: number;
  readonly tempInput: string | null;
}

interface InputHistoryActions {
  readonly addToHistory: (input: string) => void;
  readonly navigateHistory: (direction: "up" | "down") => string | null;
  readonly resetIndex: () => void;
  readonly setTempInput: (input: string) => void;
}

type InputHistoryStore = InputHistoryState & InputHistoryActions;

const MAX_HISTORY_SIZE = 10;

export const useInputHistoryStore = create<InputHistoryStore>()(
  persist(
    (set, get) => ({
      // State
      history: [],
      currentIndex: -1,
      tempInput: null,

      // Actions
      addToHistory: input => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        set(state => {
          const newHistory = [...state.history];

          // Remove duplicate if exists
          const existingIndex = newHistory.indexOf(trimmedInput);
          if (existingIndex !== -1) {
            newHistory.splice(existingIndex, 1);
          }

          // Add to the end
          newHistory.push(trimmedInput);

          // Keep only the last MAX_HISTORY_SIZE items
          if (newHistory.length > MAX_HISTORY_SIZE) {
            newHistory.shift();
          }

          return {
            history: newHistory,
            currentIndex: -1,
            tempInput: null,
          };
        });
      },

      navigateHistory: direction => {
        const state = get();
        const { history, currentIndex, tempInput } = state;

        if (history.length === 0) return null;

        let newIndex = currentIndex;

        if (direction === "up") {
          if (currentIndex === -1) {
            // First time pressing up, save current input
            newIndex = history.length - 1;
          } else if (currentIndex > 0) {
            newIndex = currentIndex - 1;
          }
        } else if (direction === "down") {
          if (currentIndex < history.length - 1) {
            newIndex = currentIndex + 1;
          } else if (currentIndex === history.length - 1) {
            // Return to the temp input
            newIndex = -1;
          }
        }

        set({ currentIndex: newIndex });

        if (newIndex === -1) {
          return tempInput || "";
        }

        return history[newIndex] || null;
      },

      resetIndex: () => {
        set({ currentIndex: -1, tempInput: null });
      },

      setTempInput: input => {
        set({ tempInput: input });
      },
    }),
    {
      name: "input-history-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        // Only persist history
        history: state.history,
      }),
    }
  )
);
