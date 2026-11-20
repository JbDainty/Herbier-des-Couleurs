import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { HomeScreen } from './HomeScreen';

/** Retain the visited menu's native views; inactive routes cannot paint or receive input. */
export function HomeRouteCache({ active }: { active: boolean }) {
  const [visited, setVisited] = useState(active);
  useLayoutEffect(() => {
    if (active) setVisited(true);
  }, [active]);
  return (
    <View
      testID="home-route-cache"
      pointerEvents={active ? 'auto' : 'none'}
      aria-hidden={!active}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      style={{ flex: 1, display: active ? 'flex' : 'none' }}
    >
      {visited && <HomeScreen active={active} />}
    </View>
  );
}
