export type ExportFormat = 'csv' | 'geojson' | 'json';

/** One detection, flattened for a file. */
export type ExportRecord = {
  id: string;
  species: string;
  speciesId: string;
  hydrophone: string;
  hydrophoneId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  confidence?: number;
  daylight?: boolean;
};

const BASE_COLUMNS: (keyof ExportRecord)[] = [
  'id',
  'species',
  'speciesId',
  'hydrophone',
  'hydrophoneId',
  'latitude',
  'longitude',
  'timestamp',
];
const EXTRA_COLUMNS: (keyof ExportRecord)[] = ['confidence', 'daylight'];

export function columnsFor(includeExtras: boolean): (keyof ExportRecord)[] {
  return includeExtras ? [...BASE_COLUMNS, ...EXTRA_COLUMNS] : BASE_COLUMNS;
}

/** Drop confidence and daylight unless asked for. */
function pick(record: ExportRecord, includeExtras: boolean): ExportRecord {
  if (includeExtras) return record;
  const { confidence: _c, daylight: _d, ...rest } = record;
  return rest;
}

function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(records: ExportRecord[], includeExtras: boolean): string {
  const columns = columnsFor(includeExtras);
  const lines = [columns.join(','), ...records.map((r) => columns.map((c) => csvCell(r[c])).join(','))];
  return lines.join('\r\n') + '\r\n';
}

export function toJSON(records: ExportRecord[], includeExtras: boolean): string {
  return JSON.stringify(
    records.map((r) => pick(r, includeExtras)),
    null,
    2,
  );
}

export function toGeoJSON(records: ExportRecord[], includeExtras: boolean): string {
  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features: records.map((r) => {
        const { latitude, longitude, ...properties } = pick(r, includeExtras);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [longitude, latitude] },
          properties,
        };
      }),
    },
    null,
    2,
  );
}

export const FORMATS: Record<ExportFormat, { label: string; extension: string; mime: string }> = {
  csv: { label: 'CSV', extension: 'csv', mime: 'text/csv;charset=utf-8' },
  geojson: { label: 'GeoJSON', extension: 'geojson', mime: 'application/geo+json' },
  json: { label: 'JSON', extension: 'json', mime: 'application/json' },
};

export function buildFile(records: ExportRecord[], format: ExportFormat, includeExtras: boolean): string {
  switch (format) {
    case 'csv':
      return toCSV(records, includeExtras);
    case 'geojson':
      return toGeoJSON(records, includeExtras);
    case 'json':
      return toJSON(records, includeExtras);
  }
}

/** Save text as a file through a temporary download link. */
export function downloadText(filename: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
