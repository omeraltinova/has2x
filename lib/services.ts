export type ProviderKey = "glm" | "deepseek" | "xiaomi";

export const PROVIDERS: Record<ProviderKey, {
  name: string;
  services: string[];
  color: string;
  description: string;
}> = {
  glm: {
    name: "GLM",
    services: ["glm53", "glm53Flash"],
    color: "cyan",
    description: "Zhipu AI's model family",
  },
  deepseek: {
    name: "DeepSeek API",
    services: ["deepseek"],
    color: "blue",
    description: "DeepSeek API peak and off-peak pricing",
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
  peakHoursLocal: string;
  description: string;
  details?: string;
  rateUnit?: string;
};

export type PeakRange = {
  startHour: number;
  endHour: number;
};

export const GLM_PEAK_WINDOWS: PeakRange[] = [{ startHour: 14, endHour: 18 }];
export const DEEPSEEK_PEAK_WINDOWS: PeakRange[] = [
  { startHour: 9, endHour: 12 },
  { startHour: 14, endHour: 18 },
];

const SINGAPORE_OFFSET_HOURS = 8;
const SINGAPORE_OFFSET_MS = SINGAPORE_OFFSET_HOURS * 60 * 60 * 1000;

function isSingaporeWeekday(now: Date): boolean {
  const singaporeTime = new Date(now.getTime() + SINGAPORE_OFFSET_MS);
  const day = singaporeTime.getUTCDay();
  return day >= 1 && day <= 5;
}

function getPeakWindowState(now: Date, windows: PeakRange[]) {
  const singaporeTime = new Date(now.getTime() + SINGAPORE_OFFSET_MS);
  const hour = singaporeTime.getUTCHours();
  const isWeekday = isSingaporeWeekday(now);
  const activeWindow = isWeekday
    ? windows.find((window) => hour >= window.startHour && hour < window.endHour)
    : undefined;

  let nextSingaporeTime: Date;
  if (activeWindow) {
    nextSingaporeTime = new Date(singaporeTime);
    nextSingaporeTime.setUTCHours(activeWindow.endHour, 0, 0, 0);
  } else {
    const nextWindow = isWeekday
      ? windows.find((window) => hour < window.startHour)
      : undefined;

    if (nextWindow) {
      nextSingaporeTime = new Date(singaporeTime);
      nextSingaporeTime.setUTCHours(nextWindow.startHour, 0, 0, 0);
    } else {
      nextSingaporeTime = new Date(Date.UTC(
        singaporeTime.getUTCFullYear(),
        singaporeTime.getUTCMonth(),
        singaporeTime.getUTCDate()
      ));
      do {
        nextSingaporeTime.setUTCDate(nextSingaporeTime.getUTCDate() + 1);
      } while (nextSingaporeTime.getUTCDay() === 0 || nextSingaporeTime.getUTCDay() === 6);
      nextSingaporeTime.setUTCHours(windows[0].startHour, 0, 0, 0);
    }
  }

  return {
    isPeak: Boolean(activeWindow),
    nextChangeAt: new Date(nextSingaporeTime.getTime() - SINGAPORE_OFFSET_MS),
  };
}

function createScheduledStatus({
  name,
  isPeak,
  peakMultiplier,
  offPeakMultiplier,
  rateUnit,
  peakHoursLocal,
  nextChangeAt,
  peakDescription,
  offPeakDescription,
  details,
}: {
  name: string;
  isPeak: boolean;
  peakMultiplier: string;
  offPeakMultiplier: string;
  rateUnit: string;
  peakHoursLocal: string;
  nextChangeAt: Date;
  peakDescription: string;
  offPeakDescription: string;
  details: string;
}): ServiceStatus {
  const multiplier = isPeak ? peakMultiplier : offPeakMultiplier;

  return {
    name,
    multiplier,
    isBonus: !isPeak,
    statusLabel: `${isPeak ? "Peak" : "Off-peak"} — ${multiplier} ${rateUnit}`,
    statusColor: isPeak ? "red" : "green",
    nextChangeAt,
    nextChangeLabel: isPeak ? "Off-peak starts in" : "Peak starts in",
    peakHoursLocal,
    description: isPeak ? peakDescription : offPeakDescription,
    details,
    rateUnit,
  };
}

export function getGLMStatus(now: Date): {
  glm53: ServiceStatus;
  glm53Flash: ServiceStatus;
} {
  const { isPeak, nextChangeAt } = getPeakWindowState(now, GLM_PEAK_WINDOWS);
  const peakHoursLocal = "Mon–Fri, 14:00–18:00 SGT (UTC+8)";
  const common = { isPeak, peakHoursLocal, nextChangeAt, rateUnit: "quota use" };

  return {
    glm53: createScheduledStatus({
      ...common,
      name: "GLM-5.3",
      peakMultiplier: "3×",
      offPeakMultiplier: "1×",
      peakDescription: "API calls consume quota at a rate of 3 during peak hours.",
      offPeakDescription: "API calls consume quota at a rate of 1 during off-peak hours.",
      details: "GLM-5.3 is the flagship model. API calls use 1× quota off-peak and 3× during peak hours.",
    }),
    glm53Flash: createScheduledStatus({
      ...common,
      name: "GLM-5.3-Flash",
      peakMultiplier: "1.2×",
      offPeakMultiplier: "0.4×",
      peakDescription: "API calls consume quota at a rate of 1.2 during peak hours.",
      offPeakDescription: "API calls consume quota at a rate of 0.4 during off-peak hours.",
      details: "GLM-5.3-Flash API calls use 0.4× quota off-peak and 1.2× during peak hours.",
    }),
  };
}

export function getDeepSeekStatus(now: Date): ServiceStatus {
  const { isPeak, nextChangeAt } = getPeakWindowState(now, DEEPSEEK_PEAK_WINDOWS);

  return createScheduledStatus({
    name: "DeepSeek API",
    isPeak,
    peakMultiplier: "2×",
    offPeakMultiplier: "1×",
    rateUnit: "API price",
    peakHoursLocal: "Mon–Fri, 09:00–12:00 and 14:00–18:00 SGT (UTC+8)",
    nextChangeAt,
    peakDescription: "Peak-hour API prices are twice the off-peak rates.",
    offPeakDescription: "Off-peak API prices are half the peak rates.",
    details: "DeepSeek's official pricing sets off-peak rates at half the peak rates. Chinese public holidays are off-peak all day. This tracker does not check holiday dates.",
  });
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
    statusColor: isBonus ? "green" : "red",
    nextChangeAt,
    nextChangeLabel: isBonus ? "Bonus ends in" : "Bonus starts in",
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

export function getWeekdayPeakRangesLocal(windows: PeakRange[], now: Date): PeakRange[] {
  if (!isSingaporeWeekday(now)) return [];

  return windows.flatMap(({ startHour, endHour }) =>
    getPeakRangesLocal(startHour, endHour, SINGAPORE_OFFSET_HOURS, now)
  );
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
  glm53: ServiceStatus,
  glm53Flash: ServiceStatus,
  deepseek: ServiceStatus,
  xiaomi: ServiceStatus
): BestTimeRecommendation {
  const statuses = [glm53, glm53Flash, deepseek, xiaomi];
  const services: BestTimeService[] = statuses.map((status) => ({
    name: status.name,
    multiplier: status.multiplier,
    isBonus: status.isBonus,
    isBest: status.isBonus,
  }));

  const nowBestServices = services.filter((s) => s.isBest);
  const isAllOptimal = services.every((s) => s.isBest);
  const hasAnyBonus = services.some((s) => s.isBonus);

  let upcomingBestWindow: BestTimeRecommendation["upcomingBestWindow"] = null;

  if (!isAllOptimal) {
    const now = new Date();
    const upcoming = statuses
      .filter((status) => !status.isBonus && status.nextChangeAt)
      .map((status) => ({ service: status.name, nextChange: status.nextChangeAt! }));

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
    summary = `${bestNames} ${nowBestServices.length === 1 ? "has" : "have"} the lower rate now.`;
  } else {
    summary = "No services are at their lower rate right now.";
  }

  return {
    nowBestServices,
    upcomingBestWindow,
    summary,
    isAllOptimal,
  };
}
