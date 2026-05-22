"use client";

import { useState, useEffect } from "react";
import { safeGetItem } from "@/lib/safeGetItem";
import { useHasHydrated } from "@/lib/useHasHydrated";

function resolveInitialTheme(): "dark" | "light" {
  const saved = safeGetItem<string | null>("theme", null);
  if (saved === "dark" || saved === "light") return saved;
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(resolveInitialTheme);
  const isHydrated = useHasHydrated();

  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [isHydrated, theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", JSON.stringify(newTheme));
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return { theme, toggleTheme };
}
