const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'day', ms: 86_400_000 },
  { unit: 'hour', ms: 3_600_000 },
  { unit: 'minute', ms: 60_000 },
];

export interface RemainingInfo {
  /** Milliseconds until the deadline (negative when overdue). */
  diffMs: number;
  overdue: boolean;
  /** Localized relative text, e.g. "in 3 hours" / "2 days ago". */
  text: string;
}

/** Relative time of `target` against `now` using Intl.RelativeTimeFormat. */
export function formatRelative(target: string | Date, locale: string, now: Date = new Date()) {
  const diffMs = new Date(target).getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(diffMs);
  for (const { unit, ms } of UNITS) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return rtf.format(Math.round(diffMs / 60_000), 'minute');
}

/** Remaining (or overdue) time against a deadline. */
export function remainingTime(
  due: string | null,
  locale: string,
  now: Date = new Date(),
): RemainingInfo | null {
  if (!due) return null;
  const diffMs = new Date(due).getTime() - now.getTime();
  return { diffMs, overdue: diffMs < 0, text: formatRelative(due, locale, now) };
}

export function formatDateTime(value: string | null, locale: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}
