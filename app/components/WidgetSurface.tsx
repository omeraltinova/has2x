"use client";

import { useEffect, useRef } from "react";
import { WidgetCard } from "@/app/components/WidgetCard";
import type { AllStatuses } from "@/lib/useStatuses";
import type { WidgetLayout } from "@/lib/widget";

type ServiceKey = keyof AllStatuses;

export function WidgetSurface({ statuses, services, layout }: { statuses: AllStatuses; services: ServiceKey[]; layout: WidgetLayout }) {
  const surfaceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || window.parent === window) return;
    const sendHeight = () => window.parent.postMessage({ type: "has2x:resize", height: Math.ceil(surface.getBoundingClientRect().height) }, "*");
    const observer = new ResizeObserver(sendHeight);
    observer.observe(surface);
    sendHeight();
    return () => observer.disconnect();
  }, []);

  return (
    <main ref={surfaceRef} className="widget-page" data-layout={layout}>
      <header className="widget-header">
        <div><h1>Usage rates</h1><p>Based on your local time</p></div>
        <span className="widget-brand" aria-label="has2x">has<span>2x</span></span>
      </header>
      {services.length > 0 ? (
        <div className="widget-grid">
          {services.map((key) => <WidgetCard key={key} status={statuses[key]} />)}
        </div>
      ) : <p className="widget-empty">No services selected. Add a valid service key to the URL.</p>}
    </main>
  );
}
