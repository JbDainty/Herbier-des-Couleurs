import React, { memo } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Path } from 'react-native-svg';
import { T } from './ui';
import { F } from './fonts';
import { SvgBackdrop } from './SvgBackdrop';
import { useMeasuredSize } from './useMeasuredSize';
import { useNativeProgress } from './useNativeProgress';

const lifetime = 5800;
const fireflies = [
  { x: 0.025, y: 0.62, phase: 0.03 },
  { x: 0.12, y: 0.15, phase: 0.09 },
  { x: 0.81, y: 0.1, phase: 0.01 },
  { x: 0.91, y: 0.22, phase: 0.06 },
  { x: 0.96, y: 0.46, phase: 0.12 },
  { x: 0.87, y: 0.84, phase: 0.16 },
];

const GoldArc = memo(function GoldArc({ lower }: { lower: boolean }) {
  return (
    <SvgBackdrop viewBox="0 0 420 100">
      <Path
        d={
          lower
            ? 'M28 55 C29 81 98 85 197 84 M223 84 C300 88 383 79 391 54'
            : 'M28 55 C29 28 97 17 197 19 M223 19 C305 16 384 29 391 54'
        }
        fill="none"
        stroke="#b79243"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <Path
        d={lower ? 'M43 72 Q80 85 145 83' : 'M268 19 Q337 19 366 33'}
        fill="none"
        stroke="#f6e1a0"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </SvgBackdrop>
  );
});

/** Two opposing native clips reveal immutable arcs without redrawing SVG every frame. */
function TracedArc({
  lower = false,
  width,
  progress,
  motion,
}: {
  lower?: boolean;
  width: number;
  progress: Animated.Value;
  motion: boolean;
}) {
  const offset = width * (lower ? 1 : -1);
  const range = lower ? [0.035, 0.17] : [0, 0.13];
  const slide = (from: number) =>
    progress.interpolate({ inputRange: range, outputRange: [from, 0], extrapolate: 'clamp' });
  return (
    <Animated.View
      testID={lower ? 'mistake-seal-lower-trace' : 'mistake-seal-upper-trace'}
      style={[
        StyleSheet.absoluteFill,
        { overflow: 'hidden', transform: motion ? [{ translateX: slide(offset) }] : [] },
      ]}
    >
      <Animated.View
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={[
          StyleSheet.absoluteFill,
          { transform: motion ? [{ translateX: slide(-offset) }] : [] },
        ]}
      >
        <GoldArc lower={lower} />
      </Animated.View>
    </Animated.View>
  );
}

/** A watercolor botanical seal: live readable type, drawn gold and six quiet fireflies. */
export function MistakeSeal({
  text,
  motion,
  onDismiss,
}: {
  text: string;
  motion: boolean;
  onDismiss: () => void;
}) {
  const measured = useMeasuredSize();
  const width = measured.size.width;
  const { value: progress } = useNativeProgress(lifetime, motion, onDismiss, lifetime);
  const part = (inputRange: number[], outputRange: number[]) =>
    progress.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
  return (
    <View
      testID="mistake-seal-note"
      pointerEvents="none"
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={text.replace(/\s+/g, ' ')}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4 }}
    >
      <Animated.View
        ref={measured.ref}
        collapsable={false}
        onLayout={measured.onLayout}
        testID={motion ? 'mistake-seal-animated' : 'mistake-seal-still'}
        style={{
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
          minHeight: 100,
          paddingHorizontal: width > 340 ? 52 : 40,
          paddingVertical: 26,
          justifyContent: 'center',
          opacity: motion ? part([0, 0.05, 0.88, 1], [0, 1, 1, 0]) : 1,
        }}
      >
        <View
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          <Image
            source={require('../../assets/feedback/enchanted-seal.webp')}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            resizeMode="stretch"
            accessible={false}
          />
          {width > 0 && (
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
              <TracedArc width={width} progress={progress} motion={motion} />
              <TracedArc lower width={width} progress={progress} motion={motion} />
            </View>
          )}
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: motion ? part([0.07, 0.18], [0, 1]) : 1 }]}
          >
            <SvgBackdrop viewBox="0 0 420 100">
              {[19, 84].map((y) => (
                <Path
                  key={y}
                  transform={`translate(210 ${y})`}
                  d="M0-6 Q4-3 0 0 Q-4-3 0-6 M6 0 Q3 4 0 0 Q3-4 6 0 M0 6 Q-4 3 0 0 Q4 3 0 6 M-6 0 Q-3-4 0 0 Q-3 4-6 0"
                  fill="#c3a052"
                  stroke="#a37f37"
                  strokeWidth="0.35"
                />
              ))}
            </SvgBackdrop>
          </Animated.View>
          {motion &&
            fireflies.map(({ x, y, phase }, i) => (
              <Animated.View
                key={i}
                testID="mistake-seal-firefly"
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  width: 12,
                  height: 12,
                  margin: -6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  backgroundColor: '#edc87533',
                  opacity: part(
                    [phase, phase + 0.06, phase + 0.16, phase + 0.3, phase + 0.42, 0.83, 0.94],
                    [0, 0.95, 0.25, 0.85, 0.35, 0.7, 0],
                  ),
                  transform: [
                    { translateY: part([phase, 0.55, 0.95], [3, -3 - i, -9]) },
                    { translateX: part([phase, 0.55, 0.95], [0, i % 2 ? 3 : -3, 0]) },
                  ],
                }}
              >
                <View
                  style={{
                    width: i % 2 ? 3 : 2,
                    height: i % 2 ? 3 : 2,
                    borderRadius: 2,
                    backgroundColor: '#fff1ba',
                    borderWidth: 0.5,
                    borderColor: '#d6ad58',
                  }}
                />
              </Animated.View>
            ))}
        </View>
        <T
          testID="mistake-seal-text"
          accessible={false}
          maxFontSizeMultiplier={1.2}
          style={{
            fontFamily: F.scientific,
            fontSize: width > 340 ? 21 : 18,
            lineHeight: width > 340 ? 25 : 23,
            textAlign: 'center',
            color: '#29452f',
          }}
        >
          {text}
        </T>
      </Animated.View>
    </View>
  );
}
