import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { wallpaperArtwork } from '../data/wallpaperArtwork';
import { acquireWallpaper, shopWallpapers } from '../state/economy';
import { useGame } from '../state/store';
import type { Purchase } from './CollectionPurchase';
import { ShopPaper } from './ShopPresentation';
import { F } from './fonts';
import { C, Icon, T } from './ui';

const greenhouse = require('../../assets/illustrations/serre.png');
const rack = require('../../assets/shop/workshop-rack.webp');

export function WallpaperGallery({
  onPurchase,
  onSelect,
}: {
  onPurchase: (purchase: Purchase) => void;
  onSelect: () => void;
}) {
  const { save, setSave } = useGame();
  const { width, height, fontScale } = useWindowDimensions();
  const { available, upcoming } = shopWallpapers(save);
  const [selected, select] = useState(save.wallpaper);
  const item = available.find((w) => w.id === selected) ?? available[0];
  const name = item?.name ?? 'La serre d’origine';
  const active = !item || item.id === save.wallpaper;
  const owned = !!item && save.ownedWallpapers?.includes(item.id);
  const label = active ? 'Retirer' : owned ? 'Utiliser' : `Acquérir · ${item.cost} graines`;
  const act = () => {
    if (!item || save.testSession) return;
    if (active || owned) {
      setSave((s) => acquireWallpaper(s, active ? 'default' : item.id));
      return;
    }
    onPurchase({
      title: `Acquérir « ${item.name} » ?`,
      cost: item.cost,
      detail:
        'Ce paysage habillera l’atelier de Mon Herbier. Vous pourrez le retirer et le remettre gratuitement.',
      action: () => setSave((s) => acquireWallpaper(s, item.id)),
    });
  };

  return (
    <>
      <View style={{ gap: 2 }}>
        <T serif accessibilityRole="header" style={styles.title}>
          Les décors
        </T>
        <T style={styles.intro}>Essayez un paysage derrière vos fioles.</T>
      </View>
      <ShopPaper testID="wallpaper-preview" style={styles.paper}>
        <View
          style={[
            styles.window,
            { height: Math.min(240, Math.max(130, Math.min(height * 0.24, width * 0.45))) },
          ]}
        >
          <Image
            testID="wallpaper-preview-landscape"
            source={wallpaperArtwork(item?.id) ?? greenhouse}
            resizeMode="cover"
            resizeMethod="resize"
            fadeDuration={0}
            accessibilityLabel={`Aperçu du paysage : ${name}`}
            style={styles.scenery}
          />
          <View pointerEvents="none" style={styles.glaze} />
          <Image
            testID="wallpaper-preview-rack"
            source={rack}
            resizeMode="contain"
            resizeMethod="resize"
            accessible={false}
            fadeDuration={0}
            style={styles.rack}
          />
        </View>
        <T style={[styles.eyebrow, { textAlign: 'center' }]}>
          {active ? 'DÉCOR EN PLACE' : owned ? 'APERÇU · ACQUIS' : 'APERÇU DU DÉCOR'}
        </T>
        <T serif style={styles.name}>
          {name}
        </T>
        {item ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={active ? 'Rétablit la serre d’origine dans Mon Herbier.' : undefined}
            accessibilityState={{ disabled: !!save.testSession }}
            disabled={!!save.testSession}
            onPress={act}
            style={({ pressed }) => [
              styles.action,
              active && styles.remove,
              { opacity: save.testSession ? 0.5 : pressed ? 0.8 : 1 },
            ]}
          >
            <T
              serif
              style={{ fontSize: 20, color: active ? C.green : '#fff3d8', textAlign: 'center' }}
            >
              {label}
            </T>
          </Pressable>
        ) : (
          <T style={styles.empty}>Économisez vos graines pour choisir un nouveau paysage.</T>
        )}
      </ShopPaper>
      {available.length > 0 && (
        <View style={styles.grid}>
          {available.map((w) => {
            const isSelected = w.id === item?.id;
            const state =
              save.wallpaper === w.id
                ? 'En place'
                : save.ownedWallpapers?.includes(w.id)
                  ? 'Acquis'
                  : `${w.cost} graines`;
            return (
              <Pressable
                key={w.id}
                testID={`wallpaper-choice-${w.ecosystem}`}
                accessibilityRole="button"
                accessibilityLabel={`Voir le décor ${w.name}, ${state}`}
                accessibilityState={{ selected: isSelected }}
                aria-selected={isSelected}
                onPress={() => {
                  select(w.id);
                  onSelect();
                }}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    width: width < 355 || fontScale > 1.3 ? '49%' : '32%',
                    opacity: pressed ? 0.8 : 1,
                  },
                  isSelected && styles.selected,
                ]}
              >
                <Image
                  source={wallpaperArtwork(w.id)}
                  accessible={false}
                  resizeMode="cover"
                  resizeMethod="resize"
                  fadeDuration={0}
                  style={styles.thumb}
                />
                <T serif style={styles.tileName}>
                  {w.name
                    .replace(/^(?:Les |Le |La |L’)/, '')
                    .replace(/^./, (c) => c.toLocaleUpperCase('fr'))}
                </T>
                <T style={styles.caption}>{state}</T>
              </Pressable>
            );
          })}
        </View>
      )}
      {upcoming && (
        <View testID="wallpaper-next" style={styles.next}>
          <Image
            source={wallpaperArtwork(upcoming.id)}
            accessible={false}
            resizeMode="cover"
            resizeMethod="resize"
            fadeDuration={0}
            style={styles.nextThumb}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <T style={styles.eyebrow}>PROCHAIN DÉCOR</T>
            <T serif style={{ fontSize: 20, color: C.green }}>
              {upcoming.name}
            </T>
            <View style={styles.unlock}>
              <Icon name="lock-closed-outline" size={15} color={C.muted} />
              <T style={styles.hint}>Dès la page {upcoming.firstPage}</T>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, color: C.green },
  intro: { fontFamily: F.scientific, fontSize: 17, color: C.muted },
  paper: { gap: 5, padding: 12, borderRadius: 16 },
  window: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 68,
    borderTopRightRadius: 68,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: '#b69a64',
    backgroundColor: '#d9d3ae',
  },
  scenery: { width: '100%', height: '100%' },
  glaze: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f7eac226' },
  rack: { position: 'absolute', width: '100%', height: '83%', bottom: '2%' },
  eyebrow: { fontFamily: F.medium, color: C.muted, letterSpacing: 1.3, fontSize: 12 },
  name: { textAlign: 'center', color: C.green, fontSize: 24 },
  action: {
    minHeight: 46,
    width: '78%',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.green,
    backgroundColor: C.green,
  },
  remove: { backgroundColor: '#e6e9d0', borderColor: '#99a381' },
  empty: { textAlign: 'center', fontSize: 16, color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%', rowGap: 8 },
  tile: {
    padding: 4,
    gap: 2,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#c9b58b',
    backgroundColor: '#fcf3de',
  },
  selected: { borderColor: C.green, backgroundColor: '#e5ead6' },
  thumb: { width: '100%', height: 46, borderRadius: 4 },
  tileName: { fontSize: 17, lineHeight: 20, color: C.green, textAlign: 'center' },
  caption: { fontFamily: F.scientific, color: C.muted, fontSize: 14, textAlign: 'center' },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ad9870',
    backgroundColor: '#f9efd8',
  },
  nextThumb: { width: 74, height: 56, borderRadius: 6, opacity: 0.82 },
  unlock: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hint: { fontSize: 15, fontFamily: F.scientific, color: C.muted, flexShrink: 1 },
});
