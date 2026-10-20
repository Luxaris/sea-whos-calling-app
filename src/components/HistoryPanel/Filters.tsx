import type { ReactNode } from 'react';
import { getHydrophones } from '../../data/api';
import { type GroupBy, type HistoryFilters, type LightFilter, MONTH_NAMES } from '../../lib/filters';
import { type PeriodOption, periodForFrom, periodForTo } from '../../lib/periods';
import { Segmented } from '../Segmented/Segmented';
import { SpeciesDropdown } from './SpeciesDropdown';

type Props = {
  groupBy: GroupBy;
  onGroupBy: (g: GroupBy) => void;
  filters: HistoryFilters;
  onChange: (f: HistoryFilters) => void;
  /** Whole months or seasons to pick from instead of dates; null for the date inputs. */
  periods: PeriodOption[] | null;
};

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'each', label: 'Each detection' },
  { value: 'day', label: 'By day' },
  { value: 'month', label: 'By month' },
  { value: 'season', label: 'By season' },
];

const SunIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--caution-icon)" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B4C8F" strokeWidth="2" aria-hidden="true">
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
);

const LIGHT_OPTIONS: { value: LightFilter; label: string; icon?: ReactNode }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'day', label: 'Daylight', icon: SunIcon },
  { value: 'night', label: 'Night', icon: MoonIcon },
];

const CONFIDENCE_OPTIONS = [
  { value: 0.7, label: '70% (medium and up)' },
  { value: 0.8, label: '80%' },
  { value: 0.85, label: '85% (high only)' },
  { value: 0, label: 'Any' },
];

export function Filters({ groupBy, onGroupBy, filters, onChange, periods }: Props) {
  const set = <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => onChange({ ...filters, [key]: value });
  const periodWord = groupBy === 'season' ? 'season' : 'month';

  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="History filters">
      <div className="filters__pair">
        <label className="field">
          Show
          <select value={groupBy} onChange={(e) => onGroupBy(e.target.value as GroupBy)}>
            {GROUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <SpeciesDropdown value={filters.species} onChange={(species) => set('species', species)} />
      </div>

      {periods ? (
        <div className="filters__pair">
          <label className="field">
            From {periodWord}
            <select
              value={periodForFrom(periods, filters.from)?.key ?? ''}
              onChange={(e) => {
                const o = periods.find((p) => p.key === e.target.value);
                if (o) set('from', o.from);
              }}
            >
              {periods.map((o) => (
                <option key={o.key} value={o.key} disabled={o.from > filters.to}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            To {periodWord}
            <select
              value={periodForTo(periods, filters.to)?.key ?? ''}
              onChange={(e) => {
                const o = periods.find((p) => p.key === e.target.value);
                if (o) set('to', o.to);
              }}
            >
              {periods.map((o) => (
                <option key={o.key} value={o.key} disabled={o.to < filters.from}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="filters__pair">
          <label className="field">
            From
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set('from', e.target.value)} />
          </label>
          <label className="field">
            To
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set('to', e.target.value)} />
          </label>
        </div>
      )}

      <div className="filters__pair">
        <label className="field">
          Hydrophone
          <select
            value={filters.hydrophoneId}
            onChange={(e) => set('hydrophoneId', e.target.value)}
            data-testid="history-hydrophone"
          >
            <option value="all">All</option>
            {getHydrophones().map((h) => (
              <option key={h.id} value={h.id}>
                {h.shortName}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Month
          <select
            value={filters.month ?? ''}
            onChange={(e) => set('month', e.target.value === '' ? null : Number(e.target.value))}
            data-testid="history-month"
          >
            <option value="">Any month</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Segmented
        name="light"
        legend="Time of day"
        value={filters.light}
        options={LIGHT_OPTIONS}
        onChange={(v) => set('light', v)}
      />

      <label className="field">
        Lowest confidence
        <select
          value={filters.minConfidence}
          onChange={(e) => set('minConfidence', Number(e.target.value))}
          data-testid="history-confidence"
        >
          {CONFIDENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
