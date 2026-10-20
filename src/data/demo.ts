import type { Detection } from './types';

/**
 * Demo mode (`?demo=1`) for walkthroughs: a frozen clock, no simulated
 * feed, short entrance animations, and one scripted alert that arrives 3 s after
 * load (or when `window.__demo.triggerAlert()` is called).
 */
export const DEMO_NOW_ISO = '2026-10-17T15:08:00-07:00';
export const DEMO_NOW_MS = Date.parse(DEMO_NOW_ISO);
export const DEMO_ALERT_DELAY_MS = 3000;
/** The example feed items are pushed this far into the past so nothing is on alert before the scripted one. */
export const DEMO_BACKDATE_MS = 35 * 60_000;

export function isDemoMode(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
}

/** `?alert=manual` holds the scripted alert until `window.__demo.triggerAlert()` is called. */
export function isAlertManual(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('alert') === 'manual';
}

export const DEMO_ALERT: Detection = {
  id: 'd-demo-alert',
  speciesId: 'orca',
  hydrophoneId: 'barkley',
  timestamp: DEMO_NOW_ISO,
  confidence: 0.93,
  daylight: true,
  clipSeconds: 8,
  audioUrl: null,
  reviewStatus: 'auto',
};

/** The starting feed in demo mode: the example detections, moved back so the caution strip starts empty. */
export function backdateForDemo(detections: Detection[]): Detection[] {
  return detections.map((d) =>
    d.id.startsWith('d-') ? { ...d, timestamp: new Date(Date.parse(d.timestamp) - DEMO_BACKDATE_MS).toISOString() } : d,
  );
}

declare global {
  interface Window {
    __demo?: { triggerAlert: () => void };
  }
}
