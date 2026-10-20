// Times are shown in the hydrophones' local time (Pacific), whatever the viewer's clock says.
export const TIME_ZONE = 'America/Vancouver';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const clockFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const zoneFormat = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, timeZoneName: 'short' });
const dayFormat = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'short', day: 'numeric' });
const dayYearFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const monthYearFormat = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'long', year: 'numeric' });
const isoDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function toMs(t: string | number | Date): number {
  return typeof t === 'number' ? t : new Date(t).getTime();
}

/** "15:06" */
export function formatClock(t: string | number | Date): string {
  return clockFormat.format(toMs(t));
}

/** "PDT" or "PST" */
export function zoneName(t: string | number | Date): string {
  const part = zoneFormat.formatToParts(toMs(t)).find((p) => p.type === 'timeZoneName');
  return part?.value ?? '';
}

/** "Oct 17" */
export function formatDay(t: string | number | Date): string {
  return dayFormat.format(toMs(t));
}

/** "Oct 17, 2026" */
export function formatDayYear(t: string | number | Date): string {
  return dayYearFormat.format(toMs(t));
}

/** "October 2026" */
export function formatMonthYear(t: string | number | Date): string {
  return monthYearFormat.format(toMs(t));
}

/** "Oct 17, 15:06" */
export function formatWhen(t: string | number | Date): string {
  return `${formatDay(t)}, ${formatClock(t)}`;
}

/** Local calendar date as "2026-10-17", for comparing with date inputs. */
export function localDateKey(t: string | number | Date): string {
  return isoDateFormat.format(toMs(t));
}

/** Local year and month (1–12). */
export function localYearMonth(t: string | number | Date): { year: number; month: number } {
  const [year, month] = localDateKey(t).split('-').map(Number);
  return { year, month };
}

/** "2 min ago", "1 h ago", "3 days ago"; older than 30 days: the date, "Aug 3, 2023". */
export function relativeTime(t: string | number | Date, now: number): string {
  const diff = Math.max(0, now - toMs(t));
  if (diff > 30 * DAY) return formatDayYear(t);
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

/** Whole minutes between t and now, never negative. */
export function minutesAgo(t: string | number | Date, now: number): number {
  return Math.max(0, Math.floor((now - toMs(t)) / MINUTE));
}

/** "Today at 15:06" or "Oct 14 at 03:22" */
export function formatDayAt(t: string | number | Date, now: number): string {
  const sameDay = localDateKey(t) === localDateKey(now);
  return `${sameDay ? 'Today' : formatDay(t)} at ${formatClock(t)}`;
}

/** Seconds as "0:08" */
export function formatSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "2024-06" as "June 2024" */
export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 15)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const DURATION = { MINUTE, HOUR, DAY };
