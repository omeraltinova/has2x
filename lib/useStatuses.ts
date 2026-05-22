"use client";

import { useState, useEffect } from "react";
import {
  getClaudeStatus,
  getGPTStatus,
  getGLMStatus,
  getXiaomiStatus,
  type ServiceStatus,
} from "@/lib/services";
import { useHasHydrated } from "@/lib/useHasHydrated";

export type AllStatuses = {
  claude: ServiceStatus;
  gpt: ServiceStatus;
  glm51: ServiceStatus;
  glm5: ServiceStatus;
  glm5Turbo: ServiceStatus;
  xiaomi: ServiceStatus;
};

export function useStatuses() {
  const [statuses, setStatuses] = useState<AllStatuses | null>(null);
  const isHydrated = useHasHydrated();

  useEffect(() => {
    if (!isHydrated) return;

    const update = () => {
      const now = new Date();
      const claude = getClaudeStatus(now);
      const gpt = getGPTStatus(now);
      const { glm51, glm5, glm5Turbo } = getGLMStatus(now);
      const xiaomi = getXiaomiStatus(now);
      setStatuses({ claude, gpt, glm51, glm5, glm5Turbo, xiaomi });
    };

    update();
    const intervalId = window.setInterval(update, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isHydrated]);

  return statuses;
}
