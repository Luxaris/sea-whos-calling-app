import { useState } from 'react';
import { getHydrophone, getSpecies } from '../../data/api';
import { demoNow } from '../../data/clock';
import type { HistoryDetection } from '../../data/types';
import { buildFile, downloadText, type ExportFormat, type ExportRecord, FORMATS } from '../../lib/export';
import { localDateKey } from '../../lib/time';

function toRecord(d: HistoryDetection): ExportRecord {
  const h = getHydrophone(d.hydrophoneId);
  return {
    id: d.id,
    species: getSpecies(d.speciesId).name,
    speciesId: d.speciesId,
    hydrophone: h.name,
    hydrophoneId: h.id,
    latitude: h.lat,
    longitude: h.lon,
    timestamp: d.timestamp,
    confidence: d.confidence,
    daylight: d.daylight,
  };
}

type Props = {
  rows: HistoryDetection[];
  /** One-row layout for the expanded table dialog. */
  compact?: boolean;
};

/** Downloads the filtered detections (always one row per detection). */
export function ExportBar({ rows, compact = false }: Props) {
  const [includeExtras, setIncludeExtras] = useState(true);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const n = rows.length;

  const download = () => {
    const f = FORMATS[format];
    const text = buildFile(rows.map(toRecord), format, includeExtras);
    downloadText(`sea-whos-calling-detections-${localDateKey(demoNow())}.${f.extension}`, text, f.mime);
  };

  return (
    <div className={compact ? 'export export--compact' : 'export'}>
      <label className="export__check">
        <input type="checkbox" checked={includeExtras} onChange={(e) => setIncludeExtras(e.target.checked)} />
        Include confidence and day or night in the file
      </label>
      <div className="export__row">
        <label className="field export__format">
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
            {(Object.keys(FORMATS) as ExportFormat[]).map((k) => (
              <option key={k} value={k}>
                {FORMATS[k].label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={`btn btn--primary export__button${compact ? '' : ' btn--large'}`}
          onClick={download}
          disabled={n === 0}
        >
          {n === 0 ? 'Nothing to download' : `Download ${n} ${n === 1 ? 'detection' : 'detections'}`}
        </button>
      </div>
    </div>
  );
}
