// The only module that reads data. Today it returns the example JSON in /data;
// swap these functions for fetch calls (or a WebSocket for live detections) that
// return the same shapes and no component needs to change.
import detectionsJson from '../../data/detections.json';
import historySimulatedJson from '../../data/history-simulated.json';
import hydrophonesJson from '../../data/hydrophones.json';
import speciesJson from '../../data/species.json';
import shippingLanesRaw from '../../data/shipping-lanes.geojson?raw';
import type {
  Detection,
  GroupId,
  HistoryDetection,
  Hydrophone,
  PoolDetection,
  ShippingLanes,
  Species,
  SpeciesGroup,
  SpeciesId,
} from './types';

export type * from './types';

const species = speciesJson.species as Species[];
const groups = speciesJson.groups as SpeciesGroup[];
const hydrophones = hydrophonesJson.hydrophones as Hydrophone[];
const shippingLanes = JSON.parse(shippingLanesRaw) as ShippingLanes;

const speciesById = new Map(species.map((s) => [s.id, s]));
const groupById = new Map(groups.map((g) => [g.id, g]));
const hydrophoneById = new Map(hydrophones.map((h) => [h.id, h]));

export function getSpeciesList(): Species[] {
  return species;
}

export function getGroups(): SpeciesGroup[] {
  return groups;
}

export function getHydrophones(): Hydrophone[] {
  return hydrophones;
}

export function getSpecies(id: SpeciesId): Species {
  const s = speciesById.get(id);
  if (!s) throw new Error(`Unknown species "${id}"`);
  return s;
}

export function getGroup(id: GroupId): SpeciesGroup {
  const g = groupById.get(id);
  if (!g) throw new Error(`Unknown species group "${id}"`);
  return g;
}

export function getHydrophone(id: string): Hydrophone {
  const h = hydrophoneById.get(id);
  if (!h) throw new Error(`Unknown hydrophone "${id}"`);
  return h;
}

/** The detections already in the feed when the page opens. */
export function getLiveDetections(): Detection[] {
  return detectionsJson.live as Detection[];
}

/** Detections the demo feed adds one at a time. */
export function getSimulationPool(): PoolDetection[] {
  return detectionsJson.simulationPool as PoolDetection[];
}

// Simulated history for every site (see scripts/make_simulated_history.mjs).
// One array so callers can memoise on it; a backend replaces it with real rows.
const history: HistoryDetection[] = historySimulatedJson.history as HistoryDetection[];

export function getHistory(): HistoryDetection[] {
  return history;
}

export function getShippingLanes(): ShippingLanes {
  return shippingLanes;
}
