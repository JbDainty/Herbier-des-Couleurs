import React, { memo } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { useHomeMagic } from './HomeMagicMotion';

const BotanicalHalo = memo(function BotanicalHalo({ daily }: { daily: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 180 180" accessible={false}>
      <Ellipse
        cx={90}
        cy={96}
        rx={74}
        ry={66}
        fill={daily ? '#d2dec8' : '#e6d69e'}
        opacity={0.35}
      />
      <Ellipse
        cx={90}
        cy={95}
        rx={64}
        ry={60}
        fill={daily ? '#f3efca' : '#fff6d8'}
        opacity={0.65}
      />
      <Path
        d="M34 127Q9 85 40 42M146 127Q173 83 140 40"
        fill="none"
        stroke="#b9a269"
        strokeWidth={1}
        opacity={0.7}
      />
      {[false, true].map((mirror) => (
        <G
          key={String(mirror)}
          transform={mirror ? 'translate(180 0) scale(-1 1)' : undefined}
          stroke="#7e986b"
          strokeWidth={0.8}
        >
          <Path d="M18 154Q54 121 33 78" fill="none" />
          <Path
            d="M30 143Q10 145 10 129Q25 127 30 143M38 132Q60 133 59 116Q42 117 38 132M40 119Q21 120 20 103Q36 103 40 119M39 105Q56 103 52 88Q39 91 39 105M35 91Q19 86 24 72Q37 78 35 91"
            fill="#a5ba8e"
            fillOpacity={0.63}
          />
          <Path
            d="M30 143 17 135M38 132 52 123M40 119 27 110M39 105 47 95M35 91 28 79"
            fill="none"
            opacity={0.55}
          />
          <Circle cx={18} cy={150} r={3.5} fill="#e9dba2" stroke="#b9a269" />
        </G>
      ))}
    </Svg>
  );
});

const Pollen = memo(function Pollen({ daily }: { daily: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 180 180" accessible={false}>
      {[
        [27, 53],
        [145, 61],
        [67, 22],
        [122, 144],
      ].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={9} fill="#f5dc92" opacity={0.18} />
          <Path
            d={`M${x} ${y - 5}Q${x + 1} ${y - 1} ${x + 5} ${y}Q${x + 1} ${y + 1} ${x} ${y + 5}Q${x - 1} ${y + 1} ${x - 5} ${y}Q${x - 1} ${y - 1} ${x} ${y - 5}Z`}
            fill="#c9a14e"
          />
          <Circle cx={x} cy={y} r={1.2} fill="#fff9d9" />
        </G>
      ))}
      <G fill={daily ? '#b899be' : '#b0ba78'} opacity={0.8}>
        <Path d="M50 63Q34 59 40 46Q52 47 50 63M137 112Q152 100 155 113Q147 123 137 112" />
      </G>
      <G fill="#cbaa57">
        <Circle cx={51} cy={33} r={1.7} />
        <Circle cx={158} cy={89} r={1.5} />
        <Circle cx={105} cy={25} r={1.6} />
        <Circle cx={24} cy={111} r={1.6} />
      </G>
    </Svg>
  );
});

/** Small cached layers only: the watercolor and SVG geometry never change per frame. */
export function HomeCardArt({ size, daily = false }: { size: number; daily?: boolean }) {
  const { clock, running } = useHomeMagic();
  const prefix = daily ? 'home-vitrail' : 'home-restoration';
  const lift = Math.min(7, size * 0.055);
  const drift = Math.min(3, size * 0.025);
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <View style={StyleSheet.absoluteFill}>
        <BotanicalHalo daily={daily} />
      </View>
      <Animated.View
        testID={`${prefix}-illustration`}
        style={[
          StyleSheet.absoluteFill,
          running && {
            transform: [
              {
                translateY: clock.interpolate({
                  inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
                  outputRange: daily
                    ? [0, lift, 0, -lift, 0, lift, 0, -lift, 0]
                    : [0, -lift, 0, lift, 0, -lift, 0, lift, 0],
                }),
              },
              {
                translateX: clock.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [-drift, drift, -drift, drift, -drift],
                }),
              },
              {
                rotate: clock.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: daily
                    ? ['-4deg', '4deg', '-4deg', '4deg', '-4deg']
                    : ['-3deg', '3deg', '-3deg', '3deg', '-3deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          testID={daily ? 'home-vitrail-art' : 'home-restoration-art'}
          source={
            daily
              ? require('../../assets/home/rosette.png')
              : require('../../assets/home/herbarium.png')
          }
          accessible={false}
          fadeDuration={0}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      </Animated.View>
      {running && (
        <Animated.View
          testID={`${prefix}-enchantment`}
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: clock.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: daily ? [0.85, 0.35, 1, 0.45, 0.85] : [0.5, 1, 0.35, 0.9, 0.5],
              }),
              transform: [
                {
                  translateY: clock.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: daily ? [5, -15, 5, -15, 5] : [0, -20, 0, -20, 0],
                  }),
                },
                {
                  translateX: clock.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [-5, 6, -5, 6, -5],
                  }),
                },
                {
                  rotate: clock.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: ['-8deg', '8deg', '-8deg', '8deg', '-8deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Pollen daily={daily} />
        </Animated.View>
      )}
    </View>
  );
}
