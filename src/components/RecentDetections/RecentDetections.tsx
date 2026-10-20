import { useEffect, useRef } from 'react';
import { getHydrophone, getSpecies } from '../../data/api';
import type { Detection } from '../../data/types';
import { toMs } from '../../lib/time';
import { useSelection } from '../../state/SelectionContext';
import { DetectionCard } from '../DetectionCard/DetectionCard';
import './RecentDetections.css';

type Props = {
  detections: Detection[];
  now: number;
  /** Ids that arrived while the page was open. */
  arrived: string[];
  /** The most recent arrival, announced to screen readers. */
  latest: Detection | null;
  paused: boolean;
  onTogglePause: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

const STACKED = '(max-width: 1099px)';
/** Clicking a card flies the map in far enough to show the 5 km zone. */
const CARD_ZOOM = 10;

const Chevron = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className={`recent__chevron recent__chevron--${direction}`}>
    <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export function RecentDetections({
  detections,
  now,
  arrived,
  latest,
  paused,
  onTogglePause,
  collapsed,
  onToggleCollapsed,
}: Props) {
  const { selection, cardScroll, selectDetection } = useSelection();
  const cards = useRef(new Map<string, HTMLElement>());
  const toggleButton = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);
  const newestFirst = [...detections].sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));

  // The hide and show buttons swap places, so keep keyboard focus on whichever is now visible.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    toggleButton.current?.focus();
  }, [collapsed]);

  // Bring the selected card into view in the column. When the columns are stacked
  // the cards sit below the map, so jumping away from the map would be unhelpful.
  useEffect(() => {
    if (!cardScroll || window.matchMedia(STACKED).matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cards.current.get(cardScroll.detectionId)?.scrollIntoView({
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [cardScroll]);

  const announcement = (
    <p className="visually-hidden" aria-live="polite">
      {latest ? `New detection: ${getSpecies(latest.speciesId).name} at ${getHydrophone(latest.hydrophoneId).name}.` : ''}
    </p>
  );

  if (collapsed) {
    return (
      <div className="recent recent--collapsed">
        <button
          ref={toggleButton}
          type="button"
          className="recent__expand"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          aria-label={`Show most recent detections, ${detections.length} detections`}
        >
          <Chevron direction="right" />
          <span className="recent__rail-label">Most recent detections</span>
          <span className="recent__count">{detections.length}</span>
        </button>
        {announcement}
      </div>
    );
  }

  return (
    <div className="recent">
      <div className="recent__head">
        <h2 className="recent__title">Most recent detections</h2>
        <div className="recent__actions">
          <button type="button" className="btn btn--quiet recent__pause" onClick={onTogglePause} aria-pressed={paused}>
            {paused ? 'Resume feed' : 'Pause feed'}
          </button>
          <button
            ref={toggleButton}
            type="button"
            className="btn btn--quiet recent__collapse"
            onClick={onToggleCollapsed}
            aria-expanded={true}
            aria-label="Hide most recent detections"
            title="Hide most recent detections"
          >
            <Chevron direction="left" />
          </button>
        </div>
      </div>
      {announcement}
      {paused && <p className="recent__paused">Feed paused. New detections will not appear until you resume.</p>}
      <div className="recent__list">
        {newestFirst.map((d) => (
          <DetectionCard
            key={d.id}
            ref={(el) => {
              if (el) cards.current.set(d.id, el);
              else cards.current.delete(d.id);
            }}
            detection={d}
            now={now}
            selected={d.id === selection.detectionId}
            isNew={arrived.includes(d.id)}
            onShowHydrophone={(det) => selectDetection(det, { pan: true, zoom: CARD_ZOOM })}
          />
        ))}
      </div>
    </div>
  );
}
