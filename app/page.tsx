"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useHasHydrated } from "@/lib/useHasHydrated";
import { safeGetItem } from "@/lib/safeGetItem";
import {
  getPeakRangesLocal,
  getGLMPeakRangesLocal,
  getWeekdayPeakRangesLocal,
  DEEPSEEK_PEAK_WINDOWS,
  getCurrentLocalHour,
  getBestTimeRecommendation,
} from "@/lib/services";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { BestTimeCard } from "@/app/components/BestTimeCard";
import { ServicePanel } from "@/app/components/ServicePanel";
import { SiteHeader } from "@/app/components/SiteHeader";
import { WidgetCard } from "@/app/components/WidgetCard";
import { useDashboardState } from "@/app/components/DashboardStateProvider";

const ALL_SERVICES = ["glm53", "glm53Flash", "deepseek", "xiaomi"] as const;
type ServiceKey = typeof ALL_SERVICES[number];

function HomeContent({ isWidget, initialServices, hasServicesParam }: { isWidget: boolean; initialServices: ServiceKey[]; hasServicesParam: boolean }) {
  const { statuses } = useDashboardState();
  const recommendation = useMemo(() => {
    if (!statuses) return null;
    return getBestTimeRecommendation(
      statuses.glm53, statuses.glm53Flash, statuses.deepseek, statuses.xiaomi
    );
  }, [statuses]);
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [visibleServices, setVisibleServices] = useState<ServiceKey[]>(initialServices);
  const [showBestTime, setShowBestTime] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [widgetPreviewServices, setWidgetPreviewServices] = useState<ServiceKey[]>(initialServices);
  const [widgetWidth, setWidgetWidth] = useState("100%");
  const [widgetHeight, setWidgetHeight] = useState("400");
  const filterRef = useRef<HTMLDivElement>(null);
  const isHydrated = useHasHydrated();

  useEffect(() => {
    const initialize = () => {
      if (!hasServicesParam) {
        const parsedServices = safeGetItem<string[]>("visibleServices", []);
        const knownServices = safeGetItem<string[]>("knownServices", []);
        const validServices = parsedServices.filter((s): s is ServiceKey => ALL_SERVICES.includes(s as ServiceKey));
        if (validServices.length > 0) {
          const newServices = ALL_SERVICES.filter((s) => !knownServices.includes(s));
          setVisibleServices([...validServices, ...newServices]);
        }
      }
      localStorage.setItem("knownServices", JSON.stringify([...ALL_SERVICES]));

      const savedShowBestTime = safeGetItem<boolean | null>("showBestTime", null);
      if (savedShowBestTime !== null) {
        setShowBestTime(savedShowBestTime);
      }
    };

    const timeoutId = window.setTimeout(initialize, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasServicesParam]);

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

  if (!isHydrated || !statuses) {
    return (
      <div className="dashboard-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-accent-text" />
      </div>
    );
  }

  if (isWidget) {
    return (
      <div className="widget-page">
        <div className={`widget-grid ${visibleServices.length === 1 ? "widget-grid--single" : ""}`}>
          {visibleServices.includes("glm53") && <WidgetCard status={statuses.glm53} />}
          {visibleServices.includes("glm53Flash") && <WidgetCard status={statuses.glm53Flash} />}
          {visibleServices.includes("deepseek") && <WidgetCard status={statuses.deepseek} />}
          {visibleServices.includes("xiaomi") && <WidgetCard status={statuses.xiaomi} />}
        </div>
      </div>
    );
  }

  const scheduleNow = new Date();
  const currentHour = getCurrentLocalHour(scheduleNow);
  const services = [
    {
      key: "glm53",
      status: statuses.glm53,
      peakRanges: getGLMPeakRangesLocal(scheduleNow),
      currentHour,
      serviceColor: "red",
      label: "GLM-5.3 Rate Schedule",
    },
    {
      key: "glm53Flash",
      status: statuses.glm53Flash,
      peakRanges: getGLMPeakRangesLocal(scheduleNow),
      currentHour,
      serviceColor: "red",
      label: "GLM-5.3-Flash Rate Schedule",
    },
    {
      key: "deepseek",
      status: statuses.deepseek,
      peakRanges: getWeekdayPeakRangesLocal(DEEPSEEK_PEAK_WINDOWS, scheduleNow),
      currentHour,
      serviceColor: "red",
      label: "DeepSeek API Peak Hours",
    },
    {
      key: "xiaomi",
      status: statuses.xiaomi,
      peakRanges: getPeakRangesLocal(16, 24, 0, scheduleNow),
      currentHour,
      serviceColor: "green",
      label: "Xiaomi Bonus Hours",
    },
  ].filter((service) => visibleServices.includes(service.key as ServiceKey));
  const isFiltered = visibleServices.length < ALL_SERVICES.length || !showBestTime;

  return (
    <div className="dashboard-shell">
      <main className="dashboard-container">
        <SiteHeader
          activeProvider={null}
          title="Service overview"
          description="Compare peak and off-peak usage across providers."
          timezone={timezone}
        />

        {recommendation && showBestTime && (
          <div className="best-time-section">
            <BestTimeCard recommendation={recommendation} />
          </div>
        )}

        <section className="services-section" aria-labelledby="services-heading">
          <div className="section-heading">
            <div>
              <h2 id="services-heading">Usage by service</h2>
              <p>Current multipliers and daily peak windows.</p>
            </div>

            <div className="dashboard-actions">
              <div className="dashboard-tools" ref={filterRef}>
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`dashboard-action ${isFiltered ? "dashboard-action--active" : ""}`}
                  aria-expanded={showFilterMenu}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {isFiltered ? "Filtered" : "Filter"}
                </button>
                {showFilterMenu && (
                  <div className="filter-menu">
                    <label className="filter-option filter-option--featured">
                      <input
                        type="checkbox"
                        checked={showBestTime}
                        onChange={() => setShowBestTime(!showBestTime)}
                        className="h-4 w-4 rounded border-zinc-300 text-accent focus:ring-accent"
                      />
                      <span>Best time to use</span>
                    </label>
                    {[
                      { key: "glm53" as const, label: "GLM-5.3" },
                      { key: "glm53Flash" as const, label: "GLM-5.3-Flash" },
                      { key: "deepseek" as const, label: "DeepSeek API" },
                      { key: "xiaomi" as const, label: "Xiaomi" },
                    ].map((service) => (
                      <label key={service.key} className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleServices.includes(service.key)}
                          onChange={() => toggleService(service.key)}
                          className="h-4 w-4 rounded border-zinc-300 text-accent focus:ring-accent"
                        />
                        <span>{service.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setWidgetPreviewServices(visibleServices);
                  setShowWidgetModal(true);
                }}
                className="dashboard-action dashboard-action--primary"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Get widget
              </button>
            </div>
          </div>

          {services.length > 0 ? (
            <div className={`service-grid service-grid--overview ${services.length === 1 ? "service-grid--single" : ""}`}>
              {services.map(({ key, ...service }) => (
                <ServicePanel key={key} {...service} />
              ))}
            </div>
          ) : (
            <p className="empty-state">No services selected. Open Filter to choose what to show.</p>
          )}
        </section>

        <footer className="dashboard-footer">
          <div className="footer-notes">
            <p>Information may be inaccurate or outdated. For the most accurate data, visit the official service websites.</p>
            <p>The above figures are estimates. Actual available usage may vary depending on project complexity, repository size, and whether auto-accept is enabled.</p>
            <p>DeepSeek treats Chinese public holidays as off-peak. This tracker does not check holiday dates. See the <a href="https://api-docs.deepseek.com/quick_start/pricing/" target="_blank" rel="noopener noreferrer">official pricing schedule</a>.</p>
          </div>
          <p className="footer-credit">
            Built by{" "}
              <a
                href="https://www.omeraltinova.com.tr/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Faruk
              </a>
          </p>
        </footer>

        {showWidgetModal && (
          <div className="widget-modal-overlay" onClick={() => setShowWidgetModal(false)}>
            <div className="widget-modal" role="dialog" aria-modal="true" aria-labelledby="widget-modal-title" onClick={(e) => e.stopPropagation()}>
              <div className="widget-modal-controls">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="widget-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Embed widget</h3>
                  <button onClick={() => setShowWidgetModal(false)} className="widget-modal-close" aria-label="Close widget dialog">
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
                      { key: "glm53" as const, label: "GLM-5.3" },
                      { key: "glm53Flash" as const, label: "GLM-5.3-Flash" },
                      { key: "deepseek" as const, label: "DeepSeek API" },
                      { key: "xiaomi" as const, label: "Xiaomi" },
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
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-accent focus:ring-accent"
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
                      className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Height:</label>
                    <input
                      type="text"
                      value={widgetHeight}
                      onChange={(e) => setWidgetHeight(e.target.value)}
                      placeholder="400px or 100%"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent"
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
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">?services=glm53,deepseek</code>
                </div>
              </div>

              <div className="widget-modal-preview">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Live preview ({widgetWidth} × {widgetHeight}):
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
      </main>
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

  return <HomeContent isWidget={isWidget} initialServices={initialServices} hasServicesParam={servicesParam !== null} />;
}

export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="dashboard-loading">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-accent-text" />
        </div>
      }>
        <HomeWithParams />
      </Suspense>
    </ErrorBoundary>
  );
}
