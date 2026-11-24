import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { species } from '../data/botany';
import { Botanical } from './Botanical';
import { F } from './fonts';
import { Paper } from './Paper';
import { StarFlower } from './RewardStars';
import { VictoryAction } from './VictoryAction';
import { C, Icon, T } from './ui';

export function JourneyPageBook({
  page,
  stage,
  stars,
  action,
  onPlay,
  onClose,
}: {
  page: number;
  stage: number;
  stars: number;
  action: string;
  onPlay: () => void;
  onClose: () => void;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const spreadWidth = Math.min(430, width - insets.left - insets.right - 26) - 18;
  const compact = height - insets.top - insets.bottom < 420;
  const index = Math.floor((page - 1) / 5);
  const plant = species[index];
  const artSize = Math.min(compact ? 92 : 154, spreadWidth * 0.48 - 20);
  const longestWord = Math.max(...plant.name.split(/[\s-]+/).map((word) => word.length));
  const titleSize = Math.min(
    compact ? 24 : 32,
    Math.floor((spreadWidth * 0.52 - 20) / (longestWord * 0.6 * Math.min(1.25, fontScale))),
  );
  return (
    <View testID="journey-page-dialog" accessibilityViewIsModal style={styles.cover}>
      <Paper
        frame={false}
        textureOpacity={0.52}
        style={[styles.spread, { minHeight: compact ? 138 : 252 }]}
      >
        <View style={styles.illustratedPage}>
          <View pointerEvents="none" style={styles.plateBorder} />
          <Botanical index={index} stage={stage} size={artSize} labels={false} />
          <Svg
            width={22}
            height={compact ? 24 : 38}
            viewBox="0 0 22 38"
            preserveAspectRatio="none"
            accessible={false}
            pointerEvents="none"
            style={styles.bookmark}
          >
            <Path d="M1 0H21V37L11 30L1 37Z" fill="#405e48" stroke="#a89969" />
            <Path d="M4 0V32M18 0V32" stroke="#bca97c" strokeWidth="0.6" />
          </Svg>
        </View>
        <View
          style={[
            styles.description,
            {
              paddingTop: compact ? 30 : 40,
              paddingBottom: compact ? 8 : 22,
              gap: compact ? 3 : 7,
            },
          ]}
        >
          <T maxFontSizeMultiplier={1.25} style={styles.folio}>
            Page {page}
          </T>
          <T
            testID="journey-dialog-title"
            accessibilityRole="header"
            maxFontSizeMultiplier={1.25}
            style={[styles.name, { fontSize: titleSize, lineHeight: Math.ceil(titleSize * 1.25) }]}
          >
            {plant.name}
          </T>
          <T
            testID="journey-dialog-latin"
            maxFontSizeMultiplier={1.25}
            style={[styles.latin, { fontSize: compact || spreadWidth < 320 ? 14 : 16 }]}
          >
            {plant.latin}
          </T>
          <View
            testID="journey-dialog-stars"
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${stars} ${stars > 1 ? 'étoiles' : 'étoile'} sur 3`}
            style={styles.stars}
          >
            {[1, 2, 3].map((n) => (
              <StarFlower key={n} filled={n <= stars} size={compact ? 20 : 24} />
            ))}
          </View>
        </View>
        <View accessible={false} pointerEvents="none" style={styles.binding}>
          <Svg
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            viewBox="0 0 18 100"
            accessible={false}
          >
            <Defs>
              <LinearGradient id="journey-spine" x1="0" x2="1" y1="0" y2="0">
                <Stop stopColor="#9b8456" stopOpacity="0" />
                <Stop offset="0.46" stopColor="#8b774f" stopOpacity="0.45" />
                <Stop offset="0.55" stopColor="#f9ebca" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#faf1db" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect width="18" height="100" fill="url(#journey-spine)" />
          </Svg>
        </View>
      </Paper>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer la fiche"
        onPress={onClose}
        style={({ pressed }) => [styles.close, { opacity: pressed ? 0.65 : 1 }]}
      >
        <Icon name="close-outline" size={21} color={C.green} />
      </Pressable>
      <View style={styles.action}>
        <VictoryAction compact maxFontSizeMultiplier={1.25} onPress={onPlay}>
          {action}
        </VictoryAction>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    padding: 8,
    backgroundColor: '#39533f',
    borderColor: '#94845c',
    borderWidth: 1,
    borderRadius: 12,
    boxShadow: '0 6px 17px #172d1e59',
  },
  spread: {
    flexDirection: 'row',
    backgroundColor: '#f5ead3',
    borderColor: '#c6b78a',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderRadius: 6,
  },
  illustratedPage: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
    paddingBottom: 7,
  },
  plateBorder: {
    position: 'absolute',
    top: 14,
    left: 9,
    right: 10,
    bottom: 10,
    borderRadius: 2,
    borderColor: '#bead8780',
    borderWidth: 0.7,
  },
  bookmark: { position: 'absolute', top: 0, left: 17 },
  binding: { position: 'absolute', left: '48%', top: 0, bottom: 0, width: 18, marginLeft: -9 },
  description: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folio: { fontFamily: F.scientific, fontSize: 16, lineHeight: 20, color: '#625c42' },
  name: { width: '100%', fontFamily: F.displayBold, textAlign: 'center', color: '#254631' },
  latin: {
    width: '100%',
    fontFamily: F.scientific,
    lineHeight: 20,
    textAlign: 'center',
    color: '#615f47',
  },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  close: {
    position: 'absolute',
    top: 4,
    right: 5,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: { width: '84%', alignSelf: 'center', alignItems: 'center', marginTop: 5 },
});
