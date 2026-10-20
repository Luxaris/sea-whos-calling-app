import type { HistoryDetection } from '../data/types';
import type { GroupBy } from './filters';
import { seasonOf } from './seasons';
import { formatYearMonth, localDateKey, localYearMonth } from './time';

/** A whole month or season that the From/To controls can pick, as inclusive local dates. */
export type PeriodOption = {
  key: string;
  label: string;
  from: string;
  to: string;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Last day of a month, "YYYY-MM-DD". Month is 1–12. */
function monthEnd(year: number, month: number): string {
  return `${year}-${pad(month)}-${pad(new Date(Date.UTC(year, month, 0)).getUTCDate())}`;
}

/** Months that have at least one detection, oldest first. */
export function monthOptions(rows: HistoryDetection[]): PeriodOption[] {
  const seen = new Map<string, PeriodOption>();
  for (const d of rows) {
    const key = localDateKey(d.timestamp).slice(0, 7);
    if (seen.has(key)) continue;
    const { year, month } = localYearMonth(d.timestamp);
    seen.set(key, { key, label: formatYearMonth(key), from: `${key}-01`, to: monthEnd(year, month) });
  }
  return [...seen.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
}

/** Seasons that have at least one detection, oldest first. Winter runs Dec 1 to the end of February. */
export function seasonOptions(rows: HistoryDetection[]): PeriodOption[] {
  const seen = new Map<string, PeriodOption & { order: number }>();
  for (const d of rows) {
    const s = seasonOf(d.timestamp);
    const key = String(s.order);
    if (seen.has(key)) continue;
    let from: string;
    let to: string;
    switch (s.name) {
      case 'Spring':
        from = `${s.year}-03-01`;
        to = `${s.year}-05-31`;
        break;
      case 'Summer':
        from = `${s.year}-06-01`;
        to = `${s.year}-08-31`;
        break;
      case 'Fall':
        from = `${s.year}-09-01`;
        to = `${s.year}-11-30`;
        break;
      case 'Winter':
        from = `${s.year}-12-01`;
        to = monthEnd(s.year + 1, 2);
        break;
    }
    seen.set(key, { key, label: s.label, from, to, order: s.order });
  }
  return [...seen.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...o }) => o);
}

/** The pickable periods for a Show mode, or null when the mode uses plain date inputs. */
export function periodOptionsFor(rows: HistoryDetection[], groupBy: GroupBy): PeriodOption[] | null {
  if (groupBy === 'month') return monthOptions(rows);
  if (groupBy === 'season') return seasonOptions(rows);
  return null;
}

/** The period a From date belongs to, or the first one after it. */
export function periodForFrom(options: PeriodOption[], from: string): PeriodOption | undefined {
  if (!from) return options[0];
  return options.find((o) => o.to >= from) ?? options[0];
}

/** The period a To date belongs to, or the last one before it. */
export function periodForTo(options: PeriodOption[], to: string): PeriodOption | undefined {
  if (!to) return options[options.length - 1];
  for (let i = options.length - 1; i >= 0; i--) if (options[i].from <= to) return options[i];
  return options[options.length - 1];
}

/** Widen a date range to whole periods so a month or season view never shows a partial period. */
export function snapRange(options: PeriodOption[], range: { from: string; to: string }): { from: string; to: string } {
  const first = periodForFrom(options, range.from);
  const last = periodForTo(options, range.to);
  if (!first || !last) return range;
  const from = first.from;
  const to = last.to >= from ? last.to : first.to;
  return { from, to };
}

/** The option whose bounds equal the range exactly, if any. */
export function exactPeriod(options: PeriodOption[], range: { from: string; to: string }): PeriodOption | undefined {
  return options.find((o) => o.from === range.from && o.to === range.to);
}

/**
 * The period before or after the current one. When the range isn't a single
 * period, stepping back lands on the last period in the range and stepping
 * forward on the first.
 */
export function stepPeriod(
  options: PeriodOption[],
  range: { from: string; to: string },
  direction: -1 | 1,
): PeriodOption | undefined {
  const current = exactPeriod(options, range);
  if (!current) return direction < 0 ? periodForTo(options, range.to) : periodForFrom(options, range.from);
  return options[options.indexOf(current) + direction];
}
