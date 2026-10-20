import type { Direction, PointExpression } from 'leaflet';

type Kind = 'pin' | 'diamond';

/** `pinSide` and `pinNudge` apply only while a detection pin shows. */
type Placement = { side: Direction; pinSide?: Direction; nudge?: [number, number] };

// Where each hydrophone's permanent label sits, chosen so neighbouring labels
// don't stack. The three Strait of Georgia sites are only a few km apart (about
// 10 px at the starting zoom): SoG Central's pin label goes above, SoG East's to
// the right, and Fraser Delta's sits just below that.
const PLACEMENT: Record<string, Placement> = {
  folger: { side: 'right' },
  barkley: { side: 'right' },
  clayoquot: { side: 'top' },
  cascadia: { side: 'right' },
  endeavour: { side: 'top' },
  sogc: { side: 'left', pinSide: 'top' },
  soge: { side: 'bottom', pinSide: 'right' },
  fraser: { side: 'right', nudge: [0, 8] },
  saanich: { side: 'bottom' },
};

const PIN_OFFSETS: Record<string, [number, number]> = {
  right: [18, -30],
  left: [-18, -30],
  top: [0, -48],
  bottom: [0, 6],
};

const DIAMOND_OFFSETS: Record<string, [number, number]> = {
  right: [12, 0],
  left: [-12, 0],
  top: [0, -12],
  bottom: [0, 12],
};

export function labelSide(hydrophoneId: string, kind: Kind): Direction {
  const p = PLACEMENT[hydrophoneId];
  return (kind === 'pin' ? p?.pinSide : undefined) ?? p?.side ?? 'right';
}

/** Offset from the marker's anchor so the label clears the pin or diamond. */
export function labelOffset(hydrophoneId: string, kind: Kind): PointExpression {
  const side = labelSide(hydrophoneId, kind);
  const table = kind === 'pin' ? PIN_OFFSETS : DIAMOND_OFFSETS;
  const [bx, by] = table[side] ?? table.right;
  const [nx, ny] = PLACEMENT[hydrophoneId]?.nudge ?? [0, 0];
  return [bx + nx, by + ny];
}
