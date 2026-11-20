import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { vitrailDayKey } from '../data/vitrails';

/** Recheck at midnight and on foreground; no connection or app restart is required. */
export function useVitrailDate(enabled = true) {
  const [day, setDay] = useState(vitrailDayKey);
  useEffect(() => {
    if (!enabled) return;
    const update = () => setDay(vitrailDayKey());
    update();
    const timer = setInterval(update, 1000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [enabled]);
  return day;
}
