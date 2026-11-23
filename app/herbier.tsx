import React, { useCallback, useContext, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { species } from '../src/data/botany';
import { useGame } from '../src/state/store';
import { HerbariumPlate } from '../src/components/HerbariumPlate';
import { HerbariumShelf } from '../src/components/HerbariumShelf';
import { SettingsFlourish } from '../src/components/SettingsArtwork';
import { HerbariumBookButton } from '../src/components/HerbariumBookButton';
import { SeedPouch } from '../src/components/SeedPouch';
import { BookChromeContext } from '../src/components/BookScrollView';
import { useMeasuredSize } from '../src/components/useMeasuredSize';
import { herbariumLayout } from '../src/layout/herbarium';
import { F } from '../src/components/fonts';
import { T, C } from '../src/components/ui';

export default function Herbier() {
  const { save } = useGame(),
    params = useLocalSearchParams<{ plant?: string }>(),
    window = useWindowDimensions();
  const chrome = useContext(BookChromeContext),
    measured = useMeasuredSize();
  const width = measured.size.width || chrome.availableWidth || window.width;
  const height = measured.size.height || chrome.availableHeight || window.height;
  const layout = herbariumLayout(width, height, window.fontScale);
  const linkedPlant = Number(params.plant);
  const initialPlant =
    params.plant !== undefined &&
    Number.isInteger(linkedPlant) &&
    linkedPlant >= 0 &&
    linkedPlant < species.length
      ? linkedPlant
      : null;
  const [selected, select] = useState<number | null>(initialPlant),
    [direct, setDirect] = useState(initialPlant !== null);
  const [zoom, setZoom] = useState(false),
    [opening, setOpening] = useState(false);
  const closePlate = useCallback(() => {
    // A closed deep link must return to the library after an album visit too.
    router.setParams({ plant: undefined });
    select(null);
    setDirect(false);
  }, []);
  if (direct && selected !== null)
    return (
      <HerbariumPlate
        selected={selected}
        save={save}
        width={width}
        zoom={zoom}
        onZoom={() => setZoom((value) => !value)}
        onClose={closePlate}
        direct
      />
    );
  return (
    <View
      ref={measured.ref}
      collapsable={false}
      onLayout={measured.onLayout}
      testID="herbarium-library-screen"
      style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
    >
      <View
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          maxWidth: 1160,
          alignSelf: 'center',
          padding: layout.padding,
        }}
      >
        <View
          testID="game-hud"
          style={{ height: layout.hudHeight, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <HerbariumBookButton
            compact
            motion={save.settings.motion && !opening}
            onHome={() => router.dismissTo('/')}
          />
          <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <T
              testID="herbarium-collection-title"
              accessibilityRole="header"
              serif
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.2}
              style={{
                fontFamily: F.displayBold,
                fontSize: layout.short || width < 360 ? 24 : 31,
                lineHeight: layout.short ? 29 : 37,
                color: C.green,
                textAlign: 'center',
              }}
            >
              Le Grand Herbier
            </T>
            {!layout.short && <SettingsFlourish />}
          </View>
          <SeedPouch compact count={save.seeds} motion={save.settings.motion && !opening} />
        </View>
        <HerbariumShelf save={save} layout={layout} onBusyChange={setOpening} />
      </View>
    </View>
  );
}
