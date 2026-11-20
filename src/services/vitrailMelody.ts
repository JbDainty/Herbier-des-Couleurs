import { createBotanicalCue } from './botanicalAudio';

// Reuse the game's bundled acoustic instruments, with a quieter mix for the daily puzzles.
const single = createBotanicalCue(require('../../assets/reveal-celebration.wav'), 0.14, 0.55);
const trio = createBotanicalCue(require('../../assets/plant-celebration.wav'), 0.14, 0.55);
const melody = (level: number) => (level === 2 ? trio : single);

export const prepareVitrailMelody = (level: number) => melody(level).prepare();
export const playVitrailMelody = (level: number, enabled: boolean) => melody(level).play(enabled);
