import { getGroup, getSpecies } from '../../data/api';
import type { Detection } from '../../data/types';
import { confidencePercent } from '../../lib/confidence';
import { groupMatches, topMatches } from '../../lib/ranked';
import './TopMatches.css';

type Props = {
  detection: Pick<Detection, 'speciesId' | 'ranked' | 'bandLimited'>;
};

/**
 * The detection's best three matches, group first:
 * "Dolphins  Top 3", then each species with its Latin name and percentage.
 * A band-limited clip lists species groups instead. Renders nothing without ranked matches.
 */
export function TopMatches({ detection }: Props) {
  const matches = topMatches(detection);
  if (!matches) return null;

  if (detection.bandLimited) {
    const groups = groupMatches(detection.ranked ?? []);
    return (
      <section className="matches" aria-label="Top group matches">
        <p className="matches__head">
          <span className="matches__muffled">Muffled audio: species group only</span>
        </p>
        <ol className="matches__list">
          {groups.map((g) => (
            <li key={g.groupId} className="matches__row">
              <span className="matches__dot" style={{ background: `var(--${g.groupId})` }} aria-hidden="true" />
              <span className="matches__name">{getGroup(g.groupId).label}</span>
              <span className="matches__pct">{confidencePercent(g.confidence)}%</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const group = getGroup(getSpecies(matches[0].speciesId).group);
  return (
    <section className="matches" aria-label="Top matches">
      <p className="matches__head">
        <span className="matches__dot" style={{ background: `var(--${group.id})` }} aria-hidden="true" />
        <span className="matches__group">{group.label}</span>
        <span className="matches__note">Top {matches.length}</span>
      </p>
      <ol className="matches__list">
        {matches.map((m) => {
          const species = getSpecies(m.speciesId);
          return (
            <li key={m.speciesId} className="matches__row">
              <span className="matches__dot" style={{ background: `var(--${species.group})` }} aria-hidden="true" />
              <span className="matches__name">
                {species.name}
                <i className="matches__latin" lang="la">
                  {species.latin}
                </i>
              </span>
              <span className="matches__pct">{confidencePercent(m.confidence)}%</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
