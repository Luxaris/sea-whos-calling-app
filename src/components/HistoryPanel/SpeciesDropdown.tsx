import { useEffect, useId, useRef, useState } from 'react';
import { getSpeciesList } from '../../data/api';
import type { SpeciesId } from '../../data/types';

type Props = {
  value: SpeciesId[];
  onChange: (species: SpeciesId[]) => void;
};

/** "All species", "None", a single name, or "3 of 5 species". */
function summary(value: SpeciesId[]): string {
  const list = getSpeciesList();
  if (value.length === list.length) return 'All species';
  if (value.length === 0) return 'No species';
  if (value.length === 1) return list.find((s) => s.id === value[0])?.name ?? '1 species';
  return `${value.length} of ${list.length} species`;
}

export function SpeciesDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const labelId = useId();
  const list = getSpeciesList();

  // Close on a click outside or on Escape, like a native select.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (id: SpeciesId, on: boolean) =>
    // Keep the species in list order so the summary and export stay stable.
    onChange(list.map((s) => s.id).filter((s) => (s === id ? on : value.includes(s))));

  return (
    <div
      className="dropdown field"
      ref={root}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <span id={labelId}>Species</span>
      <button
        ref={button}
        type="button"
        className="dropdown__button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${labelId} ${panelId}-value`}
        onClick={() => setOpen((o) => !o)}
        data-testid="history-species"
      >
        <span id={`${panelId}-value`}>{summary(value)}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="dropdown__chevron">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      {open && (
        <div
          className="dropdown__panel"
          id={panelId}
          role="group"
          aria-labelledby={labelId}
          // A mouse press on an option label would move focus to nothing and blur the panel shut
          // before the checkbox toggles; keep focus where it is. Keyboard users tab in as before.
          onMouseDown={(e) => e.preventDefault()}
        >
          {list.map((s) => (
            <label key={s.id} className="dropdown__option">
              <input
                type="checkbox"
                checked={value.includes(s.id)}
                onChange={(e) => toggle(s.id, e.target.checked)}
                data-testid={`history-species-${s.id}`}
              />
              <span className="dropdown__dot" style={{ background: `var(--${s.group})` }} aria-hidden="true" />
              <span className="dropdown__name">{s.name}</span>
              <button
                type="button"
                className="dropdown__only"
                onClick={(e) => {
                  e.preventDefault();
                  onChange([s.id]);
                }}
                aria-label={`Only ${s.name}`}
                data-testid={`history-species-only-${s.id}`}
              >
                Only
              </button>
            </label>
          ))}
          <div className="dropdown__actions">
            <button type="button" className="btn btn--quiet" onClick={() => onChange(list.map((s) => s.id))} data-testid="history-species-all">
              Select all
            </button>
            <button type="button" className="btn btn--quiet" onClick={() => onChange([])} data-testid="history-species-clear">
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
