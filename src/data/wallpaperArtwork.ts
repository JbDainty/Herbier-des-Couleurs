import { journeyLandscapes } from './journeyLandscapes';
export function wallpaperArtwork(id?: string) {
  if (!id?.startsWith('ecosystem-')) return undefined;
  const index = Number(id.slice('ecosystem-'.length));
  return Number.isInteger(index) && index >= 0 && index < journeyLandscapes.length
    ? journeyLandscapes[index]
    : undefined;
}
