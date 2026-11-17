import { readFileSync, writeFileSync } from 'node:fs';
import campaign, { type Level } from '../src/data/campaign';
import { collections } from '../src/data/collections';
import { permutedLevel } from '../src/engine/remix';
import { key, pour, won, type Board, type Move } from '../src/engine/puzzle';
import type { Rules } from '../src/engine/mechanics';

type Challenge = Level & { alternatives: Move[][]; source: number };
const path = 'src/data/collectionExpertPuzzles.json';
const data = JSON.parse(readFileSync(path, 'utf8')) as Record<string, Record<string, Challenge[]>>;
let seed = 0x65787032;
const rnd = (n: number) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return Math.floor((seed / 4294967296) * n);
};
const shuffle = (n: number) => {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
function trace(board: Board, solution: Move[], rules?: Rules): Board[] | undefined {
  const result = [board];
  for (const step of solution) {
    const next = pour(result.at(-1)!, step.from, step.to, rules);
    if (!next) return;
    result.push(next);
  }
  return won(result.at(-1)!, rules) ? result : undefined;
}
function alternate(l: Level): Move[] | undefined {
  const states = trace(l.board, l.solution, l.rules)!;
  for (let i = 0; i < l.solution.length - 1; i++) {
    const a = l.solution[i],
      b = l.solution[i + 1];
    // Two real independent colour choices, rather than a detour or a repeated state.
    if (
      new Set([a.from, a.to, b.from, b.to]).size !== 4 ||
      states[i][a.from].at(-1) === states[i][b.from].at(-1)
    )
      continue;
    const path = l.solution.slice();
    [path[i], path[i + 1]] = [path[i + 1], path[i]];
    if (trace(l.board, path, l.rules)) return path;
  }
}
const pool = campaign
  .filter(
    (l) => l.par >= 14 && new Set(l.board.flat()).size >= 5 && l.rules?.mechanics.length === 2,
  )
  .flatMap((l) => {
    const other = alternate(l);
    return other ? [{ level: l, other }] : [];
  });
const seen = new Set(campaign.map((l) => key(l.board)));
const legacy = JSON.parse(readFileSync('src/data/collectionPuzzles.json', 'utf8')) as Record<
  string,
  Record<string, Level[]>
>;
for (const bank of [legacy, data])
  for (const garden of Object.values(bank))
    for (const pages of Object.values(garden)) for (const p of pages) seen.add(key(p.board));
let count = Object.values(data).reduce(
  (sum, g) => sum + Object.values(g).reduce((n, p) => n + p.length, 0),
  0,
);
const floors = [14, 15, 16, 16, 18];
for (const garden of collections) {
  data[garden.id] ??= {};
  for (const species of garden.species) {
    if (data[garden.id][species.id]?.length === 5) continue;
    const pages: Challenge[] = [];
    for (let page = 0; page < 5; page++) {
      const choices = pool.filter(
        (x) => x.level.par >= floors[page] && x.level.par <= floors[page] + 1,
      );
      let accepted = false;
      for (let attempt = 0; attempt < 2000 && !accepted; attempt++) {
        const selected = choices[rnd(choices.length)];
        const remix = {
          level: selected.level.id,
          colors: shuffle(new Set(selected.level.board.flat()).size),
          order: shuffle(selected.level.board.length),
        };
        const main = permutedLevel(selected.level, remix);
        const other = permutedLevel(
          { ...selected.level, solution: selected.other },
          remix,
        ).solution;
        if (seen.has(key(main.board))) continue;
        let rules = structuredClone(main.rules!);
        // A third real restriction if both shortest paths support it; mystery is a visual
        // alternative. Added filters/collectors can only REMOVE moves, so the source's
        // certified minimum remains a lower bound; both retained witnesses attain it.
        if (!rules.mechanics.includes('filter')) {
          const a = trace(main.board, main.solution, rules)!,
            b = trace(main.board, other, rules)!;
          for (const tube of shuffle(main.board.length)) {
            const incoming = [main.solution, other].flatMap((solution, index) =>
              solution.flatMap((move, step) =>
                move.to === tube ? [(index ? b : a)[step][move.from].at(-1)!] : [],
              ),
            );
            if (!incoming.length || new Set(incoming).size !== 1) continue;
            const candidate: Rules = {
              ...rules,
              mechanics: [...rules.mechanics, 'filter'],
              filters: [...(rules.filters ?? []), { tube, color: incoming[0] }],
            };
            if (
              trace(main.board, main.solution, candidate) &&
              trace(main.board, other, candidate)
            ) {
              rules = candidate;
              break;
            }
          }
        }
        if (rules.mechanics.length < 3 && !rules.mechanics.includes('conservation')) {
          for (const tube of shuffle(main.board.length)) {
            if (
              [...main.solution, ...other].some((m) => m.from === tube) ||
              !main.solution.some((m) => m.to === tube)
            )
              continue;
            const candidate: Rules = {
              ...rules,
              mechanics: [...rules.mechanics, 'conservation'],
              collectors: [...(rules.collectors ?? []), tube],
            };
            if (
              trace(main.board, main.solution, candidate) &&
              trace(main.board, other, candidate)
            ) {
              rules = candidate;
              break;
            }
          }
        }
        if (rules.mechanics.length < 3 && !rules.mechanics.includes('mystery')) {
          const mixed = main.board.flatMap((tube, i) => (new Set(tube).size > 1 ? [i] : []));
          rules = {
            ...rules,
            mechanics: [...rules.mechanics, 'mystery'],
            mystery: mixed.slice(0, 3),
          };
        }
        if (
          rules.mechanics.length !== 3 ||
          !trace(main.board, main.solution, rules) ||
          !trace(main.board, other, rules)
        )
          continue;
        pages.push({
          ...main,
          id: ++count,
          rules,
          difficulty: 'collection experte',
          alternatives: [other],
          source: selected.level.id,
        });
        seen.add(key(main.board));
        accepted = true;
      }
      if (!accepted) throw Error(`Impossible de certifier ${species.id}, page ${page + 1}`);
    }
    data[garden.id][species.id] = pages;
  }
}
writeFileSync(path, JSON.stringify(data));
const minima = Object.values(data).flatMap((g) =>
  Object.values(g).flatMap((pages) => pages.map((p) => p.par)),
);
console.log(
  `${count} défis experts : trois mécanismes, ${Math.min(...minima)} à ${Math.max(...minima)} mouvements minimum, deux solutions minimales certifiées par page. Archives conservées.`,
);
