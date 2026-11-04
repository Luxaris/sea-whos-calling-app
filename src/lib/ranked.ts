import { getSpecies } from '../data/api';
import type { Detection, GroupId, RankedMatch } from '../data/types';

/** How many matches a card lists. */
export const TOP_MATCHES = 3;

export type GroupMatch = { groupId: GroupId; confidence: number };

/** The best matches to list, best first, or null when the detection carries fewer than two. */
export function topMatches(detection: Pick<Detection, 'ranked'>): RankedMatch[] | null {
  const ranked = detection.ranked;
  if (!ranked || ranked.length < 2) return null;
  return ranked.slice(0, TOP_MATCHES);
}

/**
 * The matches added up per species group, best first, for clips where only the group is named.
 * Uses every ranked entry, so the shares cover the whole list, not just the first three.
 */
export function groupMatches(ranked: RankedMatch[]): GroupMatch[] {
  const totals = new Map<GroupId, number>();
  for (const m of ranked) {
    const group = getSpecies(m.speciesId).group;
    totals.set(group, (totals.get(group) ?? 0) + m.confidence);
  }
  return [...totals]
    .map(([groupId, confidence]) => ({ groupId, confidence }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, TOP_MATCHES);
}
