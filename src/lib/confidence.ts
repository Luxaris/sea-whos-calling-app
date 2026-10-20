export type ConfidenceLevel = 'high' | 'medium' | 'low';

export const HIGH_CONFIDENCE = 0.85;
export const MEDIUM_CONFIDENCE = 0.7;

/** Whole percent, e.g. 0.94 → 94. */
export function confidencePercent(confidence: number): number {
  return Math.round(confidence * 100);
}

/** Level from the shown percentage, so the word always agrees with the number. */
export function confidenceLevel(confidence: number): ConfidenceLevel {
  const pct = confidencePercent(confidence);
  if (pct >= HIGH_CONFIDENCE * 100) return 'high';
  if (pct >= MEDIUM_CONFIDENCE * 100) return 'medium';
  return 'low';
}

/** "94% high" */
export function formatConfidence(confidence: number): string {
  return `${confidencePercent(confidence)}% ${confidenceLevel(confidence)}`;
}

export function isHighConfidence(confidence: number): boolean {
  return confidenceLevel(confidence) === 'high';
}
