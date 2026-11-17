import { expect, it } from 'vitest';
import levels from '../src/data/campaign';
import {
  currentHint,
  initial,
  loadLevel,
  move,
  normalizeNickname,
  purchaseHint,
  resetProgress,
  restore,
  reward,
  undo,
} from '../src/state/model';
import { firstPageAttempt } from '../scripts/test-fixtures';

it('starts empty and awards a seed only for the first three stars of a main-campaign page', () => {
  expect(initial().seeds).toBe(0);
  for (const [extra, earned] of [
    [0, 1],
    [1, 1],
    [2, 0],
    [3, 0],
  ]) {
    const { save, last } = firstPageAttempt(extra);
    const won = move(save, last.from, last.to);
    expect(won.seeds).toBe(save.seeds + earned);
    expect(reward(won)).toBe(won);
    expect(reward(restore(JSON.stringify(won))).seeds).toBe(won.seeds);
  }
});
it('a real replay never awards another seed, retaining best stars and unique pigments', () => {
  let save = initial();
  for (const m of levels[0].solution) save = move(save, m.from, m.to);
  const best = save.completed,
    pigments = save.pigments;
  save = loadLevel(save, 1);
  for (const m of levels[0].solution) save = move(save, m.from, m.to);
  expect(save.seeds).toBe(1);
  expect(save.lastSeedReward).toBe(0);
  expect(save.completed).toEqual(best);
  expect(save.pigments).toEqual(pigments);
});
it('awards only the missing first-three-star seed when improving a completed campaign page', () => {
  const attempt = firstPageAttempt(2);
  let save = move(attempt.save, attempt.last.from, attempt.last.to);
  expect(save.completed[1].stars).toBe(2);
  expect(save.seeds).toBe(0);
  const date = save.completed[1].date;
  const pigments = save.pigments;
  for (let replay = 0; replay < 3; replay++) {
    save = loadLevel(restore(JSON.stringify(save)), 1);
    for (const step of levels[0].solution) save = move(save, step.from, step.to);
    expect(save.lastSeedReward).toBe(replay === 0 ? 1 : 0);
    expect(save.seeds).toBe(1);
    expect(save.completed[1]).toEqual({ stars: 3, date });
    expect(save.pigments).toEqual(pigments);
  }
});
it('remembers free hints across repeated taps, reload, undo and restart', () => {
  const first = initial(),
    suggestion = levels[0].solution[0];
  const paid = purchaseHint(first, suggestion);
  expect(paid.seeds).toBe(0);
  expect(purchaseHint(paid, suggestion)).toBe(paid);
  const resumed = restore(JSON.stringify(paid));
  expect(currentHint(resumed)).toEqual(suggestion);
  expect(purchaseHint(loadLevel(resumed, 1), suggestion).seeds).toBe(0);
  const moved = move(resumed, suggestion.from, suggestion.to);
  expect(currentHint(moved)).toBeUndefined();
  expect(currentHint(undo(moved))).toEqual(suggestion);
  const another = purchaseHint(moved, levels[0].solution[1]);
  expect(another.seeds).toBe(moved.seeds);
  expect(currentHint(another)).toEqual(levels[0].solution[1]);
  expect(paid.board).toEqual(first.board);
});
it('different real hints preserve the collection wallet; invalid suggestions do nothing', () => {
  let save = { ...initial(), seeds: 2 };
  expect(purchaseHint(save, { from: 0, to: 0 })).toBe(save);
  save = purchaseHint(save, levels[0].solution[0]);
  save = move(save, levels[0].solution[0].from, levels[0].solution[0].to);
  save = purchaseHint(save, levels[0].solution[1]);
  expect(save.seeds).toBe(2);
  expect(Object.keys(save.paidHints)).toHaveLength(2);
  expect(restore(JSON.stringify(save))).toEqual(save);
});
it('keeps legacy balances and progress, without re-awarding an already won page', () => {
  let save = initial();
  for (const m of levels[0].solution) save = move(save, m.from, m.to);
  const { nickname, attemptRewarded, paidHints, ...legacy } = save;
  const migrated = restore(JSON.stringify({ ...legacy, seeds: 85 }));
  expect(migrated.seeds).toBe(85);
  expect(migrated.pigments).toEqual(save.pigments);
  expect(migrated.nickname).toBe('');
  expect(reward(migrated)).toBe(migrated);
});
it('normalizes a personal signature and reset clears it and paid hints while keeping preferences', () => {
  expect(normalizeNickname('  Élise\n des   bois  ')).toBe('Élise des bois');
  const save = {
    ...purchaseHint(initial(), levels[0].solution[0]),
    nickname: 'Élise',
    started: true,
  };
  const fresh = resetProgress(save);
  expect(fresh.nickname).toBe('');
  expect(fresh.started).toBe(false);
  expect(fresh.seeds).toBe(0);
  expect(fresh.paidHints).toEqual({});
  expect(fresh.settings).toEqual(save.settings);
});
