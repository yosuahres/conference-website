"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

/**
 * Fades its children up once they scroll into view, then stops observing.
 * The hidden state lives in CSS (`.reveal` in globals.css) so it is applied
 * before hydration and cannot flash.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
}: {
  as?: ElementType;
  /** Stagger, in milliseconds, applied once the element is in view. */
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;

    // Anything already on screen at mount reveals straight away.
    const observer = new IntersectionObserver(
      (entries, obs) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShown(true);
        obs.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      style={
        delay
          ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties)
          : undefined
      }
      className={`reveal ${shown ? "is-visible" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
