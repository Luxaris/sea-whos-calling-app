import { getHydrophone, getSpecies } from '../../data/api';
import type { Detection } from '../../data/types';
import { confidencePercent } from '../../lib/confidence';
import { minutesAgo } from '../../lib/time';
import './CautionStrip.css';

type Props = {
  alerts: Detection[];
  now: number;
  onShow: (detection: Detection) => void;
};

function agoText(minutes: number): string {
  if (minutes === 0) return 'less than a minute ago';
  return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
}

/**
 * Amber band telling the operator to hold active sonar. Shows one alert at a time:
 * the newest. `alerts` is newest first.
 */
export function CautionStrip({ alerts, now, onShow }: Props) {
  if (alerts.length === 0) return null;
  const main = alerts[0];
  const h = getHydrophone(main.hydrophoneId);
  const s = getSpecies(main.speciesId);
  return (
    <section className="caution" role="status" aria-label="Sonar caution">
      <div className="caution__row">
        <div className="caution__text">
          <svg className="caution__icon" width="28" height="28" viewBox="0 0 24 24" fill="#FAB219" stroke="#8A5A00" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l10 18H2z" />
            <path d="M12 10v5M12 18v.5" fill="none" stroke="#5C3D00" strokeWidth="2" />
          </svg>
          <div>
            <h2 className="caution__title">Hold active sonar near {h.name}</h2>
            <p className="caution__line">
              {s.name} heard {agoText(minutesAgo(main.timestamp, now))} with {confidencePercent(main.confidence)}%
              confidence, inside the 5 km mitigation zone.
            </p>
          </div>
        </div>
        <button type="button" className="caution__button" onClick={() => onShow(main)}>
          Show on map
        </button>
      </div>
    </section>
  );
}
