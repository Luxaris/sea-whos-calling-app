import { getHistory } from '../data/api';
import type { HistoryDetection, SpeciesId } from '../data/types';

/**
 * Optional spectrogram thumbnails at public/spectrograms/<history id>.webp, supplied by a backend.
 * A history detection shows its own; a live detection shows one of the same species, picked by a
 * hash of its id so a card keeps its picture. This repo ships none, so cards show a plain strip.
 */

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const url = (id: string) => `${base}spectrograms/${id}.webp`;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

let bySpecies: Map<SpeciesId, HistoryDetection[]> | null = null;
function pool(speciesId: SpeciesId): HistoryDetection[] {
  if (!bySpecies) {
    bySpecies = new Map();
    for (const d of getHistory()) {
      // Simulated rows have no clip and no thumbnail.
      if (d.simulated) continue;
      const list = bySpecies.get(d.speciesId) ?? [];
      list.push(d);
      bySpecies.set(d.speciesId, list);
    }
  }
  return bySpecies.get(speciesId) ?? [];
}

export type Spectrogram = { url: string; source: HistoryDetection; own: boolean };

/** The thumbnail for a detection, or null when none exists for its species. */
export function spectrogramFor(d: { id: string; speciesId: SpeciesId }): Spectrogram | null {
  if (d.id.startsWith('h-')) {
    const source = getHistory().find((h) => h.id === d.id);
    return source && !source.simulated ? { url: url(d.id), source, own: true } : null;
  }
  const rows = pool(d.speciesId);
  if (rows.length === 0) return null;
  const source = rows[hash(d.id) % rows.length];
  return { url: url(source.id), source, own: false };
}
