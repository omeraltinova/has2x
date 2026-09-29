"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Info, Cpu, Sparkles, Zap, Smartphone } from "lucide-react";
import type { ServiceStatus } from "@/lib/services";

export function WidgetCard({ status }: { status: ServiceStatus }) {
  const [countdown, setCountdown] = useState("");
  const infoRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const placeTooltip = useCallback(() => {
    const button = infoRef.current;
    const tooltip = tooltipRef.current;
    if (!button || !tooltip) return;

    tooltip.style.left = "0px";
    tooltip.style.top = "0px";
    tooltip.style.transform = "none";
    const buttonRect = button.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 12;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const left = Math.max(margin, Math.min(buttonRect.left, viewportWidth - tooltipRect.width - margin));
    const below = buttonRect.bottom + 8;
    const above = buttonRect.top - tooltipRect.height - 8;
    const top = below + tooltipRect.height <= viewportHeight - margin
      ? below
      : above >= margin ? above : Math.max(margin, viewportHeight - tooltipRect.height - margin);

    tooltip.style.left = `${left - tooltipRect.left}px`;
    tooltip.style.top = `${top - tooltipRect.top}px`;
  }, []);

  useEffect(() => {
    const reposition = () => {
      if (infoRef.current?.matches(":hover, :focus")) placeTooltip();
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [placeTooltip]);
  
  useEffect(() => {
    if (!status.nextChangeAt) return;
    const tick = () => {
      const diff = status.nextChangeAt!.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("00:00");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      setCountdown(`${days}d ${hours}h`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [status.nextChangeAt]);

  const getLimitText = () => {
    if (status.rateUnit) return status.rateUnit;
    return status.isBonus ? "bonus limits" : "usage count";
  };

  const getServiceIcon = (name: string) => {
    switch (name) {
      case "GLM-5.3":
        return <Sparkles className="status-widget-icon" aria-hidden="true" />;
      case "GLM-5.3-Flash":
        return <Zap className="status-widget-icon" aria-hidden="true" />;
      case "DeepSeek API":
        return <Cpu className="status-widget-icon" aria-hidden="true" />;
      case "Xiaomi":
        return <Smartphone className="status-widget-icon" aria-hidden="true" />;
      default:
        return <Cpu className="status-widget-icon" aria-hidden="true" />;
    }
  };

  const detailsId = `widget-details-${status.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <article
      className={`status-widget status-widget--${status.statusColor}`}
      aria-label={`${status.name}: ${status.statusLabel}, ${status.multiplier}`}
    >
      <div className="status-widget-identity">
        <div className="status-widget-icon-wrap">
          {getServiceIcon(status.name)}
        </div>
        <div className="status-widget-title-group">
          <h3 className="status-widget-name">{status.name}</h3>
          {status.details && (
            <div className="status-widget-detail">
              <button
                ref={infoRef}
                type="button"
                className="status-widget-info"
                aria-label={`More information about ${status.name}`}
                aria-describedby={detailsId}
                onMouseEnter={placeTooltip}
                onFocus={placeTooltip}
              >
                <Info aria-hidden="true" />
              </button>
              <span ref={tooltipRef} id={detailsId} className="status-widget-tooltip" role="tooltip">
                {status.details}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="status-widget-state">
        <span className="status-widget-dot" aria-hidden="true" />
        <span>{status.statusLabel.split("—")[0].trim()}</span>
      </div>

      <div className="status-widget-metric">
        <span className="status-widget-multiplier">{status.multiplier}</span>
        <span className="status-widget-unit">{getLimitText()}</span>
      </div>

      {status.legacyRate && (
        <p className="status-widget-legacy">
          {status.legacyRate.label}: {status.legacyRate.multiplier} {status.legacyRate.unit}
        </p>
      )}

      {countdown && (
        <div className="status-widget-countdown">
          <span className="status-widget-countdown-label">In</span>
          <span className="status-widget-countdown-value">{countdown}</span>
        </div>
      )}
    </article>
  );
}
