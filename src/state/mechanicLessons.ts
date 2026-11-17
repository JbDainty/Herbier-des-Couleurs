import { mechanicIds, type Mechanic, type Rules } from '../engine/mechanics';
import type { Save } from './model';

/** Discovery follows the mechanisms actually present, never a campaign page number. */
export function mechanicsToIntroduce(save: Save, rules?: Rules): Mechanic[] {
  return [...new Set(rules?.mechanics ?? [])].filter((id) => !save.seenMechanics?.includes(id));
}

/** Acknowledge only the visible lesson, globally, without changing game progress. */
export function acknowledgeMechanic(save: Save, id: Mechanic): Save {
  if (!mechanicIds.includes(id)) return save;
  const learned = save.seenMechanics?.includes(id) ?? false;
  const returned = save.testSession
    ? acknowledgeMechanic(save.testSession.returnSave, id)
    : undefined;
  if (learned && (!save.testSession || returned === save.testSession.returnSave)) return save;
  return {
    ...save,
    seenMechanics: learned ? save.seenMechanics : [...(save.seenMechanics ?? []), id],
    ...(returned ? { testSession: { ...save.testSession, returnSave: returned } } : {}),
  };
}
