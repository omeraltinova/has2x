"use client";

import { useState, useEffect } from "react";
import {
  getGLMStatus,
  getDeepSeekStatus,
  getXiaomiStatus,
  type ServiceStatus,
} from "@/lib/services";
import { useHasHydrated } from "@/lib/useHasHydrated";

export type AllStatuses = {
  glm53: ServiceStatus;
  glm53Flash: ServiceStatus;
  deepseek: ServiceStatus;
  xiaomi: ServiceStatus;
};

export function useStatuses() {
  const [statuses, setStatuses] = useState<AllStatuses | null>(null);
  const isHydrated = useHasHydrated();

  useEffect(() => {
    if (!isHydrated) return;

    const update = () => {
      const now = new Date();
      const { glm53, glm53Flash } = getGLMStatus(now);
      const deepseek = getDeepSeekStatus(now);
      const xiaomi = getXiaomiStatus(now);
      setStatuses({ glm53, glm53Flash, deepseek, xiaomi });
    };

    update();
    const intervalId = window.setInterval(update, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isHydrated]);

  return statuses;
}
