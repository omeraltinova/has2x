"use client";

import { useState, useEffect } from "react";
import { Info, Bot, Cpu, Sparkles, MessageSquare, Zap } from "lucide-react";
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

  const colorStyles = {
    green: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/5",
      border: "border-emerald-500/30 hover:border-emerald-500/50",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
      icon: "text-emerald-600 dark:text-emerald-500",
    },
    red: {
      bg: "bg-red-500/10 dark:bg-red-500/5",
      border: "border-red-500/30 hover:border-red-500/50",
      text: "text-red-700 dark:text-red-400",
      dot: "bg-red-500",
      icon: "text-red-600 dark:text-red-500",
    },
    orange: {
      bg: "bg-amber-500/10 dark:bg-amber-500/5",
      border: "border-amber-500/30 hover:border-amber-500/50",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
      icon: "text-amber-600 dark:text-amber-500",
    },
    gray: {
      bg: "bg-zinc-500/10 dark:bg-zinc-500/5",
      border: "border-zinc-500/30 hover:border-zinc-500/50",
      text: "text-zinc-600 dark:text-zinc-400",
      dot: "bg-zinc-500",
      icon: "text-zinc-500 dark:text-zinc-500",
    },
  }[status.statusColor];

  const isBonusService = status.name === "Claude" || status.name === "Codex";
  const limitText = isBonusService ? `${status.multiplier} bonus limits` : `${status.multiplier} usage count`;

  const getServiceIcon = (name: string) => {
    switch (name) {
      case "Claude":
        return <Bot className={`w-5 h-5 ${colorStyles.icon}`} />;
      case "Codex":
        return <MessageSquare className={`w-5 h-5 ${colorStyles.icon}`} />;
      case "GLM-5.1":
        return <Sparkles className={`w-5 h-5 ${colorStyles.icon}`} />;
      case "GLM-5-Turbo":
        return <Zap className={`w-5 h-5 ${colorStyles.icon}`} />;
      default:
        return <Cpu className={`w-5 h-5 ${colorStyles.icon}`} />;
    }
  };

  return (
    <div className={`relative rounded-xl border ${colorStyles.bg} ${colorStyles.border} p-4 flex items-center justify-between gap-4 min-w-[220px] shadow-sm hover:shadow-md transition-all duration-300 overflow-visible group/card`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800`}>
          {getServiceIcon(status.name)}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {status.name}
            </h3>
            {status.details && (
              <div className="group/tooltip relative flex items-center">
                <Info className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-900/95 backdrop-blur-sm text-zinc-100 text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border border-white/10 translate-y-1 group-hover/tooltip:translate-y-0">
                  {status.details}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-900/95"></div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-xl font-bold ${colorStyles.text} tracking-tight leading-none`}>
              {status.multiplier}
            </span>
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {limitText.replace(status.multiplier, '').trim()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 text-right">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {status.statusColor === "green" && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorStyles.dot}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${colorStyles.dot}`}></span>
          </span>
          <span className={`text-xs font-medium ${colorStyles.text}`}>
            {status.statusLabel.split('—')[0].trim()}
          </span>
        </div>
        
        {countdown && (
          <div className="mt-1 bg-white/50 dark:bg-zinc-900/50 px-2 py-0.5 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block leading-tight">Changes in</span>
            <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 leading-tight tracking-tight">{countdown}</span>
          </div>
        )}
      </div>
    </div>
  );
}
