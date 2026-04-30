export type ProviderKey = "claude" | "codex" | "glm" | "xiaomi";

export const PROVIDERS: Record<ProviderKey, {
  name: string;
  services: string[];
  color: string;
  description: string;
}> = {
  claude: {
    name: "Claude",
    services: ["claude"],
    color: "orange",
    description: "Anthropic's AI assistant",
  },
  codex: {
    name: "Codex",
    services: ["codex"],
    color: "green",
    description: "OpenAI's coding model",
  },
  glm: {
    name: "GLM",
    services: ["glm51", "glm5", "glm5Turbo"],
    color: "cyan",
    description: "Zhipu AI's model family",
  },
  xiaomi: {
    name: "Xiaomi",
    services: ["xiaomi"],
    color: "yellow",
    description: "Xiaomi's token plan",
  },
};

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

// GPT: 2x all the time until May 31, 2026 (Pro subscriptions only)
export function getGPTStatus(now: Date): ServiceStatus {
  const promotionEnd = new Date("2026-05-31T23:59:59Z");
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
      description: "2x Pro promotion ended on May 31.",
      details: "OpenAI's ChatGPT/Codex. The 2× Pro promotion has ended. Normal usage rates now apply.",
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
    peakHoursLocal: `None — 24/7 active until May 31`,
    description: `2× usage around the clock for Pro subs. Valid until May 31, 2026.`,
    details: "OpenAI's ChatGPT/Codex. Currently offering 2× message allowance 24/7 for Pro subscriptions only. No peak hours during this promotion.",
  };
}

// GLM-5: Peak 14:00-18:00 UTC+8 = 3×, Off-peak = 2×
// GLM-5.1: Peak 14:00-18:00 UTC+8 = 3×, Off-peak = 1× (through end of June), then 2×
// GLM-5-Turbo: Peak 14:00-18:00 UTC+8 = 3×, Off-peak = 1× (through end of June), then 2×
export function getGLMStatus(now: Date): {
  glm51: ServiceStatus;
  glm5: ServiceStatus;
  glm5Turbo: ServiceStatus;
} {
  const turboPromoEnd = new Date("2026-06-30T23:59:59+08:00");

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
      : "Peak: 3× consumption, Off-peak: 1× (through end of June).",
    details: turboOffPeakExpired
      ? "Zhipu AI's GLM-5-Turbo. Peak: 3× consumption, Off-peak: 2×."
      : "Zhipu AI's GLM-5-Turbo. Peak hours: 2PM-6PM Beijing time. During peak, messages count as 3×. Off-peak: 1× until end of June, then 2×.",
  };

  const glm51PromoEnd = new Date("2026-06-30T23:59:59+08:00");
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
      : "Peak: 3× consumption, Off-peak: 1× (through end of June).",
    details: glm51OffPeakExpired
      ? "Zhipu AI's GLM-5.1. Peak: 3× consumption, Off-peak: 2×."
      : "Zhipu AI's GLM-5.1. Peak hours: 2PM-6PM Beijing time. During peak, messages count as 3×. Off-peak: 1× until end of June, then 2×.",
  };

  return { glm51, glm5, glm5Turbo };
}

// Xiaomi token plan: 0.8× consumption between 16:00–24:00 UTC, 1× otherwise.
export function getXiaomiStatus(now: Date): ServiceStatus {
  const utcHour = now.getUTCHours();
  const isBonus = utcHour >= 16 && utcHour < 24;

  let nextChangeAt: Date;
  if (isBonus) {
    const next = new Date(now);
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0, 0, 0, 0);
    nextChangeAt = next;
  } else {
    const next = new Date(now);
    next.setUTCHours(16, 0, 0, 0);
    nextChangeAt = next;
  }

  const startLocal = formatHourInLocal(16, 0, now);
  const endLocal = formatHourInLocal(24, 0, now);

  return {
    name: "Xiaomi",
    multiplier: isBonus ? "0.8×" : "1×",
    isBonus,
    statusLabel: isBonus ? "Bonus — 0.8× Usage" : "Standard — 1× Usage",
    statusColor: isBonus ? "green" : "gray",
    nextChangeAt,
    nextChangeLabel: isBonus ? "Bonus ends in" : "Bonus starts in",
    promotionEnd: new Date("2099-12-31"),
    promotionExpired: false,
    peakHoursLocal: `${startLocal} – ${endLocal}`,
    description: isBonus
      ? "Bonus window: 0.8× consumption. Outside the window: 1×."
      : "Standard 1× consumption. 0.8× bonus runs 16:00–24:00 UTC.",
    details: "Xiaomi's token plan. Between 16:00 and 24:00 UTC, messages count as 0.8× instead of the standard 1×.",
  };
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
  glm5Turbo: ServiceStatus,
  xiaomi: ServiceStatus
): BestTimeRecommendation {
  const services: BestTimeService[] = [
    { name: claude.name, multiplier: claude.multiplier, isBonus: claude.isBonus, isBest: claude.isBonus },
    { name: gpt.name, multiplier: gpt.multiplier, isBonus: gpt.isBonus, isBest: gpt.isBonus },
    { name: glm51.name, multiplier: glm51.multiplier, isBonus: glm51.isBonus, isBest: glm51.isBonus },
    { name: glm5.name, multiplier: glm5.multiplier, isBonus: glm5.isBonus, isBest: glm5.isBonus },
    { name: glm5Turbo.name, multiplier: glm5Turbo.multiplier, isBonus: glm5Turbo.isBonus, isBest: glm5Turbo.isBonus },
    { name: xiaomi.name, multiplier: xiaomi.multiplier, isBonus: xiaomi.isBonus, isBest: xiaomi.isBonus },
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
    if (!xiaomi.isBonus && xiaomi.nextChangeAt) {
      upcoming.push({ service: xiaomi.name, nextChange: xiaomi.nextChangeAt });
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
