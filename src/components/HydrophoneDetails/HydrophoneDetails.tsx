import { getHydrophone, getSpecies } from '../../data/api';
import { confidencePercent } from '../../lib/confidence';
import { type AnyDetection, countSince, detectionsAt } from '../../lib/detections';
import { SPECIES_ICON } from '../../lib/speciesIcons';
import { DURATION, formatDayAt, formatSeconds, formatYearMonth } from '../../lib/time';
import { usePlayback } from '../../lib/usePlayback';
import { PlayIcon, StopIcon } from '../DetectionCard/icons';
import './HydrophoneDetails.css';

// History rows keep no clip; simulate one this long when playing them.
const FALLBACK_CLIP_SECONDS = 8;

type Props = {
  hydrophoneId: string;
  detections: AnyDetection[];
  now: number;
};

function formatCoordinates(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

export function HydrophoneDetails({ hydrophoneId, detections, now }: Props) {
  const h = getHydrophone(hydrophoneId);
  const here = detectionsAt(detections, hydrophoneId, now);
  const last = here[0] ?? null;

  return (
    <section className="details" aria-labelledby="details-title">
      <div className="details__head">
        <h2 id="details-title" className="details__name">
          {h.name}
        </h2>
        {h.status === 'online' ? (
          <span className="details__status details__status--online">
            <span className="details__dot" aria-hidden="true" />
            Online
          </span>
        ) : (
          <span className="details__status details__status--offline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            Offline
          </span>
        )}
        <span className="details__network">{h.network}</span>
        <span className="details__note">Example values. Replace with ONC device metadata.</span>
      </div>

      <div className="details__grid">
        <dl className="details__list" aria-label="Location">
          <dt>Coordinates</dt>
          <dd>{formatCoordinates(h.lat, h.lon)}</dd>
          <dt>Depth</dt>
          <dd>About {h.depthM.toLocaleString('en-CA')} m</dd>
          <dt>Data delay</dt>
          <dd>{h.dataDelay}</dd>
        </dl>
        <dl className="details__list" aria-label="Hardware">
          <dt>Hydrophone</dt>
          <dd>{h.hardware.model}</dd>
          <dt>Sample rate</dt>
          <dd>{h.hardware.sampleRateKHz} kHz</dd>
          <dt>Hears</dt>
          <dd>{h.hardware.bandLabel}</dd>
          <dt>Deployed</dt>
          <dd>{formatYearMonth(h.hardware.deployed)}</dd>
          <dt>Last serviced</dt>
          <dd>{formatYearMonth(h.hardware.lastServiced)}</dd>
        </dl>
        <div className="details__last">
          <div className="details__last-label">Last detection here</div>
          {last ? (
            <LastDetection
              key={last.id}
              detection={last}
              now={now}
              count24h={countSince(here, now, DURATION.DAY)}
            />
          ) : (
            <p className="details__empty">Nothing recorded at this hydrophone in the example data.</p>
          )}
        </div>
      </div>
    </section>
  );
}

type LastProps = { detection: AnyDetection; now: number; count24h: number };

function LastDetection({ detection, now, count24h }: LastProps) {
  const species = getSpecies(detection.speciesId);
  const clip = detection.clipSeconds ?? FALLBACK_CLIP_SECONDS;
  const playback = usePlayback(clip, detection.audioUrl ?? null);

  return (
    <>
      <div className="details__species">
        <img className="species-icon" src={SPECIES_ICON[species.id]} alt="" width="44" height="25" />
        {species.name}
      </div>
      <div className="details__when">
        {formatDayAt(detection.timestamp, now)}, {detection.daylight ? 'daylight' : 'night'}
      </div>
      <div className="details__meta">
        {confidencePercent(detection.confidence)}% confidence, {count24h}{' '}
        {count24h === 1 ? 'detection' : 'detections'} in the last 24 hours
      </div>
      <div className="details__actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={playback.toggle}
          aria-pressed={playback.playing}
        >
          {playback.playing ? <StopIcon /> : <PlayIcon />}
          {playback.playing ? 'Stop' : 'Play last call'}
        </button>
        {playback.playing && (
          <span className="details__playtime">
            {formatSeconds(playback.elapsed)} of {formatSeconds(clip)}
          </span>
        )}
      </div>
    </>
  );
}
