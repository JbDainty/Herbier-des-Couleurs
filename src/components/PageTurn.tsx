import React, { createContext, memo, useEffect, useId, useMemo, useRef } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Image,
  PixelRatio,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { Paper } from './Paper';
import { PrintedPage } from './PrintedBookPage';
import { nativeSequence } from '../animation/nativeSequence';
import { usePrimaryAnimation } from './usePrimaryAnimation';
import { singleTurnDuration, speciesTurnDuration, type TurningPage } from '../animation/book';
import { pageCurlSamples, pageTextureSurface, speciesSheetCount } from '../animation/pageCurl';
export type { TurningPage } from '../animation/book';

export const PageTurnContext = createContext<(page: number, commit: () => void) => void>(
  (_page, commit) => commit(),
);
const native = Platform.OS !== 'web';

const SheetArt = memo(function SheetArt({
  width,
  height,
  children,
  neutral,
  backwards,
}: {
  width: number;
  height: number;
  children?: React.ReactNode;
  neutral: boolean;
  backwards: boolean;
}) {
  return (
    <View style={{ width, height, backgroundColor: '#f0e3c7', overflow: 'hidden' }}>
      <Image
        source={require('../../assets/illustrations/papier.png')}
        resizeMode="cover"
        fadeDuration={0}
        style={[StyleSheet.absoluteFill, { width, height, opacity: 0.8 }]}
      />
      <View
        style={{
          position: 'absolute',
          ...(backwards ? { right: width * 0.06 } : { left: width * 0.06 }),
          top: 0,
          bottom: 0,
          borderLeftWidth: 0.6,
          borderRightWidth: 0.6,
          borderColor: '#aa8e5833',
          width: width * 0.012,
        }}
      />
      {neutral && (
        <View style={{ position: 'absolute', left: width * 0.27, top: height * 0.32 }}>
          <Svg
            width={width * 0.46}
            height={height * 0.38}
            viewBox="-80 -70 180 240"
            accessible={false}
          >
            <Path
              d="M0 140 C40 90-25 45 10-40 M13 94 C-36 86-38 46-24 34 Q8 42 13 94 M9 70 C48 62 56 24 40 9 Q10 15 9 70 M4 22 C-32 10-33-18-21-30 Q5-22 4 22 M5-8 Q40-26 30-50 Q6-46 5-8"
              fill="none"
              stroke="#6f805a"
              strokeWidth="0.7"
              opacity="0.16"
            />
          </Svg>
        </View>
      )}
      {children}
    </View>
  );
});

/** Cache only this bounded surface; its printed content retains normal layout dimensions. */
const CachedTexture = memo(function CachedTexture({
  width,
  height,
  children,
  testID,
}: {
  width: number;
  height: number;
  children?: React.ReactNode;
  testID: string;
}) {
  const surface = pageTextureSurface(width, height, PixelRatio.get());
  return (
    <View
      style={{
        width: surface.width,
        height: surface.height,
        transformOrigin: 'top left',
        transform: [{ scale: 1 / surface.ratio }],
      }}
    >
      <View
        testID={testID}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={{ width: surface.width, height: surface.height, overflow: 'hidden' }}
      >
        <View
          style={{
            width,
            height,
            transformOrigin: 'top left',
            transform: [{ scale: surface.ratio }],
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
});

const PaperCurl = memo(function PaperCurl({
  width,
  height,
  backwards,
}: {
  width: number;
  height: number;
  backwards: boolean;
}) {
  const id = 'curl-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <View style={{ width, height, transform: backwards ? [{ scaleX: -1 }] : [] }}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        accessible={false}
      >
        <Defs>
          <LinearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            <Stop stopColor="#9b825a" stopOpacity="0.05" />
            <Stop offset="0.12" stopColor="#b69c6d" stopOpacity="0.65" />
            <Stop offset="0.38" stopColor="#eee0bf" />
            <Stop offset="0.67" stopColor="#fff7df" />
            <Stop offset="0.9" stopColor="#e9d8b2" />
            <Stop offset="1" stopColor="#ad9061" />
          </LinearGradient>
        </Defs>
        <Path
          d="M0 0 C48 0.6 87 2 96 5 Q104 50 96 95 C87 98 48 99.4 0 100 Q24 50 0 0Z"
          fill={`url(#${id})`}
        />
        <Path d="M96 5 Q104 50 96 95" fill="none" stroke="#fff8e6" strokeWidth="0.65" />
        <Path
          d="M9 4 Q25 50 9 96"
          fill="none"
          stroke="#a88c5d"
          strokeOpacity="0.2"
          strokeWidth="0.45"
        />
      </Svg>
    </View>
  );
});

const CastShadow = memo(function CastShadow({
  width,
  height,
  backwards,
}: {
  width: number;
  height: number;
  backwards: boolean;
}) {
  const id = 'paper-shadow-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <View style={{ width, height, transform: backwards ? [{ scaleX: -1 }] : [] }}>
      <Svg width={width} height={height} accessible={false}>
        <Defs>
          <LinearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            <Stop stopColor="#57452d" stopOpacity="0.85" />
            <Stop offset="0.2" stopColor="#57452d" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#57452d" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
});

const TurningSheet = memo(function TurningSheet({
  width,
  height,
  clock,
  start,
  end,
  children,
  neutral,
  backwards,
}: {
  width: number;
  height: number;
  clock: Animated.Value;
  start: number;
  end: number;
  children?: React.ReactNode;
  neutral: boolean;
  backwards: boolean;
}) {
  const geometry = useMemo(
    () => pageCurlSamples(width, height, backwards),
    [width, height, backwards],
  );
  const timing = useMemo(
    () => geometry.samples.map((sample) => start + (end - start) * sample.p),
    [geometry, start, end],
  );
  const sample = (values: number[]) =>
    clock.interpolate<number>({
      inputRange: timing,
      outputRange: values,
      extrapolate: 'clamp',
    });
  const angle = (values: string[]) =>
    clock.interpolate<string>({ inputRange: timing, outputRange: values, extrapolate: 'clamp' });
  const edges = geometry.samples.map((s) => s.edge);
  const flex = geometry.samples.map((s) => s.flex);
  const visible = clock.interpolate({
    inputRange: [start, end - (end - start) * 0.035, end],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  const curlWidth = Math.min(80, width * 0.19);
  const shadowWidth = Math.min(100, width * 0.25);
  return (
    <>
      <Animated.View
        testID="book-page-shadow"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: shadowWidth,
          height,
          opacity: sample(flex.map((v) => v * 0.24)),
          transformOrigin: backwards ? 'right center' : 'left center',
          transform: [
            { translateX: sample(edges.map((x) => x - (backwards ? shadowWidth : 0))) },
            { scaleX: sample(flex.map((v) => 0.35 + v * 0.9)) },
          ],
        }}
      >
        <CachedTexture width={shadowWidth} height={height} testID="book-strip-cache">
          <CastShadow width={shadowWidth} height={height} backwards={backwards} />
        </CachedTexture>
      </Animated.View>
      <Animated.View
        testID="book-turning-sheet"
        pointerEvents="none"
        style={{
          position: 'absolute',
          width,
          height,
          top: 0,
          left: 0,
          backfaceVisibility: 'hidden',
          opacity: visible,
          transformOrigin: backwards ? 'right center' : 'left center',
          transform: [
            { perspective: geometry.perspective },
            { rotateY: angle(geometry.samples.map((s) => s.angle)) },
            { rotateZ: angle(geometry.samples.map((s) => s.twist)) },
            { skewY: angle(geometry.samples.map((s) => s.skew)) },
            { translateY: sample(geometry.samples.map((s) => s.lift)) },
          ],
        }}
      >
        <CachedTexture width={width} height={height} testID="book-paper-cache">
          <SheetArt width={width} height={height} neutral={neutral} backwards={backwards}>
            {children}
          </SheetArt>
        </CachedTexture>
      </Animated.View>
      <Animated.View
        testID="book-page-curl"
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: curlWidth,
          height,
          opacity: Animated.multiply(visible, sample(flex.map((v) => Math.min(1, v * 3)))),
          transformOrigin: backwards ? 'left center' : 'right center',
          transform: [
            { translateX: sample(edges.map((x) => x - (backwards ? 0 : curlWidth))) },
            { translateY: sample(geometry.samples.map((s) => s.lift)) },
            { scaleX: sample(flex.map((v) => 0.02 + v * 0.98)) },
            { scaleY: sample(flex.map((v) => 1 - v * 0.012)) },
          ],
        }}
      >
        <CachedTexture width={curlWidth} height={height} testID="book-strip-cache">
          <PaperCurl width={curlWidth} height={height} backwards={backwards} />
        </CachedTexture>
      </Animated.View>
    </>
  );
});

/** Three cached leaves at most; only transforms and opacity run on the native thread. */
export function PageTurn({
  page,
  onCovered,
  onFinished,
}: {
  page: TurningPage;
  onCovered: () => void;
  onFinished: () => void;
}) {
  const { width, height } = useWindowDimensions();
  usePrimaryAnimation(true);
  const cover = useRef(new Animated.Value(0)).current;
  const clock = useRef(new Animated.Value(0)).current;
  const callbacks = useRef({ onCovered, onFinished });
  callbacks.current = { onCovered, onFinished };
  const multiple = page.kind === 'species';
  const backwards = page.to < page.from;
  useEffect(() => {
    const stage = (value: Animated.Value, duration: number, complete?: () => void) => ({
      duration,
      complete,
      play(remaining: number, done: () => void) {
        const animation = Animated.timing(value, {
          toValue: 1,
          duration: remaining,
          easing: Easing.linear,
          useNativeDriver: native,
          isInteraction: false,
        });
        animation.start(({ finished }) => {
          if (finished) done();
        });
        return {
          stop(read: (progress: number) => void) {
            animation.stop();
            value.stopAnimation(read);
          },
        };
      },
    });
    const sequence = nativeSequence(
      [
        stage(cover, 220, () => callbacks.current.onCovered()),
        stage(clock, (multiple ? speciesTurnDuration : singleTurnDuration) - 220),
      ],
      () => callbacks.current.onFinished(),
    );
    sequence.setActive(
      AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
    );
    const sub = AppState.addEventListener('change', (state) =>
      sequence.setActive(state === 'active'),
    );
    return () => {
      sub.remove();
      sequence.dispose();
    };
  }, [page.id, multiple, cover, clock]);
  const source = useMemo(
    () => (
      <PrintedPage
        width={width}
        height={height}
        plant={page.plant}
        stage={page.stage}
        folio={page.from}
      />
    ),
    [width, height, page],
  );
  return (
    <View
      testID="book-page-turn"
      accessibilityViewIsModal
      accessibilityLabel={`Ouverture de la page ${page.to}`}
      accessibilityRole="progressbar"
      style={[StyleSheet.absoluteFill, { zIndex: 50, overflow: 'hidden' }]}
    >
      <Animated.View
        pointerEvents="none"
        testID={multiple ? 'book-species-riffle' : 'book-single-turn'}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: Animated.multiply(
              cover,
              clock.interpolate({ inputRange: [0, 0.93, 1], outputRange: [1, 1, 0] }),
            ),
          },
        ]}
      >
        {multiple && (
          <Paper frame={false} style={[StyleSheet.absoluteFill, { backgroundColor: '#f0e3c7' }]}>
            <PrintedPage
              width={width}
              height={height}
              plant={page.targetPlant}
              stage={page.targetStage}
              folio={page.to}
              destination
            />
          </Paper>
        )}
        {Array.from({ length: multiple ? speciesSheetCount : 1 }, (_, i) =>
          multiple ? speciesSheetCount - 1 - i : 0,
        ).map((i) => (
          <TurningSheet
            key={i}
            width={width}
            height={height}
            clock={clock}
            start={multiple ? 0.04 + i * 0.16 : 0.06}
            end={multiple ? 0.58 + i * 0.16 : 1}
            neutral={i !== 0}
            backwards={backwards}
          >
            {i === 0 ? source : undefined}
          </TurningSheet>
        ))}
      </Animated.View>
    </View>
  );
}
