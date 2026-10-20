import { confidencePercent, formatConfidence } from '../../lib/confidence';
import './ConfidenceMeter.css';

type Props = {
  confidence: number;
  /** Show "94% high" (default) or just "94%". */
  withLevel?: boolean;
  size?: 'normal' | 'small';
};

/** Thin neutral meter plus the number. Never uses status colours. */
export function ConfidenceMeter({ confidence, withLevel = true, size = 'normal' }: Props) {
  const pct = confidencePercent(confidence);
  return (
    <span className={`meter meter--${size}`}>
      <span className="meter__track" aria-hidden="true">
        <span className="meter__fill" style={{ width: `${pct}%` }} />
      </span>
      <span>{withLevel ? formatConfidence(confidence) : `${pct}%`}</span>
    </span>
  );
}
