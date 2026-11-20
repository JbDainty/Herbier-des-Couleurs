import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { playVitrailMelody, prepareVitrailMelody } from '../services/vitrailMelody';

/** Celebrate a new solved transition, never a saved victory loaded or revisited. */
export function useVitrailMelody(day: string, level: number, solved: boolean, sound: boolean) {
  const previous = useRef({ day, level, solved });
  const stop = useRef<() => void>(() => {});
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        stop.current();
      };
    }, []),
  );
  useEffect(() => {
    const before = previous.current;
    previous.current = { day, level, solved };
    stop.current();
    if (
      focused.current &&
      before.day === day &&
      before.level === level &&
      !before.solved &&
      solved &&
      sound
    )
      stop.current = playVitrailMelody(level, true);
  }, [day, level, solved, sound]);

  // The browser's audio context is unlocked inside the actual rotation gesture.
  return () => {
    if (sound) prepareVitrailMelody(level);
  };
}
