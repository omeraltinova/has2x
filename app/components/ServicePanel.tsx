"use client";

import { useEffect, useRef } from "react";
import { StatusCard } from "@/app/components/StatusCard";
import { Timeline } from "@/app/components/Timeline";
import type { PeakRange, ServiceStatus } from "@/lib/services";

type ServicePanelProps = {
  status: ServiceStatus;
  peakRanges: PeakRange[];
  currentHour: number;
  serviceColor: string;
  label: string;
  animateOnScroll?: boolean;
};

export function ServicePanel({
  status,
  peakRanges,
  currentHour,
  serviceColor,
  label,
  animateOnScroll = true,
}: ServicePanelProps) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (
      !animateOnScroll ||
      !panel ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        panel.classList.add("service-unit--revealed");
        observer.unobserve(panel);
      }
    }, { threshold: 0.14, rootMargin: "0px 0px -24px 0px" });

    observer.observe(panel);
    return () => observer.disconnect();
  }, [animateOnScroll]);

  return (
    <article ref={panelRef} className="service-unit" aria-label={`${status.name} status and schedule`}>
      <StatusCard status={status} />
      <div className="service-timeline">
        <Timeline
          peakRanges={peakRanges}
          currentHour={currentHour}
          serviceColor={serviceColor}
          label={label}
        />
      </div>
    </article>
  );
}
