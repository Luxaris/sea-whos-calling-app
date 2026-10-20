# Sea Who's Calling

Real-time whale and dolphin identification from existing hydrophones, built for
the Ocean Hackathon 2026 (Victoria, BC) and winner of the VIC03 "What's that
sound?" challenge.

Only 76 Southern Resident killer whales remain, and their home waters are also
where Canada's Pacific naval fleet trains. Sonar and underwater detonations
harm whales that are close. Sea Who's Calling listens to the hydrophones that
are already in the water and tells a sonar operator, in seconds, which species
is calling, where, and how sure the model is, so sonar can hold while an animal
is near and resume as soon as it is not. Fewer animals harmed, fewer delays.

This repository is the public face of the project: the web dashboard. The
classifier behind it, **Conch**, is proprietary and is not included. See
[Conch](#conch-the-classifier) for what it does and how it was measured.

Team: Grace Bertozzi, Jossie Yan, Leanne Farmer, Pranav Rajesh Krishnan,
Olivia Whitelaw.

---

## 1. Run it

Requires Node.js 18 or later.

```bash
npm install        # first time only
npm run dev        # http://localhost:5173
npm run build      # type-check (tsc -b) then production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
```

The URL option `?feedSeconds=N` (N ≥ 2) speeds up the simulated live feed, for
example `http://localhost:5173/?feedSeconds=5`. It only affects the demo feed.

### Stack

React 18, TypeScript 5, Vite 6, Leaflet 1.9 with react-leaflet 4. No UI
framework and no state library. Exact versions are in `package-lock.json`.

---

## 2. Conch, the classifier

Conch is a purpose-built classifier for marine mammal calls. It was trained on expert-annotated hydrophone recordings from Ocean Networks Canada
(ONC) and names the species behind a call: Pacific white-sided dolphin, Risso's
dolphin, fin whale, humpback whale, sperm whale, killer whale and blue whale.

The model, its weights, its training recipe and the training data are not
published. What follows is what we can say about how it performs.

### Headline

**Conch names the right species 90% of the time**, on 945 expert-labelled calls
from 12 recording days it never trained on.

### How we measured it

- **Test set.** 945 calls labelled by ONC's experts, from 12 recording days
  that were held out of training, so no test call comes from an encounter the
  model has heard before.
- **Benchmark.** We compared against Perch 2.0, Google DeepMind's
  state-of-the-art bioacoustics foundation model, run the way Google recommends
  for marine work: frozen Perch embeddings with a classifier trained on top
  (van Merriënboer et al. 2025, arXiv:2508.04665; Burns, Harrell et al.
  2025, "Perch 2.0 transfers 'whale' to underwater tasks", arXiv:2512.03219).
  Both models learned from the same data and were scored on the same test
  calls.
- **Two scoring rules.** Under the *species rule* the model must pick one of
  the seven species, and the 90% above is how often it picks the right one.
  The stricter *exact rule* requires the most specific correct label. We
  report both. Killer whales were scored on the three labelled ecotypes (91 calls).

### Conch vs Perch 2.0

| | Conch | Perch 2.0 |
|---|---|---|
| Species named right, species rule | **90%** | 83% |
| Species named right, exact rule | **84%** | 66% |
| Macro-F1, exact rule | **0.59** | 0.50 |

Per species, exact rule (share of each species' test calls named right):

| Species | Conch | Perch 2.0 |
|---|---|---|
| Pacific white-sided dolphin | **83%** | 0% |
| Risso's dolphin | **77%** | 23% |
| Fin whale | **87%** | 45% |
| Humpback whale | **95%** | 89% |
| Sperm whale | **62%** | 57% |
| Killer whale | **21%** | 16% |
| Blue whale | **97%** | 92% |

Conch is ahead on every species and under every rule. Perch 2.0 was built
mostly from bird and land-animal recordings; it is close on humpback and sperm
whales and falls furthest behind on the dolphins and the fin whale.

Killer whales are the hard case for both models: their calls overlap with the
dolphins', and only a small number of test calls carry an ecotype label. We
report the number rather than hide it.

### Other models we benchmarked

The same protocol (frozen embeddings, a classifier trained on top) applied to
every other public bioacoustics encoder that fits the task. Species named right under the exact rule, same 945 calls:

| Model | From | Species named right |
|---|---|---|
| **Conch** | this project | **84%** |
| Perch 2.0 | Google DeepMind | 66% |
| BirdNET V2.4 | Cornell Lab of Ornithology / Chemnitz | 64% |
| Perch 1.0 | Google | 63% |
| SurfPerch | Google | 63% |
| BirdAVES | Earth Species Project | 62% |
| AVES-bio | Earth Species Project | 60% |
| Google multispecies whale | Google | 43% |

Every general-purpose model struggles with the two dolphins. The Google whale
model, trained on eight whale species, is the weakest here even on humpback and blue whales, which
matches Google's own findings in the Perch marine paper.

---

## 3. What is real and what is simulated

The app runs entirely on example JSON files. There is no backend in this
repository and no audio ships with it.

| Feature | Today | Where |
|---|---|---|
| Hydrophone list and metadata | Example JSON (public ONC site names, approximate positions, placeholder hardware) | `data/hydrophones.json` |
| Species list | Example JSON (five species shown in the UI) | `data/species.json` |
| Current detections ("Most recent") | 5 example detections | `data/detections.json` → `live` |
| New detections arriving | **Simulated**: one every 20 s from a fixed pool | `src/data/liveFeed.ts`, `data/detections.json` → `simulationPool` |
| Detection history | **Simulated** for every site, with seasonal patterns, generated by `scripts/make_simulated_history.mjs` | `data/history-simulated.json` |
| Spectrogram thumbnails | None shipped; cards show a plain strip with the species' frequency range | `src/lib/spectrograms.ts` |
| Shipping lanes | Hand-drawn illustrative lines | `data/shipping-lanes.geojson` |
| "Now" | **Fake clock** pinned to 2026-10-17 15:08 PDT, then ticking | `src/data/clock.ts` |
| Audio clips | None shipped; the play button runs a silent timer until `audioUrl` is set | `src/lib/usePlayback.ts` |
| "2 operators watching" | Hard-coded number | `src/App.tsx` |
| Export (CSV / GeoJSON / JSON) | **Real**: built in the browser from the filtered rows | `src/lib/export.ts` |

---

## 4. Folder map

```
sea-whos-calling-app/
  data/                      example data (the only data source today)
    detections.json          { live: Detection[], simulationPool: PoolDetection[] }
    history-simulated.json   { history: HistoryDetection[] }  (generated by scripts/make_simulated_history.mjs)
    hydrophones.json         { hydrophones: Hydrophone[] }
    species.json             { groups: SpeciesGroup[], species: Species[] }
    shipping-lanes.geojson   FeatureCollection of LineStrings, each with properties.name
  public/                    logo.svg, favicon.svg
  scripts/                   make_simulated_history.mjs (regenerates the simulated history)
  hooks/pre-commit           repo rules (section 10)
  src/
    main.tsx                 entry; imports Leaflet CSS, tokens.css, global.css; marks <html> in demo mode
    App.tsx                  page layout, default selection, alert rules, map mode, demo alert, wiring
    data/
      types.ts               the data contract (section 5)
      api.ts                 THE ONLY MODULE THAT READS DATA FILES
      clock.ts               demo clock: demoNow(), useNow()
      demo.ts                demo mode (?demo=1): frozen clock, scripted alert
      liveFeed.ts            useLiveDetections(): simulated feed
    state/
      SelectionContext.tsx   shared selection { detectionId, hydrophoneId }, map focus, card scroll
    lib/                     helpers; only spectrograms.ts and useHistoryFilters.ts call api.ts
      confidence.ts          high / medium / low rules
      detections.ts          merge live + history, alerts, per-hydrophone summaries, counts
      filters.ts             history filtering, grouping, month line, month counts
      periods.ts             whole-month and whole-season ranges (period pickers, map month stepper)
      seasons.ts             Winter Dec–Feb, Spring Mar–May, Summer Jun–Aug, Fall Sep–Nov
      useHistoryFilters.ts   history filter state (called once in App; shared by map and history panel)
      export.ts              CSV / GeoJSON / JSON building and download
      time.ts                formatting in America/Vancouver time
      usePlayback.ts         plays audioUrl, or simulates with a timer
      spectrograms.ts        optional spectrogram thumbnail lookup
      speciesIcons.ts        species id -> silhouette in assets/icons/
    assets/icons/            species silhouettes (cards, map pins, details panel)
    components/              one folder per component, each with its own .css
      CautionStrip/          "Hold active sonar" band
      ConfidenceMeter/       meter plus "94% high"
      DetectionCard/         live card: play, spectrogram strip, confidence
      Header/                title, hydrophones online, updated time
      HistoryPanel/          HistoryPanel, Filters, SpeciesDropdown, HistoryTable, ExportBar
      HydrophoneDetails/     selected hydrophone's metadata and last detection
      HydrophoneMap/         map, markers, controls, label placement, marker icons
      MapLegend/             legend under the map
      MapSourceTabs/         Recent / History tabs and month stepper above the map
      MonthStrip/            12-bar "Detections by month" chart in the history panel
      Segmented/             radio group styled as one control
      SpectrogramSketch/     spectrogram strip (thumbnail or plain placeholder)
    styles/tokens.css        colours and fonts (source of truth for colours)
    styles/global.css        base styles, buttons, form fields
```

---

## 5. The data contract

From `src/data/types.ts`. **The backend must return these shapes** (or `api.ts`
must convert to them).

```ts
type SpeciesId = 'orca' | 'sperm' | 'humpback' | 'fin' | 'pwsd';
type GroupId = 'toothed' | 'baleen' | 'dolphin';
type ReviewStatus = 'auto' | 'needs_review' | 'confirmed' | 'rejected';

type Detection = {
  id: string;                 // unique and stable; React key and selection
  speciesId: SpeciesId;
  hydrophoneId: string;       // must match a Hydrophone.id
  timestamp: string;          // ISO 8601 with offset or Z, e.g. "2026-10-17T15:06:42-07:00"
  confidence: number;         // 0–1, model probability for speciesId
  daylight: boolean;          // true if the sun was up at that hydrophone
  clipSeconds: number;        // clip length in seconds (playback stops here)
  audioUrl: string | null;    // playable audio URL, or null to simulate playback
  reviewStatus: ReviewStatus; // required by the type; not read by the UI
};

/** A simulation pool item: the live feed stamps the time when it arrives. */
type PoolDetection = Omit<Detection, 'timestamp'>;

/** A history row: no clip or review fields. */
type HistoryDetection = Pick<Detection,
  'id' | 'speciesId' | 'hydrophoneId' | 'timestamp' | 'confidence' | 'daylight'> & {
  simulated?: boolean;        // true for made-up demo rows; false or absent for real ones
};

type Hydrophone = {
  id: string;                 // "folger"
  name: string;               // "Folger Passage" (cards, details, caution strip, search, export)
  shortName: string;          // "SoG Central" (map labels, history table, Hydrophone filter)
  network: string;            // "ONC NEPTUNE, west coast"
  lat: number;                // decimal degrees
  lon: number;                // decimal degrees, negative for west
  depthM: number;             // metres
  status: 'online' | 'offline';
  dataDelay: string;          // shown as-is, e.g. "About 4 s"
  hardware: {
    model: string;            // "icListen HF"
    sampleRateKHz: number;    // 64 → "64 kHz"
    bandLabel: string;        // shown as-is, e.g. "10 Hz to 32 kHz"
    deployed: string;         // "YYYY-MM" → "June 2024"
    lastServiced: string;     // "YYYY-MM"
  };
};

type Species = {
  id: SpeciesId;
  name: string;               // "Humpback whale" (cards, details, species filter, export)
  shortName: string;          // "Humpback" (map, table)
  group: GroupId;             // decides the colour
  shape: string;              // not used by the UI
  freqLabel: string;          // corner label on the spectrogram strip, e.g. "0–4 kHz"
  aria: string;               // not used by the UI
};

type SpeciesGroup = {
  id: GroupId;
  label: string;              // not used by the UI
  legend: string;             // legend text, e.g. "Baleen whales: humpback, fin"
  color: string; pin: string; spectro: string;  // not used: colours come from tokens.css
};

type ShippingLanes = FeatureCollection<LineString, { name: string }>;
```

The JSON files wrap these in objects (section 4) and may carry a `_note`
string, which is ignored. In the example data, live rows have ids `d-*`, pool
rows `sim-*`, and simulated history rows `s-*` with `"simulated": true`.

### Field rules the backend must follow

| Field | Rule | What breaks otherwise |
|---|---|---|
| `Detection.id` | Unique within the live feed and stable across resends | A repeated id is dropped by the feed; wrong card highlighted |
| `speciesId` | One of the five ids exactly | `getSpecies()` **throws and the whole page goes blank** (there is no error boundary) |
| `hydrophoneId` | Must exist in the hydrophone list | `getHydrophone()` **throws and the page goes blank** |
| `timestamp` | Parseable by `new Date()`; include an offset or `Z` | Wrong order and ages. Times always display in `America/Vancouver` |
| `timestamp` | Not in the future relative to the browser clock | Future detections are **excluded from cautions and from "Last detection here"** (clock skew, section 8) |
| `confidence` | 0–1, not 0–100 | Every level, filter and alert is wrong |
| `daylight` | Computed by the backend (sunrise/sunset at that hydrophone) | The front end never computes it |
| `clipSeconds` | > 0 on live detections | Playback ends immediately |
| `audioUrl` | Browser-playable (WAV, MP3, OGG), same origin or CORS-enabled | Playback stops and resets |
| `simulated` | Omit, or `false`, on real history rows | The row never gets a spectrogram thumbnail |
| `Hydrophone.deployed`, `lastServiced` | `"YYYY-MM"` | Shows "Invalid Date" |

### Optional spectrogram thumbnails

`src/lib/spectrograms.ts` looks for an image at
`<base URL>spectrograms/<id>.webp`. Only history rows whose id starts with `h-`
and that are not `simulated` can have one. A history row uses its own; a live
card borrows one from a non-simulated history row of the same species, picked
by a hash of the card's id, and its caption ends "(example)". With no such rows,
or if the image fails to load, the card shows a plain strip reading "No
spectrogram for this clip". This repo ships no thumbnails: a backend or
deployment supplies them (`public/spectrograms/` is git-ignored and `.webp` is
blocked by the hook).

### Hydrophone ids in the example data

`folger`, `barkley`, `clayoquot`, `cascadia`, `endeavour`, `sogc`, `soge`,
`fraser` (offline), `saanich`. Label positions are tuned per id in
`src/components/HydrophoneMap/labelPlacement.ts`; any other id still works and
gets its label on the right.

### Adding a species is a front-end change

A sixth species needs: the `SpeciesId` union in `types.ts`, an entry in
`data/species.json` (or the API), and a silhouette in `src/assets/icons/`
mapped in `SPECIES_ICON` (`src/lib/speciesIcons.ts`; the build fails until it
is added). A new group also needs the `GroupId` union and colour tokens
`--{group}`, `--{group}-pin`, `--{group}-spectro` in `src/styles/tokens.css`.

---

## 6. Rules the UI applies to the data

All of these run in the browser today. If the backend computes any of them, keep
the results identical.

**Confidence** (`src/lib/confidence.ts`)
- The percentage is `Math.round(confidence * 100)`.
- The level comes from that rounded number: **high ≥ 85**, **medium 70–84**,
  **low < 70**. So 0.845 shows as "85% high".

**Caution alerts** (`activeAlerts()` in `src/lib/detections.ts`, called in `App.tsx`)
- Only detections in the **live feed** count, not history.
- A detection raises an alert if it is high confidence **and**
  `0 ≤ now − timestamp < 30 minutes`.
- At most one alert per hydrophone (the newest).
- The caution strip shows one alert: the newest. A newer alert replaces it.
- Every active alert draws a 5 km circle (`MITIGATION_RADIUS_M`) around its
  hydrophone. The selected detection's hydrophone also gets a circle, alert or
  not.
- Show on map zooms in to at least level 10 (`ALERT_ZOOM`).

**Map: Recent and History tabs** (`MapSourceTabs.tsx`, `HydrophoneMarker.tsx`)
- **Recent** (default): each hydrophone pins its **newest live detection**. An
  online hydrophone with none shows a white diamond ("quiet"). An **offline**
  hydrophone always shows a red diamond, even if it has a detection.
- **History**: each hydrophone pins the **species heard most** among the rows
  that match the history filters, with the count in its label. Offline
  hydrophones keep their pins. A hydrophone with no matching rows shows a
  diamond (red if offline). The tab reads "History, {n} matching".
- In History mode a month stepper (previous, month select, next) sets the
  history filters' From and To to one whole month. Only months with history
  rows are offered. A By season view switches to By month. When the range is
  not exactly one month the select reads "Date range from filters".

**Live feed** (`src/data/liveFeed.ts`)
- Keeps the **10 newest** detections; cards are shown newest first.
- A detection whose id is already in the feed is ignored.
- Rows whose id starts with `h-` stay in the kept list and are never pushed out
  by new arrivals.
- Every 20 s (or `?feedSeconds`) the next pool item is stamped with the demo
  time. The pool repeats; later rounds get ids suffixed `-r2`, `-r3`, ...
- Cards that arrive after page load get a short highlight and a "New" tag (no
  animation with reduced motion). The newest pool arrival is announced to
  screen readers.
- Pause feed stops the simulation timer.

**Hydrophone details** (`HydrophoneDetails.tsx`)
- "Last detection here" is the newest detection at that hydrophone from the
  **live feed and history merged** (`mergeDetections()`), ignoring timestamps
  later than now.
- Live and history rows are the same event when hydrophone, species and
  timestamp (to the millisecond) all match; the live copy wins.
- "Detections in the last 24 hours" counts that merged list.
- History rows have no clip, so "Play last call" simulates an 8 s clip
  (`FALLBACK_CLIP_SECONDS`) unless the row has `clipSeconds` and `audioUrl`.

**Default selection on load** (`App.tsx`)
- From `getLiveDetections()`: the newest high-confidence detection, else the
  newest, else hydrophone `folger` with no detection.

**History filters** (`src/lib/useHistoryFilters.ts`, `src/lib/filters.ts`)
- One filter state, created in `App.tsx`, drives both the history panel and the
  map's History tab.
- Filters run on the whole `history` array in the browser: date range, species,
  hydrophone, calendar month (any year), time of day (any, daylight, night) and
  lowest confidence.
- Dates compare as **local Vancouver calendar days**, From and To inclusive.
  From after To shows no rows and a message.
- Lowest confidence compares rounded percentages: 70% (default), 80%, 85% or Any.
- Defaults: From is the local date of the earliest history row, To is today on
  the demo clock; all species, all hydrophones, any month, any time of day.
- Show: Each detection, By day, By month or By season. The grouped views count
  detections per species per period, newest first. Winter belongs to the year
  it starts ("Winter 2025–26"). By month and By season replace the date inputs
  with month or season selects and widen the range to whole periods.
- With one hydrophone chosen and a month set, a line gives that month's share
  (or names it the busiest month). With one hydrophone chosen, the MonthStrip
  shows 12 bars of detections by calendar month, counted over every other
  filter; clicking a bar sets or clears the month filter.
- The per-row table shows the newest 300 rows (2000 in the expanded dialog).
- History never receives new live detections.

**Export** (`src/lib/export.ts`, `ExportBar.tsx`)
- One row per filtered detection, all of them, even in a grouped view.
- Columns: `id, species, speciesId, hydrophone, hydrophoneId, latitude,
  longitude, timestamp`, plus `confidence, daylight` when the checkbox is on
  (on by default).
- Latitude and longitude are the **hydrophone's** position.
- File name: `sea-whos-calling-detections-YYYY-MM-DD.{csv|geojson|json}`, dated
  by the demo clock.

**Time** (`src/lib/time.ts`)
- Everything displays in `America/Vancouver` (PDT/PST) whatever the viewer's
  time zone.

---

## 7. Every place that reads data

Components and hooks call `api.ts` **synchronously during render**, and
`clock.ts` calls it once at module load. This is the main reason an
asynchronous API cannot simply be dropped into `api.ts` (section 8, step 2).

| Function in `api.ts` | Called from |
|---|---|
| `getLiveDetections()` | `App.tsx` (default selection), `clock.ts` (demo start time, at module load), `liveFeed.ts` (initial feed) |
| `getSimulationPool()` | `liveFeed.ts` |
| `getHistory()` | `App.tsx` (passed to `useHistoryFilters()` and `mergeDetections()`), `lib/spectrograms.ts` |
| `getHydrophones()` | `Header.tsx`, `HydrophoneMap.tsx`, `MapControls.tsx`, `Filters.tsx` |
| `getHydrophone(id)` | `CautionStrip.tsx`, `DetectionCard.tsx`, `RecentDetections.tsx`, `HydrophoneMap.tsx`, `HydrophoneDetails.tsx`, `HistoryTable.tsx`, `ExportBar.tsx`, `lib/useHistoryFilters.ts` |
| `getSpeciesList()` | `SpeciesDropdown.tsx`, `HistoryTable.tsx`, `lib/useHistoryFilters.ts` |
| `getSpecies(id)` | `CautionStrip.tsx`, `DetectionCard.tsx`, `RecentDetections.tsx`, `SpectrogramSketch.tsx`, `HydrophoneMarker.tsx`, `HydrophoneDetails.tsx`, `HistoryTable.tsx`, `ExportBar.tsx` |
| `getGroups()` | `MapLegend.tsx` |
| `getGroup(id)` | not used |
| `getShippingLanes()` | `HydrophoneMap.tsx` |

The demo clock and demo mode:

| Function | Called from |
|---|---|
| `useNow()` (`clock.ts`) | `App.tsx` (re-renders every 15 s; `now` is the later of this and the feed's `updatedAt`) |
| `demoNow()` (`clock.ts`) | `liveFeed.ts`, `lib/useHistoryFilters.ts` (default From and To), `HistoryTable.tsx` (whether to print the year), `ExportBar.tsx` (file name date) |
| `isDemoMode()` (`demo.ts`) | `main.tsx`, `App.tsx`, `clock.ts`, `liveFeed.ts`, `HydrophoneMap.tsx` |
| `isAlertManual()` (`demo.ts`) | `App.tsx` |

Normally `demoNow()` starts two minutes after the newest example live detection
(2026-10-17 15:08:42 PDT) and then runs in real time.

**Demo mode** (`?demo=1`, `src/data/demo.ts`) is for recorded walkthroughs:
- the clock is frozen at 2026-10-17 15:08:00 PDT;
- the simulated feed is off;
- the example live rows (`d-*`) are moved 35 minutes into the past, so nothing
  is on alert at load;
- one scripted alert (`DEMO_ALERT`, killer whale at Barkley Canyon, 93%) is
  added 3 s after load. With `?alert=manual` as well, it waits for
  `window.__demo.triggerAlert()`, which also works without it;
- the map jumps instead of flying, and new cards slide in once with no
  lingering highlight.

`App.tsx` passes live detections, the merged list and the history filter state
down as props. No component reads history itself.

---

## 8. Connecting the backend: step by step

Nothing in this section is implemented yet. The endpoint list is a
**proposal**; agree it with the backend before building.

### Proposed endpoints

| Method and path | Returns | Replaces |
|---|---|---|
| `GET /api/hydrophones` | `Hydrophone[]` | `data/hydrophones.json` |
| `GET /api/species` | `{ groups: SpeciesGroup[], species: Species[] }` | `data/species.json` |
| `GET /api/detections/live?limit=10` | `Detection[]`, newest first | `detections.json` → `live` |
| `GET /api/detections/stream` (WebSocket or SSE), or poll `GET /api/detections/live?since=<ISO>` | new `Detection` objects | the simulation in `liveFeed.ts` |
| `GET /api/detections/history?from=YYYY-MM-DD&to=YYYY-MM-DD&species=orca,fin&hydrophone=folger&month=7&minConfidence=0.7&light=day` | `HistoryDetection[]` | `data/history-simulated.json` (filters move to the server once data is large) |
| audio at each detection's `audioUrl` | WAV/MP3/OGG | simulated playback |
| optional `spectrograms/<id>.webp` | WebP images | the plain strip |

Shipping lanes can stay a static file.

### Step 1: one setting to switch between example and real data

Add `VITE_API_URL` (read as `import.meta.env.VITE_API_URL`). If it is empty,
keep using the JSON files so the demo still works. During development, either
enable CORS on the backend or add a proxy in `vite.config.ts`:

```ts
server: { proxy: { '/api': 'http://localhost:8000' } }
```

### Step 2: make data loading asynchronous

1. Change `api.ts` so loading is async, for example
   `loadReferenceData(): Promise<{ hydrophones, species, groups }>`.
2. In `App.tsx`, load once before rendering the dashboard. Show a loading state,
   and on failure say what happened and what to do ("Couldn't reach the
   detection server. Check your connection and reload.").
3. Keep `getHydrophone(id)`, `getSpecies(id)` and the other lookups synchronous
   by filling their maps after loading (or pass the data through a context), so
   the files in section 7 don't all have to change.
4. Decide what happens with an unknown `speciesId` or `hydrophoneId`: skip the
   detection with a console warning instead of throwing, or add an error
   boundary. Today it blanks the page.
5. Four things read data once and never again, so they must run after the
   first load: `clock.ts` reads `getLiveDetections()` at module load; `App.tsx`
   computes the default selection in a `useMemo` with no dependencies;
   `useHistoryFilters()` computes the default From date in its initial state;
   `lib/spectrograms.ts` caches its per-species lookup on first use.

### Step 3: real time

In `clock.ts`, make the non-demo branch of `demoNow()` return `Date.now()` and
remove the offset from the newest example detection. Keep the function names so
callers keep working. Demo mode can keep its frozen clock.

**Clock skew:** cautions and "Last detection here" ignore detections whose
timestamp is later than the browser's clock. If the backend's clock runs even a
few seconds ahead of an operator's computer, a new detection would not raise a
caution until the browser catches up. Keep server clocks synced (NTP) or allow a
small tolerance in `activeAlerts()` and `detectionsAt()`.

### Step 4: real live feed

Rewrite `useLiveDetections()` in `src/data/liveFeed.ts` but **keep what it
returns**, because `App.tsx` and `RecentDetections.tsx` use every field:

```ts
{
  detections: Detection[];        // at most `keep` (10)
  arrived: string[];              // ids received after page load (highlight and "New")
  latest: Detection | null;       // last arrival, announced to screen readers
  updatedAt: number;              // ms; "Updated 15:08 PDT" in the header, and a floor for `now`
  paused: boolean;
  togglePaused: () => void;
  inject: (d: Detection) => void; // add one detection now (demo mode uses it)
}
```

Notes:
- Drop duplicates by `id` (reconnects and polling overlap will resend). The
  current `add()` in the reducer already does this.
- Decide what Pause means with a real feed: stop showing new arrivals (and
  buffer them), or stop the connection. The on-screen text today is "Feed
  paused. New detections will not appear until you resume."
- Remove `getSimulationPool()`, `simulationPool` and the `?feedSeconds` option
  (`feedIntervalMs()` in `App.tsx`), or keep them for when `VITE_API_URL` is
  empty.

### Step 5: history

Small data: fetch everything once and keep the browser filtering in
`src/lib/filters.ts`. Large data: send the filters as query parameters and
fetch when they change. The filter state lives in `useHistoryFilters()`
(`src/lib/useHistoryFilters.ts`), called from `App.tsx`. The grouped views, the
"{n} matching detections" count, the month line, the MonthStrip, the month
stepper and the map's History pins all need either every matching row or
equivalent server-side counts. Export needs every matching row.

### Step 6: audio and thumbnails

Set `audioUrl` on detections. `usePlayback()` already plays real audio with
`new Audio(audioUrl)`: it tracks `currentTime`, stops at `clipSeconds` or when
the file ends, and resets on a playback error. The audio host must allow the
dashboard's origin (CORS) if it is on another domain. Thumbnails, if any, are
served at `spectrograms/<id>.webp` next to the app for history rows; never
commit them here.

### Step 7: remove sample labels

| Text or value | File |
|---|---|
| "Example values. Replace with ONC device metadata." | `HydrophoneDetails.tsx` |
| "Nothing recorded at this hydrophone in the example data." | `HydrophoneDetails.tsx` |
| "Every row is simulated for the demo. A backend replaces them with real detections." | `HistoryPanel.tsx` |
| "All sites are simulated in this demo build." | `MapSourceTabs.tsx` |
| "Shipping lanes (illustrative)" (keep if lanes stay illustrative) | `MapControls.tsx` |
| `operatorsWatching={2}` | `App.tsx` |
| fallback hydrophone `'folger'` | `App.tsx` |

### Done checklist after connecting

- [ ] `npm run build` passes and the browser console has no errors.
- [ ] With `VITE_API_URL` unset, the demo (and `?demo=1`) still runs on the JSON files.
- [ ] Unplug the backend: the page shows a clear error, not a blank screen.
- [ ] A new high-confidence detection appears as a card and pin within one
      update, and raises the caution strip with a 5 km circle.
- [ ] A detection older than 30 minutes does not raise a caution.
- [ ] An unknown species or hydrophone id does not crash the page.
- [ ] History filters, the map's History tab and export match the rows shown.
- [ ] Real clips play and the playhead moves.

---

## 9. Selection and layout behaviour

One shared selection in `src/state/SelectionContext.tsx`:
`{ detectionId: string | null, hydrophoneId: string }`, plus one-off requests to
move the map (`focus`) and to scroll a card into view (`cardScroll`).

- **Recent tab:** clicking a pin (or Enter or Space on it) selects that
  detection and its hydrophone, outlines the card and scrolls it into view in
  the left column. The map does not move. Cards don't scroll when the columns
  are stacked.
- **History tab:** clicking a pin selects only the hydrophone (history rows have
  no card).
- Clicking a quiet or offline diamond selects the hydrophone and clears the
  detection.
- Clicking a card (anywhere except its buttons) or its hydrophone name selects
  it, pans and zooms in to at least level 10.
- Show on map (caution strip) selects, pans, zooms in to at least level 10 and
  scrolls the card into view.
- Search sites selects a hydrophone, pans and zooms in to at least level 9.
- When the map moves while off screen, the page scrolls it into view. With
  reduced motion, or in demo mode, it jumps instead of flying.
- If the selected detection drops out of the 10 newest, no card is outlined but
  the hydrophone stays selected.

Layout: three columns at 1100 px and wider (300 px, map, 340 px); the left
column scrolls on its own and collapses to a 64 px rail. Below 1100 px they
stack: map, recent detections, history. The map is 560 px tall, 360 px below
600 px wide; it starts at 48.7° N, 125.8° W, zoom 7 (zoom 6 when the window is
narrower than 640 px), allows zoom 4–14, and does not zoom on the scroll wheel.

---

## 10. Repo notes

- This is the public repository. The classifier, its training code and all
  recordings live elsewhere and must never be committed here.
- Enable the pre-commit hook once per clone with
  `git config core.hooksPath hooks`. For every added or modified file it blocks:
  - audio, `.webp` image, archive, array and model files (the full list is
    in `hooks/pre-commit`);
  - any file over 1 MB (1024 KB);
  - text that looks like an AWS or GitHub key;
  - optionally, any word from `.git/info/private-words`, a local untracked list
    with one case-insensitive regex per line (`package-lock.json` is skipped).

  `.gitignore` also excludes `.env*`, `public/audio/` and `public/spectrograms/`.
- `npm run build` must pass before a pull request is opened.
- Licence: MIT for the app only (see `LICENSE`).
