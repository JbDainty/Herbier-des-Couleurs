import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../state/store';
import { homeProgress } from '../state/home';
import { homeLayout } from '../layout/home';
import { BookActionsContext } from './BookActions';
import { SeedPouch } from './SeedPouch';
import { CarnetIllustration, type CarnetEmblem } from './CarnetIllustration';
import { RestorationCard, DailyModeCard, MysteryModeCard } from './HomeAdventureCards';
import { HomeClearing } from './HomeClearing';
import { HomeMagicMotion } from './HomeMagicMotion';
import { useMeasuredSize } from './useMeasuredSize';
import { F } from './fonts';
import { T, Icon } from './ui';
import { useNativeProgress } from './useNativeProgress';
import { usePrimaryAnimation } from './usePrimaryAnimation';
import { unlockAmbience } from '../services/ambience';
import { useVitrailDate } from './useVitrailDate';

/** Soft watercolor clearing with two clearly playable adventures and a quiet future teaser. */
export function HomeScreen({ active }: { active: boolean }) {
  const { save } = useGame();
  const today = useVitrailDate(active);
  const { fontScale } = useWindowDimensions();
  const measured = useMeasuredSize();
  const frame = measured.size;
  const layout = homeLayout(frame.width, frame.height, fontScale);
  const { short, tight, gap } = layout;
  const progress = useMemo(() => homeProgress(save), [save]);
  const [focusReady, setFocused] = useState(active);
  const focused = active && focusReady;
  const entering = useRef(false);
  const [departure, setDeparture] = useState<(() => void) | null>(null);
  const performed = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    setFocused(active);
    entering.current = false;
    setDeparture(null);
    performed.current = null;
  }, [active]);
  const { replayPrologue, replaying, openWorkshop, enteringWorkshop } =
    useContext(BookActionsContext);
  const { value, settled } = useNativeProgress(
    2600,
    save.settings.motion && focused && !replaying && !departure,
  );
  usePrimaryAnimation(!settled && focused && !replaying && !departure);
  const leave = useCallback((go: () => void) => setDeparture(() => go), []);
  useEffect(() => {
    if (!departure || !settled || !focused || replaying || performed.current === departure) return;
    const frame = requestAnimationFrame(() => {
      performed.current = departure;
      departure();
    });
    return () => cancelAnimationFrame(frame);
  }, [departure, settled, focused, replaying]);
  useEffect(() => {
    if (!replaying) return;
    setDeparture(null);
    performed.current = null;
    entering.current = false;
  }, [replaying]);
  const enter = () => {
    if (entering.current) return;
    entering.current = true;
    unlockAmbience();
    leave(() => {
      if (!save.guideSeen) router.push({ pathname: '/aide', params: { premiersPas: '1' } });
      else openWorkshop();
    });
  };
  const enterAction = useRef(enter);
  enterAction.current = enter;
  const onPlay = useCallback(() => enterAction.current(), []);
  const onDaily = useCallback(() => leave(() => router.push('/vitrail')), [leave]);
  const stages = useMemo(() => {
    const part = (from: number, to: number) => ({
      opacity: value.interpolate({
        inputRange: [from, to],
        outputRange: [0, 1],
        extrapolate: 'clamp' as const,
      }),
      transform: [
        {
          translateY: value.interpolate({
            inputRange: [from, to],
            outputRange: [10, 0],
            extrapolate: 'clamp' as const,
          }),
        },
      ],
    });
    return {
      main: part(0, 0.32),
      daily: part(0.12, 0.43),
      mystery: part(0.18, 0.46),
      footer: part(0.2, 0.5),
    };
  }, [value]);
  const links: {
    title: string;
    emblem: CarnetEmblem;
    path: '/herbier' | '/carte' | '/boutique' | '/parametres';
  }[] = [
    { title: 'Herbier', emblem: 'herbier', path: '/herbier' },
    { title: 'Écosystèmes', emblem: 'ecosystemes', path: '/carte' },
    { title: 'Boutique', emblem: 'boutique', path: '/boutique' },
    { title: 'Paramètres', emblem: 'parametres', path: '/parametres' },
  ];
  const auxiliary = (mini: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: mini ? 0 : 10,
        height: 44,
      }}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Aide"
        onPress={() => leave(() => router.push('/aide'))}
        style={({ pressed }) => ({
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 4,
          paddingHorizontal: mini ? 4 : 8,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Icon name="book-outline" size={mini ? 22 : 17} color="#4b664d" />
        {!mini && (
          <T
            maxFontSizeMultiplier={1.15}
            style={{ fontFamily: F.medium, fontSize: 12, lineHeight: 17, color: '#4b664d' }}
          >
            Aide
          </T>
        )}
      </Pressable>
      {save.settings.motion && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revoir le prologue"
          onPress={() => leave(replayPrologue)}
          style={({ pressed }) => ({
            minWidth: 44,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: mini ? 4 : 8,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          {mini ? (
            <Icon name="eye-outline" size={22} color="#4b664d" />
          ) : (
            <T
              maxFontSizeMultiplier={1.15}
              style={{ fontFamily: F.medium, fontSize: 12, lineHeight: 17, color: '#4b664d' }}
            >
              Revoir le prologue
            </T>
          )}
        </Pressable>
      )}
    </View>
  );
  const label =
    enteringWorkshop || (!!departure && entering.current)
      ? 'Préparation…'
      : progress.firstPage
        ? 'Commencer'
        : progress.collectionComplete
          ? 'Rejouer'
          : 'Continuer';
  const main = (
    <Animated.View style={[{ width: layout.mainWidth, height: layout.mainHeight }, stages.main]}>
      <RestorationCard
        width={layout.mainWidth}
        height={layout.mainHeight}
        progress={progress}
        onPlay={onPlay}
        disabled={enteringWorkshop || (!!departure && entering.current)}
        label={label}
      />
    </Animated.View>
  );
  const daily = (
    <Animated.View style={[{ width: layout.sideWidth, height: layout.dailyHeight }, stages.daily]}>
      <DailyModeCard
        width={layout.sideWidth}
        height={layout.dailyHeight}
        availability={save.vitrail?.days[today]?.rewarded ? 'Terminé' : '3 vitraux'}
        onPlay={onDaily}
      />
    </Animated.View>
  );
  const mystery = (
    <Animated.View
      style={[{ width: layout.sideWidth, height: layout.mysteryHeight }, stages.mystery]}
    >
      <MysteryModeCard width={layout.sideWidth} height={layout.mysteryHeight} />
    </Animated.View>
  );
  const navHeight = short ? 54 : tight ? 48 : 64;
  return (
    <HomeMagicMotion
      enabled={save.settings.motion && focused && !replaying && !departure && settled}
    >
      <View testID="home-screen" style={{ flex: 1, minHeight: 0 }}>
        <HomeClearing width={frame.width} height={frame.height} />
        <View
          ref={measured.ref}
          collapsable={false}
          onLayout={measured.onLayout}
          testID="home-viewport"
          style={{ flex: 1, minHeight: 0, alignItems: 'center' }}
        >
          {frame.height > 0 && (
            <View
              testID="home-layout"
              style={{
                width: layout.pageWidth + layout.padding * 2,
                height: '100%',
                padding: layout.padding,
                gap,
                alignItems: 'center',
              }}
            >
              <View
                testID="home-masthead"
                style={{
                  height: layout.headerHeight,
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: short ? 0 : 6,
                }}
              >
                <View
                  accessibilityRole="header"
                  accessibilityLabel="Herbier des couleurs"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    alignItems: short ? 'flex-start' : 'center',
                    paddingLeft: short ? 0 : 76,
                  }}
                >
                  <T
                    maxFontSizeMultiplier={tight ? 1.1 : 1.2}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{
                      fontFamily: F.displayBold,
                      fontSize: short ? 23 : tight ? 30 : 42,
                      lineHeight: short ? 30 : tight ? 37 : 52,
                      color: '#304e38',
                      textAlign: 'center',
                    }}
                  >
                    {short ? 'Herbier des couleurs' : 'Herbier'}
                  </T>
                  {!short && (
                    <T
                      maxFontSizeMultiplier={1}
                      style={{
                        fontFamily: F.medium,
                        fontSize: tight ? 9 : 11,
                        lineHeight: tight ? 12 : 16,
                        letterSpacing: tight ? 2 : 3,
                        color: '#6e7655',
                      }}
                    >
                      DES COULEURS
                    </T>
                  )}
                </View>
                <View
                  style={{
                    width: 76,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff5dfe8',
                    borderColor: '#bca371',
                    borderWidth: 0.8,
                    borderRadius: 24,
                  }}
                >
                  <SeedPouch
                    count={save.seeds}
                    active={focused}
                    motion={save.settings.motion && focused && !replaying && !departure && settled}
                    compact
                  />
                </View>
                {short && auxiliary(true)}
              </View>
              <View
                style={{
                  height: layout.bodyHeight,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap,
                }}
              >
                {!!layout.headingHeight && (
                  <View
                    style={{
                      height: layout.headingHeight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <T
                      testID="home-modes-title"
                      accessibilityRole="header"
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={1}
                      style={{
                        fontFamily: F.displayBold,
                        fontSize: short ? 18 : tight ? 21 : 25,
                        lineHeight: short ? 22 : tight ? 25 : 30,
                        color: '#3e5c42',
                      }}
                    >
                      Choisir une aventure
                    </T>
                  </View>
                )}
                <View
                  testID="home-modes"
                  style={{
                    flexDirection: layout.horizontal ? 'row' : 'column',
                    alignItems: 'center',
                    gap,
                  }}
                >
                  {main}
                  {layout.horizontal ? (
                    <View style={{ width: layout.sideWidth, gap }}>
                      {daily}
                      {mystery}
                    </View>
                  ) : (
                    <>
                      {daily}
                      {mystery}
                    </>
                  )}
                </View>
              </View>
              <Animated.View
                testID="home-footer"
                style={[
                  {
                    height: layout.footerHeight,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  stages.footer,
                ]}
              >
                <View
                  style={{
                    height: navHeight,
                    width: '100%',
                    maxWidth: 620,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 3,
                    borderRadius: 23,
                    backgroundColor: '#fbefd8',
                    borderWidth: 0.8,
                    borderColor: '#baa779',
                  }}
                >
                  {links.map((link) => (
                    <Pressable
                      key={link.path}
                      accessibilityRole="link"
                      accessibilityLabel={link.title}
                      onPress={() => leave(() => router.push(link.path))}
                      style={({ pressed }) => ({
                        width: '25%',
                        height: navHeight - 2,
                        minHeight: 44,
                        minWidth: 0,
                        paddingVertical: 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.65 : 1,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      })}
                    >
                      <CarnetIllustration name={link.emblem} size={short || tight ? 24 : 32} />
                      <T
                        maxFontSizeMultiplier={1.15}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          fontFamily: F.medium,
                          fontSize: short || tight ? 12 : 13,
                          lineHeight: short || tight ? 15 : 17,
                          color: '#3d5a42',
                          width: '100%',
                          textAlign: 'center',
                        }}
                      >
                        {link.title}
                      </T>
                    </Pressable>
                  ))}
                </View>
                {!short && auxiliary(false)}
              </Animated.View>
            </View>
          )}
          <View
            testID={settled ? 'home-stage-settled' : 'home-stage-unfolding'}
            pointerEvents="none"
          />
        </View>
      </View>
    </HomeMagicMotion>
  );
}
