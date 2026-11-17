import { expect, it } from 'vitest';
import { mechanicDetails, mechanicIds, type Mechanic, type Rules } from '../src/engine/mechanics';
import { initial, loadLevel, restore, activeRules } from '../src/state/model';
import { acknowledgeMechanic, mechanicsToIntroduce } from '../src/state/mechanicLessons';
import { acquireGarden } from '../src/state/economy';
import { gardenPuzzle, startGarden } from '../src/state/gardens';

it('defines a short useful summary and optional detailed explanation for all eight mechanics', () => {
  for (const id of mechanicIds) {
    expect(mechanicDetails[id].summary.length).toBeGreaterThan(30);
    expect(mechanicDetails[id].summary.length).toBeLessThanOrEqual(120);
    expect(mechanicDetails[id].intro.length).toBeGreaterThan(mechanicDetails[id].summary.length);
  }
});
it('discovers only actual unknown mechanics, in their displayed order, without marking unseen cards', () => {
  const fresh = initial();
  const rules: Rules = { mechanics: ['filter', 'locks', 'filter', 'mystery'] };
  expect(mechanicsToIntroduce(fresh)).toEqual([]);
  expect(mechanicsToIntroduce(fresh, rules)).toEqual(['filter', 'locks', 'mystery']);
  const first = acknowledgeMechanic(fresh, 'filter');
  expect(first.seenMechanics).toEqual(['filter']);
  expect(mechanicsToIntroduce(first, rules)).toEqual(['locks', 'mystery']);
  expect(acknowledgeMechanic(first, 'filter')).toBe(first);
  expect(acknowledgeMechanic(first, 'unknown' as Mechanic)).toBe(first);
  expect(fresh.seenMechanics).toBeUndefined();
});
it('shares acknowledged lessons between collections and campaign, including reloads and out-of-order access', () => {
  let save = acquireGarden(
    { ...initial(), seeds: 150 },
    'orchidees-lumiere',
    new Date('2026-11-17'),
  );
  save = startGarden(save, 'orchidees-lumiere', 'aurore');
  const rules = gardenPuzzle('orchidees-lumiere', 'aurore', 0).rules!;
  for (const id of rules.mechanics) save = acknowledgeMechanic(save, id);
  save = restore(JSON.stringify(save));
  expect(mechanicsToIntroduce(save, rules)).toEqual([]);
  const next = loadLevel({ ...save, testSession: { returnSave: save } }, 11);
  expect(next.current).toBe(11);
  expect(mechanicsToIntroduce(next, activeRules(next))).toEqual([]);
  expect(next.gardenSession).toEqual(save.gardenSession);
  expect(next.seeds).toBe(save.seeds);
});
it('keeps a partially acknowledged queue pending after restore, without touching the puzzle or wallet', () => {
  const original = { ...initial(), seeds: 123, nickname: 'Leçon' };
  const next = acknowledgeMechanic(original, 'capacity');
  const { seenMechanics, ...rest } = next;
  expect(rest).toEqual(original);
  expect(seenMechanics).toEqual(['capacity']);
  const reloaded = restore(JSON.stringify(next));
  expect(mechanicsToIntroduce(reloaded, { mechanics: ['capacity', 'links', 'crystal'] })).toEqual([
    'links',
    'crystal',
  ]);
});
it('remembers a lesson encountered in a preview while restoring all real progress unchanged', () => {
  const real = { ...initial(), seeds: 37, nickname: 'Carnet' };
  const trial = loadLevel({ ...real, seeds: 500, testSession: { returnSave: real } }, 1000);
  const next = acknowledgeMechanic(trial, 'locks');
  expect(next.seeds).toBe(500);
  expect(next.testSession!.returnSave.seeds).toBe(37);
  const { seenMechanics, ...unchanged } = next.testSession!.returnSave;
  expect(unchanged).toEqual(real);
  expect(seenMechanics).toEqual(['locks']);
  expect(acknowledgeMechanic(next, 'locks')).toBe(next);
  expect(restore(JSON.stringify(next)).testSession!.returnSave.seenMechanics).toEqual(['locks']);
});
