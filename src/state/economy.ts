import type { Save } from './model';
import { chapters } from '../data/botany';
import { journeyRegions } from '../data/ecology';
import { collectionById, featuredCollection } from '../data/collections';
export const themes = [
  { id: 'ivoire', name: 'Papier d’ivoire', color: '#f5f1e7', cost: 0 },
  { id: 'sauge', name: 'Carnet de sauge', color: '#dfe6d1', cost: 100 },
  { id: 'rose', name: 'Poussière de rose', color: '#eddbd1', cost: 150 },
];
export function acquireTheme(s: Save, id: string): Save {
  const theme = themes.find((t) => t.id === id);
  if (!theme) return s;
  if (s.owned.includes(id)) return { ...s, theme: id };
  if (s.seeds < theme.cost) return s;
  return { ...s, theme: id, seeds: s.seeds - theme.cost, owned: [...s.owned, id] };
}

export const wallpapers = chapters.map((chapter, ecosystem) => {
  const first = journeyRegions.find((r) => r.ecosystem === ecosystem)!;
  return {
    id: `ecosystem-${ecosystem}`,
    ecosystem,
    name: chapter.name,
    color: chapter.color,
    cost: first.end - first.start + 1,
    firstPage: first.start,
  };
});
export const wallpaperUnlocked = (s: Save, id: string) => {
  const item = wallpapers.find((w) => w.id === id);
  return !!item && (item.firstPage === 1 || !!s.completed[item.firstPage - 1]);
};
export function shopWallpapers(save: Save) {
  const owned = save.ownedWallpapers ?? [];
  const available = wallpapers.filter(
    (w) => owned.includes(w.id) || (wallpaperUnlocked(save, w.id) && save.seeds >= w.cost),
  );
  const upcoming = wallpapers.find((w) => !owned.includes(w.id) && !wallpaperUnlocked(save, w.id));
  return { available, upcoming };
}
export function acquireWallpaper(s: Save, id: string): Save {
  if (s.testSession) return s;
  if (id === 'default') return s.wallpaper === 'default' ? s : { ...s, wallpaper: 'default' };
  const item = wallpapers.find((w) => w.id === id);
  if (!item) return s;
  const owned = s.ownedWallpapers ?? [];
  if (owned.includes(id)) return s.wallpaper === id ? s : { ...s, wallpaper: id };
  if (!wallpaperUnlocked(s, id) || s.seeds < item.cost) return s;
  return { ...s, seeds: s.seeds - item.cost, wallpaper: id, ownedWallpapers: [...owned, id] };
}
export function acquireGarden(s: Save, id: string, now = new Date()): Save {
  const garden = collectionById(id);
  if (
    s.testSession ||
    !garden ||
    garden.kind === 'golden' ||
    s.gardens?.[id] ||
    featuredCollection(now)?.id !== id ||
    s.seeds < garden.cost
  )
    return s;
  return {
    ...s,
    seeds: s.seeds - garden.cost,
    gardens: { ...s.gardens, [id]: { species: [garden.species[0].id], completed: {} } },
  };
}
export function acquireGardenSpecies(s: Save, collection: string, id: string): Save {
  const garden = collectionById(collection);
  const progress =
    s.gardens?.[collection] ??
    (garden?.kind === 'golden' ? { species: [], completed: {} } : undefined);
  const species = garden?.species.find((p) => p.id === id);
  if (
    s.testSession ||
    !progress ||
    !species ||
    progress.species.includes(id) ||
    s.seeds < species.cost
  )
    return s;
  return {
    ...s,
    seeds: s.seeds - species.cost,
    gardens: { ...s.gardens, [collection]: { ...progress, species: [...progress.species, id] } },
  };
}
