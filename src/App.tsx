import { useEffect, useMemo, useState } from 'react';
import { CautionStrip } from './components/CautionStrip/CautionStrip';
import { Header } from './components/Header/Header';
import { HistoryPanel } from './components/HistoryPanel/HistoryPanel';
import { HydrophoneDetails } from './components/HydrophoneDetails/HydrophoneDetails';
import { HydrophoneMap } from './components/HydrophoneMap/HydrophoneMap';
import type { MapMode } from './components/HydrophoneMap/HydrophoneMarker';
import { MapLegend } from './components/MapLegend/MapLegend';
import { MapSourceTabs } from './components/MapSourceTabs/MapSourceTabs';
import { RecentDetections } from './components/RecentDetections/RecentDetections';
import { getHistory, getLiveDetections } from './data/api';
import { useNow } from './data/clock';
import { DEMO_ALERT, DEMO_ALERT_DELAY_MS, isAlertManual, isDemoMode } from './data/demo';
import { useLiveDetections } from './data/liveFeed';
import type { Detection } from './data/types';
import { isHighConfidence } from './lib/confidence';
import { activeAlerts, type HydrophoneSummary, mergeDetections, summarizeByHydrophone } from './lib/detections';
import { DURATION, toMs } from './lib/time';
import { useHistoryFilters } from './lib/useHistoryFilters';
import { type Selection, SelectionProvider, useSelection } from './state/SelectionContext';
import './App.css';

const ALERT_WINDOW_MS = 30 * DURATION.MINUTE;
/** Zoom used by "Show on map" so the 5 km zone is visible. */
const ALERT_ZOOM = 10;

/** `?feedSeconds=5` speeds the demo feed up for a pitch. */
function feedIntervalMs(): number {
  const seconds = Number(new URLSearchParams(window.location.search).get('feedSeconds'));
  return Number.isFinite(seconds) && seconds >= 2 ? seconds * 1000 : 20_000;
}

/** The newest high-confidence detection, else the newest one. */
function defaultSelection(detections: Detection[]): Selection {
  const newestFirst = [...detections].sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));
  const pick = newestFirst.find((d) => isHighConfidence(d.confidence)) ?? newestFirst[0];
  return pick
    ? { detectionId: pick.id, hydrophoneId: pick.hydrophoneId }
    : { detectionId: null, hydrophoneId: 'folger' };
}

export default function App() {
  const initial = useMemo(() => defaultSelection(getLiveDetections()), []);
  return (
    <SelectionProvider initial={initial}>
      <Dashboard />
    </SelectionProvider>
  );
}

function Dashboard() {
  const demo = isDemoMode();
  const feed = useLiveDetections({ intervalMs: feedIntervalMs(), simulate: !demo });
  const detections = feed.detections;
  // Re-read the clock whenever the feed changes so new arrivals show "Just now".
  const tick = useNow();
  const now = Math.max(tick, feed.updatedAt);
  const history = getHistory();
  const { selection, focus, selectDetection, selectHydrophone } = useSelection();
  const [recentCollapsed, setRecentCollapsed] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('recent');
  const historyState = useHistoryFilters(history);
  const historyRows = historyState.rows;

  const alerts = useMemo(() => activeAlerts(detections, now, ALERT_WINDOW_MS, isHighConfidence), [detections, now]);
  const allDetections = useMemo(() => mergeDetections(detections, history), [detections, history]);
  const mapSummaries = useMemo<Map<string, HydrophoneSummary>>(
    () => (mapMode === 'recent' ? summarizeByHydrophone(detections) : summarizeByHydrophone(historyRows)),
    [mapMode, detections, historyRows],
  );

  // Demo mode: one scripted alert arrives shortly after load, or when
  // window.__demo.triggerAlert() is called. Either path runs it once.
  const inject = feed.inject;
  useEffect(() => {
    if (!demo) return;
    const trigger = () => inject(DEMO_ALERT);
    // ?alert=manual holds the alert until triggerAlert(), e.g. for a screen recording.
    const timer = isAlertManual() ? 0 : window.setTimeout(trigger, DEMO_ALERT_DELAY_MS);
    window.__demo = {
      triggerAlert: () => {
        window.clearTimeout(timer);
        trigger();
      },
    };
    return () => {
      window.clearTimeout(timer);
      delete window.__demo;
    };
  }, [demo, inject]);

  // The selected detection's hydrophone gets a mitigation circle too, so clicking a card shows its zone.
  const zoneHydrophoneIds = useMemo(
    () => (selection.detectionId ? [selection.hydrophoneId] : []),
    [selection.detectionId, selection.hydrophoneId],
  );

  // A recent pin selects its detection so the matching card lights up; a history
  // pin has no card, so it selects the hydrophone.
  const handlePin = (summary: HydrophoneSummary) => {
    const live = detections.find((d) => d.id === summary.newest.id);
    if (mapMode === 'recent' && live) selectDetection(live, { scroll: true });
    else selectHydrophone(summary.hydrophoneId);
  };

  return (
    <div className="app">
      <Header updatedAt={feed.updatedAt} operatorsWatching={2} />
      <CautionStrip
        alerts={alerts}
        now={now}
        onShow={(d) => selectDetection(d, { pan: true, zoom: ALERT_ZOOM, scroll: true })}
      />
      <main className={`layout${recentCollapsed ? ' layout--recent-collapsed' : ''}`}>
        <aside className="layout__recent" aria-label="Most recent detections">
          <RecentDetections
            detections={detections}
            now={now}
            arrived={feed.arrived}
            latest={feed.latest}
            paused={feed.paused}
            onTogglePause={feed.togglePaused}
            collapsed={recentCollapsed}
            onToggleCollapsed={() => setRecentCollapsed((c) => !c)}
          />
        </aside>
        <section className="layout__map" aria-label="Hydrophone map">
          <MapSourceTabs
            mode={mapMode}
            onChange={setMapMode}
            historyCount={historyRows.length}
            months={historyState.months}
            range={historyState.filters}
            onPickMonth={historyState.pickMonth}
          />
          <HydrophoneMap
            summaries={mapSummaries}
            mode={mapMode}
            alerts={alerts}
            zoneHydrophoneIds={zoneHydrophoneIds}
            selectedHydrophoneId={selection.hydrophoneId}
            focus={focus}
            onSelectPin={handlePin}
            onSelectHydrophone={selectHydrophone}
          />
          <MapLegend />
          <HydrophoneDetails hydrophoneId={selection.hydrophoneId} detections={allDetections} now={now} />
        </section>
        <aside className="layout__history" aria-label="Detection history">
          <HistoryPanel state={historyState} />
        </aside>
      </main>
    </div>
  );
}
