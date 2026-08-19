export type IconName =
  | "pin"
  | "calendar"
  | "globe"
  | "users"
  | "mail"
  | "shield"
  | "pulse"
  | "leaf"
  | "factory"
  | "signal"
  | "sun"
  | "car"
  | "sparkle"
  | "arrow"
  | "caret"
  | "chevron"
  | "download"
  | "check"
  | "menu"
  | "close"
  | "external";

const paths: Record<IconName, React.ReactNode> = {
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.2a3.5 3.5 0 0 1 0 6.6M17.5 20a6.5 6.5 0 0 0-2.2-4.9" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  pulse: <path d="M2.5 12h4l2-5 3.5 10 2.5-6 1.5 3h5.5" />,
  leaf: (
    <>
      <path d="M4 20c0-8 5-13 16-13 0 8-4.5 13-11 13-2.8 0-5-1.2-5-1.2Z" />
      <path d="M4 20c3-5 7-8 12-10" />
    </>
  ),
  factory: (
    <>
      <path d="M3 20V10l6 4V10l6 4V6h6v14H3Z" />
      <path d="M7 20v-3.5M12 20v-3.5M17 20v-3.5" />
    </>
  ),
  signal: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  car: (
    <>
      <path d="M3 15.5h18M5 15.5l1.6-5.2A2 2 0 0 1 8.5 9h7a2 2 0 0 1 1.9 1.3l1.6 5.2" />
      <path d="M4 15.5V19h3v-3.5M17 15.5V19h3v-3.5" />
      <circle cx="7.5" cy="15.5" r="0.6" />
      <circle cx="16.5" cy="15.5" r="0.6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4L4.5 10.8 10.2 9 12 3.5Z" />
      <path d="M19 16.5v3M17.5 18h3" />
    </>
  ),
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  caret: <path d="M7 10h10l-5 6z" fill="currentColor" stroke="none" />,
  chevron: <path d="m6 9.5 6 6 6-6" />,
  download: (
    <>
      <path d="M12 3.5v11m0 0 4-4m-4 4-4-4" />
      <path d="M4.5 17v2.5h15V17" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  menu: <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />,
  close: <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />,
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14v5.5H4.5V6H10" />
    </>
  ),
};

export function Icon({
  name,
  className = "size-4",
  strokeWidth = 1.6,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
