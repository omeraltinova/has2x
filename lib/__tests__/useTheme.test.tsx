import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../useTheme";
import { describe, it, expect, beforeEach } from "vitest";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  it("should initialize with default mode (dark) and palette (emerald)", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeMode).toBe("dark");
    expect(result.current.themePalette).toBe("emerald");
  });

  it("should initialize from localStorage if present", () => {
    localStorage.setItem("theme-mode", JSON.stringify("light"));
    localStorage.setItem("theme-palette", JSON.stringify("sunset"));

    const { result } = renderHook(() => useTheme());
    expect(result.current.themeMode).toBe("light");
    expect(result.current.themePalette).toBe("sunset");
  });

  it("should allow changing mode and sync to localStorage", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setMode("light");
    });

    expect(result.current.themeMode).toBe("light");
    expect(JSON.parse(localStorage.getItem("theme-mode") || "")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("should allow changing palette and sync to localStorage", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setPalette("ocean");
    });

    expect(result.current.themePalette).toBe("ocean");
    expect(JSON.parse(localStorage.getItem("theme-palette") || "")).toBe("ocean");
    expect(document.documentElement.getAttribute("data-theme")).toBe("ocean");
  });

  it("should toggle mode via toggleTheme", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.themeMode).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.themeMode).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
