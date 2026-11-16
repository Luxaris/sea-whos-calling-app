# Live sample: real detections from ONC hydrophones

20 detections from Ocean Networks Canada (ONC) hydrophones at Barkley
Canyon, off the west coast of Vancouver Island, recorded on the evening of
15 November 2026 between 17:35 and 20:28 Vancouver time: humpback whale song
and blue whale calls. Several calls were picked up by more than one hydrophone
of the array and appear once per hydrophone. The rows use the app's data
contract (`src/data/types.ts`) plus a pointer into the ONC archive for the
audio and the spectrogram. No audio or images are stored here: both stream
from ONC.

The app does not read this folder yet.

## Files

| File | Shape |
|---|---|
| `detections.json` | `{ live: Detection[] }`, newest first |
| `hydrophones.json` | `{ hydrophones: Hydrophone[] }`, the four hydrophones used |

### Detection fields

Every field of `Detection` is filled as the contract describes. Notes:

- `timestamp`: start of the call, Vancouver time with its offset.
- `confidence`, `ranked`: best matches first; `ranked[0]` is `speciesId`
  with `confidence`. Rows without `ranked` show the top match only, as in the
  example data.
- `bandLimited: true` (3 rows): the call is named only to its species group.
  The card names the group from the `ranked` shares, so these rows list every
  match, not just three; `confidence` is the group's share.
- `daylight`: sun above the horizon at the hydrophone at `timestamp`.
- `audioUrl` is `null`. The browser builds the audio from `stream` at play time
  (below).
- `clipSeconds` = `stream.audioEnd − stream.audioStart`: the call plus about a
  second either side.
- `stream` (new): where the call is in the ONC archive.

```ts
stream: {
  locationCode: string; // ONC location code, e.g. "BACNH.H2" (= the hydrophone's oncLocationCode)
  fileStart: string;    // start of the 5-minute archive file, UTC
  audioStart: number;   // seconds into that file where the clip starts
  audioEnd: number;     // seconds into that file where the clip ends
};
```

### Hydrophone fields

Coordinates, depth and the deployment month come from ONC's `locations` and
`deployments` services; the sample rate from the archived files. The four
Barkley Canyon hydrophones form one array and share one ONC position, so their
map pins overlap. `lastServiced` is the date of the current deployment. Extra
fields: `oncLocationCode`, `doi` and `citation` (the dataset citation ONC asks
for).

## New ids the UI must add

One species, in the existing `baleen` group:

```json
{ "id": "blue", "name": "Blue whale", "shortName": "Blue whale", "latin": "Balaenoptera musculus", "group": "baleen", "shape": "moan", "freqLabel": "0–100 Hz", "aria": "Spectrogram sketch: a long, very low tonal call" }
```

It also needs `'blue'` in the `SpeciesId` union (`src/data/types.ts`) and a
silhouette mapped in `SPECIES_ICON` (`src/lib/speciesIcons.ts`). No new group
ids: every `ranked` entry is `blue` or one of the five existing species. The
baleen legend ("Baleen whales: humpback, fin") may want "blue" added.

The hydrophone ids are new as well (`bacnh-h1` to `bacnh-h4`); they need no
code change, and `src/components/HydrophoneMap/labelPlacement.ts` places their
labels on the right by default.

## Replaying the pack as a live feed

The calls happened at the times in `timestamp`. To show them as if they were
arriving now, shift every timestamp by the same amount:

```ts
const rows = [...pack.live].reverse(); // oldest first
const shift = Date.now() - Date.parse(rows[0].timestamp);
// a row "arrives" when Date.now() >= Date.parse(row.timestamp) + shift
const shifted = rows.map((d) => ({
  ...d,
  timestamp: new Date(Date.parse(d.timestamp) + shift).toISOString(),
}));
```

To compress the three hours into a short demo, divide the gaps by a speed factor
before adding `shift`. Keep `stream` as it is: it points at the original
recording.

## Streaming audio and spectrograms

ONC archives each hydrophone in 5-minute FLAC files and publishes, per file,
spectrogram images (`-spect.png` 1200 × 900, `-spect-small.png` 400 × 300,
`-spect-thumb.png` 175 × 131). Every request to the Oceans 3.0 API needs a
token (free ONC account, below). The API allows cross-origin requests.

1. **Find the file names** (one request per detection):

   ```
   GET https://data.oceannetworks.ca/api/archivefile/location
       ?locationCode={stream.locationCode}&deviceCategoryCode=HYDROPHONE
       &dateFrom={stream.fileStart}&dateTo={stream.fileStart + 1 s}&token={token}
   → { files: ["…Z.flac", "…Z-spect.png", "…Z-spect-small.png", "…Z-spect-thumb.png", …] }
   ```

2. **Audio.** Fetch the `.flac`, make a blob URL and play it with a media
   fragment:

   ```ts
   const url = `https://data.oceannetworks.ca/api/archivefile/download?filename=${flac}&token=${token}`;
   const blob = await (await fetch(url)).blob();
   const audio = new Audio(`${URL.createObjectURL(blob)}#t=${s.audioStart},${s.audioEnd}`);
   audio.play(); // plays audioStart..audioEnd, then pauses
   ```

   ONC does not answer HTTP range requests, so a `#t=` on the ONC URL itself
   is ignored and playback starts at 0:00 (Firefox and Chrome); the blob
   is seekable. A file is about 25 MB at 64 kHz and 85 MB at 256 kHz, so start
   the fetch when a card appears, not on click, and revoke the blob URL
   afterwards. Firefox and Chrome both play these FLAC files. With the
   fragment, `audio.currentTime` starts at `audioStart`: the elapsed time is
   `currentTime − audioStart` (`src/lib/usePlayback.ts` compares `currentTime`
   with `clipSeconds` today).

3. **Spectrogram.** Use the `-spect.png` (or `-small` / `-thumb`) as an
   `<img src>` with the same download URL. It covers the whole 5-minute file;
   the frequency range is printed on its axis and differs between files. The
   plot area spans 8.9 % to 86.8 % of the image width (file start to file end,
   linear in time) and 7.4 % to 89.9 % of its height, so the call sits at
   `x = 8.9 % + (audioStart … audioEnd) / 300 × 77.9 %` of the width; crop to
   that with CSS. Low calls (blue whales, below 100 Hz) sit in the bottom
   pixels of this image.

### The ONC token

Create a free account at <https://data.oceannetworks.ca>, then copy the token
from your profile's Web Services API tab. For local work put it in
`.env.local` (git-ignored) and read `import.meta.env.VITE_ONC_TOKEN`:

```
VITE_ONC_TOKEN=your-token
```

Vite writes `VITE_` values into the built files, so use `npm run dev` with the
token, and never build or deploy while `.env.local` holds it. Never commit it.

### Live use

ONC publishes a 5-minute file a few minutes after it ends (`dataDelay` in
`hydrophones.json`). A live backend runs detection on each new file as it
appears and sends the same rows; the browser streams the audio and
spectrogram the same way.

## Data licence and attribution

ONC's data policy: data owned by ONC "are provided under a Creative Commons
CC-BY 4.0 License, open and free for anyone to use with attribution"
(<https://www.oceannetworks.ca/data/data-policy/>). Show this line wherever the
data appear:

> Hydrophone data: Ocean Networks Canada, CC BY 4.0.

and cite the datasets (ONC's citations for these deployments, also in
`hydrophones.json`):

- Ocean Networks Canada Society. 2021. Barkley Canyon Hydrophone Deployed
  2021-02-10 (Hydrophone A, `BACNH.H1`). Ocean Networks Canada Society.
  <https://doi.org/10.34943/3c560ebd-1a7f-46f1-ab3e-4e0d390ec6b5>
- Ocean Networks Canada Society. 2021. Barkley Canyon Hydrophone Deployed
  2021-02-10 (Hydrophone B, `BACNH.H2`). Ocean Networks Canada Society.
  <https://doi.org/10.34943/fcce9ecb-e0e2-47f9-ae0b-426302b06d67>
- Ocean Networks Canada Society. 2021. Barkley Canyon Hydrophone Deployed
  2021-02-10 (Hydrophone C, `BACNH.H3`). Ocean Networks Canada Society.
  <https://doi.org/10.34943/5bdb2da4-e123-494b-8177-e226bbb716da>
- Ocean Networks Canada Society. 2021. Barkley Canyon Hydrophone Deployed
  2021-02-10 (Hydrophone D, `BACNH.H4`). Ocean Networks Canada Society.
  <https://doi.org/10.34943/a0fac23f-f6fe-42c0-9f16-7f4c8410b5a4>

ONC's guide to citing its data: <https://wiki.oceannetworks.ca/display/DP/Data+Citations>.
