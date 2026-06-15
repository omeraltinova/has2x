import { describe, it, expect } from "vitest";
import {
  getClaudeStatus,
  getGPTStatus,
  getGLMStatus,
  getXiaomiStatus,
  formatCountdown,
  getPeakRangesLocal,
  getCurrentLocalHour,
  getBestTimeRecommendation,
  PROVIDERS,
} from "@/lib/services";

const MOCK_CLAUDE: ReturnType<typeof getClaudeStatus> = {
  name: "Claude Code",
  multiplier: "1×",
  isBonus: true,
  statusLabel: "No Peak Reduction",
  statusColor: "green",
  nextChangeAt: null,
  nextChangeLabel: "",
  promotionEnd: new Date("2099-12-31"),
  promotionExpired: false,
  peakHoursLocal: "None — removed for Claude Code Pro/Max",
  description: "Claude Code no longer has reduced five-hour limits during peak hours for Pro and Max accounts.",
  details: "Claude Code only. Anthropic removed peak-hour limit reductions for Pro and Max accounts on May 6, 2026; Claude chat and API limits may differ.",
};

const MOCK_GPT_BONUS: ReturnType<typeof getGPTStatus> = {
  name: "Codex",
  multiplier: "2×",
  isBonus: true,
  statusLabel: "2× Limit Active!",
  statusColor: "green",
  nextChangeAt: new Date("2026-05-31T23:59:59Z"),
  nextChangeLabel: "Promotion ends in",
  promotionEnd: new Date("2026-05-31T23:59:59Z"),
  promotionExpired: false,
  peakHoursLocal: "None — 24/7 active until May 31",
  description: "2× usage around the clock for Pro subs. Valid until May 31, 2026.",
  details: "OpenAI's ChatGPT/Codex. Currently offering 2× message allowance 24/7 for Pro subscriptions only. No peak hours during this promotion.",
};

const MOCK_GPT_EXPIRED: ReturnType<typeof getGPTStatus> = {
  name: "Codex",
  multiplier: "1×",
  isBonus: false,
  statusLabel: "Promotion Ended",
  statusColor: "gray",
  nextChangeAt: null,
  nextChangeLabel: "",
  promotionEnd: new Date("2026-05-31T23:59:59Z"),
  promotionExpired: true,
  peakHoursLocal: "",
  description: "2x Pro promotion ended on May 31.",
  details: "OpenAI's ChatGPT/Codex. The 2× Pro promotion has ended. Normal usage rates now apply.",
};

describe("getClaudeStatus", () => {
  it("always returns green status with no peak reduction", () => {
    const result = getClaudeStatus(new Date());
    expect(result.statusColor).toBe("green");
    expect(result.isBonus).toBe(true);
    expect(result.multiplier).toBe("1×");
    expect(result.nextChangeAt).toBeNull();
    expect(result.promotionExpired).toBe(false);
  });
});

describe("getGPTStatus", () => {
  it("returns 2x active for dates before May 31, 2026", () => {
    const before = new Date("2026-05-15T12:00:00Z");
    const result = getGPTStatus(before);
    expect(result.multiplier).toBe("2×");
    expect(result.isBonus).toBe(true);
    expect(result.statusColor).toBe("green");
    expect(result.statusLabel).toBe("2× Limit Active!");
    expect(result.promotionExpired).toBe(false);
  });

  it("returns promotion expired after May 31, 2026", () => {
    const after = new Date("2026-06-01T00:00:01Z");
    const result = getGPTStatus(after);
    expect(result.multiplier).toBe("1×");
    expect(result.isBonus).toBe(false);
    expect(result.statusColor).toBe("gray");
    expect(result.statusLabel).toBe("Promotion Ended");
    expect(result.promotionExpired).toBe(true);
    expect(result.nextChangeAt).toBeNull();
  });

  it("returns promotion expired at exactly May 31 23:59:59 UTC", () => {
    const atEnd = new Date("2026-05-31T23:59:59Z");
    const result = getGPTStatus(atEnd);
    expect(result.promotionExpired).toBe(true);
  });

  it("returns active right before May 31 23:59:58 UTC", () => {
    const before = new Date("2026-05-31T23:59:58Z");
    const result = getGPTStatus(before);
    expect(result.promotionExpired).toBe(false);
    expect(result.multiplier).toBe("2×");
  });
});

describe("getGLMStatus", () => {
  const makeUTC8 = (hour: number, day = 21, month = 4): Date => {
    // April = month 3 in zero-indexed JS
    return new Date(Date.UTC(2026, month, day, hour - 8));
  };

  it("returns peak status at 14:00 UTC+8 (3x for all GLM models)", () => {
    const peakTime = makeUTC8(14);
    const { glm51, glm5Turbo } = getGLMStatus(peakTime);
    expect(glm51.multiplier).toBe("3×");
    expect(glm5Turbo.multiplier).toBe("3×");
    expect(glm51.statusColor).toBe("red");
    expect(glm5Turbo.statusColor).toBe("red");
  });

  it("returns off-peak status at 10:00 UTC+8", () => {
    const offPeakTime = makeUTC8(10);
    const { glm51, glm5Turbo } = getGLMStatus(offPeakTime);
    // GLM-5.1/5.2 and Turbo: 1x off-peak before end of September 2026 (test date April)
    expect(glm51.multiplier).toBe("1×");
    expect(glm5Turbo.multiplier).toBe("1×");
    expect(glm51.statusColor).toBe("green");
    expect(glm5Turbo.statusColor).toBe("green");
  });

  it("returns peak status at 17:59 UTC+8", () => {
    const beforeEnd = makeUTC8(17, 21, 4);
    const { glm51 } = getGLMStatus(beforeEnd);
    expect(glm51.multiplier).toBe("3×");
    expect(glm51.statusColor).toBe("red");
  });

  it("returns off-peak at exactly 18:00 UTC+8", () => {
    const atEnd = makeUTC8(18);
    const { glm51 } = getGLMStatus(atEnd);
    // 18:00 is the first off-peak hour (test date April, before promo end → 1×)
    expect(glm51.multiplier).toBe("1×");
    expect(glm51.statusColor).toBe("green");
  });

  it("GLM-5.1/5.2 and Turbo off-peak promo still active in July 2026 (before Sept 30)", () => {
    const offPeakInJuly = new Date(Date.UTC(2026, 6, 1, 2, 0, 0)); // 10:00 UTC+8 in July
    const { glm51, glm5Turbo } = getGLMStatus(offPeakInJuly);
    expect(glm51.multiplier).toBe("1×");
    expect(glm5Turbo.multiplier).toBe("1×");
    expect(glm51.promotionExpired).toBe(false);
    expect(glm5Turbo.promotionExpired).toBe(false);
    expect(glm51.statusColor).toBe("green");
    expect(glm5Turbo.statusColor).toBe("green");
  });

  it("GLM-5.1/5.2 and Turbo promotions expire after September 30, 2026", () => {
    const offPeakAfterPromo = new Date(Date.UTC(2026, 9, 1, 2, 0, 0)); // 10:00 UTC+8 in October
    const { glm51, glm5Turbo } = getGLMStatus(offPeakAfterPromo);
    expect(glm51.multiplier).toBe("2×");
    expect(glm5Turbo.multiplier).toBe("2×");
    expect(glm51.promotionExpired).toBe(true);
    expect(glm5Turbo.promotionExpired).toBe(true);
    expect(glm51.statusColor).toBe("orange");
    expect(glm5Turbo.statusColor).toBe("orange");
  });

  it("GLM-5.1 card is shared with GLM-5.2 (same usage rules)", () => {
    const { glm51 } = getGLMStatus(makeUTC8(10));
    expect(glm51.name).toBe("GLM-5.1 / 5.2");
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
      { ...MOCK_CLAUDE, isBonus: true },
      { ...MOCK_GPT_BONUS, isBonus: true, nextChangeAt: null },
      { ...MOCK_CLAUDE, isBonus: true, name: "GLM-5.1 / 5.2", multiplier: "1×" },
      { ...MOCK_CLAUDE, isBonus: true, name: "GLM-5-Turbo", multiplier: "1×" },
      { ...MOCK_CLAUDE, isBonus: true, name: "Xiaomi", multiplier: "0.8×" },
    );
    expect(rec.isAllOptimal).toBe(true);
    expect(rec.summary).toBe("All services are at their best rates now!");
    expect(rec.upcomingBestWindow).toBeNull();
    expect(rec.nowBestServices).toHaveLength(5);
  });

  it("identifies services at bonus rate", () => {
    const rec = getBestTimeRecommendation(
      { ...MOCK_CLAUDE, isBonus: true },
      { ...MOCK_GPT_EXPIRED, isBonus: false },
      { ...MOCK_CLAUDE, isBonus: false, name: "GLM-5.1 / 5.2" },
      { ...MOCK_CLAUDE, isBonus: false, name: "GLM-5-Turbo" },
      { ...MOCK_CLAUDE, isBonus: false, name: "Xiaomi" },
    );
    expect(rec.isAllOptimal).toBe(false);
    expect(rec.nowBestServices).toHaveLength(1);
    expect(rec.nowBestServices[0].name).toBe("Claude Code");
  });

  it("reports no bonus services correctly", () => {
    const rec = getBestTimeRecommendation(
      { ...MOCK_CLAUDE, isBonus: false },
      { ...MOCK_GPT_EXPIRED, isBonus: false },
      { ...MOCK_CLAUDE, isBonus: false, name: "GLM-5.1 / 5.2" },
      { ...MOCK_CLAUDE, isBonus: false, name: "GLM-5-Turbo" },
      { ...MOCK_CLAUDE, isBonus: false, name: "Xiaomi" },
    );
    expect(rec.isAllOptimal).toBe(false);
    expect(rec.nowBestServices).toHaveLength(0);
    expect(rec.summary).toBe("No services are at bonus rates currently.");
  });

  it("provides upcoming best window when not all optimal", () => {
    const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
    const rec = getBestTimeRecommendation(
      { ...MOCK_CLAUDE, isBonus: true },
      { ...MOCK_GPT_EXPIRED, isBonus: false },
      { ...MOCK_CLAUDE, isBonus: false, name: "GLM-5.1 / 5.2", nextChangeAt: futureDate },
      { ...MOCK_CLAUDE, isBonus: true, name: "GLM-5-Turbo" },
      { ...MOCK_CLAUDE, isBonus: false, name: "Xiaomi", nextChangeAt: new Date(Date.now() + 7200000) },
    );
    expect(rec.upcomingBestWindow).not.toBeNull();
    expect(rec.upcomingBestWindow!.services).toContain("GLM-5.1 / 5.2");
    expect(rec.upcomingBestWindow!.countdown).toBeTruthy();
  });
});

describe("PROVIDERS", () => {
  it("has all expected provider keys", () => {
    expect(Object.keys(PROVIDERS)).toEqual(["claude", "codex", "glm", "xiaomi"]);
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

  it("GLM provider has two services (GLM-5 removed)", () => {
    const glm = PROVIDERS.glm;
    expect(glm.services).toEqual(["glm51", "glm5Turbo"]);
    expect(glm.services).not.toContain("glm5");
  });
});
