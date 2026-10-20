import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { Circle, GeoJSON, MapContainer, ScaleControl, TileLayer } from 'react-leaflet';
import { getHydrophone, getHydrophones, getShippingLanes } from '../../data/api';
import { isDemoMode } from '../../data/demo';
import type { Detection, Hydrophone } from '../../data/types';
import type { HydrophoneSummary } from '../../lib/detections';
import type { MapFocus } from '../../state/SelectionContext';
import { HydrophoneMarker, type MapMode } from './HydrophoneMarker';
import { MapControls } from './MapControls';
import './HydrophoneMap.css';

export const MITIGATION_RADIUS_M = 5000;
const INITIAL_CENTER: [number, number] = [48.7, -125.8];

type Props = {
  /** One entry per hydrophone with something to show, from the live feed or the filtered history. */
  summaries: Map<string, HydrophoneSummary>;
  mode: MapMode;
  alerts: Detection[];
  /** Hydrophones that get a 5 km mitigation circle: active alerts plus the selected detection's. */
  zoneHydrophoneIds: string[];
  selectedHydrophoneId: string | null;
  focus: MapFocus | null;
  onSelectPin: (summary: HydrophoneSummary) => void;
  onSelectHydrophone: (hydrophoneId: string, options?: { pan?: boolean; zoom?: number }) => void;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function HydrophoneMap({
  summaries,
  mode,
  alerts,
  zoneHydrophoneIds,
  selectedHydrophoneId,
  focus,
  onSelectPin,
  onSelectHydrophone,
}: Props) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [showLanes, setShowLanes] = useState(true);
  const hydrophones = getHydrophones();
  const lanes = getShippingLanes();

  // Phones get one zoom level less so all nine hydrophones still fit.
  const initialZoom = typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 7;

  const zoneIds = useMemo(() => [...new Set([...alerts.map((a) => a.hydrophoneId), ...zoneHydrophoneIds])], [alerts, zoneHydrophoneIds]);

  useEffect(() => {
    if (!map || !focus) return;
    const h = getHydrophone(focus.hydrophoneId);
    const zoom = Math.max(map.getZoom(), focus.zoom ?? 0);
    // The recorded demo moves its own camera, so the map jumps instead of flying.
    const reduce = prefersReducedMotion() || isDemoMode();
    if (reduce) map.setView([h.lat, h.lon], zoom, { animate: false });
    else map.flyTo([h.lat, h.lon], zoom, { duration: 1.5 });
    // When the columns stack (or the page is scrolled) the map can be off screen.
    const box = map.getContainer().getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) {
      map.getContainer().scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [map, focus]);

  // Leaflet only watches the window, so redraw when the column changes width
  // (for example when the left column is collapsed).
  useEffect(() => {
    if (!map) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  const handleMarker = (hydrophone: Hydrophone, summary: HydrophoneSummary | null) => {
    if (summary) onSelectPin(summary);
    else onSelectHydrophone(hydrophone.id);
  };

  return (
    <div className="hmap">
      <MapContainer
        ref={setMap}
        className="hmap__map"
        center={INITIAL_CENTER}
        zoom={initialZoom}
        minZoom={4}
        maxZoom={14}
        zoomControl={false}
        scrollWheelZoom={false}
        aria-label="Map of hydrophones on the BC coast"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {showLanes && (
          <GeoJSON
            data={lanes}
            style={{ className: 'hmap__lane', color: '#5B7A93', weight: 2, dashArray: '8 6', interactive: false }}
          />
        )}
        {zoneIds.map((id) => {
          const h = getHydrophone(id);
          return (
            <Circle
              key={id}
              center={[h.lat, h.lon]}
              radius={MITIGATION_RADIUS_M}
              // react-leaflet only applies className at creation, as a top-level prop.
              className="hmap__zone"
              pathOptions={{
                color: '#B07800',
                weight: 1.5,
                dashArray: '4 4',
                fillColor: '#FAB219',
                fillOpacity: 0.16,
              }}
              interactive={false}
            />
          );
        })}
        {hydrophones.map((h) => (
          <HydrophoneMarker
            key={h.id}
            hydrophone={h}
            summary={summaries.get(h.id) ?? null}
            mode={mode}
            selected={h.id === selectedHydrophoneId}
            onActivate={handleMarker}
          />
        ))}
        <ScaleControl position="bottomleft" />
      </MapContainer>

      <MapControls
        map={map}
        showLanes={showLanes}
        onToggleLanes={setShowLanes}
        onPickHydrophone={(id) => onSelectHydrophone(id, { pan: true, zoom: 9 })}
      />
    </div>
  );
}
