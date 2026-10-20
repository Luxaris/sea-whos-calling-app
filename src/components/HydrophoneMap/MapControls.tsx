import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useId, useRef, useState } from 'react';
import { getHydrophones } from '../../data/api';

type Panel = 'search' | 'layers' | 'help' | null;

type Props = {
  map: LeafletMap | null;
  showLanes: boolean;
  onToggleLanes: (show: boolean) => void;
  onPickHydrophone: (hydrophoneId: string) => void;
};

/** Floating controls styled like ONC's data map. */
export function MapControls({ map, showLanes, onToggleLanes, onPickHydrophone }: Props) {
  const [open, setOpen] = useState<Panel>(null);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const ids = { search: useId(), layers: useId(), help: useId() };

  // Close on Escape or a click elsewhere.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const toggle = (panel: Panel) => setOpen((current) => (current === panel ? null : panel));
  const q = query.trim().toLowerCase();
  const matches = getHydrophones().filter(
    (h) => !q || h.name.toLowerCase().includes(q) || h.shortName.toLowerCase().includes(q),
  );

  return (
    <div ref={root}>
      <div className="hmap__panel">
        <button
          type="button"
          className="hmap__blue"
          aria-expanded={open === 'search'}
          aria-controls={ids.search}
          onClick={() => toggle('search')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" aria-hidden="true">
            <circle cx="10" cy="10" r="6.5" />
            <path d="M15 15l6 6" />
          </svg>
          Search sites
        </button>
        <button
          type="button"
          className="hmap__blue"
          aria-expanded={open === 'layers'}
          aria-controls={ids.layers}
          onClick={() => toggle('layers')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
            <path d="M3 4h18l-7 8v7l-4 2v-9z" />
          </svg>
          Layers
        </button>

        {open === 'search' && (
          <div className="hmap__popover" id={ids.search} role="dialog" aria-label="Search sites">
            <label className="field">
              Hydrophone name
              <input
                type="search"
                value={query}
                autoFocus
                placeholder="For example Folger"
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <ul className="hmap__results">
              {matches.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPickHydrophone(h.id);
                      setOpen(null);
                    }}
                  >
                    {h.name}
                    {h.status === 'offline' && <span className="hmap__offline">, offline</span>}
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="hmap__empty">No hydrophone matches "{query}". Try part of the name.</li>}
            </ul>
          </div>
        )}

        {open === 'layers' && (
          <div className="hmap__popover" id={ids.layers} role="dialog" aria-label="Layers">
            <label className="hmap__check">
              <input type="checkbox" checked={showLanes} onChange={(e) => onToggleLanes(e.target.checked)} />
              Shipping lanes (illustrative)
            </label>
            <p className="hmap__note">Mitigation zones always show while a caution is active.</p>
          </div>
        )}
      </div>

      <div className="hmap__round-group">
        <button
          type="button"
          className="hmap__round"
          aria-label="Help"
          aria-expanded={open === 'help'}
          aria-controls={ids.help}
          onClick={() => toggle('help')}
        >
          ?
        </button>
        <button type="button" className="hmap__round" aria-label="Zoom in" onClick={() => map?.zoomIn()}>
          +
        </button>
        <button type="button" className="hmap__round" aria-label="Zoom out" onClick={() => map?.zoomOut()}>
          −
        </button>
        {open === 'help' && (
          <div className="hmap__popover hmap__popover--right" id={ids.help} role="dialog" aria-label="Map help">
            <p>Pins show the newest detection at each hydrophone. Select a pin to see its card and hydrophone details.</p>
            <p>Diamonds are hydrophones with nothing heard recently. A red diamond is offline.</p>
            <p>The dashed amber circle is the 5 km mitigation zone around a caution.</p>
          </div>
        )}
      </div>
    </div>
  );
}
