import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform } from 'react-native';
import { useAmbientMotion } from './usePrimaryAnimation';

const HomeMagicContext = createContext<{ clock: Animated.Value; running: boolean } | null>(null);

/** The clearing and both cards share one native clock, suspended with the menu. */
export function HomeMagicMotion({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const available = useAmbientMotion(enabled);
  const clock = useRef(new Animated.Value(0)).current;
  const [running, setRunning] = useState(false);
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    const sync = (active: boolean) => {
      animation?.stop();
      clock.setValue(0);
      setRunning(available && active);
      if (!available || !active) return;
      animation = Animated.loop(
        Animated.timing(clock, {
          toValue: 1,
          duration: 22000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      );
      animation.start();
    };
    sync(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const subscription = AppState.addEventListener('change', (state) => sync(state === 'active'));
    return () => {
      subscription.remove();
      animation?.stop();
      clock.stopAnimation();
    };
  }, [available, clock]);
  const value = useMemo(() => ({ clock, running }), [clock, running]);
  return <HomeMagicContext.Provider value={value}>{children}</HomeMagicContext.Provider>;
}

export function useHomeMagic() {
  const value = useContext(HomeMagicContext);
  if (!value) throw new Error('Home artwork needs HomeMagicMotion');
  return value;
}
