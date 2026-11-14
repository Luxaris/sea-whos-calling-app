import type { FeatureCollection, LineString } from 'geojson';

export type SpeciesId = 'orca' | 'sperm' | 'humpback' | 'fin' | 'pwsd';
export type GroupId = 'toothed' | 'baleen' | 'dolphin';
export type ReviewStatus = 'auto' | 'needs_review' | 'confirmed' | 'rejected';

export type SpeciesGroup = {
  id: GroupId;
  label: string;
  legend: string;
  color: string;
  pin: string;
  spectro: string;
};

export type Species = {
  id: SpeciesId;
  name: string;
  shortName: string;
  group: GroupId;
  shape: string;
  freqLabel: string;
  aria: string;
  /** Scientific name, e.g. "Megaptera novaeangliae"; shown in italics in a card's top matches. */
  latin: string;
};

export type Hydrophone = {
  id: string;
  name: string;
  shortName: string;
  network: string;
  lat: number;
  lon: number;
  depthM: number;
  status: 'online' | 'offline';
  dataDelay: string;
  hardware: {
    model: string;
    sampleRateKHz: number;
    bandLabel: string;
    deployed: string; // YYYY-MM
    lastServiced: string; // YYYY-MM
  };
};

export type Detection = {
  id: string;
  speciesId: SpeciesId;
  hydrophoneId: string;
  timestamp: string; // ISO 8601 with offset
  confidence: number; // 0–1
  daylight: boolean;
  clipSeconds: number;
  audioUrl: string | null;
  reviewStatus: ReviewStatus;
  /**
   * Optional. The model's best matches, best first, each with its 0–1 probability; the first is
   * speciesId. A card lists the top three when there are at least two; without it the card shows
   * only speciesId and confidence.
   */
  ranked?: RankedMatch[];
  /**
   * Optional. True when the clip is band-limited (muffled, the high frequencies cut off): the card
   * names the species group and lists group matches instead of species.
   */
  bandLimited?: boolean;
};

/** One entry of Detection.ranked. */
export type RankedMatch = {
  speciesId: SpeciesId;
  confidence: number; // 0–1
};

/** A pool item has no timestamp yet; the live feed stamps it when it arrives. */
export type PoolDetection = Omit<Detection, 'timestamp'>;

/** Past detections carry no clip or review fields. */
export type HistoryDetection = Pick<
  Detection,
  'id' | 'speciesId' | 'hydrophoneId' | 'timestamp' | 'confidence' | 'daylight'
> & {
  /** True for demo rows made up to show seasonal patterns; false or absent for rows from a backend. */
  simulated?: boolean;
};

export type ShippingLanes = FeatureCollection<LineString, { name: string }>;
