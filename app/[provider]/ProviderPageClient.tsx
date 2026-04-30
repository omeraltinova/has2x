"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useHasHydrated } from "@/lib/useHasHydrated";
import {
  getClaudeStatus,
  getGPTStatus,
  getGLMStatus,
  getXiaomiStatus,
  getPeakRangesLocal,
  getCurrentLocalHour,
  PROVIDERS,
  type ProviderKey,
  type ServiceStatus,
} from "@/lib/services";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { Timeline, CodexTimeline } from "@/app/components/Timeline";
import { StatusCard } from "@/app/components/StatusCard";

const PROVIDER_COLORS: Record<string, { bg: string; border: string; text: string; hoverBg: string }> = {
  orange: {
    bg: "bg-orange-500/10 dark:bg-orange-500/5",
    border: "border-orange-500/30 hover:border-orange-500/50",
    text: "text-orange-600 dark:text-orange-400",
    hoverBg: "hover:bg-orange-500/10",
  },
  green: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/5",
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    text: "text-emerald-600 dark:text-emerald-400",
    hoverBg: "hover:bg-emerald-500/10",
  },
  cyan: {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/5",
    border: "border-cyan-500/30 hover:border-cyan-500/50",
    text: "text-cyan-600 dark:text-cyan-400",
    hoverBg: "hover:bg-cyan-500/10",
  },
  yellow: {
    bg: "bg-yellow-500/10 dark:bg-yellow-500/5",
    border: "border-yellow-500/30 hover:border-yellow-500/50",
    text: "text-yellow-600 dark:text-yellow-400",
    hoverBg: "hover:bg-yellow-500/10",
  },
};

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function ProviderContent({ providerKey }: { providerKey: ProviderKey }) {
  const provider = PROVIDERS[providerKey];
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [statuses, setStatuses] = useState<{
    claude: ServiceStatus;
    gpt: ServiceStatus;
    glm51: ServiceStatus;
    glm5: ServiceStatus;
    glm5Turbo: ServiceStatus;
    xiaomi: ServiceStatus;
  } | null>(null);
  const [timezone, setTimezone] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isHydrated = useHasHydrated();

  useEffect(() => {
    let intervalId: number | null = null;

    const initialize = () => {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

      const saved = safeGetItem<string | null>("theme", null);
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
      } else {
        document.documentElement.classList.add("dark");
      }

      const update = () => {
        const now = new Date();
        const claude = getClaudeStatus(now);
        const gpt = getGPTStatus(now);
        const { glm51, glm5, glm5Turbo } = getGLMStatus(now);
        const xiaomi = getXiaomiStatus(now);
        setStatuses({ claude, gpt, glm51, glm5, glm5Turbo, xiaomi });
      };

      update();
      intervalId = window.setInterval(update, 30000);
    };

    const timeoutId = window.setTimeout(initialize, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  if (!isHydrated || !statuses) {
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

  const providerServices = provider.services;
  const colors = PROVIDER_COLORS[provider.color] || PROVIDER_COLORS.green;

  const serviceCards: { key: string; status: ServiceStatus; isCodex?: boolean }[] = [];
  if (providerServices.includes("claude")) serviceCards.push({ key: "claude", status: statuses.claude });
  if (providerServices.includes("codex")) serviceCards.push({ key: "codex", status: statuses.gpt, isCodex: true });
  if (providerServices.includes("glm51")) serviceCards.push({ key: "glm51", status: statuses.glm51 });
  if (providerServices.includes("glm5")) serviceCards.push({ key: "glm5", status: statuses.glm5 });
  if (providerServices.includes("glm5Turbo")) serviceCards.push({ key: "glm5Turbo", status: statuses.glm5Turbo });
  if (providerServices.includes("xiaomi")) serviceCards.push({ key: "xiaomi", status: statuses.xiaomi });

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
      <div className="mx-auto max-w-5xl relative z-10">
        <header className="mb-8">
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-600 dark:text-zinc-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All Services
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
                has
                <span className={`ml-1 ${colors.text}`}>{provider.name}</span>
                <span className="text-emerald-500">2x<span className="text-zinc-400">?</span></span>
              </h1>
            </div>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {provider.description}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Timezone: {timezone}
            </p>
          </div>

          <nav className="mt-6 flex justify-center gap-3">
            {(Object.entries(PROVIDERS) as [ProviderKey, typeof PROVIDERS[ProviderKey]][]).map(([key, p]) => {
              const pColors = PROVIDER_COLORS[p.color] || PROVIDER_COLORS.green;
              const isCurrent = key === providerKey;
              return (
                <Link
                  key={key}
                  href={`/${key}`}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isCurrent
                      ? `${pColors.bg} ${pColors.border} ${pColors.text}`
                      : `bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700`
                  }`}
                >
                  {p.name}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className={`grid gap-6 ${
          serviceCards.length === 1
            ? "grid-cols-1 max-w-md mx-auto"
            : serviceCards.length === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
        }`}>
          {serviceCards.map(({ key, status }) => (
            <div key={key} className="h-full">
              <StatusCard status={status} />
            </div>
          ))}
        </div>

        <div className={`mt-8 grid gap-6 ${
          providerServices.length === 1
            ? "grid-cols-1 max-w-md mx-auto"
            : providerServices.length === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
        }`}>
          {providerServices.includes("claude") && (
            <div className="w-full">
              <Timeline peakRanges={getPeakRangesLocal(5, 11, -7, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="Claude Peak Hours" />
            </div>
          )}
          {providerServices.includes("codex") && (
            <div className="w-full">
              <CodexTimeline currentHour={getCurrentLocalHour(new Date())} />
            </div>
          )}
          {providerServices.includes("glm51") && (
            <div className="w-full">
              <Timeline peakRanges={getPeakRangesLocal(14, 18, 8, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="GLM Peak Hours" />
            </div>
          )}
          {providerServices.includes("glm5") && (
            <div className="w-full">
              <Timeline peakRanges={getPeakRangesLocal(14, 18, 8, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="GLM-5 Peak Hours" />
            </div>
          )}
          {providerServices.includes("glm5Turbo") && (
            <div className="w-full">
              <Timeline peakRanges={getPeakRangesLocal(14, 18, 8, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="GLM-5-Turbo Peak Hours" />
            </div>
          )}
          {providerServices.includes("xiaomi") && (
            <div className="w-full">
              <Timeline peakRanges={getPeakRangesLocal(16, 24, 0, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="green" label="Xiaomi Bonus Hours" />
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-zinc-500">
          <p>Information may be inaccurate or outdated. For the most accurate data, please visit the official service websites.</p>
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
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
      </div>
    </div>
  );
}

function ProviderPageInner({ providerKey }: { providerKey: ProviderKey }) {
  if (!(providerKey in PROVIDERS)) {
    return (
      <div className="flex min-h-screen items-center justify-center dark-grid-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Provider Not Found</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">The provider &quot;{providerKey}&quot; does not exist.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return <ProviderContent providerKey={providerKey} />;
}

export function ProviderPageClient({ providerKey }: { providerKey: ProviderKey }) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center dark-grid-bg">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
          </div>
        }
      >
        <ProviderPageInner providerKey={providerKey} />
      </Suspense>
    </ErrorBoundary>
  );
}
