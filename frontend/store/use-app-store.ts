"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Analysis, ChatMessage } from "@/lib/api";

const defaultMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "I can explain structured AI findings in plain language. I cannot diagnose from images, confirm cancer, or replace a physician."
  }
];

type AppState = {
  analyses: Analysis[];
  messages: ChatMessage[];
  darkMode: boolean;
  setAnalyses: (analyses: Analysis[]) => void;
  upsertAnalyses: (analyses: Analysis[]) => void;
  upsertAnalysis: (analysis: Analysis) => void;
  addMessage: (message: ChatMessage) => void;
  resetAiMemory: () => void;
  setDarkMode: (value: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      analyses: [],
      messages: defaultMessages,
      darkMode: false,
      setAnalyses: (analyses) => set({ analyses }),
      upsertAnalyses: (analyses) =>
        set((state) => {
          const merged = [...state.analyses];
          for (const analysis of analyses) {
            const existingIndex = merged.findIndex((item) => item.id === analysis.id);
            if (existingIndex === -1) {
              merged.unshift(analysis);
            } else {
              merged[existingIndex] = analysis;
            }
          }
          return { analyses: merged };
        }),
      upsertAnalysis: (analysis) =>
        set((state) => {
          const existingIndex = state.analyses.findIndex((item) => item.id === analysis.id);
          if (existingIndex === -1) {
            return { analyses: [analysis, ...state.analyses] };
          }

          const analyses = [...state.analyses];
          analyses[existingIndex] = analysis;
          return { analyses };
        }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      resetAiMemory: () => set({ analyses: [], messages: defaultMessages }),
      setDarkMode: (darkMode) => set({ darkMode })
    }),
    {
      name: "oncovision-ui"
    }
  )
);
