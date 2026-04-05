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
    green: "bg-emerald-500/5 border-emerald-500/30",
    red: "bg-red-500/5 border-red-500/30",
    orange: "bg-amber-500/5 border-amber-500/30",
    gray: "bg-zinc-500/5 border-zinc-500/30",
  }[status.statusColor];

  const glowColor = {
    green: "hover:shadow-emerald-500/20",
    red: "hover:shadow-red-500/20",
    orange: "hover:shadow-amber-500/20",
    gray: "hover:shadow-zinc-500/10",
  }[status.statusColor];

  const textColor = {
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-amber-600 dark:text-amber-400",
    gray: "text-zinc-500 dark:text-zinc-400",
  }[status.statusColor];

  const isBonusService = status.name === "Claude" || status.name === "Codex";
  const limitText = isBonusService ? `${status.multiplier} bonus limits` : `${status.multiplier} usage count`;

  return (
    <div
      className={`relative rounded-xl border ${bgColor} p-4 flex items-center justify-between gap-4 min-w-[220px] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-sm hover:shadow-md ${glowColor} overflow-visible group/card`}
    >
      {/* Subtle pulse effect for the border on hover */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent transition-colors duration-500 group-hover/card:border-white/10 dark:group-hover/card:border-white/5 pointer-events-none"></div>

      <div className="flex flex-col relative z-10">
        <div className="flex items-center gap-1.5 mb-1">
          {/* Status Indicator Dot */}
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status.statusColor === 'green' ? 'bg-emerald-400' :
              status.statusColor === 'red' ? 'bg-red-400' :
              status.statusColor === 'orange' ? 'bg-amber-400' : 'bg-zinc-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              status.statusColor === 'green' ? 'bg-emerald-500' :
              status.statusColor === 'red' ? 'bg-red-500' :
              status.statusColor === 'orange' ? 'bg-amber-500' : 'bg-zinc-500'
            }`}></span>
          </span>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{status.name}</h3>
          {status.details && (
            <div className="group relative z-50">
              <button
                className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-600 focus:outline-none"
                aria-label="More information"
              >
                i
              </button>
              <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-200 opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 pointer-events-none scale-95 group-hover:scale-100 origin-bottom dark:bg-zinc-700">
                {status.details}
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-800 dark:bg-zinc-700"></div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${textColor}`}>{status.multiplier}</span>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{limitText}</span>
        </div>
      </div>
      {countdown && (
        <div className="flex flex-col items-end relative z-10">
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Changes in</span>
          <div className="bg-white/60 dark:bg-black/30 rounded-md px-2 py-1 border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner flex items-center justify-center">
            <span className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">{countdown}</span>
          </div>
        </div>
      )}
    </div>
  );
}
