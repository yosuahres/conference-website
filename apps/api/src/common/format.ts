const DEFAULT_TZ = 'Asia/Jakarta';

/** IDR has no minor units; plain `Intl` would render "Rp 1.500.000,00". */
export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  }).format(date);
}

export function formatDateTime(
  value: Date | string | null | undefined,
  timezone = DEFAULT_TZ,
) {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short',
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
  if (!from) return '';
  if (!to) return formatDate(from, timezone);

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  }).formatRange(from, to);
}
