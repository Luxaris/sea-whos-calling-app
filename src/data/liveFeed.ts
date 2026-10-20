import { useCallback, useEffect, useReducer } from 'react';
import { getLiveDetections, getSimulationPool } from './api';
import { demoNow } from './clock';
import { backdateForDemo, isDemoMode } from './demo';
import type { Detection } from './types';

// Demo feed: starts with the example "live" detections, then every `intervalMs`
// stamps the next simulation pool item with the current (demo) time and puts it
// on top. Replace with a WebSocket or polling call once the classifier has an API.

export type LiveFeedOptions = {
  /** How often a simulated detection arrives. Default 20 s. */
  intervalMs?: number;
  /** How many detections to keep. Default 10. */
  keep?: number;
  /** Set false to stop the simulated arrivals entirely (demo mode). Default true. */
  simulate?: boolean;
};

type State = {
  detections: Detection[];
  /** How many pool items have been used so far. */
  added: number;
  /** Ids that arrived after the page opened; their cards get a brief highlight. */
  arrived: string[];
  updatedAt: number;
};

type Action = { type: 'arrive'; now: number; keep: number } | { type: 'inject'; detection: Detection; keep: number };

const isArchive = (d: Detection) => d.id.startsWith('h-');

function init(): State {
  const live = getLiveDetections();
  return { detections: isDemoMode() ? backdateForDemo(live) : live, added: 0, arrived: [], updatedAt: demoNow() };
}

/** Put one new detection on top, keeping `keep` rows. */
function add(state: State, detection: Detection, keep: number, now: number, fromPool: boolean): State {
  if (state.detections.some((d) => d.id === detection.id)) return state;
  const all = [detection, ...state.detections].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  // Archived detections stay at the bottom of the list; new arrivals never push them out.
  const archive = all.filter(isArchive);
  const detections = [...all.filter((d) => !isArchive(d)).slice(0, Math.max(0, keep - archive.length)), ...archive];
  const kept = new Set(detections.map((d) => d.id));
  return {
    detections,
    added: state.added + (fromPool ? 1 : 0),
    arrived: [...state.arrived, detection.id].filter((id) => kept.has(id)),
    updatedAt: now,
  };
}

function reducer(state: State, action: Action): State {
  if (action.type === 'inject') {
    return add(state, action.detection, action.keep, new Date(action.detection.timestamp).getTime(), false);
  }
  const pool = getSimulationPool();
  if (pool.length === 0) return state;
  const item = pool[state.added % pool.length];
  const round = Math.floor(state.added / pool.length);
  const detection: Detection = {
    ...item,
    // The pool repeats, so later rounds need fresh ids.
    id: round === 0 ? item.id : `${item.id}-r${round + 1}`,
    timestamp: new Date(action.now).toISOString(),
  };
  return add(state, detection, action.keep, action.now, true);
}

export function useLiveDetections({ intervalMs = 20_000, keep = 10, simulate = true }: LiveFeedOptions = {}) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [paused, setPaused] = useReducer((_: boolean, next: boolean) => next, false);

  useEffect(() => {
    if (paused || !simulate) return;
    const timer = window.setInterval(() => dispatch({ type: 'arrive', now: demoNow(), keep }), intervalMs);
    return () => window.clearInterval(timer);
  }, [paused, simulate, intervalMs, keep]);

  const togglePaused = useCallback(() => setPaused(!paused), [paused]);
  /** Add one specific detection now (the scripted demo alert). */
  const inject = useCallback((detection: Detection) => dispatch({ type: 'inject', detection, keep }), [keep]);

  return {
    detections: state.detections,
    arrived: state.arrived,
    latest: state.added > 0 ? state.detections.find((d) => d.id === state.arrived[state.arrived.length - 1]) ?? null : null,
    updatedAt: state.updatedAt,
    paused,
    togglePaused,
    inject,
  };
}
