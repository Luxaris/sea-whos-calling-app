import type { Detection, HistoryDetection, SpeciesId } from '../data/types';
import { toMs } from './time';

/** Live detections carry a clip; past ones may not. */
export type AnyDetection = HistoryDetection & Partial<Pick<Detection, 'clipSeconds' | 'audioUrl'>>;

const sameEvent = (d: HistoryDetection) => `${d.hydrophoneId}|${d.speciesId}|${toMs(d.timestamp)}`;

/** Live feed plus history, newest first, with the feed's copy winning when both hold the same event. */
export function mergeDetections(live: Detection[], history: HistoryDetection[]): AnyDetection[] {
  const seen = new Set(live.map(sameEvent));
  const merged: AnyDetection[] = [...live, ...history.filter((h) => !seen.has(sameEvent(h)))];
  return merged.sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));
}

/** Newest-first detections at one hydrophone, up to `now`. */
export function detectionsAt(all: AnyDetection[], hydrophoneId: string, now: number): AnyDetection[] {
  return all.filter((d) => d.hydrophoneId === hydrophoneId && toMs(d.timestamp) <= now);
}

/** How many detections fall in the `windowMs` before `now`. */
export function countSince(list: AnyDetection[], now: number, windowMs: number): number {
  return list.filter((d) => now - toMs(d.timestamp) <= windowMs).length;
}

/**
 * High-confidence detections recent enough to hold sonar, newest first,
 * keeping only the newest one at each hydrophone.
 */
export function activeAlerts(live: Detection[], now: number, windowMs: number, isHigh: (c: number) => boolean) {
  const seen = new Set<string>();
  return live
    .filter((d) => isHigh(d.confidence) && toMs(d.timestamp) <= now && now - toMs(d.timestamp) < windowMs)
    .sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp))
    .filter((d) => !seen.has(d.hydrophoneId) && seen.add(d.hydrophoneId));
}

/** What the map shows for one hydrophone: its newest detection, the species heard most, and how many. */
export type HydrophoneSummary<T extends HistoryDetection = HistoryDetection> = {
  hydrophoneId: string;
  newest: T;
  topSpeciesId: SpeciesId;
  count: number;
};

/** One summary per hydrophone that has at least one detection in `rows`. */
export function summarizeByHydrophone<T extends HistoryDetection>(rows: T[]): Map<string, HydrophoneSummary<T>> {
  const newest = new Map<string, T>();
  const counts = new Map<string, Map<SpeciesId, number>>();
  for (const d of rows) {
    const current = newest.get(d.hydrophoneId);
    if (!current || toMs(d.timestamp) > toMs(current.timestamp)) newest.set(d.hydrophoneId, d);
    let perSpecies = counts.get(d.hydrophoneId);
    if (!perSpecies) counts.set(d.hydrophoneId, (perSpecies = new Map()));
    perSpecies.set(d.speciesId, (perSpecies.get(d.speciesId) ?? 0) + 1);
  }
  const out = new Map<string, HydrophoneSummary<T>>();
  for (const [hydrophoneId, d] of newest) {
    const perSpecies = counts.get(hydrophoneId)!;
    let topSpeciesId = d.speciesId;
    let top = 0;
    let count = 0;
    for (const [speciesId, n] of perSpecies) {
      count += n;
      if (n > top) {
        top = n;
        topSpeciesId = speciesId;
      }
    }
    out.set(hydrophoneId, { hydrophoneId, newest: d, topSpeciesId, count });
  }
  return out;
}
