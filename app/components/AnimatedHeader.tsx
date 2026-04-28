"use client";

import { useState, useEffect } from "react";

const SERVICES = [
  { name: "Claude", color: "text-orange-400" },
  { name: "Codex", color: "text-green-400" },
  { name: "GLM", color: "text-cyan-400" },
  { name: "Xiaomi", color: "text-yellow-400" },
];

export function AnimatedHeader() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exit" | "enter">("visible");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const cycle = () => {
      setPhase("exit");
      timeout = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % SERVICES.length);
        setPhase("enter");
        timeout = setTimeout(() => {
          setPhase("visible");
          timeout = setTimeout(cycle, 2000);
        }, 50);
      }, 500);
    };

    timeout = setTimeout(cycle, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const transform =
    phase === "visible" || phase === "enter"
      ? "translate-y-0 opacity-100"
      : "-translate-y-[120%] opacity-0";

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl flex items-center gap-0">
        <span>has</span>
        <span className="relative inline-flex h-[1.3em] min-w-[4em] overflow-hidden justify-center mx-1">
          <span
            className={`inline-flex items-center justify-center transition-all duration-500 ease-out ${transform} ${SERVICES[activeIndex].color}`}
          >
            {SERVICES[activeIndex].name}
          </span>
        </span>
        <span className="text-emerald-500">2x<span className="text-zinc-400">?</span></span>
      </h1>
    </div>
  );
}
