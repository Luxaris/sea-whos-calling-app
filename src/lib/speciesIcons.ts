import dolphin from '../assets/icons/dolphin.svg';
import finWhale from '../assets/icons/fin-whale.svg';
import humpback from '../assets/icons/humpback.svg';
import orca from '../assets/icons/orca.svg';
import spermWhale from '../assets/icons/sperm-whale.svg';
import type { SpeciesId } from '../data/types';

/**
 * Side-on silhouette for each species (black on transparent, 256×256 with the
 * animal across the middle). Always shown next to the species name, so use alt="".
 * blue-whale.svg is in the folder too but is not one of the five species.
 */
export const SPECIES_ICON: Record<SpeciesId, string> = {
  orca,
  sperm: spermWhale,
  humpback,
  fin: finWhale,
  pwsd: dolphin,
};
