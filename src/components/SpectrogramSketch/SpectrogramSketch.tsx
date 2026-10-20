import { useState } from 'react';
import { getSpecies } from '../../data/api';
import type { SpeciesId } from '../../data/types';
import './SpectrogramSketch.css';

type Props = {
  speciesId: SpeciesId;
  /** 0–1 while playing; draws a white playhead. */
  playhead?: number | null;
  /** A real spectrogram image (public/spectrograms), shown tinted in the species colour. */
  src?: string | null;
  /** Shown as the image's alt text, e.g. "Humpback whale call, Folger Passage". */
  caption?: string;
};

/** A real spectrogram strip. Without an image it stays a plain dark strip that says so; nothing is drawn by hand. */
export function SpectrogramSketch({ speciesId, playhead = null, src = null, caption }: Props) {
  const species = getSpecies(speciesId);
  const colour = `var(--${species.group}-spectro)`;
  const [broken, setBroken] = useState(false);
  const image = src && !broken;
  return (
    <div className={`spectro${image ? ' spectro--image' : ''}`}>
      {image ? (
        <>
          <img className="spectro__img" src={src} alt={caption ?? `${species.name} call spectrogram`} width="256" height="128" onError={() => setBroken(true)} />
          <span className="spectro__tint" style={{ background: colour }} aria-hidden="true" />
        </>
      ) : (
        <span className="spectro__empty">No spectrogram for this clip</span>
      )}
      {playhead !== null && (
        <span className="spectro__playhead" aria-hidden="true" style={{ left: `${Math.min(playhead, 1) * 100}%` }} />
      )}
      <span className="spectro__label">{species.freqLabel}</span>
    </div>
  );
}
