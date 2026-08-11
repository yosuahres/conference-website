const DEFAULT_TZ = "Asia/Jakarta";

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: Date | string | null | undefined,
  timezone = DEFAULT_TZ,
) {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

export function formatDateTime(
  value: Date | string | null | undefined,
  timezone = DEFAULT_TZ,
) {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(date);
}

/** "12–14 August 2026", collapsing the shared month and year. */
export function formatDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  timezone = DEFAULT_TZ,
) {
  const from = toDate(start);
  const to = toDate(end);
  if (!from) return "";
  if (!to) return formatDate(from, timezone);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).formatRange(from, to);
}

export function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "in 6 days" / "3 days ago" — used on deadline banners. */
export function formatRelative(value: Date | string | null | undefined) {
  const date = toDate(value);
  if (!date) return "";

  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / 86_400_000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffDays) >= 1) return formatter.format(diffDays, "day");
  return formatter.format(Math.round(diffMs / 3_600_000), "hour");
}
