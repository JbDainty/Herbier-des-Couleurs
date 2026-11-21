/** Immutable samples for the native animation graph; nothing is calculated per frame. */
export function pageCurlSamples(width: number, height: number, backwards = false) {
  const perspective = Math.max(900, width * 3.4);
  const direction = backwards ? 1 : -1;
  const samples = Array.from({ length: 25 }, (_, i) => {
    const p = i / 24;
    // A hesitant lift, a quicker crossing, then a soft release at the binding.
    const turn = p * p * (3 - 2 * p);
    const angle = 94 * turn;
    const radians = (angle * Math.PI) / 180;
    const flex = Math.sin(Math.PI * turn);
    const projection =
      (width * Math.cos(radians)) / (1 - (width * Math.sin(radians)) / perspective);
    return {
      p,
      angle: `${direction * angle}deg`,
      edge: backwards ? width - projection : projection,
      flex: Math.max(0, flex),
      lift: -Math.min(7, height * 0.008) * flex,
      twist: `${direction * 0.45 * flex}deg`,
      skew: `${direction * 1.35 * flex}deg`,
    };
  });
  return { perspective, samples };
}

export const speciesSheetCount = 3;

/** Bound the temporary offscreen page texture, especially on QHD/high-density phones. */
export function pageTextureSurface(width: number, height: number, density: number) {
  const ratio = Math.min(1, 2 / density, 1600 / (Math.max(width, height) * density));
  return { width: width * ratio, height: height * ratio, ratio };
}
