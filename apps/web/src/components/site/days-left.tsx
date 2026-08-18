"use client";

import { useEffect, useState } from "react";

export function DaysLeft({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const target = new Date(iso).getTime();
    if (Number.isNaN(target)) return;

    const days = Math.ceil((target - Date.now()) / 86_400_000);
    if (days < 0) setLabel("Closed");
    else if (days === 0) setLabel("Today");
    else setLabel(`${days} ${days === 1 ? "day" : "days"} left`);
  }, [iso]);

  if (!label) return null;

  const closed = label === "Closed";

  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[0.62rem] font-semibold ${
        closed ? "bg-shell text-faint" : "border border-line text-subtle"
      }`}
    >
      {label}
    </span>
  );
}
