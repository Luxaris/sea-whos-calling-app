import { exactPeriod, type PeriodOption, stepPeriod } from '../../lib/periods';
import type { MapMode } from '../HydrophoneMap/HydrophoneMarker';
import { Segmented } from '../Segmented/Segmented';
import './MapSourceTabs.css';

type Props = {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  /** Rows currently matching the history filters. */
  historyCount: number;
  /** Months that have history, oldest first. */
  months: PeriodOption[];
  /** The history filters' current date range. */
  range: { from: string; to: string };
  onPickMonth: (month: PeriodOption) => void;
};

const Chevron = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d={direction === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} />
  </svg>
);

/** Switches the map between the live feed and the filtered history, with a month stepper for the history. */
export function MapSourceTabs({ mode, onChange, historyCount, months, range, onPickMonth }: Props) {
  const options = [
    { value: 'recent' as const, label: 'Recent detections' },
    { value: 'history' as const, label: `History, ${historyCount} matching` },
  ];
  const current = exactPeriod(months, range);
  const previous = stepPeriod(months, range, -1);
  const next = stepPeriod(months, range, 1);

  return (
    <div className="map-source">
      <Segmented name="map-source" legend="Map shows" value={mode} options={options} onChange={onChange} className="map-source__tabs" />

      {mode === 'history' && (
        <div className="map-source__month" role="group" aria-label="Month shown">
          <button
            type="button"
            className="btn btn--quiet map-source__step"
            onClick={() => previous && onPickMonth(previous)}
            disabled={!previous}
            aria-label="Previous month"
          >
            <Chevron direction="left" />
          </button>
          <label className="field map-source__pick">
            <span className="visually-hidden">Month</span>
            <select
              value={current?.key ?? ''}
              onChange={(e) => {
                const m = months.find((o) => o.key === e.target.value);
                if (m) onPickMonth(m);
              }}
            >
              {!current && (
                <option value="" disabled>
                  Date range from filters
                </option>
              )}
              {months.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn--quiet map-source__step"
            onClick={() => next && onPickMonth(next)}
            disabled={!next}
            aria-label="Next month"
          >
            <Chevron direction="right" />
          </button>
        </div>
      )}

      <p className="map-source__hint">
        {mode === 'recent'
          ? 'Pins show the newest detection at each hydrophone from the live feed.'
          : 'Pins show the species heard most at each hydrophone for the chosen month and filters. All sites are simulated in this demo build.'}
      </p>
    </div>
  );
}
