"use client";

import { useState, useEffect, useRef } from "react";
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
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100 sm:text-6xl flex items-center gap-0">
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
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">{label}</p>
      <div className="relative pt-7">
        {hoveredHour !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-700 text-[10px] text-zinc-200 whitespace-nowrap z-20 pointer-events-none"
            style={{ left: tooltipX }}
          >
            {hoveredHour.toString().padStart(2, "0")}:00
            <span className={`ml-1 ${isHoveredPeak ? "text-red-400" : "text-emerald-400"}`}>
              {isHoveredPeak ? "(Peak)" : "(Off-peak)"}
            </span>
          </div>
        )}
        <div 
          className="relative h-2 rounded-full overflow-hidden bg-zinc-800/80 shadow-inner cursor-crosshair"
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
      <div className="flex justify-between text-[9px] text-zinc-500 mt-1.5 px-0.5">
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
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">Codex Peak Hours</p>
      <div className="relative pt-7">
        {hoveredHour !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-700 text-[10px] text-zinc-200 whitespace-nowrap z-20 pointer-events-none"
            style={{ left: tooltipX }}
          >
            {hoveredHour.toString().padStart(2, "0")}:00
            <span className="ml-1 text-emerald-400">(2×)</span>
          </div>
        )}
        <div 
          className="relative h-2 rounded-full overflow-hidden bg-zinc-800/80 shadow-inner cursor-crosshair"
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
      <p className="text-[9px] text-zinc-500 mt-1.5">24/7 active — no peak hours</p>
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
    <div className="relative rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 shadow-lg shadow-emerald-500/20">
      <div className="absolute top-3 right-3">
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h2 className="text-xl font-bold text-zinc-100">Best Time to Use</h2>
      </div>

      <p className="text-sm text-zinc-300 mb-4">{recommendation.summary}</p>

      {recommendation.nowBestServices.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {recommendation.nowBestServices.map((service) => (
            <span
              key={service.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {service.name} ({service.multiplier})
            </span>
          ))}
        </div>
      )}

      {mounted && recommendation.upcomingBestWindow && (
        <div className="mt-4 pt-4 border-t border-emerald-500/20">
          <p className="text-xs text-zinc-400 mb-1">Next optimal window</p>
          <p className="text-lg font-mono font-bold text-amber-400">{countdown}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {recommendation.upcomingBestWindow.services.join(", ")} at {recommendation.upcomingBestWindow.time}
          </p>
        </div>
      )}

      {recommendation.isAllOptimal && (
        <div className="mt-4 pt-4 border-t border-emerald-500/20">
          <p className="text-emerald-400 font-semibold flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {status.name}
          </h2>
          {status.details && (
            <div className="group relative">
              <button
                className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-300 text-xs font-bold text-zinc-600 hover:bg-zinc-400 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [statuses, setStatuses] = useState<{
    claude: ServiceStatus;
    gpt: ServiceStatus;
    glm5: ServiceStatus;
    glm5Turbo: ServiceStatus;
  } | null>(null);
  const [recommendation, setRecommendation] = useState<ReturnType<typeof getBestTimeRecommendation> | null>(null);
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
      setRecommendation(getBestTimeRecommendation(claude, gpt, glm5, glm5Turbo));
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  if (!mounted || !statuses) {
    return (
      <div className="flex min-h-screen items-center justify-center dark-grid-bg">
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

  return (
    <div 
      className="min-h-screen bg-zinc-50 dark-grid-bg px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
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
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Timezone: {timezone}
          </p>
        </header>

        {recommendation && (
          <div className="mb-8">
            <BestTimeCard recommendation={recommendation} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard status={statuses.claude} />
          <StatusCard status={statuses.gpt} />
          <StatusCard status={statuses.glm5} />
          <StatusCard status={statuses.glm5Turbo} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Timeline
            peakRanges={getPeakRangesLocal(8, 14, -4, new Date())}
            currentHour={getCurrentLocalHour(new Date())}
            serviceColor="red"
            label="Claude Peak Hours"
          />
          <CodexTimeline currentHour={getCurrentLocalHour(new Date())} />
          <Timeline
            peakRanges={getPeakRangesLocal(14, 18, 8, new Date())}
            currentHour={getCurrentLocalHour(new Date())}
            serviceColor="red"
            label="GLM-5 Peak Hours"
          />
          <Timeline
            peakRanges={getPeakRangesLocal(14, 18, 8, new Date())}
            currentHour={getCurrentLocalHour(new Date())}
            serviceColor="red"
            label="GLM-5-Turbo Peak Hours"
          />
        </div>

        <footer className="mt-12 text-center text-xs text-zinc-400 dark:text-zinc-600">
          <p>
            Information may be inaccurate or outdated. For the most accurate data, please visit the official service websites.
          </p>
          <p className="mt-2">
            Built by{" "}
            <a
              href="https://www.omeraltinova.com.tr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Faruk
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
