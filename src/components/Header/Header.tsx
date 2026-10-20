import { getHydrophones } from '../../data/api';
import { formatClock, zoneName } from '../../lib/time';
import './Header.css';

type Props = {
  updatedAt: number;
  operatorsWatching: number;
};

export function Header({ updatedAt, operatorsWatching }: Props) {
  const hydrophones = getHydrophones();
  const online = hydrophones.filter((h) => h.status === 'online').length;

  return (
    <header className="header">
      <div className="header__brand">
        <img className="header__logo" src="/logo.svg" width={44} height={44} alt="" />
        <div>
          <h1 className="header__title">Sea Who's Calling</h1>
          <p className="header__subtitle">Live marine mammal detections from ONC hydrophones, BC coast</p>
        </div>
      </div>
      <div className="header__status">
        <span className="header__item">
          <span className="header__dot" aria-hidden="true" />
          {online} of {hydrophones.length} hydrophones online
        </span>
        <span className="header__item">
          Updated {formatClock(updatedAt)} {zoneName(updatedAt)}
        </span>
        <span className="header__item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {operatorsWatching} operators watching
        </span>
      </div>
    </header>
  );
}
