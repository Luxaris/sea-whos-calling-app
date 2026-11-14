import { forwardRef } from 'react';
import { getGroup, getHydrophone, getSpecies } from '../../data/api';
import type { Detection } from '../../data/types';
import { groupMatches } from '../../lib/ranked';
import { SPECIES_ICON } from '../../lib/speciesIcons';
import { spectrogramFor } from '../../lib/spectrograms';
import { formatClock, formatDayYear, formatSeconds, relativeTime } from '../../lib/time';
import { usePlayback } from '../../lib/usePlayback';
import { ConfidenceMeter } from '../ConfidenceMeter/ConfidenceMeter';
import { SpectrogramSketch } from '../SpectrogramSketch/SpectrogramSketch';
import { TopMatches } from '../TopMatches/TopMatches';
import { PlayIcon, StopIcon } from './icons';
import './DetectionCard.css';

type Props = {
  detection: Detection;
  now: number;
  selected: boolean;
  isNew?: boolean;
  onShowHydrophone?: (detection: Detection) => void;
};

export const DetectionCard = forwardRef<HTMLElement, Props>(function DetectionCard(
  { detection, now, selected, isNew = false, onShowHydrophone },
  ref,
) {
  const species = getSpecies(detection.speciesId);
  // A band-limited clip is named by its species group, never by a species guess: with ranked
  // matches, the group with the largest share.
  const topGroup = detection.bandLimited && detection.ranked?.length ? groupMatches(detection.ranked)[0] : null;
  const groupId = topGroup?.groupId ?? species.group;
  const name = detection.bandLimited ? getGroup(groupId).label : species.name;
  const hydrophone = getHydrophone(detection.hydrophoneId);
  const playback = usePlayback(detection.clipSeconds, detection.audioUrl);
  const spectrogram = spectrogramFor(detection);
  const headingId = `card-${detection.id}-title`;

  return (
    // Clicking anywhere on the card shows it on the map, except on the card's own
    // controls. Keyboard users get the same action from the hydrophone name button.
    <article
      ref={ref}
      className={`card${selected ? ' card--selected' : ''}${isNew ? ' card--new' : ''}`}
      aria-labelledby={headingId}
      data-testid={`detection-card-${detection.id}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a, input, select')) return;
        onShowHydrophone?.(detection);
      }}
    >
      <div className="card__top">
        <div className="card__name">
          {!detection.bandLimited && (
            <img className="species-icon" src={SPECIES_ICON[species.id]} alt="" width="44" height="25" />
          )}
          <h3 id={headingId} className="card__species">
            {name}
          </h3>
        </div>
        <span className="card__meta">
          {isNew && <span className="card__new-tag">New</span>}
          <time className="card__when" dateTime={detection.timestamp} title={formatClock(detection.timestamp)}>
            {relativeTime(detection.timestamp, now)}
          </time>
        </span>
      </div>

      <div className="card__where">
        <span className="card__dot" style={{ background: `var(--${groupId})` }} aria-hidden="true" />
        <button
          type="button"
          className="card__hydrophone"
          onClick={() => onShowHydrophone?.(detection)}
          aria-label={`${hydrophone.name}, show on map`}
        >
          {hydrophone.name}
        </button>
        {selected && <span className="card__selected">Selected on map</span>}
      </div>

      <TopMatches detection={detection} />

      <SpectrogramSketch
        speciesId={detection.speciesId}
        playhead={playback.playing ? playback.progress : null}
        src={spectrogram?.url}
        caption={
          spectrogram
            ? `${name} call, ${getHydrophone(spectrogram.source.hydrophoneId).name}, ${formatDayYear(spectrogram.source.timestamp)}${spectrogram.own ? '' : ' (example)'}`
            : undefined
        }
      />

      <div className="card__controls">
        <div className="card__play">
          <button
            type="button"
            className={`btn ${selected ? 'btn--primary' : 'btn--secondary'}`}
            onClick={playback.toggle}
            aria-pressed={playback.playing}
            aria-label={playback.playing ? `Stop ${name} call` : `Play ${name} call`}
          >
            {playback.playing ? <StopIcon /> : <PlayIcon />}
            {playback.playing ? 'Stop' : 'Play call'}
          </button>
          <span className="card__clip" aria-live="off">
            {playback.playing
              ? `${formatSeconds(playback.elapsed)} of ${formatSeconds(detection.clipSeconds)}`
              : `${detection.clipSeconds} s clip`}
          </span>
        </div>
        <ConfidenceMeter confidence={detection.confidence} />
      </div>
    </article>
  );
});
