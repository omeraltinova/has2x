"use client";

import { useState, useEffect } from "react";
import {
  formatCountdown,
  getBestTimeRecommendation,
} from "@/lib/services";

export function BestTimeCard({ recommendation }: { recommendation: ReturnType<typeof getBestTimeRecommendation> }) {
  const [countdown, setCountdown] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !recommendation.upcomingBestWindow) return;
    const targetDate = recommendation.upcomingBestWindow.nextChangeAt;
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [mounted, recommendation.upcomingBestWindow]);

  return (
    <div className="relative rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/20">
      <div className="absolute top-3 right-3">
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Best Time to Use</h2>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">{recommendation.summary}</p>

      {recommendation.nowBestServices.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {recommendation.nowBestServices.map((service) => (
            <span
              key={service.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-sm font-medium text-emerald-700 dark:text-emerald-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              {service.name} ({service.multiplier})
            </span>
          ))}
        </div>
      )}

      {mounted && recommendation.upcomingBestWindow && (
        <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-500/20">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Next optimal window</p>
          <p className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">{countdown}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            {recommendation.upcomingBestWindow.services.join(", ")} at {recommendation.upcomingBestWindow.time}
          </p>
        </div>
      )}

      {recommendation.isAllOptimal && (
        <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-500/20">
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Perfect time to use all services!
          </p>
        </div>
      )}
    </div>
  );
}
