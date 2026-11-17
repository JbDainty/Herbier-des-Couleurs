import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { handwrittenLettering } from './PencilNote';

export const emptySeedHint = 'Les indices sont gratuits. Gardez vos graines pour votre collection.';
export const missingPathHint =
  'La recherche n’a pas abouti. Vous pouvez annuler un versement ou recommencer cette page.';
export const blockedPathHint =
  'Cette disposition n’a plus d’issue. Revenez en arrière avec Annuler.';
export const compactHint = (text: string) =>
  text === emptySeedHint
    ? 'Les indices sont gratuits.'
    : text === missingPathHint || text === blockedPathHint
      ? text === blockedPathHint
        ? 'Disposition bloquée. Revenez en arrière avec Annuler.'
        : 'Recherche incomplète. Annulez ou recommencez.'
      : text;
const paragraphs = [
  emptySeedHint,
  missingPathHint,
  blockedPathHint,
  'Versez le flacon 12 dans le flacon 13.',
];

const measurements = new Map<string, number[]>();
export const hintLayoutKey = (width: number, fontScale: number, compact = false) =>
  `${Math.min(580, width)}/${fontScale}/${compact}`;

/** Measure every possible paragraph before a request, including native font scaling.
 * The parchment is an overlay: neither searching nor typing can move the controls. */
export function HintSlot({
  children,
  layoutWidth,
  measureOnly = false,
  onReady,
  compact = false,
  fixedHeight,
}: {
  children?: React.ReactNode;
  layoutWidth: number;
  measureOnly?: boolean;
  onReady?: (key: string, height: number) => void;
  compact?: boolean;
  fixedHeight?: number;
}) {
  const { fontScale } = useWindowDimensions();
  const key = hintLayoutKey(layoutWidth, fontScale, compact);
  const [heights, setHeights] = useState(() => measurements.get(key) ?? paragraphs.map(() => 0));
  const height =
    Math.max((compact ? 22 : 54) * (compact ? Math.min(fontScale, 1.15) : fontScale), ...heights) +
    (compact ? 12 : 24);
  useEffect(() => {
    if (!heights.every((height) => height > 0)) return;
    measurements.set(key, heights);
    onReady?.(key, height);
  }, [heights, key, onReady, height]);
  return (
    <View
      testID={measureOnly ? 'hint-slot-probe' : 'hint-scroll-slot'}
      style={{
        width: '100%',
        maxWidth: 580,
        alignSelf: 'center',
        height: fixedHeight ?? height,
        marginBottom: compact ? 0 : 8,
      }}
    >
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        {paragraphs.map((paragraph, i) => (
          <Text
            key={paragraph}
            accessible={false}
            maxFontSizeMultiplier={compact ? 1.15 : undefined}
            aria-hidden
            style={[
              handwrittenLettering,
              {
                position: 'absolute',
                top: compact ? 6 : 12,
                left: compact ? 14 : 20,
                right: compact ? 34 : 46,
                opacity: 0,
                ...(compact ? { fontSize: 18, lineHeight: 22 } : {}),
              },
            ]}
            onLayout={({ nativeEvent: { layout } }) =>
              setHeights((previous) => {
                if (previous[i] === layout.height) return previous;
                const next = [...previous];
                next[i] = layout.height;
                return next;
              })
            }
          >
            {compact ? compactHint(paragraph) : paragraph}
          </Text>
        ))}
      </View>
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}
