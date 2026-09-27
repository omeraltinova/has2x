"use client";

import { useState, useRef, useEffect } from "react";
import { Palette, Sun, Moon, Check } from "lucide-react";
import { useTheme, type ThemePalette } from "@/lib/useTheme";

export function ThemeSelector() {
  const { themeMode, themePalette, setMode, setPalette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const palettes: { id: ThemePalette; name: string; bg: string }[] = [
    { id: "emerald", name: "Emerald", bg: "bg-emerald-500" },
    { id: "sunset", name: "Sunset", bg: "bg-rose-500" },
    { id: "ocean", name: "Ocean", bg: "bg-blue-500" },
    { id: "cyberpunk", name: "Cyberpunk", bg: "bg-purple-500" },
  ];

  return (
    <div className="relative z-50" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-trigger"
        aria-label="Customize theme"
        aria-expanded={isOpen}
      >
        <Palette className="w-5 h-5 text-accent-text transition-colors duration-200" />
      </button>

      {isOpen && (
        <div className="theme-menu">
          <h3 className="theme-menu-title">
            Appearance
          </h3>

          {/* Theme Mode Section */}
          <div className="mb-4">
            <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Mode
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("light")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  themeMode === "light"
                    ? "bg-zinc-100 dark:bg-zinc-800 border-accent/40 text-accent-text"
                    : "bg-transparent border-zinc-200 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => setMode("dark")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  themeMode === "dark"
                    ? "bg-zinc-100 dark:bg-zinc-800 border-accent/40 text-accent-text"
                    : "bg-transparent border-zinc-200 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </div>

          {/* Theme Palette Section */}
          <div>
            <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Color palette
            </span>
            <div className="flex flex-col gap-1">
              {palettes.map((p) => {
                const isActive = themePalette === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPalette(p.id)}
                    className={`flex items-center justify-between w-full p-2 rounded-lg text-left text-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer ${
                      isActive
                        ? "font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-800"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full ${p.bg} ring-2 ring-offset-2 dark:ring-offset-zinc-900 ${
                          isActive ? "ring-accent/80" : "ring-transparent"
                        }`}
                      />
                      {p.name}
                    </div>
                    {isActive && <Check className="w-4 h-4 text-accent-text" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
