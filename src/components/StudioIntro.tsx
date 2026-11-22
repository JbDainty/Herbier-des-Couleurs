import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { createStudioPlayback } from '../animation/studioPlayback';
import { unlockAmbience } from '../services/ambience';
import { StudioVideo } from './StudioVideo';
import type { StudioVideoHandle } from './studioVideoTypes';

export function StudioIntro({
  canPlay,
  sound,
  onFinished,
}: {
  canPlay: boolean;
  sound: boolean;
  onFinished: () => void;
}) {
  const insets = useSafeAreaInsets();
  const video = useRef<StudioVideoHandle>(null);
  const done = useRef(onFinished);
  done.current = onFinished;
  const [blocked, setBlocked] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );
  const reveal = useCallback(() => {
    if (Platform.OS !== 'web') void SplashScreen.hideAsync().catch(() => {});
  }, []);
  const playback = useMemo(
    () =>
      createStudioPlayback({
        play: (current) => video.current?.play(current) ?? Promise.reject(Error('Video not ready')),
        pause: () => video.current?.pause(),
        blocked: setBlocked,
        finish: () => {
          reveal();
          done.current();
        },
      }),
    [reveal],
  );
  useEffect(() => {
    const sync = (active: boolean) => {
      playback.setForeground(active);
      video.current?.setForeground(active);
      setForeground(active);
    };
    sync(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const subscription = AppState.addEventListener('change', (state) => sync(state === 'active'));
    return () => {
      subscription.remove();
      playback.dispose();
    };
  }, [playback]);
  useEffect(() => {
    playback.setEnabled(canPlay);
  }, [canPlay, playback]);
  useEffect(() => {
    const fallback = setTimeout(reveal, 2000);
    return () => clearTimeout(fallback);
  }, [reveal]);
  useEffect(() => {
    if (!canPlay || !foreground || blocked) return;
    const deadline = setTimeout(() => playback.finish(), 15000);
    return () => clearTimeout(deadline);
  }, [canPlay, foreground, blocked, playback]);
  return (
    <View testID="studio-launch" style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar hidden />
      <StudioVideo
        ref={video}
        sound={sound}
        onReady={reveal}
        onEnd={playback.finish}
        onError={playback.finish}
      />
      {blocked && (
        <>
          <Image
            testID="studio-poster"
            source={require('../../assets/studio/krabel-poster.jpg')}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            resizeMode="contain"
            accessible={false}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Démarrer le logo du studio avec le son"
            onPress={() => {
              unlockAmbience();
              playback.retry();
            }}
            style={{
              position: 'absolute',
              alignSelf: 'center',
              bottom: Math.max(insets.bottom + 90, 80),
              minHeight: 48,
              padding: 16,
              backgroundColor: '#f4f0e5',
              borderRadius: 24,
            }}
          >
            <Text style={{ color: '#273b31', fontSize: 16 }}>Toucher pour démarrer</Text>
          </Pressable>
        </>
      )}
      <Pressable
        testID="studio-skip"
        accessibilityRole="button"
        accessibilityLabel="Passer le logo du studio"
        onPress={() => {
          if (Platform.OS === 'web') unlockAmbience();
          playback.finish();
        }}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 12,
          right: insets.right + 16,
          minHeight: 44,
          minWidth: 72,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffffdd',
          borderRadius: 22,
        }}
      >
        <Text style={{ color: '#47534a', fontSize: 14 }}>Passer</Text>
      </Pressable>
    </View>
  );
}
