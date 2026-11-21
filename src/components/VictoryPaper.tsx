import React, { useEffect } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { Paper } from './Paper';
import { CollectionPaperCorners } from './CollectionPaperCorners';
import { playLeafWind } from '../services/leafWind';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';

/** Quiet ivory paper: four static gold flourishes replace the full-height growing vines. */
export function VictoryPaper({
  children,
  motion,
  sound,
  frame,
  style,
}: {
  children: React.ReactNode;
  motion: boolean;
  sound: boolean;
  frame?: { width: number; height: number };
  style?: ViewStyle;
}) {
  usePrimaryAnimation(true);
  const { value, settled } = useNativeProgress(600, motion);
  useEffect(() => playLeafWind(sound), [sound]);
  return (
    <Paper
      testID="victory-living-paper"
      frame={false}
      textureOpacity={0.4}
      style={[
        {
          width: frame?.width ?? '100%',
          height: frame?.height,
          alignItems: 'center',
          backgroundColor: '#fbefd8',
          borderRadius: 20,
          borderWidth: 0.8,
          borderColor: '#c7ad7a',
        },
        style,
      ]}
    >
      <Animated.View
        testID={settled ? 'victory-paper-settled' : 'victory-paper-entering'}
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, { opacity: motion ? value : 1 }]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { margin: 5, borderWidth: 0.5, borderColor: '#dfcda7', borderRadius: 15 },
          ]}
        />
        <CollectionPaperCorners />
      </Animated.View>
      {children}
    </Paper>
  );
}
