export type GardenSpecies = {
  id: string;
  name: string;
  description: string;
  cost: number;
  color: string;
};
export type GardenCollection = {
  id: string;
  name: string;
  subtitle: string;
  availableFrom: string;
  cost: number;
  kind?: 'seasonal' | 'golden';
  species: GardenSpecies[];
};

export const GOLDEN_COLLECTION_ID = 'merveilles-or';

/** Append future gardens here; purchased collections must never be removed from the catalogue. */
export const collections: GardenCollection[] = [
  {
    id: 'orchidees-lumiere',
    name: 'Le jardin des orchidées de lumière',
    subtitle: 'Six créations botaniques imaginaires, entre aquarelle et enchantement.',
    availableFrom: '2026-11-01',
    cost: 150,
    species: [
      {
        id: 'aurore',
        name: 'Orchidée des aurores',
        description:
          'Ses pétales d’améthyste semblent retenir les premières lueurs du jour. La première orchidée est incluse avec le jardin.',
        cost: 0,
        color: '#9c7fc1',
      },
      {
        id: 'velours',
        name: 'Orchidée de velours',
        description: 'Une corolle de pourpre et de rose, comme un ruban de velours dans la serre.',
        cost: 45,
        color: '#ae648e',
      },
      {
        id: 'jade',
        name: 'Orchidée de jade',
        description: 'Des courbes d’émeraude et de crème, ponctuées de minuscules éclats dorés.',
        cost: 45,
        color: '#70a58a',
      },
      {
        id: 'ambre',
        name: 'Orchidée d’ambre',
        description: 'Une grappe de fleurs dorées qui évoquent le miel et les soirs d’été.',
        cost: 45,
        color: '#c99a43',
      },
      {
        id: 'lune',
        name: 'Orchidée de lune',
        description:
          'De grands pétales nacrés aux reflets bleutés, baignés d’une lumière paisible.',
        cost: 45,
        color: '#91a9c3',
      },
      {
        id: 'corail',
        name: 'Orchidée de corail',
        description:
          'Des pétales frangés de pêche et de corail, traversés de fines veines écarlates.',
        cost: 45,
        color: '#ce887c',
      },
    ],
  },
  {
    id: GOLDEN_COLLECTION_ID,
    kind: 'golden',
    name: 'L’Herbier des Merveilles',
    subtitle: 'Cinq espèces imaginaires d’exception, enluminées sur fond d’or.',
    availableFrom: '2026-11-01',
    cost: 0,
    species: [
      {
        id: 'phenix',
        name: 'Orchidée du Phénix',
        description:
          'Des pétales pourpres et corail se déploient comme des flammes. Des nervures d’or rejoignent un cœur de braise.',
        cost: 200,
        color: '#b34d67',
      },
      {
        id: 'constellations',
        name: 'Lotus des Constellations',
        description:
          'Ses pétales bleu nuit et violets portent un ciel d’étoiles. De longs filaments argentés entourent son cœur.',
        cost: 200,
        color: '#626db6',
      },
      {
        id: 'eclipse',
        name: 'Rose de l’Éclipse',
        description:
          'Une rose de velours noir et bordeaux, bordée d’or, dont le cœur s’entoure d’un halo lumineux.',
        cost: 200,
        color: '#773e59',
      },
      {
        id: 'cristal',
        name: 'Lys de Cristal',
        description:
          'Ses pétales translucides mêlent turquoise et nacre. Des gouttes de diamant brillent près de ses étamines dorées.',
        cost: 200,
        color: '#77adb7',
      },
      {
        id: 'temps',
        name: 'Passiflore du Temps',
        description:
          'Une couronne de filaments dorés s’enroule autour de pétales émeraude et mauves, comme une spirale suspendue.',
        cost: 200,
        color: '#8e7da8',
      },
    ],
  },
];

export const COLLECTION_CYCLE_MONTHS = 2;
export function collectionCycleStart(now = new Date()) {
  const month = now.getUTCMonth() - (now.getUTCMonth() % COLLECTION_CYCLE_MONTHS);
  return new Date(Date.UTC(now.getUTCFullYear(), month, 1)).toISOString().slice(0, 10);
}
export const collectionById = (id: string) => collections.find((c) => c.id === id);
export function featuredCollection(now = new Date()) {
  const day = collectionCycleStart(now);
  return collections
    .filter((c) => c.kind !== 'golden' && c.availableFrom <= day)
    .sort((a, b) => b.availableFrom.localeCompare(a.availableFrom))[0];
}
