import React from 'react';
import { FoliageFrame } from './FoliageFrame';
import { Image, StyleSheet, View, type ViewProps } from 'react-native';

/** Non-interactive paper overlay: it never consumes a game gesture. */
export function PaperTexture({
  background = false,
  framed = false,
  vitality,
  compactFrame = false,
  textureOpacity,
}: {
  background?: boolean;
  framed?: boolean;
  vitality?: number;
  compactFrame?: boolean;
  textureOpacity?: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: -1 }]}
    >
      <Image
        source={require('../../assets/illustrations/papier.png')}
        fadeDuration={0}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFill,
          { width: '100%', height: '100%', opacity: textureOpacity ?? (background ? 0.5 : 0.68) },
        ]}
      />
      {framed && <FoliageFrame vitality={vitality} compact={compactFrame} />}
    </View>
  );
}
export function Paper({
  children,
  style,
  vitality,
  frame = true,
  compactFrame = false,
  textureOpacity,
  ...props
}: ViewProps & {
  vitality?: number;
  frame?: boolean;
  compactFrame?: boolean;
  textureOpacity?: number;
}) {
  return (
    <View {...props} style={[{ overflow: 'hidden', zIndex: 0 }, style]}>
      <PaperTexture
        framed={frame}
        vitality={vitality}
        compactFrame={compactFrame}
        textureOpacity={textureOpacity}
      />
      {children}
    </View>
  );
}
