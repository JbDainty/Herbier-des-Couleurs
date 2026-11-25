import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Animated, AppState, Easing, Image, Platform, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { T } from './ui';
import { F } from './fonts';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation, useAmbientMotion } from './usePrimaryAnimation';

/** Original engraved silhouettes: locked paintings remain a discovery. */
export function GoldenPlantSilhouette({
  species,
  width = 240,
  height = 260,
}: {
  species: string;
  width?: number;
  height?: number;
}) {
  const petals =
    species === 'constellations' ? 9 : species === 'eclipse' ? 12 : species === 'cristal' ? 6 : 5;
  return (
    <Svg width={width} height={height} viewBox="0 0 240 280" accessible={false}>
      <Rect width="240" height="280" rx="14" fill="#dfc17e" />
      <Rect
        x="9"
        y="9"
        width="222"
        height="262"
        rx="10"
        fill="none"
        stroke="#ad823a"
        strokeWidth="0.8"
      />
      <Ellipse cx="120" cy="129" rx="83" ry="94" fill="#efdb9d" fillOpacity="0.6" />
      <G fill="#6c522b" stroke="#503d24" strokeWidth="1">
        <Path d="M119 246Q136 170 119 124L124 123Q141 184 123 246Z M124 217Q66 223 57 185Q105 180 124 217Z M132 194Q177 191 186 156Q140 155 132 194Z" />
        {Array.from({ length: petals }, (_, i) => (
          <Path
            key={i}
            transform={`rotate(${(i * 360) / petals} 120 113)`}
            d={
              species === 'cristal'
                ? 'M120 113Q83 78 120 35Q147 82 120 113Z'
                : species === 'phenix'
                  ? 'M120 113Q67 109 68 61Q123 55 120 113Z'
                  : 'M120 113Q82 68 120 46Q151 78 120 113Z'
            }
          />
        ))}
        {species === 'temps' &&
          Array.from({ length: 20 }, (_, i) => (
            <Path
              key={i}
              transform={`rotate(${i * 18} 120 113)`}
              d="M120 110Q96 82 120 57"
              fill="none"
              strokeWidth="1.8"
            />
          ))}
        <Circle cx="120" cy="113" r={species === 'eclipse' ? 22 : 13} fill="#b18a46" />
      </G>
      <Path
        d="M31 33 34 40 41 43 34 46 31 53 28 46 21 43 28 40Z M202 225 204 230 210 232 204 234 202 240 200 234 194 232 200 230Z"
        fill="#fff0c4"
      />
    </Svg>
  );
}

export function GoldenHerbarium({
  width,
  height,
  motion,
  acquired,
  onPress,
}: {
  width: number;
  height: number;
  motion: boolean;
  acquired: number;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const active = useAmbientMotion(motion && focused);
  const clock = useRef(new Animated.Value(0)).current;
  const id = 'gold-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    const sync = (foreground: boolean) => {
      animation?.stop();
      clock.setValue(0);
      if (!active || !foreground) return;
      animation = Animated.loop(
        Animated.timing(clock, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      );
      animation.start();
    };
    sync(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const subscription = AppState.addEventListener('change', (state) => sync(state === 'active'));
    return () => {
      subscription.remove();
      animation?.stop();
      clock.stopAnimation();
    };
  }, [active, clock]);
  const wide = width > height * 1.4;
  const titleSize = Math.min(
    44,
    Math.max(20, height * (wide ? 0.15 : 0.072)),
    width * (wide ? 0.08 : 0.1),
  );
  return (
    <Pressable
      testID="golden-herbarium-book"
      accessibilityRole="button"
      accessibilityLabel="Ouvrir l’Herbier des Merveilles"
      accessibilityHint={`Grand herbier doré, ${acquired} espèces sur 5 acquises. Chaque espèce coûte 200 graines.`}
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        height,
        opacity: pressed ? 0.88 : 1,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#a17c35',
      })}
    >
      <Svg width={width} height={height} accessible={false}>
        <Defs>
          <LinearGradient id={id} x1="0" x2="1" y1="0" y2="0.8">
            <Stop offset="0" stopColor="#b18b3d" />
            <Stop offset="0.28" stopColor="#f1d88c" />
            <Stop offset="0.62" stopColor="#d0aa50" />
            <Stop offset="1" stopColor="#98702b" />
          </LinearGradient>
        </Defs>
        <Rect x="6" y="9" width={width - 12} height={height - 12} rx="18" fill="#6f511f" />
        <Rect x="16" y="7" width={width - 23} height={height - 20} rx="13" fill="#f1dfaa" />
        {[0, 1, 2].map((i) => (
          <Path
            key={i}
            d={`M${width - 13 + i * 2} 22V${height - 22}`}
            stroke="#b29a65"
            strokeWidth="0.7"
          />
        ))}
        <Rect
          x="4"
          y="3"
          width={width - 20}
          height={height - 20}
          rx="15"
          fill={`url(#${id})`}
          stroke="#7c5921"
          strokeWidth="2"
        />
        <Rect x="8" y="6" width="18" height={height - 26} rx="7" fill="#8b6528" fillOpacity="0.6" />
        <Rect
          x="34"
          y="21"
          width={width - 72}
          height={height - 58}
          rx="7"
          fill="none"
          stroke="#f6e6ae"
          strokeWidth="2"
        />
        <Rect
          x="40"
          y="27"
          width={width - 84}
          height={height - 70}
          rx="5"
          fill="none"
          stroke="#8d692b"
          strokeWidth="0.8"
        />
        {[0, 1, 2, 3].map((i) => (
          <G
            key={i}
            transform={`translate(${i % 2 ? width - 44 : 41} ${i < 2 ? 29 : height - 45}) scale(${i % 2 ? -1 : 1} ${i < 2 ? 1 : -1})`}
          >
            <Path
              d="M0 41Q4 5 39 0M4 22Q25 27 23 11Q9 10 4 22ZM14 10Q12-2 29-3Q31 7 14 10Z"
              fill="#8d6b2e"
              stroke="#f8e9b4"
              strokeWidth="0.7"
            />
          </G>
        ))}
        <Ellipse
          cx={width * (wide ? 0.27 : 0.5)}
          cy={height * (wide ? 0.51 : 0.51)}
          rx={Math.min(width * 0.29, height * 0.25)}
          ry={height * 0.21}
          fill="#f6dfa0"
          fillOpacity="0.5"
          stroke="#906b2c"
          strokeWidth="1.3"
        />
        <G
          transform={`translate(${width * (wide ? 0.27 : 0.5)} ${height * 0.52}) scale(${height / 420})`}
          fill="none"
          stroke="#775321"
          strokeWidth="1.6"
        >
          <Path d="M0 63Q20 15 0-19M0 44Q-52 48-44 12Q-9 10 0 44ZM7 25Q49 17 45-11Q13-9 7 25Z" />
          {Array.from({ length: 8 }, (_, i) => (
            <Path
              key={i}
              transform={`rotate(${i * 45} 0 -26)`}
              d="M0-26Q-30-59 0-78Q28-56 0-26Z"
              fill="#cfaa56"
            />
          ))}
          <Circle cx="0" cy="-26" r="11" fill="#f6e4a8" />
        </G>
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: wide ? '47%' : '13%',
          right: '13%',
          top: wide ? '16%' : '10%',
          alignItems: 'center',
        }}
      >
        <T
          serif
          numberOfLines={2}
          adjustsFontSizeToFit
          style={{
            fontSize: titleSize,
            lineHeight: titleSize * 1.15,
            color: '#4f361a',
            textAlign: 'center',
          }}
        >
          L’Herbier{'\n'}des Merveilles
        </T>
        {wide && (
          <T style={{ marginTop: 8, color: '#62491e', textAlign: 'center' }}>
            Cinq espèces d’exception
          </T>
        )}
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: wide ? '47%' : '12%',
          right: '12%',
          bottom: '13%',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <T
          style={{
            fontFamily: F.scientific,
            color: '#573e1b',
            textAlign: 'center',
            fontSize: Math.max(12, Math.min(17, height * 0.043)),
          }}
        >
          {acquired} / 5 merveilles acquises
        </T>
        <T
          style={{
            color: '#60451c',
            fontSize: Math.max(11, Math.min(14, height * 0.038)),
            textAlign: 'center',
          }}
        >
          200 graines par espèce · Ouvrir
        </T>
      </View>
      {active && (
        <>
          <Animated.View
            pointerEvents="none"
            testID="golden-book-shimmer"
            style={{
              position: 'absolute',
              top: -height * 0.2,
              height: height * 1.4,
              width: width * 0.24,
              transform: [
                {
                  translateX: clock.interpolate({
                    inputRange: [0, 0.24, 1],
                    outputRange: [-width * 0.5, width * 1.4, width * 1.4],
                  }),
                },
                { rotate: '-14deg' },
              ],
            }}
          >
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={id + '-shine'} x1="0" x2="1">
                  <Stop offset="0" stopColor="#fff8d9" stopOpacity="0" />
                  <Stop offset="0.5" stopColor="#fff8d9" stopOpacity="0.5" />
                  <Stop offset="1" stopColor="#fff8d9" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${id}-shine)`} />
            </Svg>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            testID="golden-book-pollen"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: clock.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.35, 0.95, 0.35],
              }),
              transform: [
                { translateY: clock.interpolate({ inputRange: [0, 1], outputRange: [6, -9] }) },
              ],
            }}
          >
            <Svg width="100%" height="100%">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Path
                  key={i}
                  transform={`translate(${width * (0.2 + ((i * 0.13) % 0.65))} ${height * (0.32 + ((i * 0.17) % 0.45))})`}
                  d="M0-5 1-1 5 0 1 1 0 5-1 1-5 0-1-1Z"
                  fill="#fff7d4"
                />
              ))}
            </Svg>
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

export function OpeningGoldenHerbarium({
  width,
  height,
  onDone,
  children,
}: {
  width: number;
  height: number;
  onDone: () => void;
  children: React.ReactNode;
}) {
  const { value } = useNativeProgress(560, true, onDone);
  usePrimaryAnimation(true);
  return (
    <View pointerEvents="none" testID="antique-book-opening" style={{ width, height }}>
      <View
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: 13,
          borderColor: '#b39659',
          borderWidth: 2,
          backgroundColor: '#f7e8c2',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('../../assets/shop/phenix.webp')}
          resizeMode="contain"
          fadeDuration={0}
          style={{ width: '76%', height: '69%' }}
        />
        <T serif style={{ fontSize: 23, color: '#665332', textAlign: 'center' }}>
          Orchidée du Phénix
        </T>
      </View>
      <Animated.View
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={{
          width,
          height,
          transformOrigin: 'left center',
          opacity: value.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
          transform: [
            { perspective: width * 4 },
            {
              rotateY: value.interpolate({
                inputRange: [0, 0.12, 0.85, 1],
                outputRange: ['0deg', '-2deg', '-82deg', '-90deg'],
              }),
            },
          ],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
