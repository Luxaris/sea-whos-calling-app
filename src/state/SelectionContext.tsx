import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { Detection } from '../data/types';

export type Selection = { detectionId: string | null; hydrophoneId: string };

/** A one-off request for the map to move; a new nonce means "do it again". */
export type MapFocus = { hydrophoneId: string; zoom?: number; nonce: number };

/** A one-off request for the card list to scroll a card into view. */
export type CardScroll = { detectionId: string; nonce: number };

type MoveOptions = {
  /** Pan the map to the hydrophone, zooming in to at least `zoom` if given. */
  pan?: boolean;
  zoom?: number;
  /** Scroll the matching card into view. */
  scroll?: boolean;
};

type State = { selection: Selection; focus: MapFocus | null; cardScroll: CardScroll | null; nonce: number };

type Action = { type: 'select'; selection: Selection; options: MoveOptions };

function reducer(state: State, action: Action): State {
  const nonce = state.nonce + 1;
  const { selection, options } = action;
  return {
    selection,
    nonce,
    focus: options.pan ? { hydrophoneId: selection.hydrophoneId, zoom: options.zoom, nonce } : state.focus,
    cardScroll:
      options.scroll && selection.detectionId ? { detectionId: selection.detectionId, nonce } : state.cardScroll,
  };
}

type ContextValue = {
  selection: Selection;
  focus: MapFocus | null;
  cardScroll: CardScroll | null;
  selectDetection: (detection: Detection, options?: MoveOptions) => void;
  selectHydrophone: (hydrophoneId: string, options?: MoveOptions) => void;
};

const SelectionContext = createContext<ContextValue | null>(null);

export function SelectionProvider({ initial, children }: { initial: Selection; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { selection: initial, focus: null, cardScroll: null, nonce: 0 });

  const selectDetection = useCallback((detection: Detection, options: MoveOptions = {}) => {
    dispatch({
      type: 'select',
      selection: { detectionId: detection.id, hydrophoneId: detection.hydrophoneId },
      options,
    });
  }, []);

  const selectHydrophone = useCallback((hydrophoneId: string, options: MoveOptions = {}) => {
    dispatch({ type: 'select', selection: { detectionId: null, hydrophoneId }, options });
  }, []);

  const value = useMemo(
    () => ({
      selection: state.selection,
      focus: state.focus,
      cardScroll: state.cardScroll,
      selectDetection,
      selectHydrophone,
    }),
    [state, selectDetection, selectHydrophone],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): ContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used inside <SelectionProvider>');
  return ctx;
}
