// Simulated detection history for the demo: made-up calls at every hydrophone with plausible
// seasonal patterns (fin whales offshore in winter, killer whales inshore in summer, humpbacks on
// the coast in late summer and fall). Every row carries "simulated": true. Deterministic seed.
//
//   node scripts/make_simulated_history.mjs      -> data/history-simulated.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const YEAR = 2023;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'history-simulated.json');

// Expected detections per month (Jan..Dec) for each species at each site.
const PATTERN = {
  humpback: {
    folger:    [4, 3, 4, 8, 15, 25, 35, 40, 38, 30, 14, 6],
    barkley:   [12, 10, 9, 12, 20, 28, 34, 38, 40, 34, 24, 16],
    clayoquot: [10, 8, 8, 12, 18, 24, 28, 30, 32, 28, 20, 14],
    cascadia:  [6, 5, 4, 5, 8, 10, 12, 12, 14, 12, 10, 8],
    endeavour: [3, 2, 2, 3, 5, 7, 8, 8, 9, 7, 5, 4],
    sogc:      [2, 1, 1, 3, 6, 10, 14, 16, 14, 10, 5, 2],
    soge:      [1, 1, 1, 2, 4, 8, 10, 12, 10, 8, 4, 2],
    fraser:    [1, 0, 1, 2, 3, 5, 6, 6, 5, 4, 2, 1],
    saanich:   [1, 1, 1, 2, 4, 6, 8, 8, 7, 5, 2, 1],
  },
  fin: {
    barkley:   [36, 32, 26, 16, 8, 4, 3, 4, 8, 18, 30, 36],
    clayoquot: [30, 26, 20, 12, 6, 3, 2, 3, 6, 14, 24, 30],
    cascadia:  [34, 30, 24, 14, 8, 4, 3, 4, 8, 18, 28, 34],
    endeavour: [26, 22, 18, 10, 6, 3, 2, 3, 6, 14, 22, 26],
    folger:    [6, 5, 4, 2, 1, 0, 0, 0, 1, 3, 5, 6],
  },
  orca: {
    sogc:      [4, 3, 4, 5, 8, 16, 26, 30, 24, 12, 5, 4],
    soge:      [3, 3, 3, 4, 7, 14, 22, 26, 20, 10, 4, 3],
    fraser:    [2, 2, 2, 3, 6, 12, 18, 20, 16, 8, 3, 2],
    saanich:   [3, 2, 3, 4, 6, 10, 14, 16, 12, 8, 4, 3],
    folger:    [3, 2, 3, 4, 6, 8, 10, 10, 9, 6, 4, 3],
    barkley:   [3, 2, 3, 3, 4, 5, 6, 6, 5, 4, 3, 3],
    clayoquot: [2, 1, 2, 2, 3, 4, 4, 4, 4, 3, 2, 2],
    cascadia:  [1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1],
    endeavour: [0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  },
  sperm: {
    endeavour: [4, 4, 6, 10, 14, 16, 14, 12, 10, 6, 4, 3],
    cascadia:  [3, 3, 5, 8, 12, 14, 12, 10, 8, 5, 3, 3],
    barkley:   [3, 3, 4, 6, 9, 11, 10, 8, 6, 4, 3, 3],
    clayoquot: [2, 2, 3, 5, 8, 10, 8, 7, 5, 3, 2, 2],
  },
  pwsd: {
    folger:    [12, 10, 8, 6, 5, 6, 8, 10, 14, 18, 16, 14],
    barkley:   [10, 9, 7, 6, 5, 5, 7, 9, 12, 15, 13, 11],
    clayoquot: [8, 7, 6, 5, 4, 4, 6, 8, 10, 12, 10, 9],
    sogc:      [6, 5, 4, 3, 3, 4, 5, 6, 8, 10, 8, 7],
    soge:      [4, 4, 3, 2, 2, 3, 4, 5, 6, 8, 6, 5],
    saanich:   [3, 3, 2, 2, 2, 2, 3, 4, 5, 6, 5, 4],
    fraser:    [2, 2, 2, 1, 1, 2, 2, 3, 4, 5, 4, 3],
    cascadia:  [2, 2, 1, 1, 1, 1, 2, 2, 3, 3, 3, 2],
    endeavour: [1, 1, 1, 0, 1, 1, 1, 1, 2, 2, 1, 1],
  },
};

// Rough day length in hours at 48.5 N by month; solar noon near 20:24 UTC on this coast.
const DAY_LENGTH = [8.8, 10.1, 11.9, 13.7, 15.3, 16.1, 15.6, 14.2, 12.5, 10.7, 9.2, 8.4];
const SOLAR_NOON_UTC = 20.4;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// mulberry32: a small seeded generator so the output is reproducible
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(YEAR);
const randint = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));
const uniform = (lo, hi) => lo + random() * (hi - lo);
const round3 = (x) => Math.round(x * 1000) / 1000;

function poisson(mean) {
  if (mean <= 0) return 0;
  const limit = Math.exp(-mean);
  let k = 0;
  let p = 1;
  for (;;) {
    p *= random();
    if (p < limit) return k;
    k += 1;
  }
}

function confidence() {
  const roll = random();
  if (roll < 0.6) return round3(uniform(0.85, 0.98));
  if (roll < 0.88) return round3(uniform(0.7, 0.849));
  return round3(uniform(0.45, 0.699));
}

const pad = (n) => String(n).padStart(2, '0');
const rows = [];
for (const [species, sites] of Object.entries(PATTERN)) {
  for (const [site, monthly] of Object.entries(sites)) {
    monthly.forEach((mean, mi) => {
      for (let i = 0; i < poisson(mean); i++) {
        const day = randint(1, DAYS_IN_MONTH[mi]);
        const hourUtc = random() * 24;
        const offset = ((((hourUtc - SOLAR_NOON_UTC + 12) % 24) + 24) % 24) - 12;
        const daylight = Math.abs(offset) < DAY_LENGTH[mi] / 2;
        const h = Math.floor(hourUtc);
        const m = Math.floor(hourUtc * 60) % 60;
        const s = randint(0, 59);
        rows.push({
          speciesId: species,
          hydrophoneId: site,
          timestamp: `${YEAR}-${pad(mi + 1)}-${pad(day)}T${pad(h)}:${pad(m)}:${pad(s)}Z`,
          confidence: confidence(),
          daylight,
          simulated: true,
        });
      }
    });
  }
}
rows.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));
const out = rows.map((r, i) => ({ id: `s-${String(i + 1).padStart(5, '0')}`, ...r }));
const lines = out.map((r) => JSON.stringify(r));
fs.writeFileSync(
  OUT,
  '{\n"_note": "Simulated detections for the demo, at every hydrophone. Generated by scripts/make_simulated_history.mjs; not real observations.",\n"history": [\n' +
    lines.join(',\n') +
    '\n]}\n',
);
console.log(`wrote ${out.length} rows to ${OUT}`);
