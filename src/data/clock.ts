import { useEffect, useState } from 'react';
import { getLiveDetections } from './api';
import { DEMO_NOW_MS, isDemoMode } from './demo';

// The example detections are dated 2026-10-17 around 15:06 PDT. For the demo the
// clock starts two minutes after the newest one ("Updated 15:08") and then runs in real time, so the caution strip shows on load
// and relative times keep moving. Replace with Date.now() once a live API exists.
const newest = Math.max(...getLiveDetections().map((d) => new Date(d.timestamp).getTime()));
const DEMO_START = newest + 2 * 60_000;
const offset = DEMO_START - Date.now();

const frozen = isDemoMode();

export function demoNow(): number {
  // The recorded demo needs the same clock every run.
  return frozen ? DEMO_NOW_MS : Date.now() + offset;
}

/** The demo clock, refreshed every `everyMs`. */
export function useNow(everyMs = 15_000): number {
  const [now, setNow] = useState(demoNow);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(demoNow()), everyMs);
    return () => window.clearInterval(timer);
  }, [everyMs]);
  return now;
}
