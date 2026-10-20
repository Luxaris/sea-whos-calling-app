import { useEffect, useRef, useState } from 'react';
import { type GroupBy, isRangeValid } from '../../lib/filters';
import type { HistoryState } from '../../lib/useHistoryFilters';
import { ExportBar } from './ExportBar';
import { Filters } from './Filters';
import { HistoryTable } from './HistoryTable';
import { MonthStrip } from '../MonthStrip/MonthStrip';
import './HistoryPanel.css';

const PERIOD_WORD: Record<Exclude<GroupBy, 'each'>, [string, string]> = {
  day: ['day', 'days'],
  month: ['month', 'months'],
  season: ['season', 'seasons'],
};

type Props = {
  /** Filter state owned by the app, so the map can show the same rows. */
  state: HistoryState;
};

export function HistoryPanel({ state }: Props) {
  const { groupBy, setGroupBy, filters, setFilters, periodOptions, rows, periods, monthLine, monthBars, toggleMonth } = state;
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  // The native dialog handles focus, Escape and the backdrop; keep it in step with state.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (expanded && !el.open) el.showModal();
    else if (!expanded && el.open) el.close();
  }, [expanded]);

  const n = rows.length;
  let summary = `${n} matching ${n === 1 ? 'detection' : 'detections'}`;
  if (groupBy !== 'each' && n > 0) {
    const [one, many] = PERIOD_WORD[groupBy];
    summary += ` in ${periods.length} ${periods.length === 1 ? one : many}`;
  }

  const hasTable = isRangeValid(filters) && n > 0;
  const table = (isExpanded: boolean) => (
    <HistoryTable groupBy={groupBy} rows={rows} periods={periods} species={filters.species} expanded={isExpanded} />
  );
  const footnote = (
    <p className="history__footnote">
      Confidence is the model's probability for the species shown. High is 85% and up, medium 70 to 84%, low below
      70%.
    </p>
  );

  return (
    <div className="history">
      <h2 className="history__title">Detection history</h2>
      <Filters groupBy={groupBy} onGroupBy={setGroupBy} filters={filters} onChange={setFilters} periods={periodOptions} />

      <section className="history__results" aria-labelledby="history-count">
        <div className="history__count-row">
          <strong id="history-count" className="history__count" aria-live="polite">
            {summary}
          </strong>
          <span className="history__hint">Every row is simulated for the demo. A backend replaces them with real detections.</span>
          {hasTable && (
            <button type="button" className="btn btn--quiet history__expand" onClick={() => setExpanded(true)} data-testid="history-expand">
              <ExpandIcon />
              Expand table
            </button>
          )}
        </div>
        {monthLine && (
          <p className="history__month-line" data-testid="busiest-month-line">
            {monthLine}
          </p>
        )}
        {filters.hydrophoneId !== 'all' && monthBars.some((c) => c > 0) && (
          <MonthStrip counts={monthBars} month={filters.month} onSelect={toggleMonth} />
        )}
        {!isRangeValid(filters) ? (
          <p className="history__empty">The From date is after the To date. Pick an earlier From date.</p>
        ) : n === 0 ? (
          <p className="history__empty">No detections match these filters. Try a wider date range or lower confidence.</p>
        ) : (
          table(false)
        )}
        {footnote}
      </section>

      <ExportBar rows={rows} />

      <dialog
        ref={dialog}
        className="history-dialog"
        aria-labelledby="history-dialog-title"
        data-testid="history-dialog"
        onClose={() => setExpanded(false)}
      >
        {expanded && (
          <div className="history-dialog__body">
            <div className="history-dialog__head">
              <div>
                <h2 id="history-dialog-title" className="history__title">
                  Detection history
                </h2>
                <strong className="history__count">{summary}</strong>
              </div>
              <button type="button" className="btn btn--secondary" onClick={() => setExpanded(false)}>
                <CloseIcon />
                Close
              </button>
            </div>
            {table(true)}
            {footnote}
            <ExportBar rows={rows} compact />
          </div>
        )}
      </dialog>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
