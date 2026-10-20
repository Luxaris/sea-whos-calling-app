import type { ReactNode } from 'react';
import './Segmented.css';

export type SegmentedOption<T extends string> = { value: T; label: string; icon?: ReactNode };

type Props<T extends string> = {
  name: string;
  legend: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (v: T) => void;
  /** Extra class on the fieldset, for layout. */
  className?: string;
  /** Hide the legend visually but keep it for screen readers. */
  hideLegend?: boolean;
};

/** A row of radio buttons styled as one control. */
export function Segmented<T extends string>({ name, legend, value, options, onChange, className, hideLegend }: Props<T>) {
  return (
    <fieldset className={`segmented__fieldset${className ? ` ${className}` : ''}`}>
      <legend className={hideLegend ? 'visually-hidden' : 'segmented__legend'}>{legend}</legend>
      <div className="segmented">
        {options.map((o) => (
          <label key={o.value} className={`segmented__option${o.value === value ? ' is-checked' : ''}`}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
              className="visually-hidden"
            />
            {o.icon}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
