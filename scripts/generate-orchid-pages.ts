import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { collections } from '../src/data/collections';
import campaign, { type Level } from '../src/data/campaign';
import { key, pour, won, type Board, type Move } from '../src/engine/puzzle';
import { solveOptimal, OptimalSearchLimit } from '../src/engine/optimal';

// Append-only snapshots: rebuilding the campaign must not alter a purchased garden.
const path = 'src/data/collectionPuzzles.json';
const data: Record<string, Record<string, Level[]>> = existsSync(path)
  ? JSON.parse(readFileSync(path, 'utf8'))
  : {};
const seen = new Set(campaign.map((p) => key(p.board)));
let count = 0;
for (const garden of Object.values(data))
  for (const pages of Object.values(garden))
    for (const page of pages) {
      seen.add(key(page.board));
      count++;
    }
let seed = 0x6f726368;
const random = (n: number) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % n;
};
for (const garden of collections) {
  data[garden.id] ??= {};
  for (const [speciesIndex, species] of garden.species.entries()) {
    if (data[garden.id][species.id]?.length === 5) continue;
    const pages: Level[] = [];
    for (let page = 0; page < 5; page++) {
      const colors = (speciesIndex < 3 ? 3 : 4) + (page >= 2 ? 1 : 0);
      let accepted = false;
      for (let attempt = 0; attempt < 1000 && !accepted; attempt++) {
        const board: Board = [...Array.from({ length: colors }, (_, c) => [c, c, c, c]), [], []];
        const reverse: Move[] = [];
        for (let step = 0; step < 20 + speciesIndex * 3 + page * 5; step++) {
          const options: { from: number; to: number; units: number }[] = [];
          for (let from = 0; from < board.length; from++)
            for (let to = 0; to < board.length; to++) {
              if (
                from === to ||
                !board[from].length ||
                board[to].length === 4 ||
                board[from].at(-1) === board[to].at(-1)
              )
                continue;
              const color = board[from].at(-1)!;
              for (
                let units = 1;
                units <= Math.min(board[from].length, 4 - board[to].length);
                units++
              ) {
                const rest = board[from].slice(0, -units);
                if (
                  board[from].slice(-units).every((c) => c === color) &&
                  (!rest.length || rest.at(-1) === color)
                )
                  options.push({ from, to, units });
              }
            }
          if (!options.length) break;
          const { from, to, units } = options[random(options.length)];
          board[to].push(...board[from].splice(-units));
          reverse.unshift({ from: to, to: from });
        }
        if (seen.has(key(board)) || board.every((tube) => tube.every((c) => c === tube[0])))
          continue;
        let verified = board;
        for (const move of reverse) {
          const after = pour(verified, move.from, move.to);
          if (!after) throw Error('Certificat inversé invalide.');
          verified = after;
        }
        if (!won(verified)) throw Error('Certificat incomplet.');
        try {
          const exact = solveOptimal(board, { maxMoves: reverse.length, maxNodes: 400000 });
          if (!exact || exact.minimum < 4 + page + Math.floor(speciesIndex / 2)) continue;
          pages.push({ id: ++count, board, solution: exact.solution, par: exact.minimum });
          seen.add(key(board));
          accepted = true;
        } catch (e) {
          if (!(e instanceof OptimalSearchLimit)) throw e;
        }
      }
      if (!accepted) throw Error(`Aucun puzzle certifié pour ${species.id}, page ${page + 1}.`);
    }
    data[garden.id][species.id] = pages;
  }
}
writeFileSync(path, JSON.stringify(data));
console.log(`${count} pages de jardins conservées et certifiées ; campagne inchangée.`);
