"use client";

import { useState, useEffect } from "react";
import { formatCountdown, type ServiceStatus } from "@/lib/services";
import { useHasHydrated } from "@/lib/useHasHydrated";

export function StatusCard({ status }: { status: ServiceStatus }) {
  const [countdown, setCountdown] = useState("");
  const isHydrated = useHasHydrated();

  useEffect(() => {
    if (!isHydrated || !status.nextChangeAt) return;

    const nextChangeAt = status.nextChangeAt;

    const tick = () => {
      const diff = nextChangeAt.getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    };

    const timeoutId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, 200);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [isHydrated, status.nextChangeAt]);

  const bgColor = {
    green: "border-emerald-500/40 bg-emerald-500/5",
    red: "border-red-500/40 bg-red-500/5",
    orange: "border-amber-500/40 bg-amber-500/5",
    gray: "border-zinc-500/40 bg-zinc-500/5",
  }[status.statusColor];

  const badgeColor = {
    green: "bg-emerald-500 text-white",
    red: "bg-red-500 text-white",
    orange: "bg-amber-500 text-white",
    gray: "bg-zinc-500 text-white",
  }[status.statusColor];

  const glowColor = {
    green: "shadow-emerald-500/20",
    red: "shadow-red-500/20",
    orange: "shadow-amber-500/20",
    gray: "shadow-zinc-500/10",
  }[status.statusColor];

  const multiplierColor = {
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-amber-600 dark:text-amber-400",
    gray: "text-zinc-500",
  }[status.statusColor];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 ${bgColor} p-6 shadow-lg ${glowColor} transition-all duration-300 hover:scale-[1.02] h-full`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {status.name}
          </h2>
          {status.details && (
            <div className="group relative">
              <button
                className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                i
              </button>
              <div className="absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
                {status.details}
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-800 dark:bg-zinc-700"></div>
              </div>
            </div>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}
        >
          {status.multiplier}
        </span>
      </div>

      <div className="mb-3">
        <span
          className={`inline-block rounded-lg px-3 py-1.5 text-sm font-semibold ${badgeColor}`}
        >
          {status.statusLabel}
        </span>
      </div>

      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        {status.description}
      </p>

      {status.peakHoursLocal && (
        <div className="mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Peak Hours (Local)
          </p>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {status.peakHoursLocal}
          </p>
        </div>
      )}

      {isHydrated && status.nextChangeAt && countdown && (
        <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-700/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            {status.nextChangeLabel}
          </p>
          <p
            className={`text-2xl font-mono font-bold tabular-nums ${multiplierColor}`}
          >
            {countdown}
          </p>
        </div>
      )}

      {status.promotionExpired && (
        <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-700/50">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
            Promotion has expired
          </p>
        </div>
      )}
    </div>
  );
}
