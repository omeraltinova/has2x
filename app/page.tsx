"use client";

import { useState, useEffect, useRef } from "react";
import {
  getClaudeStatus,
  getGPTStatus,
  getGLMStatus,
  formatCountdown,
  type ServiceStatus,
} from "@/lib/services";

const SERVICES = [
  { name: "Claude", color: "text-orange-400" },
  { name: "ChatGPT", color: "text-green-400" },
  { name: "GLM", color: "text-cyan-400" },
];

function AnimatedHeader() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exit" | "enter">("visible");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const cycle = () => {
      setPhase("exit");
      timeout = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % SERVICES.length);
        setPhase("enter");
        timeout = setTimeout(() => {
          setPhase("visible");
          timeout = setTimeout(cycle, 2000);
        }, 50);
      }, 500);
    };

    timeout = setTimeout(cycle, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const transform =
    phase === "visible" || phase === "enter"
      ? "translate-y-0 opacity-100"
      : "-translate-y-[120%] opacity-0";

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100 sm:text-6xl flex items-center gap-0">
        <span>has</span>
        <span className="relative inline-flex h-[1.3em] min-w-[4em] overflow-hidden justify-center mx-1">
          <span
            className={`inline-flex items-center justify-center transition-all duration-500 ease-out ${transform} ${SERVICES[activeIndex].color}`}
          >
            {SERVICES[activeIndex].name}
          </span>
        </span>
        <span className="text-emerald-500">2x</span>
        <span className="text-zinc-600 text-2xl font-normal">?</span>
      </h1>
    </div>
  );
}

function StatusCard({ status }: { status: ServiceStatus }) {
  const nextChangeRef = useRef<Date | null>(null);
  const [countdown, setCountdown] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    nextChangeRef.current = status.nextChangeAt;
  }, [status.nextChangeAt]);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      const target = nextChangeRef.current;
      if (!target) {
        setCountdown("");
        return;
      }
      const diff = target.getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [mounted]);

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
    green: "text-emerald-400",
    red: "text-red-400",
    orange: "text-amber-400",
    gray: "text-zinc-500",
  }[status.statusColor];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 ${bgColor} p-6 shadow-lg ${glowColor} transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {status.name}
        </h2>
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
        <div className="mb-3 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Peak Hours (Local)
          </p>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {status.peakHoursLocal}
          </p>
        </div>
      )}

      {mounted && countdown && (
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

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [statuses, setStatuses] = useState<{
    claude: ServiceStatus;
    gpt: ServiceStatus;
    glm5: ServiceStatus;
    glm5Turbo: ServiceStatus;
  } | null>(null);
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    setMounted(true);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const update = () => {
      const now = new Date();
      const claude = getClaudeStatus(now);
      const gpt = getGPTStatus(now);
      const { glm5, glm5Turbo } = getGLMStatus(now);
      setStatuses({ claude, gpt, glm5, glm5Turbo });
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !statuses) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <AnimatedHeader />
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Real-time AI service usage multiplier tracker
          </p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Timezone: {timezone}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard status={statuses.claude} />
          <StatusCard status={statuses.gpt} />
          <StatusCard status={statuses.glm5} />
          <StatusCard status={statuses.glm5Turbo} />
        </div>

        <footer className="mt-12 text-center text-xs text-zinc-400 dark:text-zinc-600">
          <p>
            Data sourced from official announcements. Hours are automatically
            converted to your local timezone.
          </p>
        </footer>
      </div>
    </div>
  );
}
