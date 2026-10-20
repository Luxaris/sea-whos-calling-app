import type { Marker as LeafletMarker } from 'leaflet';
import { useEffect, useRef } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { getSpecies } from '../../data/api';
import type { Hydrophone } from '../../data/types';
import { confidencePercent } from '../../lib/confidence';
import type { HydrophoneSummary } from '../../lib/detections';
import { labelOffset, labelSide } from './labelPlacement';
import { diamondIcon, pinIcon } from './markerIcons';

export type MapMode = 'recent' | 'history';

type Props = {
  hydrophone: Hydrophone;
  /** Detections at this hydrophone in the current map source, if any. */
  summary: HydrophoneSummary | null;
  /** Recent pins show the newest species; history pins show the species heard most and a count. */
  mode: MapMode;
  selected: boolean;
  onActivate: (hydrophone: Hydrophone, summary: HydrophoneSummary | null) => void;
};

export function HydrophoneMarker({ hydrophone, summary, mode, selected, onActivate }: Props) {
  const ref = useRef<LeafletMarker>(null);
  const offline = hydrophone.status === 'offline';
  // The live map hides pins at offline hydrophones; the archive is about the past, so history pins stay.
  const showPin = summary !== null && (mode === 'history' || !offline);
  const species = showPin ? getSpecies(mode === 'history' ? summary.topSpeciesId : summary.newest.speciesId) : null;
  const kind = showPin ? 'pin' : 'diamond';
  const side = labelSide(hydrophone.id, kind);
  const count = summary?.count ?? 0;
  const countText = `${count} ${count === 1 ? 'detection' : 'detections'}`;

  const label = species
    ? mode === 'history'
      ? `${species.name} heard most at ${hydrophone.name}, ${countText} match the history filters${offline ? ', hydrophone now offline' : ''}`
      : `${species.name} at ${hydrophone.name}, ${confidencePercent(summary!.newest.confidence)}% confidence`
    : `${hydrophone.name} hydrophone${offline ? ', offline' : mode === 'history' ? ', nothing in the filtered history' : ', nothing heard recently'}`;

  // Leaflet makes the icon focusable; give it a name and let Enter or Space activate it.
  const activate = useRef(() => onActivate(hydrophone, showPin ? summary : null));
  activate.current = () => onActivate(hydrophone, showPin ? summary : null);

  useEffect(() => {
    const el = ref.current?.getElement();
    if (!el) return;
    el.setAttribute('aria-label', label);
    el.setAttribute('aria-pressed', String(selected));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate.current();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  });

  return (
    <Marker
      ref={ref}
      position={[hydrophone.lat, hydrophone.lon]}
      icon={showPin ? pinIcon(species!, selected) : diamondIcon(offline, selected)}
      zIndexOffset={selected ? 1000 : showPin ? 500 : 0}
      eventHandlers={{ click: () => activate.current() }}
    >
      {/* Leaflet doesn't update a tooltip's class or offset, so remount it when the marker changes kind. */}
      <Tooltip
        key={`${kind}-${offline}`}
        permanent
        direction={side}
        offset={labelOffset(hydrophone.id, kind)}
        className={`hlabel hlabel--${kind}${offline && !showPin ? ' hlabel--offline' : ''}`}
      >
        {species ? (
          <>
            <b>{species.shortName}</b>
            <br />
            {mode === 'history' ? `${hydrophone.shortName}, ${countText}` : hydrophone.shortName}
          </>
        ) : offline ? (
          `${hydrophone.shortName}, offline`
        ) : (
          hydrophone.shortName
        )}
      </Tooltip>
    </Marker>
  );
}
