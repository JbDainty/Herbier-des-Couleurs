import React, { useContext } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { GardenCollection, GardenSpecies } from '../data/collections';
import { collectionArtwork } from '../data/collectionArtwork';
import { gardenStage } from '../state/gardens';
import { useGame } from '../state/store';
import { BookChromeContext } from './BookScrollView';
import { HerbariumBookButton } from './HerbariumBookButton';
import { PaperTexture } from './Paper';
import { SeedPouch } from './SeedPouch';
import { SettingsFlourish } from './SettingsArtwork';
import { ShopPaper, ShopRibbon, SpecimenHalo, shopArtwork } from './ShopPresentation';
import { C, Icon, T } from './ui';
import { F } from './fonts';

const engravedPlants: Record<string, number> = {
  phenix: shopArtwork.phenix,
  constellations: require('../../assets/shop/merveilles-constellations.webp'),
  eclipse: require('../../assets/shop/merveilles-eclipse.webp'),
  cristal: require('../../assets/shop/merveilles-cristal.webp'),
  temps: require('../../assets/shop/merveilles-temps.webp'),
};

export function GoldenGallery({
  garden,
  selection,
  onSelect,
  onAction,
  onHome,
  onShop,
  onHerbarium,
}: {
  garden: GardenCollection;
  selection?: string;
  onSelect: (species: GardenSpecies) => void;
  onAction: (species: GardenSpecies) => void;
  onHome: () => void;
  onShop: () => void;
  onHerbarium: () => void;
}) {
  const { save } = useGame();
  const viewport = useWindowDimensions();
  const chrome = useContext(BookChromeContext);
  const width = Math.min(chrome.availableWidth || viewport.width, 500);
  const height = chrome.availableHeight || viewport.height;
  const compact = width < 360 || height < 720;
  const artHeight = Math.max(138, Math.min(360, (width - 28) * 0.91, height - 394));
  const specimen = garden.species.find((species) => species.id === selection) ?? garden.species[0];
  const acquired = save.gardens?.[garden.id]?.species ?? [];
  const owned = acquired.includes(specimen.id);
  const stage = gardenStage(save, garden.id, specimen.id);
  const resuming =
    save.gardenSession?.collection === garden.id && save.gardenSession.species === specimen.id;
  const missing = specimen.cost - save.seeds;
  const action = owned
    ? stage === 5
      ? 'Rejouer cette merveille'
      : resuming
        ? 'Continuer cette merveille'
        : 'Restaurer cette merveille'
    : `Acquérir · ${specimen.cost} graines`;

  return (
    <View testID="collection-garden" style={styles.screen}>
      <PaperTexture background textureOpacity={0.47} />
      <ScrollView
        testID="golden-gallery"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.page, compact && styles.compactPage, { width }]}
      >
        <View style={[styles.header, compact && styles.compactHeader]}>
          <HerbariumBookButton compact={compact} motion={save.settings.motion} onHome={onHome} />
          <View style={styles.headerTitle}>
            <T
              serif
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              maxFontSizeMultiplier={1.15}
              style={[
                styles.title,
                {
                  fontSize: width < 360 ? 24 : 31,
                  lineHeight: width < 360 ? 30 : 37,
                },
              ]}
            >
              Les Merveilles
            </T>
            <SettingsFlourish />
          </View>
          <SeedPouch compact count={save.seeds} motion={save.settings.motion} />
        </View>
        <ShopPaper
          testID={`garden-species-${specimen.id}`}
          style={[styles.folio, compact && styles.compactFolio]}
        >
          <View style={[styles.artFrame, { height: artHeight }]}>
            {!owned && <SpecimenHalo />}
            <Image
              testID="golden-gallery-plant"
              source={owned ? collectionArtwork[specimen.id] : engravedPlants[specimen.id]}
              resizeMethod="resize"
              resizeMode="contain"
              fadeDuration={0}
              style={styles.flower}
              accessible
              accessibilityLabel={
                owned || specimen.id === 'phenix'
                  ? `Aquarelle : ${specimen.name}`
                  : `Silhouette : ${specimen.name}`
              }
            />
          </View>
          <T
            serif
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
            style={[styles.specimen, compact && styles.compactSpecimen]}
          >
            {specimen.name}
          </T>
          <T testID="golden-gallery-description" style={styles.description}>
            {specimen.description}
          </T>
          <T style={styles.progress}>
            {owned ? `${stage} / 5 pages restaurées` : '5 pages à restaurer'}
          </T>
          <ShopRibbon
            disabled={!!save.testSession || (!owned && missing > 0)}
            onPress={() => onAction(specimen)}
          >
            {action}
          </ShopRibbon>
          {!owned && missing > 0 && (
            <T testID="golden-gallery-missing-seeds" style={styles.missing}>
              Encore {missing} {missing === 1 ? 'graine' : 'graines'}
            </T>
          )}
        </ShopPaper>
        <View
          testID="golden-gallery-thumbnails"
          accessibilityRole="tablist"
          accessibilityLabel="Les cinq espèces"
          style={styles.thumbnails}
        >
          {garden.species.map((species) => {
            const active = species.id === specimen.id;
            const collected = acquired.includes(species.id);
            return (
              <Pressable
                key={species.id}
                accessibilityRole="tab"
                accessibilityLabel={species.name}
                accessibilityHint={collected ? 'Espèce acquise' : undefined}
                accessibilityState={{ selected: active }}
                aria-selected={active}
                testID={`golden-gallery-tab-${species.id}`}
                onPress={() => onSelect(species)}
                style={({ pressed }) => [
                  styles.thumbnail,
                  { height: compact ? 60 : 77 },
                  active && styles.activeThumbnail,
                  pressed && styles.pressed,
                ]}
              >
                {active && <View pointerEvents="none" style={styles.activeOutline} />}
                <Image
                  testID={
                    !collected && species.id !== 'phenix'
                      ? `golden-silhouette-${species.id}`
                      : undefined
                  }
                  source={engravedPlants[species.id]}
                  accessible={false}
                  fadeDuration={0}
                  resizeMode="contain"
                  style={styles.thumbnailArt}
                />
                {collected && (
                  <View pointerEvents="none" style={styles.ownedMark}>
                    <Icon name="checkmark-circle-outline" size={15} color={C.green} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onShop}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Icon name="arrow-undo-outline" size={18} color={C.green} />
            <T style={styles.linkText}>Retour à la boutique</T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retrouver le grand herbier doré"
            onPress={onHerbarium}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Icon name="book-outline" size={18} color={C.green} />
            <T style={styles.linkText}>Herbier doré</T>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: '#f4ead6', zIndex: 0 },
  page: {
    flexGrow: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 16,
  },
  compactPage: { paddingVertical: 8, paddingHorizontal: 10, gap: 9 },
  header: { minHeight: 78, alignItems: 'center', flexDirection: 'row', gap: 3 },
  compactHeader: { minHeight: 53 },
  headerTitle: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.displayBold, color: '#274635', textAlign: 'center', width: '100%' },
  folio: { paddingHorizontal: 16, paddingVertical: 16, gap: 6, alignItems: 'center' },
  compactFolio: { paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  artFrame: { width: '100%', alignItems: 'center' },
  flower: { width: '90%', height: '100%' },
  specimen: {
    fontFamily: F.displayBold,
    fontSize: 31,
    lineHeight: 35,
    textAlign: 'center',
    color: '#274635',
  },
  compactSpecimen: { fontSize: 25, lineHeight: 30 },
  description: { fontSize: 17, lineHeight: 21, textAlign: 'center', color: C.ink, maxWidth: 360 },
  progress: { fontFamily: F.scientific, fontSize: 16, lineHeight: 21, textAlign: 'center' },
  missing: { fontSize: 14, lineHeight: 18, color: C.muted, textAlign: 'center' },
  thumbnails: { flexDirection: 'row', gap: 5 },
  thumbnail: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderWidth: 1,
    borderColor: '#c7af78',
    borderRadius: 13,
    backgroundColor: '#f7ead0',
  },
  activeThumbnail: { borderColor: '#a77f36', borderWidth: 1.5, backgroundColor: '#fff2d6' },
  activeOutline: {
    ...StyleSheet.absoluteFillObject,
    margin: 2,
    borderRadius: 10,
    borderWidth: 0.6,
    borderColor: '#b69655',
  },
  thumbnailArt: { width: '100%', height: '100%' },
  ownedMark: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#f9efd8',
    borderRadius: 8,
  },
  pressed: { opacity: 0.72 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 },
  linkText: {
    fontFamily: F.medium,
    fontSize: 15,
    lineHeight: 20,
    color: C.green,
    textDecorationLine: 'underline',
  },
});
