"use client";

import { useState, useEffect } from "react";
import type { ServiceStatus } from "@/lib/services";

export function WidgetCard({ status }: { status: ServiceStatus }) {
  const [countdown, setCountdown] = useState("");
  
  useEffect(() => {
    if (!status.nextChangeAt) return;
    const tick = () => {
      const diff = status.nextChangeAt!.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("00:00");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [status.nextChangeAt]);

  const bgColor = {
    green: "bg-emerald-500/10 border-emerald-500/30",
    red: "bg-red-500/10 border-red-500/30",
    orange: "bg-amber-500/10 border-amber-500/30",
    gray: "bg-zinc-500/10 border-zinc-500/30",
  }[status.statusColor];

  const textColor = {
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-amber-600 dark:text-amber-400",
    gray: "text-zinc-500",
  }[status.statusColor];

  const isBonusService = status.name === "Claude" || status.name === "Codex";
  const limitText = isBonusService ? `${status.multiplier} bonus limits` : `${status.multiplier} usage count`;

  return (
    <div className={`rounded-lg border ${bgColor} p-3 flex items-center justify-between gap-3 min-w-[200px]`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{status.name}</h3>
          {status.details && (
            <div className="group relative">
              <button className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600">
                i
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 px-2 py-1 bg-zinc-800 text-zinc-200 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {status.details}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800"></div>
              </div>
            </div>
          )}
        </div>
        <span className={`text-lg font-bold ${textColor}`}>{status.multiplier}</span>
        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">{limitText}</span>
      </div>
      {countdown && (
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Changes in</span>
          <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{countdown}</span>
        </div>
      )}
    </div>
  );
}
