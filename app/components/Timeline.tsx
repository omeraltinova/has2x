"use client";

import { useState, useCallback } from "react";
import type { PeakRange } from "@/lib/services";

export function Timeline({
  peakRanges,
  currentHour,
  serviceColor,
  label,
}: {
  peakRanges: PeakRange[];
  currentHour: number;
  serviceColor: string;
  label: string;
}) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [tooltipX, setTooltipX] = useState(0);

  const gradientStops: string[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const isInPeak = peakRanges.some(
      (r) => hour >= r.startHour && hour < r.endHour
    );
    const pct = (hour / 24) * 100;
    const nextPct = ((hour + 1) / 24) * 100;
    
    if (isInPeak) {
      const color = serviceColor === "red" ? "239, 68, 68" : "245, 158, 11";
      gradientStops.push(`rgba(${color}, 0.5) ${pct}%`);
      gradientStops.push(`rgba(${color}, 0.5) ${nextPct}%`);
    } else {
      gradientStops.push(`rgba(16, 185, 129, 0.4) ${pct}%`);
      gradientStops.push(`rgba(16, 185, 129, 0.4) ${nextPct}%`);
    }
  }

  const currentPct = ((currentHour + 0.5) / 24) * 100;

  const updateHourFromPosition = useCallback((clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const pct = x / rect.width;
    const hour = Math.floor(pct * 24);
    setHoveredHour(Math.max(0, Math.min(23, hour)));
    setTooltipX(x);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateHourFromPosition(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    updateHourFromPosition(touch.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    updateHourFromPosition(touch.clientX, e.currentTarget.getBoundingClientRect());
  };

  const isHoveredPeak = hoveredHour !== null && peakRanges.some(
    (r) => hoveredHour >= r.startHour && hoveredHour < r.endHour
  );

  return (
    <div className="mb-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{label}</p>
      <div className="relative pt-7">
        {hoveredHour !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-600 dark:bg-zinc-700 text-[10px] text-zinc-100 dark:text-zinc-200 whitespace-nowrap z-20 pointer-events-none"
            style={{ left: tooltipX }}
          >
            {hoveredHour.toString().padStart(2, "0")}:00
            <span className={`ml-1 ${isHoveredPeak ? "text-red-400" : "text-emerald-400"}`}>
              {isHoveredPeak ? "(Peak)" : "(Off-peak)"}
            </span>
          </div>
        )}
        <div 
          className="relative h-2 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800/80 shadow-inner cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredHour(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setHoveredHour(null)}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${gradientStops.join(", ")})`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-lg shadow-white/50 z-10"
            style={{ left: `calc(${currentPct}% - 3px)` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[9px] text-zinc-400 dark:text-zinc-500 mt-1.5 px-0.5">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}

export function CodexTimeline({ currentHour }: { currentHour: number }) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [tooltipX, setTooltipX] = useState(0);

  const currentPct = ((currentHour + 0.5) / 24) * 100;

  const updateHourFromPosition = useCallback((clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const pct = x / rect.width;
    const hour = Math.floor(pct * 24);
    setHoveredHour(Math.max(0, Math.min(23, hour)));
    setTooltipX(x);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateHourFromPosition(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    updateHourFromPosition(touch.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    updateHourFromPosition(touch.clientX, e.currentTarget.getBoundingClientRect());
  };

  return (
    <div className="mb-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Codex Peak Hours</p>
      <div className="relative pt-7">
        {hoveredHour !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-600 dark:bg-zinc-700 text-[10px] text-zinc-100 dark:text-zinc-200 whitespace-nowrap z-20 pointer-events-none"
            style={{ left: tooltipX }}
          >
            {hoveredHour.toString().padStart(2, "0")}:00
            <span className="ml-1 text-emerald-400">(2x)</span>
          </div>
        )}
        <div 
          className="relative h-2 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800/80 shadow-inner cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredHour(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setHoveredHour(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/50 via-emerald-400/40 to-emerald-500/50" />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-lg shadow-white/50 z-10"
            style={{ left: `calc(${currentPct}% - 3px)` }}
          />
        </div>
      </div>
      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1.5">24/7 active - no peak hours</p>
    </div>
  );
}
