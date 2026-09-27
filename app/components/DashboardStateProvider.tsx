"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useStatuses, type AllStatuses } from "@/lib/useStatuses";
import type { ProviderKey } from "@/lib/services";

type ProviderTransition = {
  from: ProviderKey;
  to: ProviderKey;
};

type DashboardState = {
  statuses: AllStatuses | null;
  providerTransition: ProviderTransition | null;
  beginProviderTransition: (from: ProviderKey, to: ProviderKey) => void;
  clearProviderTransition: () => void;
  finishProviderTransition: (to: ProviderKey) => void;
};

const DashboardStateContext = createContext<DashboardState | null>(null);

export function DashboardStateProvider({ children }: { children: React.ReactNode }) {
  const statuses = useStatuses();
  const [providerTransition, setProviderTransition] = useState<ProviderTransition | null>(null);

  const beginProviderTransition = useCallback((from: ProviderKey, to: ProviderKey) => {
    if (from !== to) setProviderTransition({ from, to });
  }, []);
  const clearProviderTransition = useCallback(() => setProviderTransition(null), []);
  const finishProviderTransition = useCallback((to: ProviderKey) => {
    setProviderTransition((current) => current?.to === to ? null : current);
  }, []);

  useEffect(() => {
    if (!providerTransition) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeoutId = window.setTimeout(() => {
      setProviderTransition((current) => (
        current?.from === providerTransition.from && current.to === providerTransition.to ? null : current
      ));
    }, prefersReducedMotion ? 1000 : 2000);

    return () => window.clearTimeout(timeoutId);
  }, [providerTransition]);

  return (
    <DashboardStateContext.Provider
      value={{ statuses, providerTransition, beginProviderTransition, clearProviderTransition, finishProviderTransition }}
    >
      {children}
    </DashboardStateContext.Provider>
  );
}

export function useDashboardState() {
  const state = useContext(DashboardStateContext);
  if (!state) throw new Error("useDashboardState must be used within DashboardStateProvider");
  return state;
}
