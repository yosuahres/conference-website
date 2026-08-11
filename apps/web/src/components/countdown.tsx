"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  /** ISO string — a Date prop would not survive the server/client boundary cleanly. */
  target: string;
  label: string;
}

function partsFrom(msRemaining: number) {
  const total = Math.max(0, msRemaining);
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}

export function Countdown({ target, label }: CountdownProps) {
  const targetMs = new Date(target).getTime();

  // Start at null so the server and the first client render agree; the real
  // numbers appear on the first tick.
  const [parts, setParts] = useState<ReturnType<typeof partsFrom> | null>(null);

  useEffect(() => {
    const tick = () => setParts(partsFrom(targetMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const expired = parts !== null && targetMs - Date.now() <= 0;

  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {expired ? (
        <p className="mt-3 text-sm font-medium text-muted-foreground">Closed</p>
      ) : (
        <div className="mt-3 flex gap-4">
          {(
            [
              ["Days", parts?.days],
              ["Hours", parts?.hours],
              ["Min", parts?.minutes],
              ["Sec", parts?.seconds],
            ] as const
          ).map(([unit, value]) => (
            <div key={unit} className="min-w-12">
              <p className="text-2xl font-semibold tabular-nums">
                {value === undefined ? "--" : String(value).padStart(2, "0")}
              </p>
              <p className="text-[11px] uppercase text-muted-foreground">
                {unit}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
