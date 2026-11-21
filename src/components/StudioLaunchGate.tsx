import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useGame } from '../state/store';
import { StudioIntro } from './StudioIntro';

/** Per-process launch state: navigation and foregrounding never replay the studio clip. */
export function StudioLaunchGate({
  fontsReady,
  children,
}: {
  fontsReady: boolean;
  children: React.ReactNode;
}) {
  const { save, ready, error } = useGame();
  const [finished, setFinished] = useState(false);
  if (!finished)
    return (
      <StudioIntro
        canPlay={ready || !!error}
        sound={save.settings.sound}
        onFinished={() => setFinished(true)}
      />
    );
  if (!fontsReady)
    return (
      <View
        testID="brand-launch-loading"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f4f0e5',
        }}
      >
        <Image
          source={require('../../assets/branding/splash-mark.png')}
          style={{ width: 240, height: 240 }}
          resizeMode="contain"
          accessible={false}
        />
      </View>
    );
  return <>{children}</>;
}
