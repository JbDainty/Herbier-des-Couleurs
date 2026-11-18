import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  neighbor,
  opposite,
  traceVitrail,
  rotationPeriod,
  canonicalVitrail,
  type VitrailPuzzle,
  type GlassPort,
} from '../src/engine/vitrail';

let seed = 0x18112026;
const random = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
};
const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)];
const shuffle = <T>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const edgePorts = (size: number) =>
  Array.from({ length: size * size }, (_, cell) =>
    [0, 1, 2, 3].filter((side) => neighbor(cell, side, size) < 0).map((side) => ({ cell, side })),
  ).flat();
type Walk = { cells: number[]; entry: number; exit: number };
function walk(
  size: number,
  start: number,
  entry: number,
  blocked: Set<number>,
  min: number,
  max: number,
): Walk | null {
  let budget = 200;
  const visit = (path: number[], direction: number): Walk | null => {
    if (--budget < 0) return null;
    const cell = path[path.length - 1];
    for (const next of shuffle([0, 1, 2, 3].filter((d) => d !== opposite(direction)))) {
      const adjacent = neighbor(cell, next, size);
      if (adjacent < 0) {
        if (path.length >= min) return { cells: path, entry, exit: next };
      } else if (path.length < max && !blocked.has(adjacent) && !path.includes(adjacent)) {
        const result = visit([...path, adjacent], next);
        if (result) return result;
      }
    }
    return null;
  };
  return visit([start], entry);
}
const direction = (from: number, to: number, size: number) =>
  [0, 1, 2, 3].find((d) => neighbor(from, d, size) === to)!;
function imprint(puzzle: VitrailPuzzle, path: Walk) {
  for (let i = 0; i < path.cells.length; i++) {
    const cell = path.cells[i];
    const input = i ? direction(path.cells[i - 1], cell, puzzle.size) : path.entry;
    const output =
      i + 1 < path.cells.length ? direction(cell, path.cells[i + 1], puzzle.size) : path.exit;
    puzzle.cells[cell] = input === output ? 'glass' : 'mirror';
    puzzle.solution[cell] = input === output || (input ^ 1) === output ? 0 : 1;
  }
}
function generate(tier: number): VitrailPuzzle | null {
  const size = tier === 0 ? 4 : 5,
    start = pick(edgePorts(size));
  const main = walk(
    size,
    start.cell,
    opposite(start.side),
    new Set(),
    tier === 0 ? 5 : 8,
    tier === 0 ? 11 : 12,
  );
  if (!main) return null;
  const puzzle: VitrailPuzzle = {
    size,
    cells: Array(size * size).fill('glass'),
    sources: [{ ...start, color: tier === 2 ? 1 : pick([1, 2, 3, 4, 5, 6]) }],
    targets: [],
    initial: [],
    solution: Array(size * size).fill(0),
  };
  imprint(puzzle, main);
  const occupied = new Set(main.cells);
  const targetPorts: Omit<GlassPort, 'color'>[] = [{ cell: main.cells.at(-1)!, side: main.exit }];
  let splitAt = -1;
  if (tier > 0) {
    for (const index of shuffle(main.cells.map((_, i) => i).slice(1, -2))) {
      const cell = main.cells[index],
        input = direction(main.cells[index - 1], cell, size),
        output = direction(cell, main.cells[index + 1], size);
      if (output !== input && output !== (input + 1) % 4) continue;
      const branchDirection = output === input ? (input + 1) % 4 : input;
      const first = neighbor(cell, branchDirection, size);
      if (first < 0 || occupied.has(first)) continue;
      const branch = walk(size, first, branchDirection, occupied, 2, 7);
      if (!branch) continue;
      imprint(puzzle, branch);
      branch.cells.forEach((cell) => occupied.add(cell));
      puzzle.cells[cell] = 'splitter';
      puzzle.solution[cell] = input;
      targetPorts.push({ cell: branch.cells.at(-1)!, side: branch.exit });
      splitAt = index;
      break;
    }
    if (splitAt < 0) return null;
  }
  if (tier === 2) {
    let mixed = false;
    for (const index of shuffle(main.cells.map((_, i) => i).slice(splitAt + 1, -1))) {
      const cell = main.cells[index],
        output = direction(cell, main.cells[index + 1], size);
      for (const port of shuffle([0, 1, 2, 3].filter((d) => d !== output))) {
        const first = neighbor(cell, port, size);
        if (first < 0 || occupied.has(first)) continue;
        const reverse = walk(size, first, port, occupied, 3, 8);
        if (!reverse) continue;
        const secondary: Walk = {
          cells: [...reverse.cells].reverse(),
          entry: opposite(reverse.exit),
          exit: opposite(port),
        };
        imprint(puzzle, secondary);
        puzzle.cells[cell] = 'mixer';
        puzzle.solution[cell] = output;
        puzzle.sources.push({ cell: secondary.cells[0], side: reverse.exit, color: pick([2, 4]) });
        mixed = true;
        break;
      }
      if (mixed) break;
    }
    if (!mixed) return null;
  }
  const mirrors = puzzle.cells.filter((c) => c === 'mirror').length;
  if (mirrors < [2, 4, 6][tier] || mirrors > [5, 8, 13][tier]) return null;
  const solutionTrace = traceVitrail(puzzle, puzzle.solution);
  puzzle.targets = targetPorts.map((p) => ({
    ...p,
    color: solutionTrace.exits[`${p.cell}:${p.side}`] ?? 0,
  }));
  if (
    puzzle.targets.some((p) => !p.color) ||
    (tier === 2 && !puzzle.targets.some((p) => p.color === 3 || p.color === 5))
  )
    return null;
  if (
    new Set([...puzzle.sources, ...puzzle.targets].map((p) => `${p.cell}:${p.side}`)).size !==
    puzzle.sources.length + puzzle.targets.length
  )
    return null;
  puzzle.initial = puzzle.cells.map((kind) => Math.floor(random() * rotationPeriod(kind)));
  const distance = puzzle.initial.reduce(
    (sum, value, i) =>
      sum +
      ((puzzle.solution[i] - value + rotationPeriod(puzzle.cells[i])) %
        rotationPeriod(puzzle.cells[i])),
    0,
  );
  if (distance < [2, 5, 9][tier] || traceVitrail(puzzle, puzzle.initial).solved) return null;
  if (!traceVitrail(puzzle, puzzle.solution).solved) throw Error('Broken certificate');
  return puzzle;
}
const destination = 'src/data/vitrailYear.json';
const days: { day: string; puzzles: VitrailPuzzle[] }[] = existsSync(destination)
  ? JSON.parse(readFileSync(destination, 'utf8')).days
  : [];
const total = Number(process.argv[2] ?? 365);
if (!Number.isInteger(total) || total < days.length || total > 3650)
  throw Error('Specify a total day count at least as large as the immutable existing bank.');
const seen = new Set(days.flatMap((entry) => entry.puzzles.map(canonicalVitrail)));
if (seen.size !== days.length * 3) throw Error('Existing bank has a duplicate.');
seed ^= days.length;
let attempts = 0;
for (let day = days.length; day < total; day++) {
  const puzzles: VitrailPuzzle[] = [];
  for (let tier = 0; tier < 3; tier++) {
    for (;;) {
      attempts++;
      if (attempts > 3000000)
        throw Error(`Generation budget exhausted at day ${day}, tier ${tier}`);
      const puzzle = generate(tier);
      if (!puzzle) continue;
      const key = canonicalVitrail(puzzle);
      if (seen.has(key)) continue;
      seen.add(key);
      puzzles.push(puzzle);
      break;
    }
  }
  days.push({ day: new Date(Date.UTC(2026, 10, 18 + day)).toISOString().slice(0, 10), puzzles });
  if ((day + 1) % 60 === 0) console.log(`${day + 1} days certified (${attempts} candidates)`);
}
writeFileSync(destination, JSON.stringify({ version: 1, days }) + '\n');
console.log(
  `${days.length} days / ${seen.size} unique puzzles, ${attempts} new candidates; ${days[0].day} to ${days.at(-1)!.day}`,
);
