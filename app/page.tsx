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
import { WidgetBuilder } from "@/app/components/WidgetBuilder";
import { WidgetSurface } from "@/app/components/WidgetSurface";
import { useDashboardState } from "@/app/components/DashboardStateProvider";
import { readWidgetAppearance, type WidgetLayout } from "@/lib/widget";

const ALL_SERVICES = ["glm53", "glm53Flash", "deepseek", "xiaomi"] as const;
type ServiceKey = typeof ALL_SERVICES[number];

function HomeContent({ isWidget, initialServices, hasServicesParam, widgetLayout }: { isWidget: boolean; initialServices: ServiceKey[]; hasServicesParam: boolean; widgetLayout: WidgetLayout }) {
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
  const filterRef = useRef<HTMLDivElement>(null);
  const isHydrated = useHasHydrated();

  useEffect(() => {
    if (isWidget) return;
    const initialize = () => {
      if (!hasServicesParam) {
        const parsedServices = safeGetItem<string[]>("visibleServices", []);
        const knownServices = safeGetItem<string[]>("knownServices", []);
        const validServices = [...new Set(parsedServices.filter((s): s is ServiceKey => ALL_SERVICES.includes(s as ServiceKey)))];
        if (validServices.length > 0) {
          const newServices = ALL_SERVICES.filter((s) => !knownServices.includes(s) && !validServices.includes(s));
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
  }, [hasServicesParam, isWidget]);

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
    if (isWidget) return;
    localStorage.setItem("visibleServices", JSON.stringify(visibleServices));
    localStorage.setItem("showBestTime", JSON.stringify(showBestTime));
  }, [visibleServices, showBestTime, isWidget]);

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
    return <WidgetSurface statuses={statuses} services={visibleServices} layout={widgetLayout} />;
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

        {showWidgetModal && <WidgetBuilder initialServices={visibleServices} onClose={() => setShowWidgetModal(false)} />}
      </main>
    </div>
  );
}

function HomeWithParams() {
  const searchParams = useSearchParams();
  const isWidget = searchParams.get("widget") === "true";
  const servicesParam = searchParams.get("services");
  
  const initialServices: ServiceKey[] = servicesParam
    ? [...new Set(servicesParam.split(",").filter((s): s is ServiceKey => ALL_SERVICES.includes(s as ServiceKey)))]
    : [...ALL_SERVICES];

  const { layout } = readWidgetAppearance(new URLSearchParams(searchParams.toString()));
  return <HomeContent isWidget={isWidget} initialServices={initialServices} hasServicesParam={servicesParam !== null} widgetLayout={layout} />;
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
