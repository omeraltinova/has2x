"use client";

import { useState, useEffect } from "react";
import { safeGetItem } from "@/lib/safeGetItem";
import { useHasHydrated } from "@/lib/useHasHydrated";

export type ThemeMode = "light" | "dark";
export type ThemePalette = "emerald" | "sunset" | "ocean" | "cyberpunk";

function resolveInitialMode(): ThemeMode {
  const savedMode = safeGetItem<ThemeMode | null>("theme-mode", null);
  if (savedMode === "dark" || savedMode === "light") return savedMode;
  
  const legacyTheme = safeGetItem<string | null>("theme", null);
  if (legacyTheme === "dark" || legacyTheme === "light") return legacyTheme;
  
  return "dark";
}

function resolveInitialPalette(): ThemePalette {
  const savedPalette = safeGetItem<ThemePalette | null>("theme-palette", null);
  if (
    savedPalette === "emerald" ||
    savedPalette === "sunset" ||
    savedPalette === "ocean" ||
    savedPalette === "cyberpunk"
  ) {
    return savedPalette;
  }
  return "emerald";
}

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(resolveInitialMode);
  const [themePalette, setThemePalette] = useState<ThemePalette>(resolveInitialPalette);
  const isHydrated = useHasHydrated();

  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.classList.toggle("dark", themeMode === "dark");
    document.documentElement.setAttribute("data-theme", themePalette);
  }, [isHydrated, themeMode, themePalette]);

  const setMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem("theme-mode", JSON.stringify(mode));
    localStorage.setItem("theme", JSON.stringify(mode));
    document.documentElement.classList.toggle("dark", mode === "dark");
  };

  const setPalette = (palette: ThemePalette) => {
    setThemePalette(palette);
    localStorage.setItem("theme-palette", JSON.stringify(palette));
    document.documentElement.setAttribute("data-theme", palette);
  };

  const toggleTheme = () => {
    const newMode = themeMode === "dark" ? "light" : "dark";
    setMode(newMode);
  };

  return {
    theme: themeMode,
    themeMode,
    themePalette,
    setMode,
    setPalette,
    toggleTheme,
  };
}
