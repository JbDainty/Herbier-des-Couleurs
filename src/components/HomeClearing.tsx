import React, { memo } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useHomeMagic } from './HomeMagicMotion';

const Fireflies = memo(function Fireflies() {
  return (
    <Svg width={70} height={160} viewBox="0 0 70 160" accessible={false}>
      {[
        { x: 17, y: 22 },
        { x: 49, y: 79 },
        { x: 29, y: 133 },
      ].map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={6} fill="#f9dd88" opacity={0.1} />
          <Circle cx={p.x} cy={p.y} r={3} fill="#f8df98" opacity={0.45} />
          <Circle cx={p.x} cy={p.y} r={1.5} fill="#fff8d5" />
        </G>
      ))}
    </Svg>
  );
});
const Leaves = memo(function Leaves() {
  return (
    <Svg width={70} height={172} viewBox="0 0 70 172" accessible={false}>
      <G stroke="#778d70" fill="#a9bc95" fillOpacity={0.45} strokeWidth={0.7}>
        <Path d="M3 172Q52 110 46 12" fill="none" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <G
            key={i}
            transform={
              'translate(' + (13 + i * 6) + ' ' + (150 - i * 22) + ') rotate(' + (-25 + i * 4) + ')'
            }
          >
            <Path d="M0 0Q-22-5-20-20Q-6-17 0 0M2-3Q25-9 22-23Q7-19 2-3" />
            <Path d="M0 0-15-15M2-3 17-18" fill="none" />
          </G>
        ))}
      </G>
    </Svg>
  );
});

/** One native clock moves three small cached drawings; the background and SVG paths stay static. */
export function HomeClearing({ width, height }: { width: number; height: number }) {
  const { clock, running } = useHomeMagic();
  return (
    <View
      testID={running ? 'home-garden-animating' : 'home-garden-still'}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#e1e5d9' }]}
    >
      <Image
        testID="home-garden-background"
        source={require('../../assets/home/clearing.jpg')}
        resizeMode="cover"
        resizeMethod="resize"
        fadeDuration={0}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      />
      {running && (
        <>
          {[false, true].map((right) => (
            <Animated.View
              key={String(right)}
              testID={right ? 'home-clearing-fireflies-right' : 'home-clearing-fireflies'}
              renderToHardwareTextureAndroid
              shouldRasterizeIOS
              style={{
                position: 'absolute',
                left: right ? undefined : Math.min(20, width * 0.03),
                right: right ? 5 : undefined,
                top: height * (right ? 0.08 : 0.04),
                width: 70,
                height: 160,
                opacity: clock.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: right ? [0.2, 0.7, 0.4, 0.8, 0.2] : [0.65, 0.3, 0.8, 0.4, 0.65],
                }),
                transform: [
                  {
                    translateY: clock.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: right ? [8, -14, 8] : [0, -24, 0],
                    }),
                  },
                  {
                    translateX: clock.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: right ? [0, -7, 0] : [0, 8, 0],
                    }),
                  },
                ],
              }}
            >
              <Fireflies />
            </Animated.View>
          ))}
          <Animated.View
            testID="home-garden-fern"
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={{
              position: 'absolute',
              left: -12,
              bottom: height * 0.06,
              width: 70,
              height: 172,
              opacity: 0.55,
              transformOrigin: 'bottom left',
              transform: [
                {
                  rotate: clock.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['-1.5deg', '1.5deg', '-1.5deg'],
                  }),
                },
              ],
            }}
          >
            <Leaves />
          </Animated.View>
        </>
      )}
    </View>
  );
}
