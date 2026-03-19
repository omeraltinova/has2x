"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getClaudeStatus,
  getGPTStatus,
  getGLMStatus,
  formatCountdown,
  getPeakRangesLocal,
  getCurrentLocalHour,
  getBestTimeRecommendation,
  type ServiceStatus,
  type PeakRange,
} from "@/lib/services";

const SERVICES = [
  { name: "Claude", color: "text-orange-400" },
  { name: "Codex", color: "text-green-400" },
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
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl flex items-center gap-0">
        <span>has</span>
        <span className="relative inline-flex h-[1.3em] min-w-[4em] overflow-hidden justify-center mx-1">
          <span
            className={`inline-flex items-center justify-center transition-all duration-500 ease-out ${transform} ${SERVICES[activeIndex].color}`}
          >
            {SERVICES[activeIndex].name}
          </span>
        </span>
        <span className="text-emerald-500">2x<span className="text-zinc-400">?</span></span>
      </h1>
    </div>
  );
}

function Timeline({
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const hour = Math.floor(pct * 24);
    setHoveredHour(Math.max(0, Math.min(23, hour)));
    setTooltipX(x);
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

function CodexTimeline({ currentHour }: { currentHour: number }) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [tooltipX, setTooltipX] = useState(0);

  const currentPct = ((currentHour + 0.5) / 24) * 100;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const hour = Math.floor(pct * 24);
    setHoveredHour(Math.max(0, Math.min(23, hour)));
    setTooltipX(x);
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

function BestTimeCard({ recommendation }: { recommendation: ReturnType<typeof getBestTimeRecommendation> }) {
  const [countdown, setCountdown] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !recommendation.upcomingBestWindow) return;
    const tick = () => {
      const next = recommendation.upcomingBestWindow;
      if (next) {
        const [days, hours, minutes, seconds] = next.countdown.split(/[dhms]/).map((s) => parseInt(s.trim()) || 0);
        let totalMs = 0;
        if (next.countdown.includes("d")) {
          totalMs = days * 86400000 + hours * 3600000 + minutes * 60000 + seconds * 1000;
        } else {
          const parts = next.countdown.split(":").map(Number);
          totalMs = parts[0] * 3600000 + parts[1] * 60000 + parts[2] * 1000;
        }
        setCountdown(formatCountdown(totalMs));
      }
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

const ALL_SERVICES = ["claude", "codex", "glm5", "glm5Turbo"] as const;
type ServiceKey = typeof ALL_SERVICES[number];

function HomeContent({ isWidget, initialServices }: { isWidget: boolean; initialServices: ServiceKey[] }) {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [statuses, setStatuses] = useState<{
    claude: ServiceStatus;
    gpt: ServiceStatus;
    glm5: ServiceStatus;
    glm5Turbo: ServiceStatus;
  } | null>(null);
  const [recommendation, setRecommendation] = useState<ReturnType<typeof getBestTimeRecommendation> | null>(null);
  const [timezone, setTimezone] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [visibleServices, setVisibleServices] = useState<ServiceKey[]>(initialServices);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }

    const update = () => {
      const now = new Date();
      const claude = getClaudeStatus(now);
      const gpt = getGPTStatus(now);
      const { glm5, glm5Turbo } = getGLMStatus(now);
      setStatuses({ claude, gpt, glm5, glm5Turbo });
      setRecommendation(getBestTimeRecommendation(claude, gpt, glm5, glm5Turbo));
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleService = (service: ServiceKey) => {
    setVisibleServices((prev) => {
      if (prev.includes(service)) {
        return prev.filter((s) => s !== service);
      }
      return [...prev, service];
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  if (!mounted || !statuses) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "dark-grid-bg" : "light-grid-bg"}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: `radial-gradient(600px circle at 50% 50%, rgba(16, 185, 129, 0.06), transparent 40%)`,
          }}
        />
      </div>
    );
  }

  if (isWidget) {
    return (
      <div className={`min-h-screen p-4 ${theme === "dark" ? "dark-grid-bg" : "light-grid-bg"}`}>
        <div className="flex justify-center gap-4 flex-wrap">
          {visibleServices.includes("claude") && <StatusCard status={statuses.claude} />}
          {visibleServices.includes("codex") && <StatusCard status={statuses.gpt} />}
          {visibleServices.includes("glm5") && <StatusCard status={statuses.glm5} />}
          {visibleServices.includes("glm5Turbo") && <StatusCard status={statuses.glm5Turbo} />}
        </div>
        <div className="mt-4 flex justify-center gap-4 flex-wrap">
          {visibleServices.includes("claude") && <Timeline peakRanges={getPeakRangesLocal(8, 14, -4, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="Claude Peak Hours" />}
          {visibleServices.includes("codex") && <CodexTimeline currentHour={getCurrentLocalHour(new Date())} />}
          {visibleServices.includes("glm5") && <Timeline peakRanges={getPeakRangesLocal(14, 18, 8, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="GLM-5 Peak Hours" />}
          {visibleServices.includes("glm5Turbo") && <Timeline peakRanges={getPeakRangesLocal(14, 18, 8, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="GLM-5-Turbo Peak Hours" />}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden ${theme === "dark" ? "dark-grid-bg" : "light-grid-bg"}`}
      onMouseMove={handleMouseMove}
    >
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.06), transparent 40%)`,
        }}
      />
      <div className="mx-auto max-w-6xl relative z-10">
        <header className="mb-10 text-center">
          <AnimatedHeader />
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Real-time AI service usage multiplier tracker
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
            Timezone: {timezone}
          </p>
        </header>

        {recommendation && (
          <div className="mb-8">
            <BestTimeCard recommendation={recommendation} />
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-6 items-stretch">
          {visibleServices.includes("claude") && <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-[350px] flex"><StatusCard status={statuses.claude} /></div>}
          {visibleServices.includes("codex") && <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-[350px] flex"><StatusCard status={statuses.gpt} /></div>}
          {visibleServices.includes("glm5") && <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-[350px] flex"><StatusCard status={statuses.glm5} /></div>}
          {visibleServices.includes("glm5Turbo") && <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-[350px] flex"><StatusCard status={statuses.glm5Turbo} /></div>}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {visibleServices.includes("claude") && <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-[350px]"><Timeline peakRanges={getPeakRangesLocal(8, 14, -4, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="Claude Peak Hours" /></div>}
          {visibleServices.includes("codex") && <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-[350px]"><CodexTimeline currentHour={getCurrentLocalHour(new Date())} /></div>}
          {visibleServices.includes("glm5") && <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-[350px]"><Timeline peakRanges={getPeakRangesLocal(14, 18, 8, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="GLM-5 Peak Hours" /></div>}
          {visibleServices.includes("glm5Turbo") && <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-[350px]"><Timeline peakRanges={getPeakRangesLocal(14, 18, 8, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="GLM-5-Turbo Peak Hours" /></div>}
        </div>

        <footer className="mt-12 text-center text-xs text-zinc-500">
          <p>
            Information may be inaccurate or outdated. For the most accurate data, please visit the official service websites.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors text-zinc-700 dark:text-zinc-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>
              {showFilterMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 min-w-[140px] z-50">
                  {[
                    { key: "claude" as const, label: "Claude" },
                    { key: "codex" as const, label: "Codex" },
                    { key: "glm5" as const, label: "GLM-5" },
                    { key: "glm5Turbo" as const, label: "GLM-5-Turbo" },
                  ].map((service) => (
                    <label
                      key={service.key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleServices.includes(service.key)}
                        onChange={() => toggleService(service.key)}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{service.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowWidgetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Get Widget
            </button>
            <span className="text-zinc-400">Built by{" "}
              <a
                href="https://www.omeraltinova.com.tr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Faruk
              </a>
            </span>
          </div>
        </footer>

        {showWidgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowWidgetModal(false)}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Embed Widget</h3>
                <button onClick={() => setShowWidgetModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Add this iframe to your website to embed the tracker. Use URL parameters to customize which services to show.
              </p>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 font-mono text-xs break-all text-zinc-700 dark:text-zinc-300">
                {`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/?widget=true&services=${visibleServices.join(",")}" width="100%" height="600" frameborder="0"></iframe>`}
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <span className="text-xs text-zinc-500">Parameters:</span>
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">?widget=true</code>
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">?services=codex,glm5</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeWithParams() {
  const searchParams = useSearchParams();
  const isWidget = searchParams.get("widget") === "true";
  const servicesParam = searchParams.get("services");
  
  const initialServices: ServiceKey[] = servicesParam
    ? servicesParam.split(",").filter((s): s is ServiceKey => ALL_SERVICES.includes(s as ServiceKey))
    : [...ALL_SERVICES];

  return <HomeContent isWidget={isWidget} initialServices={initialServices} />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center dark-grid-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
      </div>
    }>
      <HomeWithParams />
    </Suspense>
  );
}