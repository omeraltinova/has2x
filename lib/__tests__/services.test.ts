import { describe, it, expect } from "vitest";
import {
  getGLMStatus,
  getDeepSeekStatus,
  getXiaomiStatus,
  formatCountdown,
  getPeakRangesLocal,
  getWeekdayPeakRangesLocal,
  GLM_PEAK_WINDOWS,
  DEEPSEEK_PEAK_WINDOWS,
  getCurrentLocalHour,
  getBestTimeRecommendation,
  PROVIDERS,
  type ServiceStatus,
} from "@/lib/services";

function makeStatus(name: string, isBonus: boolean, nextChangeAt: Date | null = null): ServiceStatus {
  return {
    name,
    multiplier: "1×",
    isBonus,
    statusLabel: "",
    statusColor: isBonus ? "green" : "red",
    nextChangeAt,
    nextChangeLabel: "Peak starts in",
    peakHoursLocal: "",
    description: "",
  };
}

describe("getGLMStatus", () => {
  it("applies the flagship and Flash quota rates during weekday peak hours", () => {
    const peakTime = new Date("2026-04-20T06:00:00Z");
    const { glm53, glm53Flash } = getGLMStatus(peakTime);
    expect(glm53.multiplier).toBe("3×");
    expect(glm53Flash.multiplier).toBe("1.2×");
    expect(glm53.statusColor).toBe("red");
    expect(glm53Flash.statusColor).toBe("red");
  });

  it("applies off-peak rates before the weekday peak window", () => {
    const offPeakTime = new Date("2026-04-20T02:00:00Z");
    const { glm53, glm53Flash } = getGLMStatus(offPeakTime);
    expect(glm53.multiplier).toBe("1×");
    expect(glm53Flash.multiplier).toBe("0.4×");
    expect(glm53.statusColor).toBe("green");
    expect(glm53Flash.statusColor).toBe("green");
  });

  it("treats weekends as off-peak", () => {
    const saturdayPeakHour = new Date("2026-05-02T06:00:00Z");
    const { glm53, glm53Flash } = getGLMStatus(saturdayPeakHour);
    expect(glm53.multiplier).toBe("1×");
    expect(glm53Flash.multiplier).toBe("0.4×");
  });

  it("starts off-peak at 18:00 SGT", () => {
    const atEnd = new Date("2026-04-20T10:00:00Z");
    const { glm53, glm53Flash } = getGLMStatus(atEnd);
    expect(glm53.multiplier).toBe("1×");
    expect(glm53Flash.multiplier).toBe("0.4×");
  });

  it("does not attach an end date to either GLM rate", () => {
    const { glm53, glm53Flash } = getGLMStatus(new Date("2026-04-20T02:00:00Z"));
    expect(glm53).not.toHaveProperty("promotionEnd");
    expect(glm53Flash).not.toHaveProperty("promotionEnd");
  });
});

describe("getDeepSeekStatus", () => {
  it("marks both weekday peak windows at twice the off-peak price", () => {
    const morningPeak = getDeepSeekStatus(new Date("2026-04-20T01:00:00Z"));
    const afternoonPeak = getDeepSeekStatus(new Date("2026-04-20T06:00:00Z"));
    expect(morningPeak.multiplier).toBe("2×");
    expect(afternoonPeak.multiplier).toBe("2×");
    expect(morningPeak.statusColor).toBe("red");
  });

  it("marks other weekday and weekend hours as off-peak", () => {
    const midday = getDeepSeekStatus(new Date("2026-04-20T04:00:00Z"));
    const saturday = getDeepSeekStatus(new Date("2026-05-02T01:00:00Z"));
    expect(midday.multiplier).toBe("1×");
    expect(saturday.multiplier).toBe("1×");
    expect(saturday.statusColor).toBe("green");
  });

  it("builds peak timelines only for weekdays", () => {
    const weekday = new Date("2026-04-20T01:00:00Z");
    const weekend = new Date("2026-05-02T01:00:00Z");
    expect(getWeekdayPeakRangesLocal(DEEPSEEK_PEAK_WINDOWS, weekday).length).toBeGreaterThanOrEqual(2);
    expect(getWeekdayPeakRangesLocal(GLM_PEAK_WINDOWS, weekend)).toEqual([]);
  });
});

describe("getXiaomiStatus", () => {
  const makeUTC = (hour: number, day = 21, month = 4): Date => {
    return new Date(Date.UTC(2026, month, day, hour));
  };

  it("returns bonus (0.8x) at 16:00 UTC", () => {
    const result = getXiaomiStatus(makeUTC(16));
    expect(result.multiplier).toBe("0.8×");
    expect(result.isBonus).toBe(true);
    expect(result.statusColor).toBe("green");
  });

  it("returns bonus at 23:00 UTC", () => {
    const result = getXiaomiStatus(makeUTC(23));
    expect(result.multiplier).toBe("0.8×");
    expect(result.isBonus).toBe(true);
  });

  it("returns standard (1x) at 15:59 UTC", () => {
    const result = getXiaomiStatus(makeUTC(15, 21, 4));
    expect(result.multiplier).toBe("1×");
    expect(result.isBonus).toBe(false);
    expect(result.statusColor).toBe("red");
  });

  it("returns standard at exactly 24:00 UTC (end of bonus)", () => {
    const endResult = getXiaomiStatus(new Date(Date.UTC(2026, 4, 22, 0, 0, 0)));
    expect(endResult.multiplier).toBe("1×");
    expect(endResult.isBonus).toBe(false);
  });

  it("nextChangeAt points to next bonus start when standard", () => {
    const result = getXiaomiStatus(makeUTC(10));
    expect(result.nextChangeAt).not.toBeNull();
    expect(result.nextChangeAt!.getUTCHours()).toBe(16);
  });

  it("nextChangeAt points to next day 00:00 when in bonus", () => {
    const result = getXiaomiStatus(makeUTC(18));
    expect(result.nextChangeAt).not.toBeNull();
    expect(result.nextChangeAt!.getUTCHours()).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("returns 00:00:00 for zero or negative ms", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(-1000)).toBe("00:00:00");
  });

  it("formats seconds only", () => {
    expect(formatCountdown(5000)).toBe("00:00:05");
  });

  it("formats minutes and seconds", () => {
    expect(formatCountdown(65000)).toBe("00:01:05");
  });

  it("formats hours, minutes, seconds", () => {
    expect(formatCountdown(3665000)).toBe("01:01:05");
  });

  it("formats days when >= 1 day", () => {
    expect(formatCountdown(90061000)).toBe("1d 1h 01m 01s");
  });

  it("pads numbers correctly", () => {
    expect(formatCountdown(3600000)).toBe("01:00:00");
    expect(formatCountdown(86400000)).toBe("1d 0h 00m 00s");
  });
});

describe("getPeakRangesLocal", () => {
  it("returns simple range when local TZ matches source", () => {
    const now = new Date("2026-05-21T12:00:00Z");
    const offset = -now.getTimezoneOffset() / 60;
    const ranges = getPeakRangesLocal(14, 18, offset, now);
    expect(ranges).toEqual([{ startHour: 14, endHour: 18 }]);
  });

  it("wraps across midnight correctly", () => {
    // If source is UTC+8 and local is far west, range may wrap
    const ranges = getPeakRangesLocal(16, 24, 0, new Date());
    expect(ranges.length).toBeGreaterThanOrEqual(1);
    for (const range of ranges) {
      expect(range.startHour).toBeLessThan(24);
      expect(range.endHour).toBeLessThanOrEqual(24);
      expect(range.startHour).toBeLessThan(range.endHour);
    }
  });
});

describe("getCurrentLocalHour", () => {
  it("returns a number between 0 and 23", () => {
    const hour = getCurrentLocalHour(new Date());
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThan(24);
  });

  it("matches the actual local hour", () => {
    const now = new Date();
    expect(getCurrentLocalHour(now)).toBe(now.getHours());
  });
});

describe("getBestTimeRecommendation", () => {
  it("marks all optimal when all services are bonus", () => {
    const rec = getBestTimeRecommendation(
      makeStatus("GLM-5.3", true),
      makeStatus("GLM-5.3-Flash", true),
      makeStatus("DeepSeek API", true),
      makeStatus("Xiaomi", true),
    );
    expect(rec.isAllOptimal).toBe(true);
    expect(rec.summary).toBe("All services are at their best rates now!");
    expect(rec.upcomingBestWindow).toBeNull();
    expect(rec.nowBestServices).toHaveLength(4);
  });

  it("identifies services at the lower rate", () => {
    const rec = getBestTimeRecommendation(
      makeStatus("GLM-5.3", false),
      makeStatus("GLM-5.3-Flash", false),
      makeStatus("DeepSeek API", true),
      makeStatus("Xiaomi", false),
    );
    expect(rec.isAllOptimal).toBe(false);
    expect(rec.nowBestServices).toHaveLength(1);
    expect(rec.nowBestServices[0].name).toBe("DeepSeek API");
  });

  it("reports no lower-rate services correctly", () => {
    const rec = getBestTimeRecommendation(
      makeStatus("GLM-5.3", false),
      makeStatus("GLM-5.3-Flash", false),
      makeStatus("DeepSeek API", false),
      makeStatus("Xiaomi", false),
    );
    expect(rec.isAllOptimal).toBe(false);
    expect(rec.nowBestServices).toHaveLength(0);
    expect(rec.summary).toBe("No services are at their lower rate right now.");
  });

  it("provides upcoming best window when not all optimal", () => {
    const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
    const rec = getBestTimeRecommendation(
      makeStatus("GLM-5.3", false, futureDate),
      makeStatus("GLM-5.3-Flash", true),
      makeStatus("DeepSeek API", false, new Date(Date.now() + 7200000)),
      makeStatus("Xiaomi", true),
    );
    expect(rec.upcomingBestWindow).not.toBeNull();
    expect(rec.upcomingBestWindow!.services).toContain("GLM-5.3");
    expect(rec.upcomingBestWindow!.countdown).toBeTruthy();
  });
});

describe("PROVIDERS", () => {
  it("has all expected provider keys", () => {
    expect(Object.keys(PROVIDERS)).toEqual(["glm", "deepseek", "xiaomi"]);
  });

  it("each provider has required fields", () => {
    for (const [, provider] of Object.entries(PROVIDERS)) {
      expect(provider).toHaveProperty("name");
      expect(provider).toHaveProperty("services");
      expect(provider).toHaveProperty("color");
      expect(provider).toHaveProperty("description");
      expect(Array.isArray(provider.services)).toBe(true);
      expect(provider.services.length).toBeGreaterThan(0);
    }
  });

  it("GLM provider has only the current GLM models", () => {
    const glm = PROVIDERS.glm;
    expect(glm.services).toEqual(["glm53", "glm53Flash"]);
  });
});
