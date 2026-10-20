import L from 'leaflet';
import type { Species } from '../../data/types';
import { SPECIES_ICON } from '../../lib/speciesIcons';

const PIN_PATH = 'M17 43C17 43 3 27 3 16a14 14 0 0 1 28 0c0 11-14 27-14 27z';

const cache = new Map<string, L.DivIcon>();

function cached(key: string, make: () => L.DivIcon): L.DivIcon {
  let icon = cache.get(key);
  if (!icon) {
    icon = make();
    cache.set(key, icon);
  }
  return icon;
}

/**
 * Teardrop pin, tip on the hydrophone, filled with the species group's pin colour,
 * with the species silhouette in white inside.
 */
export function pinIcon(species: Species, selected: boolean): L.DivIcon {
  return cached(`pin-${species.id}-${selected}`, () =>
    L.divIcon({
      className: `hmarker hmarker--pin${selected ? ' hmarker--selected' : ''}`,
      iconSize: [36, 46],
      iconAnchor: [18, 45],
      tooltipAnchor: [0, 0],
      html: `
        <span class="hmarker__halo" aria-hidden="true"></span>
        <svg width="36" height="46" viewBox="0 0 34 44" aria-hidden="true" focusable="false">
          <path d="${PIN_PATH}" style="fill: var(--${species.group}-pin)" stroke="#FFFFFF" stroke-width="2"/>
        </svg>
        <img class="hmarker__species" src="${SPECIES_ICON[species.id]}" alt="" width="26" height="26">`,
    }),
  );
}

/** Diamond for a hydrophone with nothing heard recently, or one that is offline. */
export function diamondIcon(offline: boolean, selected: boolean): L.DivIcon {
  return cached(`diamond-${offline}-${selected}`, () =>
    L.divIcon({
      className: `hmarker hmarker--diamond${offline ? ' hmarker--offline' : ''}${selected ? ' hmarker--selected' : ''}`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      tooltipAnchor: [0, 0],
      html: '<span class="hmarker__ring" aria-hidden="true"></span><span class="hmarker__diamond" aria-hidden="true"></span>',
    }),
  );
}
