import type { HistoryDetection, SpeciesId } from '../data/types';
import { seasonOf } from './seasons';
import { formatDayYear, formatMonthYear, localDateKey, localYearMonth, toMs } from './time';

export type GroupBy = 'each' | 'day' | 'month' | 'season';
export type LightFilter = 'any' | 'day' | 'night';

export type HistoryFilters = {
  /** Inclusive local dates, "YYYY-MM-DD"; empty means no limit. */
  from: string;
  to: string;
  light: LightFilter;
  species: SpeciesId[];
  /** 'all' or a hydrophone id */
  hydrophoneId: string;
  /** 0, 0.7, 0.8 or 0.85 */
  minConfidence: number;
  /** Calendar month 1–12 in any year, or null for any month. */
  month: number | null;
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function isRangeValid(f: Pick<HistoryFilters, 'from' | 'to'>): boolean {
  return !f.from || !f.to || f.from <= f.to;
}

/** Rows that pass every filter, newest first. */
export function filterDetections<T extends HistoryDetection>(rows: T[], f: HistoryFilters): T[] {
  if (!isRangeValid(f)) return [];
  const species = new Set(f.species);
  return rows
    .filter((d) => {
      const day = localDateKey(d.timestamp);
      if (f.from && day < f.from) return false;
      if (f.to && day > f.to) return false;
      if (f.light === 'day' && !d.daylight) return false;
      if (f.light === 'night' && d.daylight) return false;
      if (!species.has(d.speciesId)) return false;
      if (f.hydrophoneId !== 'all' && d.hydrophoneId !== f.hydrophoneId) return false;
      if (f.month !== null && localYearMonth(d.timestamp).month !== f.month) return false;
      // Compare whole percentages so "70% and up" includes a 0.695 shown as 70%.
      return Math.round(d.confidence * 100) >= Math.round(f.minConfidence * 100);
    })
    .sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));
}

export type PeriodRow = {
  key: string;
  label: string;
  counts: Partial<Record<SpeciesId, number>>;
  total: number;
};

function period(t: string, by: Exclude<GroupBy, 'each'>): { key: string; label: string; order: number } {
  switch (by) {
    case 'day': {
      const key = localDateKey(t);
      return { key, label: formatDayYear(t), order: Number(key.replace(/-/g, '')) };
    }
    case 'month': {
      const key = localDateKey(t).slice(0, 7);
      return { key, label: formatMonthYear(t), order: Number(key.replace('-', '')) };
    }
    case 'season': {
      const s = seasonOf(t);
      return { key: String(s.order), label: s.label, order: s.order };
    }
  }
}

/** One row per day, month or season with counts per species, newest period first. */
export function groupDetections(rows: HistoryDetection[], by: Exclude<GroupBy, 'each'>): PeriodRow[] {
  const groups = new Map<string, PeriodRow & { order: number }>();
  for (const d of rows) {
    const p = period(d.timestamp, by);
    let g = groups.get(p.key);
    if (!g) {
      g = { key: p.key, label: p.label, order: p.order, counts: {}, total: 0 };
      groups.set(p.key, g);
    }
    g.counts[d.speciesId] = (g.counts[d.speciesId] ?? 0) + 1;
    g.total += 1;
  }
  return [...groups.values()].sort((a, b) => b.order - a.order).map(({ order: _order, ...row }) => row);
}

/**
 * One line about the chosen month at the chosen hydrophone, counted over the rows that
 * pass every other filter: "October is the busiest month at Folger Passage: 12 of 19 detections."
 * or "March: 3 of 19 detections at Folger Passage." Null unless both a hydrophone and a month are set.
 */
export function monthSummary(rows: HistoryDetection[], f: HistoryFilters, hydrophoneName: string): string | null {
  if (f.hydrophoneId === 'all' || f.month === null) return null;
  const base = filterDetections(rows, { ...f, month: null });
  const counts = new Array<number>(13).fill(0);
  for (const d of base) counts[localYearMonth(d.timestamp).month] += 1;
  const total = base.length;
  const n = counts[f.month];
  const busiest = Math.max(...counts);
  const name = MONTH_NAMES[f.month - 1];
  const fmt = (x: number) => x.toLocaleString('en-CA');
  const noun = total === 1 ? 'detection' : 'detections';
  if (n > 0 && n === busiest) return `${name} is the busiest month at ${hydrophoneName}: ${fmt(n)} of ${fmt(total)} ${noun}.`;
  return `${name}: ${fmt(n)} of ${fmt(total)} ${noun} at ${hydrophoneName}.`;
}

/**
 * Detections per calendar month (index 0 = January) over the rows that pass every filter
 * except the month, so the strip under the month line shows the whole year the line is
 * drawn from. Empty when no hydrophone is chosen.
 */
export function monthCounts(rows: HistoryDetection[], f: HistoryFilters): number[] {
  const counts = new Array<number>(12).fill(0);
  if (f.hydrophoneId === 'all') return counts;
  for (const d of filterDetections(rows, { ...f, month: null })) counts[localYearMonth(d.timestamp).month - 1] += 1;
  return counts;
}
