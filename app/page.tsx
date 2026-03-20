"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getClaudeStatus,
  getGPTStatus,
  getGLMStatus,
  getPeakRangesLocal,
  getCurrentLocalHour,
  getBestTimeRecommendation,
  type ServiceStatus,
} from "@/lib/services";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { AnimatedHeader } from "@/app/components/AnimatedHeader";
import { Timeline, CodexTimeline } from "@/app/components/Timeline";
import { BestTimeCard } from "@/app/components/BestTimeCard";
import { StatusCard } from "@/app/components/StatusCard";
import { WidgetCard } from "@/app/components/WidgetCard";

const ALL_SERVICES = ["claude", "codex", "glm5", "glm5Turbo"] as const;
type ServiceKey = typeof ALL_SERVICES[number];

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

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
  const [showBestTime, setShowBestTime] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [widgetPreviewServices, setWidgetPreviewServices] = useState<ServiceKey[]>(initialServices);
  const [widgetWidth, setWidgetWidth] = useState("100%");
  const [widgetHeight, setWidgetHeight] = useState("400");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const saved = safeGetItem<string | null>("theme", null);
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }

    const parsedServices = safeGetItem<string[]>("visibleServices", []);
    const validServices = parsedServices.filter((s): s is ServiceKey => ALL_SERVICES.includes(s as ServiceKey));
    if (validServices.length > 0) {
      setVisibleServices(validServices);
    }

    const savedShowBestTime = safeGetItem<boolean | null>("showBestTime", null);
    if (savedShowBestTime !== null) {
      setShowBestTime(savedShowBestTime);
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

  useEffect(() => {
    if (showWidgetModal) {
      setWidgetPreviewServices(visibleServices);
    }
  }, [showWidgetModal, visibleServices]);

  useEffect(() => {
    localStorage.setItem("visibleServices", JSON.stringify(visibleServices));
    localStorage.setItem("showBestTime", JSON.stringify(showBestTime));
  }, [visibleServices, showBestTime]);

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
      <div className={`min-h-screen p-2 ${theme === "dark" ? "dark-grid-bg" : "light-grid-bg"}`}>
        <div className="flex flex-wrap justify-center gap-2">
          {visibleServices.includes("claude") && <WidgetCard status={statuses.claude} />}
          {visibleServices.includes("codex") && <WidgetCard status={statuses.gpt} />}
          {visibleServices.includes("glm5") && <WidgetCard status={statuses.glm5} />}
          {visibleServices.includes("glm5Turbo") && <WidgetCard status={statuses.glm5Turbo} />}
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

        {recommendation && showBestTime && (
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  visibleServices.length < 4 || !showBestTime
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {visibleServices.length < 4 || !showBestTime ? 'Filtered' : 'Filter'}
              </button>
              {showFilterMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 min-w-[180px] z-50">
                  <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer border-b border-zinc-200 dark:border-zinc-700 mb-1">
                    <input
                      type="checkbox"
                      checked={showBestTime}
                      onChange={() => setShowBestTime(!showBestTime)}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Best Time to Use</span>
                  </label>
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
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
              {/* Left Side - Controls */}
              <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-700 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Embed Widget</h3>
                  <button onClick={() => setShowWidgetModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Customize which services to show in the widget preview.
                </p>

                {/* Service Toggles */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Select Services:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "claude" as const, label: "Claude" },
                      { key: "codex" as const, label: "Codex" },
                      { key: "glm5" as const, label: "GLM-5" },
                      { key: "glm5Turbo" as const, label: "GLM-5-Turbo" },
                    ].map((service) => (
                      <label
                        key={service.key}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={widgetPreviewServices.includes(service.key)}
                          onChange={() => {
                            setWidgetPreviewServices((prev) =>
                              prev.includes(service.key)
                                ? prev.filter((s) => s !== service.key)
                                : [...prev, service.key]
                            );
                          }}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{service.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Controls */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Width:</label>
                    <input
                      type="text"
                      value={widgetWidth}
                      onChange={(e) => setWidgetWidth(e.target.value)}
                      placeholder="100% or 800px"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Height:</label>
                    <input
                      type="text"
                      value={widgetHeight}
                      onChange={(e) => setWidgetHeight(e.target.value)}
                      placeholder="400px or 100%"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Iframe Code */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Embed Code:</p>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 font-mono text-xs break-all text-zinc-700 dark:text-zinc-300">
                    {`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/?widget=true&services=${widgetPreviewServices.join(",")}" width="${widgetWidth}" height="${widgetHeight.includes('%') ? widgetHeight : `${widgetHeight}px`}" frameborder="0"></iframe>`}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-zinc-500">Parameters:</span>
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">?widget=true</code>
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">?services=codex,glm5</code>
                </div>
              </div>

              {/* Right Side - Preview */}
              <div className="w-full md:w-1/2 bg-zinc-50 dark:bg-zinc-950 p-6">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Live Preview ({widgetWidth} × {widgetHeight}):
                </p>
                <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 mx-auto" style={{ width: widgetWidth.includes('px') ? widgetWidth : '100%', height: widgetHeight.includes('%') || widgetHeight === 'auto' ? widgetHeight : `${widgetHeight}px`, maxWidth: '100%' }}>
                  {typeof window !== "undefined" && (
                    <iframe
                      src={`${window.location.origin}/?widget=true&services=${widgetPreviewServices.join(",")}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="Widget Preview"
                      className="bg-white dark:bg-zinc-900"
                    />
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  {widgetPreviewServices.length} service{widgetPreviewServices.length !== 1 ? 's' : ''} selected
                </p>
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
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center dark-grid-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
        </div>
      }>
        <HomeWithParams />
      </Suspense>
    </ErrorBoundary>
  );
}