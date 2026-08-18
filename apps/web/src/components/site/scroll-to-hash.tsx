"use client";

import { useEffect } from "react";

const DURATION = 1400;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export function ScrollToHash() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const offsetOf = (el: HTMLElement) =>
      window.scrollY +
      el.getBoundingClientRect().top -
      (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);

    const run = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      cancelAnimationFrame(frame);

      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      if (reduced.matches) {
        window.scrollTo(0, offsetOf(target));
        root.style.scrollBehavior = previous;
        return;
      }

      window.scrollTo(0, 0);
      const end = offsetOf(target);
      const startedAt = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / DURATION);
        window.scrollTo(0, end * easeInOutCubic(t));

        if (t < 1) {
          frame = requestAnimationFrame(step);
        } else {
          root.style.scrollBehavior = previous;
        }
      };

      frame = requestAnimationFrame(step);
    };

    const restoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    run();
    window.addEventListener("hashchange", run);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", run);
      history.scrollRestoration = restoration;
    };
  }, []);

  return null;
}
