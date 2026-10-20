import { useCallback, useMemo, useState } from 'react';
import { getHydrophone, getSpeciesList } from '../data/api';
import { demoNow } from '../data/clock';
import type { HistoryDetection } from '../data/types';
import { filterDetections, type GroupBy, groupDetections, type HistoryFilters, monthCounts, monthSummary } from './filters';
import { monthOptions, type PeriodOption, periodOptionsFor, snapRange } from './periods';
import { localDateKey } from './time';

/** Filter state for the history panel, shared with the map so both show the same rows. */
export function useHistoryFilters(history: HistoryDetection[]) {
  const [groupBy, setGroupByState] = useState<GroupBy>('each');
  const [filters, setFilters] = useState<HistoryFilters>(() => ({
    // From the earliest row in the history.
    from: history.reduce((min, d) => (localDateKey(d.timestamp) < min ? localDateKey(d.timestamp) : min), localDateKey(demoNow())),
    to: localDateKey(demoNow()),
    light: 'any',
    species: getSpeciesList().map((s) => s.id),
    hydrophoneId: 'all',
    minConfidence: 0.7,
    month: null,
  }));

  const months = useMemo(() => monthOptions(history), [history]);
  const periodOptions = useMemo(() => periodOptionsFor(history, groupBy), [history, groupBy]);

  // By month and By season pick whole periods, so the date range snaps to period edges when the mode changes.
  const setGroupBy = useCallback(
    (g: GroupBy) => {
      setGroupByState(g);
      const options = periodOptionsFor(history, g);
      if (options && options.length) setFilters((f) => ({ ...f, ...snapRange(options, f) }));
    },
    [history],
  );

  /** Narrow the range to one month. A season view would then show a partial season, so it becomes a month view. */
  const pickMonth = useCallback((month: PeriodOption) => {
    setFilters((f) => ({ ...f, from: month.from, to: month.to }));
    setGroupByState((g) => (g === 'season' ? 'month' : g));
  }, []);

  const rows = useMemo(() => filterDetections(history, filters), [history, filters]);
  const periods = useMemo(() => (groupBy === 'each' ? [] : groupDetections(rows, groupBy)), [rows, groupBy]);
  const monthLine = useMemo(
    () => (filters.hydrophoneId === 'all' ? null : monthSummary(history, filters, getHydrophone(filters.hydrophoneId).name)),
    [history, filters],
  );

  const monthBars = useMemo(() => monthCounts(history, filters), [history, filters]);
  /** Month strip click: narrow to that calendar month, or clear it when it is already chosen. */
  const toggleMonth = useCallback((month: number) => setFilters((f) => ({ ...f, month: f.month === month ? null : month })), []);

  return { groupBy, setGroupBy, filters, setFilters, periodOptions, months, pickMonth, rows, periods, monthLine, monthBars, toggleMonth };
}

export type HistoryState = ReturnType<typeof useHistoryFilters>;
