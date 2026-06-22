"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";

export function ThemeSync() {
  const darkMode = useAppStore((state) => state.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return null;
}
