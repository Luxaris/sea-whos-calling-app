import { useState } from 'react';
import { MONTH_NAMES } from '../../lib/filters';
import './MonthStrip.css';

type Props = {
  /** Detections per calendar month, index 0 = January. */
  counts: number[];
  /** Calendar month 1–12 to highlight, or null. */
  month: number | null;
  /** Click or Enter on a bar. */
  onSelect?: (month: number) => void;
};

const W = 100;
const H = 46;
const BAR = 5.2;
const GAP = (W - 12 * BAR) / 12;
const TOP = 11;
const BASE = 36;

/** Twelve thin bars, one per month, with the chosen month in the primary colour and its count on top.
 *  Sits under the month line and uses the same rows it is counted from. */
export function MonthStrip({ counts, month, onSelect }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...counts);
  const fmt = (x: number) => x.toLocaleString('en-CA');
  const pct = (c: number) => (total ? Math.round((100 * c) / total) : 0);
  const x = (i: number) => GAP / 2 + i * (BAR + GAP);
  const barH = (c: number) => (c ? Math.max((c / max) * (BASE - TOP), 0.6) : 0);
  const summary = counts.map((c, i) => `${MONTH_NAMES[i]} ${c}`).join(', ');

  return (
    <div className="month-strip" data-testid="month-strip">
      <div className="month-strip__head">
        <span className="month-strip__title">Detections by month</span>
        <span className="month-strip__total">{fmt(total)} total</span>
      </div>
      <div className="month-strip__plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Detections by month: ${summary}`}>
          <line className="month-strip__base" x1="0" y1={BASE} x2={W} y2={BASE} />
          {counts.map((c, i) => {
            const m = i + 1;
            const hi = m === month;
            const h = barH(c);
            return (
              <g
                key={m}
                className={`month-strip__bar${hi ? ' is-active' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={hi}
                aria-label={`${MONTH_NAMES[i]}: ${fmt(c)} detections, ${pct(c)}%`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect?.(m)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(m);
                  }
                }}
              >
                <rect className="month-strip__hit" x={x(i) - GAP / 2} y={0} width={BAR + GAP} height={H} />
                <rect className="month-strip__fill" x={x(i)} y={BASE - h} width={BAR} height={h} rx={1.2} />
                {hi && c > 0 && (
                  <text className="month-strip__value" x={x(i) + BAR / 2} y={BASE - h - 2.5} textAnchor="middle">
                    {fmt(c)}
                  </text>
                )}
                <text className="month-strip__month" x={x(i) + BAR / 2} y={BASE + 6.5} textAnchor="middle">
                  {MONTH_NAMES[i][0]}
                </text>
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="month-strip__tip" style={{ left: `${((x(hover) + BAR / 2) / W) * 100}%` }} role="status">
            <b>{MONTH_NAMES[hover]}</b>
            <span>
              {fmt(counts[hover])} {counts[hover] === 1 ? 'detection' : 'detections'} · {pct(counts[hover])}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
