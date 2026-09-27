"use client";

import { useState, useEffect } from "react";
import { Info, Cpu, Sparkles, Zap, Smartphone } from "lucide-react";
import type { ServiceStatus } from "@/lib/services";

export function WidgetCard({ status }: { status: ServiceStatus }) {
  const [countdown, setCountdown] = useState("");
  
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
                type="button"
                className="status-widget-info"
                aria-label={`More information about ${status.name}`}
                aria-describedby={detailsId}
              >
                <Info aria-hidden="true" />
              </button>
              <span id={detailsId} className="status-widget-tooltip" role="tooltip">
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

      {countdown && (
        <div className="status-widget-countdown">
          <span className="status-widget-countdown-label">In</span>
          <span className="status-widget-countdown-value">{countdown}</span>
        </div>
      )}
    </article>
  );
}
