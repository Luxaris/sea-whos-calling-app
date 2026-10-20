import { localYearMonth } from './time';

export type SeasonName = 'Winter' | 'Spring' | 'Summer' | 'Fall';

export type Season = {
  name: SeasonName;
  /** The year the season starts in; winter starts in December. */
  year: number;
  /** Sorts chronologically. */
  order: number;
  /** "Fall 2026", "Winter 2025–26" */
  label: string;
};

/** Winter Dec–Feb, Spring Mar–May, Summer Jun–Aug, Fall Sep–Nov, in local time. */
export function seasonOf(t: string | number | Date): Season {
  const { year, month } = localYearMonth(t);
  if (month >= 3 && month <= 5) return make('Spring', year, 1);
  if (month >= 6 && month <= 8) return make('Summer', year, 2);
  if (month >= 9 && month <= 11) return make('Fall', year, 3);
  // December belongs to the winter that starts that year; Jan and Feb to the one before.
  return make('Winter', month === 12 ? year : year - 1, 4);
}

function make(name: SeasonName, year: number, index: number): Season {
  const label = name === 'Winter' ? `Winter ${year}–${String((year + 1) % 100).padStart(2, '0')}` : `${name} ${year}`;
  return { name, year, order: year * 10 + index, label };
}
