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
  species: GardenSpecies[];
};

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
    .filter((c) => c.availableFrom <= day)
    .sort((a, b) => b.availableFrom.localeCompare(a.availableFrom))[0];
}
