"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useHasHydrated } from "@/lib/useHasHydrated";
import { useTheme } from "@/lib/useTheme";
import { ThemeSelector } from "@/app/components/ThemeSelector";
import { useStatuses } from "@/lib/useStatuses";
import {
  getPeakRangesLocal,
  getCurrentLocalHour,
  PROVIDERS,
  type ProviderKey,
  type ServiceStatus,
} from "@/lib/services";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { Timeline, AlwaysActiveTimeline } from "@/app/components/Timeline";
import { StatusCard } from "@/app/components/StatusCard";

const PROVIDER_COLORS: Record<string, { bg: string; border: string; text: string; hoverBg: string }> = {
  orange: {
    bg: "bg-orange-500/10 dark:bg-orange-500/5",
    border: "border-orange-500/30 hover:border-orange-500/50",
    text: "text-orange-600 dark:text-orange-400",
    hoverBg: "hover:bg-orange-500/10",
  },
  green: {
    bg: "bg-accent/10 dark:bg-accent/5",
    border: "border-accent/30 hover:border-accent/50",
    text: "text-accent-text",
    hoverBg: "hover:bg-accent/10",
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

function ProviderContent({ providerKey }: { providerKey: ProviderKey }) {
  const provider = PROVIDERS[providerKey];
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const statuses = useStatuses();
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const { theme } = useTheme();
  const isHydrated = useHasHydrated();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  if (!isHydrated || !statuses) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "dark-grid-bg" : "light-grid-bg"}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-accent-text" />
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
  if (providerServices.includes("glm5Turbo")) serviceCards.push({ key: "glm5Turbo", status: statuses.glm5Turbo });
  if (providerServices.includes("xiaomi")) serviceCards.push({ key: "xiaomi", status: statuses.xiaomi });

  return (
    <div
      className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden ${theme === "dark" ? "dark-grid-bg" : "light-grid-bg"}`}
      onMouseMove={handleMouseMove}
    >
      <ThemeSelector />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--accent-glow), transparent 40%)`,
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
                <span className="text-accent-text">2x<span className="text-zinc-400">?</span></span>
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
              <AlwaysActiveTimeline currentHour={getCurrentLocalHour(new Date())} label="Claude Code Limit Window" markerLabel="(normal)" footer="No peak-hour reduction for Claude Code Pro/Max" />
            </div>
          )}
          {providerServices.includes("codex") && (
            <div className="w-full">
              <AlwaysActiveTimeline currentHour={getCurrentLocalHour(new Date())} />
            </div>
          )}
          {providerServices.includes("glm51") && (
            <div className="w-full">
              <Timeline peakRanges={getPeakRangesLocal(14, 18, 8, new Date())} currentHour={getCurrentLocalHour(new Date())} serviceColor="red" label="GLM Peak Hours" />
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
                className="text-accent-text hover:text-accent transition-colors"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/15 border border-accent/30 text-accent-text hover:bg-accent/25 transition-colors font-medium"
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-accent-text" />
          </div>
        }
      >
        <ProviderPageInner providerKey={providerKey} />
      </Suspense>
    </ErrorBoundary>
  );
}
