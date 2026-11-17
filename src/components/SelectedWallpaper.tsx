import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useGame } from '../state/store';
import { wallpaperArtwork } from '../data/wallpaperArtwork';
export function SelectedWallpaper() {
  const { save } = useGame();
  const source = wallpaperArtwork(save.wallpaper);
  if (!source) return null;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      style={StyleSheet.absoluteFill}
    >
      <Image
        testID="selected-wallpaper"
        source={source}
        resizeMode="cover"
        resizeMethod="resize"
        fadeDuration={0}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f6efd3', opacity: 0.62 }]} />
    </View>
  );
}
