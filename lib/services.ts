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

// Claude: Peak 8AM-2PM ET weekdays, off-peak = 2x
// Promotion: March 13-27, 2026
export function getClaudeStatus(now: Date): ServiceStatus {
  const promotionEnd = new Date("2026-03-28T06:59:00Z"); // March 27 11:59 PM PT = March 28 06:59 UTC
  const promotionExpired = now >= promotionEnd;

  if (promotionExpired) {
    return {
      name: "Claude",
      multiplier: "1×",
      isBonus: false,
      statusLabel: "Promotion Ended",
      statusColor: "gray",
      nextChangeAt: null,
      nextChangeLabel: "",
      promotionEnd,
      promotionExpired: true,
      peakHoursLocal: "",
      description: "2x promotion ended on March 27.",
      details: "Anthropic's Claude AI assistant. The 2× promotion has ended. Normal usage rates now apply.",
    };
  }

  // Convert to ET (UTC-4 in March 2026 — EDT)
  const etOffset = -4;
  const etTime = new Date(now.getTime() + etOffset * 60 * 60 * 1000);
  const etHour = etTime.getUTCHours();
  const etDay = etTime.getUTCDay(); // 0=Sun, 6=Sat

  const isWeekday = etDay >= 1 && etDay <= 5;
  const isPeak = isWeekday && etHour >= 8 && etHour < 14;

  // Calculate next change
  let nextChangeAt: Date;
  if (isPeak) {
    // Peak ends at 14:00 ET
    const nextOff = new Date(etTime);
    nextOff.setUTCHours(14, 0, 0, 0);
    nextChangeAt = new Date(nextOff.getTime() - etOffset * 60 * 60 * 1000);
  } else if (isWeekday && etHour < 8) {
    // Before peak starts today
    const nextPeak = new Date(etTime);
    nextPeak.setUTCHours(8, 0, 0, 0);
    nextChangeAt = new Date(nextPeak.getTime() - etOffset * 60 * 60 * 1000);
  } else if (isWeekday && etHour >= 14) {
    // After peak, next peak is tomorrow (or Monday if Friday)
    const nextPeak = new Date(etTime);
    if (etDay === 5) {
      // Friday -> Monday
      nextPeak.setUTCDate(nextPeak.getUTCDate() + 3);
    } else {
      nextPeak.setUTCDate(nextPeak.getUTCDate() + 1);
    }
    nextPeak.setUTCHours(8, 0, 0, 0);
    nextChangeAt = new Date(nextPeak.getTime() - etOffset * 60 * 60 * 1000);
  } else {
    // Weekend — next peak is Monday 8 AM ET
    const daysUntilMonday = etDay === 0 ? 1 : 8 - etDay;
    const nextPeak = new Date(etTime);
    nextPeak.setUTCDate(nextPeak.getUTCDate() + daysUntilMonday);
    nextPeak.setUTCHours(8, 0, 0, 0);
    nextChangeAt = new Date(nextPeak.getTime() - etOffset * 60 * 60 * 1000);
  }

  // Cap at promotion end
  if (nextChangeAt > promotionEnd) {
    nextChangeAt = promotionEnd;
  }

  const peakStartLocal = formatHourInLocal(8, etOffset, now);
  const peakEndLocal = formatHourInLocal(14, etOffset, now);

  return {
    name: "Claude",
    multiplier: isPeak ? "1×" : "2×",
    isBonus: !isPeak,
    statusLabel: isPeak ? "Normal Limit (Peak)" : "2× Limit Active!",
    statusColor: isPeak ? "red" : "green",
    nextChangeAt,
    nextChangeLabel: isPeak ? "2× starts in" : "Peak starts in",
    promotionEnd,
    promotionExpired: false,
    peakHoursLocal: `${peakStartLocal} – ${peakEndLocal} (weekdays)`,
    description: "2× usage during off-peak hours. Valid until March 27.",
    details: "Anthropic's Claude AI assistant. Peak hours: 8AM-2PM ET weekdays. During peak, normal usage rates apply. Off-peak gets 2× message allowance.",
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
// GLM-5-Turbo: Peak 14:00-18:00 UTC+8 = 3×, Off-peak = 1× (through end of April), then 2×
export function getGLMStatus(now: Date): {
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

  return { glm5, glm5Turbo };
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
