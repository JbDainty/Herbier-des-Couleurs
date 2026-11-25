import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, type Href } from 'expo-router';
import { chapters, species } from '../data/botany';
import { plantsForEcosystem } from '../data/ecology';
import { restoration, type Save } from '../state/model';
import type { HerbariumLayout } from '../layout/herbarium';
import { F } from './fonts';
import { C, Icon, T } from './ui';
import { VictoryAction } from './VictoryAction';
import { AntiqueHerbarium, OpeningHerbarium } from './AntiqueHerbarium';
import { useAmbientMotion } from './usePrimaryAnimation';
import { preparePageArtwork } from '../services/pageArtwork';
import { GoldenHerbarium, OpeningGoldenHerbarium } from './GoldenHerbarium';
import { GOLDEN_COLLECTION_ID } from '../data/collections';

/** One shared native clock lights one binding at a time; no SVG frame updates. */
function useBindingLight(enabled: boolean) {
  const active = useAmbientMotion(enabled),
    value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let run: Animated.CompositeAnimation | undefined;
    const sync = (foreground: boolean) => {
      run?.stop();
      value.setValue(0);
      if (!active || !foreground) return;
      run = Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: 14000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      );
      run.start();
    };
    sync(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const listener = AppState.addEventListener('change', (state) => sync(state === 'active'));
    return () => {
      listener.remove();
      run?.stop();
      value.stopAnimation();
    };
  }, [active, value]);
  return value;
}
export function HerbariumShelf({
  save,
  layout,
  onBusyChange,
}: {
  save: Save;
  layout: HerbariumLayout;
  onBusyChange: (busy: boolean) => void;
}) {
  const params = useLocalSearchParams<{ shelf?: string; volume?: string }>();
  const remembered =
    params.volume !== undefined ? Number(params.volume) : Number(params.shelf ?? 0) * 4;
  const anchor =
    Number.isInteger(remembered) && remembered >= 0 && remembered <= chapters.length
      ? remembered
      : 0;
  const [opening, setOpening] = useState<number | null>(null),
    [focused, setFocused] = useState(true);
  const activated = useRef(false),
    alive = useRef(true);
  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      activated.current = false;
      setOpening(null);
      setFocused(true);
      onBusyChange(false);
      return () => {
        alive.current = false;
        setFocused(false);
      };
    }, [onBusyChange]),
  );
  useEffect(() => () => onBusyChange(false), [onBusyChange]);
  const perPage = layout.booksPerPage,
    golden = anchor === chapters.length,
    regularPages = Math.ceil(chapters.length / perPage),
    page = golden ? regularPages : Math.floor(anchor / perPage),
    first = golden ? chapters.length : page * perPage;
  useLayoutEffect(() => {
    // Keep a new tap if its book remains visible after resizing. Cancel only
    // a volume removed from this spread, before the next frame can be touched.
    if (opening === null || (opening >= first && opening < first + perPage)) return;
    activated.current = false;
    setOpening(null);
    onBusyChange(false);
  }, [first, perPage, opening, onBusyChange]);
  const light = useBindingLight(save.settings.motion && focused && opening === null && !golden);
  const complete = useMemo(
    () => species.filter((_, i) => restoration(save, i) === 5).length,
    [save],
  );
  const turnShelf = (nextPage: number) => {
    if (activated.current || nextPage < 0 || nextPage > regularPages) return;
    const start = Math.min(nextPage * perPage, chapters.length);
    router.setParams({ shelf: String(Math.floor(start / 4)), volume: String(start) });
  };
  const enter = (index: number) => {
    if (!alive.current || !activated.current) return;
    router.push(
      (index === chapters.length
        ? `/jardin?collection=${GOLDEN_COLLECTION_ID}&vue=galerie`
        : `/carnet?ecosystem=${index}`) as Href,
    );
  };
  const open = (index: number) => {
    if (activated.current || !alive.current) return;
    activated.current = true;
    if (index < chapters.length) {
      const plant = plantsForEcosystem(index)[0];
      preparePageArtwork(plant, restoration(save, plant));
    }
    if (!save.settings.motion) {
      enter(index);
      return;
    }
    onBusyChange(true);
    setOpening(index);
  };
  return (
    <View
      testID="herbarium-shelf"
      style={{ flex: 1, minHeight: 0, width: '100%', alignItems: 'center' }}
    >
      <View
        style={[
          styles.indexRow,
          { height: layout.summaryHeight, width: layout.gridWidth, marginBottom: layout.gap },
        ]}
      >
        <T
          testID="herbarium-collection-progress"
          accessibilityLabel={`${complete} planches estampillées sur ${species.length}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          style={styles.progress}
        >
          {complete} / {species.length} planches
        </T>
        {!!Object.keys(save.gardens ?? {}).length && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes jardins de collection"
            onPress={() => router.push('/jardin')}
            disabled={opening !== null}
            style={styles.gardenLink}
          >
            <Icon name="leaf-outline" size={22} color="#805c91" />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            golden ? 'Retrouver les carnets des écosystèmes' : 'Voir l’Herbier des Merveilles'
          }
          onPress={() => turnShelf(golden ? 0 : regularPages)}
          disabled={opening !== null}
          style={({ pressed }) => [styles.bookmarkTarget, { opacity: pressed ? 0.75 : 1 }]}
        >
          <View style={styles.bookmark}>
            <Icon name={golden ? 'book-outline' : 'sparkles-outline'} size={17} color="#80602e" />
            <T numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.bookmarkText}>
              {golden ? 'Les carnets' : 'Merveilles'}
            </T>
          </View>
        </Pressable>
      </View>
      <View style={{ flex: 1, minHeight: 0, justifyContent: 'center', alignItems: 'center' }}>
        <View
          testID="herbarium-volume-grid"
          style={{
            width: layout.gridWidth,
            height: layout.gridHeight,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: layout.gap,
          }}
        >
          {golden
            ? (() => {
                const art = (
                  <GoldenHerbarium
                    width={layout.gridWidth}
                    height={layout.gridHeight}
                    motion={save.settings.motion && focused && opening === null}
                    acquired={save.gardens?.[GOLDEN_COLLECTION_ID]?.species.length ?? 0}
                    onPress={() => open(chapters.length)}
                  />
                );
                return opening === chapters.length ? (
                  <OpeningGoldenHerbarium
                    width={layout.gridWidth}
                    height={layout.gridHeight}
                    onDone={() => enter(chapters.length)}
                  >
                    {art}
                  </OpeningGoldenHerbarium>
                ) : (
                  art
                );
              })()
            : chapters.slice(first, first + perPage).map((eco, offset) => {
                const index = first + offset,
                  plants = plantsForEcosystem(index),
                  done = plants.filter((p) => restoration(save, p) === 5).length;
                const art = (
                  <AntiqueHerbarium
                    index={index}
                    title={eco.name}
                    done={done}
                    total={plants.length}
                    width={layout.bookWidth}
                    height={layout.bookHeight}
                    glimmer={light}
                  />
                );
                return (
                  <Pressable
                    key={index}
                    testID={`herbarium-book-${index}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Ouvrir le carnet ${eco.name}`}
                    accessibilityHint={`${done} planches estampillées sur ${plants.length}`}
                    accessibilityState={{ busy: opening === index, disabled: opening !== null }}
                    disabled={opening !== null}
                    onPress={() => open(index)}
                    style={({ pressed }) => ({
                      width: layout.bookWidth,
                      height: layout.bookHeight,
                      opacity: pressed ? 0.86 : 1,
                    })}
                  >
                    {opening === index ? (
                      <OpeningHerbarium onDone={() => enter(index)}>{art}</OpeningHerbarium>
                    ) : (
                      art
                    )}
                  </Pressable>
                );
              })}
        </View>
      </View>
      <View
        style={{
          width: '100%',
          maxWidth: 500,
          height: layout.pagerHeight,
          marginTop: layout.gap,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={styles.pagerButton}>
          <VictoryAction
            compact
            narrow
            secondary
            maxFontSizeMultiplier={1.2}
            disabled={page === 0 || opening !== null}
            onPress={() => turnShelf(page - 1)}
          >
            Avant
          </VictoryAction>
        </View>
        <T
          testID="herbarium-shelf-page"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Page ${page + 1} sur ${regularPages + 1}`}
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          style={styles.pageNumber}
        >
          {page + 1} / {regularPages + 1}
        </T>
        <View style={styles.pagerButton}>
          <VictoryAction
            compact
            narrow
            maxFontSizeMultiplier={1.2}
            disabled={page === regularPages || opening !== null}
            onPress={() => turnShelf(page + 1)}
          >
            Suite
          </VictoryAction>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  progress: {
    flex: 1,
    minWidth: 0,
    fontFamily: F.scientific,
    color: C.green,
    fontSize: 16,
    lineHeight: 22,
  },
  gardenLink: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  bookmarkTarget: { minHeight: 44, justifyContent: 'center' },
  bookmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: '#c7ae78',
    backgroundColor: '#f1e3bf',
  },
  bookmarkText: { fontFamily: F.medium, fontSize: 15, lineHeight: 21, color: '#69532e' },
  pagerButton: { flex: 1, minWidth: 0 },
  pageNumber: {
    minWidth: 52,
    textAlign: 'center',
    fontFamily: F.scientific,
    fontSize: 16,
    lineHeight: 22,
    color: C.green,
  },
});
