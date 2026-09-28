"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export function SiteBrand() {
  const brandRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const brand = brandRef.current;
    if (!brand) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | null = null;
    let inView = false;
    let pointerOver = window.matchMedia("(hover: hover) and (pointer: fine)").matches && brand.matches(":hover");
    let requestedRate = 1;

    const updateRate = () => {
      const nextRate = pointerOver || brand.matches(":focus-visible") ? 5 : 1;
      if (nextRate === requestedRate) return;
      requestedRate = nextRate;
      animation?.updatePlaybackRate(nextRate);
    };

    const syncAnimation = () => {
      if (reducedMotion.matches) {
        animation?.cancel();
        animation = null;
        requestedRate = 1;
        return;
      }

      if (!inView || document.hidden) {
        animation?.pause();
        return;
      }

      if (animation) {
        animation.play();
        return;
      }

      animation = brand.animate(
        [
          { backgroundPosition: "50% 50%", offset: 0, easing: "ease-in-out" },
          { backgroundPosition: "100% 50%", offset: 0.25, easing: "ease-in-out" },
          { backgroundPosition: "0% 50%", offset: 0.75, easing: "ease-in-out" },
          { backgroundPosition: "50% 50%", offset: 1 },
        ],
        { duration: 16000, iterations: Infinity },
      );
      requestedRate = 1;
      updateRate();
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncAnimation();
    });
    observer.observe(brand);

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerOver = true;
      updateRate();
    };
    const onPointerLeave = () => {
      pointerOver = false;
      updateRate();
    };

    brand.addEventListener("pointerenter", onPointerEnter);
    brand.addEventListener("pointerleave", onPointerLeave);
    brand.addEventListener("focus", updateRate);
    brand.addEventListener("blur", updateRate);
    document.addEventListener("visibilitychange", syncAnimation);
    reducedMotion.addEventListener("change", syncAnimation);

    return () => {
      observer.disconnect();
      brand.removeEventListener("pointerenter", onPointerEnter);
      brand.removeEventListener("pointerleave", onPointerLeave);
      brand.removeEventListener("focus", updateRate);
      brand.removeEventListener("blur", updateRate);
      document.removeEventListener("visibilitychange", syncAnimation);
      reducedMotion.removeEventListener("change", syncAnimation);
      animation?.cancel();
    };
  }, []);

  return (
    <Link ref={brandRef} href="/" className="site-brand" aria-label="has2x overview">
      has<span className="site-brand-accent">2x</span>
    </Link>
  );
}
