import { getHydrophone, getSpecies, getSpeciesList } from '../../data/api';
import type { HistoryDetection, SpeciesId } from '../../data/types';
import type { GroupBy, PeriodRow } from '../../lib/filters';
import { formatClock, formatDay, formatDayYear, localYearMonth } from '../../lib/time';
import { demoNow } from '../../data/clock';
import { ConfidenceMeter } from '../ConfidenceMeter/ConfidenceMeter';

type Props = {
  groupBy: GroupBy;
  rows: HistoryDetection[];
  periods: PeriodRow[];
  species: SpeciesId[];
  /** In the expanded dialog the box can be taller and show far more rows. */
  expanded?: boolean;
};

/** The per-row table shows at most this many rows (a history can have thousands); Export always has all of them. */
const MAX_ROWS = 300;
const MAX_ROWS_EXPANDED = 2000;

const PERIOD_HEADING: Record<Exclude<GroupBy, 'each'>, string> = { day: 'Day', month: 'Month', season: 'Season' };

/** "Oct 17, 15:06", with the year added when it isn't this year. */
function when(t: string): string {
  const sameYear = localYearMonth(t).year === localYearMonth(demoNow()).year;
  return `${sameYear ? formatDay(t) : formatDayYear(t)}, ${formatClock(t)}`;
}

export function HistoryTable({ groupBy, rows, periods, species, expanded = false }: Props) {
  const boxClass = expanded ? 'table-box table-box--expanded' : 'table-box';
  const maxRows = expanded ? MAX_ROWS_EXPANDED : MAX_ROWS;
  if (groupBy === 'each') {
    return (
      <div className={boxClass} tabIndex={0} role="region" aria-label="Matching detections">
        <table className="table" data-testid="history-table">
          <thead>
            <tr>
              <th scope="col">Species</th>
              <th scope="col">Hydrophone</th>
              <th scope="col">When</th>
              <th scope="col">Light</th>
              <th scope="col">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, maxRows).map((d) => (
              <tr key={d.id}>
                <td>{getSpecies(d.speciesId).shortName}</td>
                <td>{getHydrophone(d.hydrophoneId).shortName}</td>
                <td>
                  <time dateTime={d.timestamp}>{when(d.timestamp)}</time>
                </td>
                <td>{d.daylight ? 'Day' : 'Night'}</td>
                <td>
                  <ConfidenceMeter confidence={d.confidence} withLevel={false} size="small" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > maxRows && (
          <p className="history__footnote">
            Showing the newest {maxRows} of {rows.length}.{' '}
            {expanded ? 'Group by day, month or season to see them all, or export.' : 'Expand the table, group by period, or export to see them all.'}
          </p>
        )}
      </div>
    );
  }

  // Keep the species columns in the standard order.
  const shown = getSpeciesList().filter((s) => species.includes(s.id));
  return (
    <div className={boxClass} tabIndex={0} role="region" aria-label="Detections per period">
      <table className="table table--counts" data-testid="history-table">
        <thead>
          <tr>
            <th scope="col">{PERIOD_HEADING[groupBy]}</th>
            {shown.map((s) => (
              <th key={s.id} scope="col" className="num">
                {s.shortName}
              </th>
            ))}
            <th scope="col" className="num">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.label}</th>
              {shown.map((s) => (
                <td key={s.id} className={`num${p.counts[s.id] ? '' : ' zero'}`}>
                  {p.counts[s.id] ?? 0}
                </td>
              ))}
              <td className="num total">{p.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
