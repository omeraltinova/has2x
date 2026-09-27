"use client";

import { createContext, useContext } from "react";
import { useStatuses, type AllStatuses } from "@/lib/useStatuses";

type DashboardStatus = {
  statuses: AllStatuses | null;
};

const DashboardStateContext = createContext<DashboardStatus | null>(null);

export function DashboardStateProvider({ children }: { children: React.ReactNode }) {
  const statuses = useStatuses();

  return (
    <DashboardStateContext.Provider value={{ statuses }}>
      {children}
    </DashboardStateContext.Provider>
  );
}

export function useDashboardState() {
  const state = useContext(DashboardStateContext);
  if (!state) throw new Error("useDashboardState must be used within DashboardStateProvider");
  return state;
}
