/** Light uses additive RGB channels: red=1, green=2, blue=4. */
export type GlassKind = 'glass' | 'mirror' | 'splitter' | 'mixer';
export type OpticalMechanic = Exclude<GlassKind, 'glass'>;
export type GlassPort = { cell: number; side: number; color: number };
export type VitrailPuzzle = {
  size: number;
  cells: GlassKind[];
  sources: GlassPort[];
  targets: GlassPort[];
  initial: number[];
  solution: number[];
};
export const opticalLessons: Record<OpticalMechanic, { name: string; summary: string }> = {
  mirror: {
    name: 'Les miroirs du vitrail',
    summary:
      'Touchez un miroir pour le faire pivoter. Il dévie la lumière à angle droit : le halo de chaque fleur indique la couleur à lui envoyer. Chaque geste peut être annulé.',
  },
  splitter: {
    name: 'Le séparateur de lumière',
    summary:
      'Le séparateur reçoit un rayon par sa tige et le partage en deux : tout droit et sur le côté. Les deux rayons gardent la même couleur. Faites-le pivoter pour orienter ses branches.',
  },
  mixer: {
    name: 'Les couleurs de la lumière',
    summary:
      'Le mélangeur rassemble les rayons vers sa flèche. Ici, c’est de la lumière : rouge + vert = jaune, rouge + bleu = magenta, vert + bleu = cyan. Les trois réunis donnent du blanc.',
  },
};
export const lightColors: Record<number, { name: string; hex: string; mark: string }> = {
  1: { name: 'rouge', hex: '#b95868', mark: 'R' },
  2: { name: 'vert', hex: '#70995d', mark: 'V' },
  3: { name: 'jaune', hex: '#c49a3c', mark: 'R+V' },
  4: { name: 'bleu', hex: '#658fbe', mark: 'B' },
  5: { name: 'magenta', hex: '#a56b9d', mark: 'R+B' },
  6: { name: 'cyan', hex: '#5baba8', mark: 'V+B' },
  7: { name: 'blanc', hex: '#b1a181', mark: 'R+V+B' },
};
export const opposite = (direction: number) => (direction + 2) % 4;
export const rotationPeriod = (kind: GlassKind) =>
  kind === 'glass' ? 1 : kind === 'mirror' ? 2 : 4;
export function neighbor(cell: number, direction: number, size: number): number {
  const x = cell % size,
    y = Math.floor(cell / size);
  const nx = x + [0, 1, 0, -1][direction],
    ny = y + [-1, 0, 1, 0][direction];
  return nx < 0 || nx >= size || ny < 0 || ny >= size ? -1 : ny * size + nx;
}
export function outgoing(kind: GlassKind, rotation: number, direction: number): number[] {
  if (kind === 'glass') return [direction];
  if (kind === 'mirror') return [direction ^ (rotation % 2 === 0 ? 1 : 3)];
  if (kind === 'splitter') return direction === rotation ? [rotation, (rotation + 1) % 4] : [];
  return direction === opposite(rotation) ? [] : [rotation];
}
export const portKey = (port: Pick<GlassPort, 'cell' | 'side'>) => `${port.cell}:${port.side}`;
export type LightTrace = {
  incoming: number[][];
  outgoing: number[][];
  exits: Record<string, number>;
  lit: boolean[];
  solved: boolean;
};

/** Monotone channel propagation terminates even when the player creates a closed optical loop. */
export function traceVitrail(puzzle: VitrailPuzzle, rotations: number[]): LightTrace {
  const incoming = puzzle.cells.map(() => [0, 0, 0, 0]);
  const emitted = puzzle.cells.map(() => [0, 0, 0, 0]);
  const exits: Record<string, number> = {};
  const queue: [number, number, number][] = puzzle.sources.map((source) => [
    source.cell,
    opposite(source.side),
    source.color,
  ]);
  for (let i = 0; i < queue.length; i++) {
    const [cell, direction, color] = queue[i];
    const added = color & ~incoming[cell][direction];
    if (!added) continue;
    incoming[cell][direction] |= added;
    for (const next of outgoing(puzzle.cells[cell], rotations[cell], direction)) {
      const fresh = added & ~emitted[cell][next];
      if (!fresh) continue;
      emitted[cell][next] |= fresh;
      const target = neighbor(cell, next, puzzle.size);
      if (target < 0) exits[`${cell}:${next}`] = (exits[`${cell}:${next}`] ?? 0) | fresh;
      else queue.push([target, next, fresh]);
    }
  }
  const lit = puzzle.targets.map((target) => exits[portKey(target)] === target.color);
  return { incoming, outgoing: emitted, exits, lit, solved: lit.length > 0 && lit.every(Boolean) };
}

/** A free hint can always reach the certified solution from any sequence of reversible choices. */
export function vitrailHint(puzzle: VitrailPuzzle, rotations: number[]): number | null {
  if (traceVitrail(puzzle, rotations).solved) return null;
  const index = rotations.findIndex((value, i) => value !== puzzle.solution[i]);
  return index < 0 ? null : index;
}
export function opticalMechanics(puzzle: VitrailPuzzle): OpticalMechanic[] {
  return (['mirror', 'splitter', 'mixer'] as const).filter((kind) => puzzle.cells.includes(kind));
}

/** Ignore scramble, orientation, every color choice, rotations and reflections. */
export function canonicalVitrail(puzzle: VitrailPuzzle): string {
  const variants: string[] = [];
  for (const flip of [false, true])
    for (let turn = 0; turn < 4; turn++) {
      const point = (cell: number) => {
        let x = cell % puzzle.size,
          y = Math.floor(cell / puzzle.size);
        if (flip) x = puzzle.size - 1 - x;
        for (let t = 0; t < turn; t++) [x, y] = [puzzle.size - 1 - y, x];
        return y * puzzle.size + x;
      };
      const side = (d: number) => ((flip ? (4 - d) % 4 : d) + turn) % 4;
      const cells = Array<string>(puzzle.cells.length);
      puzzle.cells.forEach((kind, i) => {
        cells[point(i)] = kind[0];
      });
      // 'mirror' and 'mixer' must stay distinct in the topology key.
      puzzle.cells.forEach((kind, i) => {
        if (kind === 'mixer') cells[point(i)] = 'x';
      });
      const ports = (values: GlassPort[]) =>
        values
          .map((p) => `${point(p.cell)}:${side(p.side)}`)
          .sort()
          .join(',');
      variants.push(
        `${puzzle.size}/${cells.join('')}/${ports(puzzle.sources)}/${ports(puzzle.targets)}`,
      );
    }
  return variants.sort()[0];
}
