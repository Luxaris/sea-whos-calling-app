import { getGroups } from '../../data/api';
import './MapLegend.css';

export function MapLegend() {
  return (
    <ul className="legend" aria-label="Map legend">
      {getGroups().map((g) => (
        <li key={g.id}>
          <span className="legend__dot" style={{ background: `var(--${g.id})` }} aria-hidden="true" />
          {g.legend}
        </li>
      ))}
      <li>
        <span className="legend__diamond" aria-hidden="true" />
        Hydrophone, quiet
      </li>
      <li>
        <span className="legend__diamond legend__diamond--offline" aria-hidden="true" />
        Hydrophone, offline
      </li>
      <li>
        <span className="legend__zone" aria-hidden="true" />
        Mitigation zone
      </li>
      <li>
        <span className="legend__lane" aria-hidden="true" />
        Shipping lane
      </li>
    </ul>
  );
}
