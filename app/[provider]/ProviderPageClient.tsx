"use client";

import { useMemo, Suspense } from "react";
import Link from "next/link";
import { useHasHydrated } from "@/lib/useHasHydrated";
import {
  getPeakRangesLocal,
  getWeekdayPeakRangesLocal,
  GLM_PEAK_WINDOWS,
  DEEPSEEK_PEAK_WINDOWS,
  getCurrentLocalHour,
  PROVIDERS,
  type ProviderKey,
  type PeakRange,
  type ServiceStatus,
} from "@/lib/services";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { ServicePanel } from "@/app/components/ServicePanel";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useDashboardState } from "@/app/components/DashboardStateProvider";
import type { AllStatuses } from "@/lib/useStatuses";

type ProviderServiceCard = {
  key: string;
  status: ServiceStatus;
  peakRanges: PeakRange[];
  currentHour: number;
  serviceColor: string;
  label: string;
};

function getProviderServiceCards(
  providerKey: ProviderKey,
  statuses: AllStatuses,
  scheduleNow: Date,
  currentHour: number,
): ProviderServiceCard[] {
  const services = PROVIDERS[providerKey].services;
  const cards: ProviderServiceCard[] = [];

  if (services.includes("glm53")) {
    cards.push({
      key: "glm53",
      status: statuses.glm53,
      peakRanges: getWeekdayPeakRangesLocal(GLM_PEAK_WINDOWS, scheduleNow),
      currentHour,
      serviceColor: "red",
      label: "GLM-5.3 Peak Hours",
    });
  }
  if (services.includes("glm53Flash")) {
    cards.push({
      key: "glm53Flash",
      status: statuses.glm53Flash,
      peakRanges: getWeekdayPeakRangesLocal(GLM_PEAK_WINDOWS, scheduleNow),
      currentHour,
      serviceColor: "red",
      label: "GLM-5.3-Flash Peak Hours",
    });
  }
  if (services.includes("deepseek")) {
    cards.push({
      key: "deepseek",
      status: statuses.deepseek,
      peakRanges: getWeekdayPeakRangesLocal(DEEPSEEK_PEAK_WINDOWS, scheduleNow),
      currentHour,
      serviceColor: "red",
      label: "DeepSeek API Peak Hours",
    });
  }
  if (services.includes("xiaomi")) {
    cards.push({
      key: "xiaomi",
      status: statuses.xiaomi,
      peakRanges: getPeakRangesLocal(16, 24, 0, scheduleNow),
      currentHour,
      serviceColor: "green",
      label: "Xiaomi Bonus Hours",
    });
  }

  return cards;
}

function ProviderServicesSection({
  providerKey,
  serviceCards,
}: {
  providerKey: ProviderKey;
  serviceCards: ProviderServiceCard[];
}) {
  return (
    <section
      className="services-section provider-services-section"
      aria-labelledby={`provider-services-heading-${providerKey}`}
    >
      <div className="section-heading">
        <div>
          <h2 id={`provider-services-heading-${providerKey}`}>Usage and schedules</h2>
          <p>Current multipliers and daily peak windows.</p>
        </div>
      </div>

      <div className={`service-grid ${serviceCards.length === 1 ? "service-grid--single" : ""}`}>
        {serviceCards.map(({ key, ...service }) => (
          <ServicePanel key={key} {...service} animateOnScroll={false} />
        ))}
      </div>
    </section>
  );
}

function ProviderContent({ providerKey }: { providerKey: ProviderKey }) {
  const provider = PROVIDERS[providerKey];
  const { statuses } = useDashboardState();
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const isHydrated = useHasHydrated();

  if (!isHydrated || !statuses) {
    return (
      <div className="dashboard-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-accent-text" />
      </div>
    );
  }

  const scheduleNow = new Date();
  const currentHour = getCurrentLocalHour(scheduleNow);
  const serviceCards = getProviderServiceCards(providerKey, statuses, scheduleNow, currentHour);

  return (
    <div className="dashboard-shell">
      <main className="dashboard-container">
        <SiteHeader
          activeProvider={providerKey}
          title={provider.name}
          description={provider.description}
          timezone={timezone}
        />

        <ProviderServicesSection
          key={providerKey}
          providerKey={providerKey}
          serviceCards={serviceCards}
        />

        <footer className="dashboard-footer">
          <div className="footer-notes">
            <p>Information may be inaccurate or outdated. For the most accurate data, visit the official service websites.</p>
            <p>The above figures are estimates. Actual available usage may vary depending on project complexity, repository size, and whether auto-accept is enabled.</p>
            {providerKey === "deepseek" && (
              <p>Chinese public holidays are off-peak. This tracker does not check holiday dates. See the <a href="https://api-docs.deepseek.com/quick_start/pricing/" target="_blank" rel="noopener noreferrer">official pricing schedule</a>.</p>
            )}
          </div>
          <p className="footer-credit">
            Built by <a href="https://www.omeraltinova.com.tr/" target="_blank" rel="noopener noreferrer">Faruk</a>
          </p>
        </footer>
      </main>
    </div>
  );
}

function ProviderPageInner({ providerKey }: { providerKey: ProviderKey }) {
  if (!(providerKey in PROVIDERS)) {
    return (
      <div className="dashboard-shell">
        <main className="dashboard-container">
          <section className="not-found">
            <h1>Provider not found</h1>
            <p>The provider &quot;{providerKey}&quot; does not exist.</p>
            <Link
              href="/"
              className="dashboard-action dashboard-action--primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </section>
        </main>
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
          <div className="dashboard-loading">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-accent-text" />
          </div>
        }
      >
        <ProviderPageInner providerKey={providerKey} />
      </Suspense>
    </ErrorBoundary>
  );
}
