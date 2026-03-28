export type ServiceStatus = {
  name: string;
  multiplier: string;
  isBonus: boolean;
  statusLabel: string;
  statusColor: "green" | "red" | "orange" | "gray";
  nextChangeAt: Date | null;
  nextChangeLabel: string;
  promotionEnd: Date;
  promotionExpired: boolean;
  peakHoursLocal: string;
  description: string;
  details?: string;
};

// Claude: Peak 5AM-11AM PT weekdays — reduced 5-hour session limits during peak
// Weekly limits unchanged. Off-peak = normal session limits.
export function getClaudeStatus(now: Date): ServiceStatus {
  // PT is currently PDT (UTC-7) in late March 2026
  const ptOffset = -7;
  const ptTime = new Date(now.getTime() + ptOffset * 60 * 60 * 1000);
  const ptHour = ptTime.getUTCHours();
  const ptDay = ptTime.getUTCDay(); // 0=Sun, 6=Sat

  const isWeekday = ptDay >= 1 && ptDay <= 5;
  const isPeak = isWeekday && ptHour >= 5 && ptHour < 11;

  // Calculate next change
  let nextChangeAt: Date;
  if (isPeak) {
    // Peak ends at 11:00 PT
    const nextOff = new Date(ptTime);
    nextOff.setUTCHours(11, 0, 0, 0);
    nextChangeAt = new Date(nextOff.getTime() - ptOffset * 60 * 60 * 1000);
  } else if (isWeekday && ptHour < 5) {
    // Before peak starts today
    const nextPeak = new Date(ptTime);
    nextPeak.setUTCHours(5, 0, 0, 0);
    nextChangeAt = new Date(nextPeak.getTime() - ptOffset * 60 * 60 * 1000);
  } else if (isWeekday && ptHour >= 11) {
    // After peak, next peak is tomorrow (or Monday if Friday)
    const nextPeak = new Date(ptTime);
    if (ptDay === 5) {
      // Friday -> Monday
      nextPeak.setUTCDate(nextPeak.getUTCDate() + 3);
    } else {
      nextPeak.setUTCDate(nextPeak.getUTCDate() + 1);
    }
    nextPeak.setUTCHours(5, 0, 0, 0);
    nextChangeAt = new Date(nextPeak.getTime() - ptOffset * 60 * 60 * 1000);
  } else {
    // Weekend — next peak is Monday 5 AM PT
    const daysUntilMonday = ptDay === 0 ? 1 : 8 - ptDay;
    const nextPeak = new Date(ptTime);
    nextPeak.setUTCDate(nextPeak.getUTCDate() + daysUntilMonday);
    nextPeak.setUTCHours(5, 0, 0, 0);
    nextChangeAt = new Date(nextPeak.getTime() - ptOffset * 60 * 60 * 1000);
  }

  const peakStartLocal = formatHourInLocal(5, ptOffset, now);
  const peakEndLocal = formatHourInLocal(11, ptOffset, now);

  return {
    name: "Claude",
    multiplier: isPeak ? "↓" : "1×",
    isBonus: !isPeak,
    statusLabel: isPeak ? "Peak — Reduced Limits" : "Off-Peak — Normal Limits",
    statusColor: isPeak ? "red" : "green",
    nextChangeAt,
    nextChangeLabel: isPeak ? "Off-peak starts in" : "Peak starts in",
    promotionEnd: new Date("2099-12-31"),
    promotionExpired: false,
    peakHoursLocal: `${peakStartLocal} – ${peakEndLocal} (weekdays)`,
    description: isPeak
      ? "Peak hours active — 5-hour session limits are reduced. Weekly limits unchanged."
      : "Off-peak — normal 5-hour session limits. Weekly limits unchanged.",
    details: "Anthropic's Claude. Peak hours: 5AM-11AM PT weekdays. During peak, 5-hour session limits are lower than normal. Off-peak gets normal session limits. Weekly limits remain the same.",
  };
}

// GPT: 2x all the time until April 2, 2026
export function getGPTStatus(now: Date): ServiceStatus {
  const promotionEnd = new Date("2026-04-02T23:59:59Z");
  const promotionExpired = now >= promotionEnd;

  if (promotionExpired) {
    return {
      name: "Codex",
      multiplier: "1×",
      isBonus: false,
      statusLabel: "Promotion Ended",
      statusColor: "gray",
      nextChangeAt: null,
      nextChangeLabel: "",
      promotionEnd,
      promotionExpired: true,
      peakHoursLocal: "",
      description: "2x promotion ended on April 2.",
      details: "OpenAI's ChatGPT/Codex. The 2× promotion has ended. Normal usage rates now apply.",
    };
  }

  return {
    name: "Codex",
    multiplier: "2×",
    isBonus: true,
    statusLabel: "2× Limit Active!",
    statusColor: "green",
    nextChangeAt: promotionEnd,
    nextChangeLabel: "Promotion ends in",
    promotionEnd,
    promotionExpired: false,
    peakHoursLocal: `None — 24/7 active until Apr 2`,
    description: `2× usage around the clock. Valid until April 2, 2026.`,
    details: "OpenAI's ChatGPT/Codex. Currently offering 2× message allowance 24/7. No peak hours during this promotion.",
  };
}

// GLM-5: Peak 14:00-18:00 UTC+8 = 3×, Off-peak = 2×
// GLM-5.1: Peak 14:00-18:00 UTC+8 = 3×, Off-peak = 1× (through end of April), then 2×
// GLM-5-Turbo: Peak 14:00-18:00 UTC+8 = 3×, Off-peak = 1× (through end of April), then 2×
export function getGLMStatus(now: Date): {
  glm51: ServiceStatus;
  glm5: ServiceStatus;
  glm5Turbo: ServiceStatus;
} {
  const turboPromoEnd = new Date("2026-04-30T23:59:59+08:00");

  const utc8Offset = 8;
  const utc8Time = new Date(now.getTime() + utc8Offset * 60 * 60 * 1000);
  const utc8Hour = utc8Time.getUTCHours();

  const isPeak = utc8Hour >= 14 && utc8Hour < 18;

  // Next change
  let nextChangeAt: Date;
  if (isPeak) {
    // Peak ends at 18:00 UTC+8
    const next = new Date(utc8Time);
    next.setUTCHours(18, 0, 0, 0);
    nextChangeAt = new Date(next.getTime() - utc8Offset * 60 * 60 * 1000);
  } else if (utc8Hour < 14) {
    // Before peak
    const next = new Date(utc8Time);
    next.setUTCHours(14, 0, 0, 0);
    nextChangeAt = new Date(next.getTime() - utc8Offset * 60 * 60 * 1000);
  } else {
    // After peak (18+), next peak is tomorrow
    const next = new Date(utc8Time);
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(14, 0, 0, 0);
    nextChangeAt = new Date(next.getTime() - utc8Offset * 60 * 60 * 1000);
  }

  const peakStartLocal = formatHourInLocal(14, utc8Offset, now);
  const peakEndLocal = formatHourInLocal(18, utc8Offset, now);
  const peakHoursLocal = `${peakStartLocal} – ${peakEndLocal}`;

  const turboOffPeakExpired = now >= turboPromoEnd;

  const glm5: ServiceStatus = {
    name: "GLM-5",
    multiplier: isPeak ? "3×" : "2×",
    isBonus: !isPeak,
    statusLabel: isPeak ? "Peak — 3× Usage" : "Off-Peak — 2× Usage",
    statusColor: isPeak ? "red" : "orange",
    nextChangeAt,
    nextChangeLabel: isPeak ? "Off-peak starts in" : "Peak starts in",
    promotionEnd: new Date("2099-12-31"),
    promotionExpired: false,
    peakHoursLocal,
    description: "Peak: 3× consumption, Off-peak: 2×. Use GLM-5 for complex tasks, GLM-4.7 for routine.",
    details: "Zhipu AI's GLM-5 model. Peak hours: 2PM-6PM Beijing time. During peak, messages count as 3×. Off-peak counts as 2×.",
  };

  const turboMultiplier = isPeak ? "3×" : turboOffPeakExpired ? "2×" : "1×";
  const turboIsBonus = !isPeak && !turboOffPeakExpired;

  const glm5Turbo: ServiceStatus = {
    name: "GLM-5-Turbo",
    multiplier: turboMultiplier,
    isBonus: turboIsBonus,
    statusLabel: isPeak
      ? "Peak — 3× Usage"
      : turboOffPeakExpired
        ? "Off-Peak — 2× Usage"
        : "Off-Peak — 1× Usage ⭐",
    statusColor: isPeak ? "red" : turboOffPeakExpired ? "orange" : "green",
    nextChangeAt,
    nextChangeLabel: isPeak ? "Off-peak starts in" : "Peak starts in",
    promotionEnd: turboPromoEnd,
    promotionExpired: turboOffPeakExpired,
    peakHoursLocal,
    description: turboOffPeakExpired
      ? "Peak: 3× consumption, Off-peak: 2×."
      : "Peak: 3× consumption, Off-peak: 1× (through end of April).",
    details: turboOffPeakExpired
      ? "Zhipu AI's GLM-5-Turbo. Peak: 3× consumption, Off-peak: 2×."
      : "Zhipu AI's GLM-5-Turbo. Peak hours: 2PM-6PM Beijing time. During peak, messages count as 3×. Off-peak: 1× until end of April, then 2×.",
  };

  const glm51PromoEnd = new Date("2026-04-30T23:59:59+08:00");
  const glm51OffPeakExpired = now >= glm51PromoEnd;
  const glm51Multiplier = isPeak ? "3×" : glm51OffPeakExpired ? "2×" : "1×";
  const glm51IsBonus = !isPeak && !glm51OffPeakExpired;

  const glm51: ServiceStatus = {
    name: "GLM-5.1",
    multiplier: glm51Multiplier,
    isBonus: glm51IsBonus,
    statusLabel: isPeak
      ? "Peak — 3× Usage"
      : glm51OffPeakExpired
        ? "Off-Peak — 2× Usage"
        : "Off-Peak — 1× Usage ⭐",
    statusColor: isPeak ? "red" : glm51OffPeakExpired ? "orange" : "green",
    nextChangeAt,
    nextChangeLabel: isPeak ? "Off-peak starts in" : "Peak starts in",
    promotionEnd: glm51PromoEnd,
    promotionExpired: glm51OffPeakExpired,
    peakHoursLocal,
    description: glm51OffPeakExpired
      ? "Peak: 3× consumption, Off-peak: 2×."
      : "Peak: 3× consumption, Off-peak: 1× (through end of April).",
    details: glm51OffPeakExpired
      ? "Zhipu AI's GLM-5.1. Peak: 3× consumption, Off-peak: 2×."
      : "Zhipu AI's GLM-5.1. Peak hours: 2PM-6PM Beijing time. During peak, messages count as 3×. Off-peak: 1× until end of April, then 2×.",
  };

  return { glm51, glm5, glm5Turbo };
}

function formatHourInLocal(
  hourInSourceTz: number,
  sourceUtcOffset: number,
  now: Date
): string {
  // Convert source timezone hour to UTC, then to local
  const utcHour = hourInSourceTz - sourceUtcOffset;
  const localOffset = -now.getTimezoneOffset() / 60;
  let localHour = utcHour + localOffset;
  if (localHour < 0) localHour += 24;
  if (localHour >= 24) localHour -= 24;
  const h = Math.floor(localHour);
  const m = Math.round((localHour - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}d ${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export type PeakRange = {
  startHour: number;
  endHour: number;
};

export function getPeakRangesLocal(
  sourceStartHour: number,
  sourceEndHour: number,
  sourceUtcOffset: number,
  now: Date
): PeakRange[] {
  const localOffset = -now.getTimezoneOffset() / 60;
  const diffOffset = localOffset - sourceUtcOffset;

  let localStart = sourceStartHour + diffOffset;
  let localEnd = sourceEndHour + diffOffset;

  const ranges: PeakRange[] = [];

  if (localStart < 0) localStart += 24;
  if (localStart >= 24) localStart -= 24;
  if (localEnd < 0) localEnd += 24;
  if (localEnd >= 24) localEnd -= 24;

  if (localStart < localEnd) {
    ranges.push({ startHour: localStart, endHour: localEnd });
  } else if (localStart > localEnd) {
    ranges.push({ startHour: localStart, endHour: 24 });
    if (localEnd > 0) {
      ranges.push({ startHour: 0, endHour: localEnd });
    }
  }

  return ranges;
}

export function getCurrentLocalHour(now: Date): number {
  return now.getHours();
}

export type BestTimeService = {
  name: string;
  multiplier: string;
  isBonus: boolean;
  isBest: boolean;
};

export type BestTimeRecommendation = {
  nowBestServices: BestTimeService[];
  upcomingBestWindow: {
    time: string;
    services: string[];
    countdown: string;
    nextChangeAt: Date;
  } | null;
  summary: string;
  isAllOptimal: boolean;
};

export function getBestTimeRecommendation(
  claude: ServiceStatus,
  gpt: ServiceStatus,
  glm51: ServiceStatus,
  glm5: ServiceStatus,
  glm5Turbo: ServiceStatus
): BestTimeRecommendation {
  const services: BestTimeService[] = [
    { name: claude.name, multiplier: claude.multiplier, isBonus: claude.isBonus, isBest: claude.isBonus },
    { name: gpt.name, multiplier: gpt.multiplier, isBonus: gpt.isBonus, isBest: gpt.isBonus },
    { name: glm51.name, multiplier: glm51.multiplier, isBonus: glm51.isBonus, isBest: glm51.isBonus },
    { name: glm5.name, multiplier: glm5.multiplier, isBonus: glm5.isBonus, isBest: glm5.isBonus },
    { name: glm5Turbo.name, multiplier: glm5Turbo.multiplier, isBonus: glm5Turbo.isBonus, isBest: glm5Turbo.isBonus },
  ];

  const nowBestServices = services.filter((s) => s.isBest);
  const isAllOptimal = services.every((s) => s.isBest);
  const hasAnyBonus = services.some((s) => s.isBonus);

  let upcomingBestWindow: BestTimeRecommendation["upcomingBestWindow"] = null;

  if (!isAllOptimal) {
    const now = new Date();
    const upcoming: { service: string; nextChange: Date }[] = [];

    if (!claude.isBonus && claude.nextChangeAt) {
      upcoming.push({ service: claude.name, nextChange: claude.nextChangeAt });
    }
    if (!gpt.isBonus && gpt.nextChangeAt) {
      upcoming.push({ service: gpt.name, nextChange: gpt.nextChangeAt });
    }
    if (!glm51.isBonus && glm51.nextChangeAt) {
      upcoming.push({ service: glm51.name, nextChange: glm51.nextChangeAt });
    }
    if (!glm5.isBonus && glm5.nextChangeAt) {
      upcoming.push({ service: glm5.name, nextChange: glm5.nextChangeAt });
    }
    if (!glm5Turbo.isBonus && glm5Turbo.nextChangeAt) {
      upcoming.push({ service: glm5Turbo.name, nextChange: glm5Turbo.nextChangeAt });
    }

    if (upcoming.length > 0) {
      upcoming.sort((a, b) => a.nextChange.getTime() - b.nextChange.getTime());
      const next = upcoming[0];
      const diff = next.nextChange.getTime() - now.getTime();
      upcomingBestWindow = {
        time: next.nextChange.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        services: [next.service],
        countdown: formatCountdown(diff),
        nextChangeAt: next.nextChange,
      };
    }
  }

  let summary: string;
  if (isAllOptimal) {
    summary = "All services are at their best rates now!";
  } else if (hasAnyBonus) {
    const bestNames = nowBestServices.map((s) => s.name).join(", ");
    summary = `${bestNames} ${nowBestServices.length === 1 ? "is" : "are"} at bonus rate now!`;
  } else {
    summary = "No services are at bonus rates currently.";
  }

  return {
    nowBestServices,
    upcomingBestWindow,
    summary,
    isAllOptimal,
  };
}
