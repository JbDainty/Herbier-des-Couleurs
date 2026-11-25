import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BookChromeContext, BookScrollView } from '../src/components/BookScrollView';
import { CollectionPurchase, type Purchase } from '../src/components/CollectionPurchase';
import {
  PeacefulBook,
  ShopModal,
  ShopPaper,
  ShopRibbon,
  SpecimenHalo,
  shopArtwork,
} from '../src/components/ShopPresentation';
import { campaignTestAdsEnabled } from '../src/services/campaignAds';
import { useGame } from '../src/state/store';
import { acquireGarden, acquireGardenSpecies, wallpapers } from '../src/state/economy';
import { collections, featuredCollection, GOLDEN_COLLECTION_ID } from '../src/data/collections';
import { WallpaperGallery } from '../src/components/WallpaperGallery';
import { Button, C, Icon, T } from '../src/components/ui';
import { F } from '../src/components/fonts';

type Section = 'accueil' | 'jardins' | 'decors';

export default function Boutique() {
  const { save, setSave } = useGame();
  const { width, height } = useWindowDimensions();
  const { availableHeight } = useContext(BookChromeContext);
  const compact = (availableHeight || height) < 800 || width < 360;
  const artHeight = Math.max(145, Math.min(240, (availableHeight || height) - 610));
  const params = useLocalSearchParams<{ rayon?: string; offre?: string }>();
  const section: Section =
    params.rayon === 'jardins' || params.rayon === 'decors' ? params.rayon : 'accueil';
  const scroll = useRef<ScrollView>(null);
  const [purchase, confirm] = useState<Purchase | null>(null);
  const [info, setInfo] = useState<'seeds' | 'ads' | null>(params.offre === 'pubs' ? 'ads' : null);
  const featured = featuredCollection();
  const gardenOwned = featured && !!save.gardens?.[featured.id];
  const golden = collections.find((c) => c.id === GOLDEN_COLLECTION_ID)!;
  const phenix = golden.species.find((s) => s.id === 'phenix')!;
  const phenixOwned = !!save.gardens?.[golden.id]?.species.includes(phenix.id);
  const open = (next: Section) => {
    router.setParams({ rayon: next });
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  useEffect(() => {
    if (Platform.OS === 'web' || section === 'accueil') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (purchase || info) return false;
      open('accueil');
      return true;
    });
    return () => sub.remove();
  }, [section, purchase, info]);
  const seeWonders = () =>
    router.push({ pathname: '/jardin', params: { collection: golden.id, vue: 'galerie' } });
  const collectPhenix = () => {
    if (phenixOwned) return seeWonders();
    confirm({
      title: `Collectionner « ${phenix.name} » ?`,
      cost: phenix.cost,
      detail:
        'Cette merveille et ses cinq puzzles resteront dans votre collection. Chaque espèce de l’herbier s’acquiert séparément.',
      action: () => {
        setSave((s) => acquireGardenSpecies(s, golden.id, phenix.id));
        seeWonders();
      },
    });
  };
  const buyGarden = () => {
    if (!featured) return;
    if (gardenOwned) {
      router.push({ pathname: '/jardin', params: { collection: featured.id } });
      return;
    }
    confirm({
      title: 'Ouvrir le jardin des orchidées ?',
      cost: featured.cost,
      detail:
        'Votre première orchidée et ses cinq puzzles sont inclus. Les autres espèces s’acquièrent séparément. Le jardin reste dans votre collection après la saison.',
      action: () => {
        setSave((s) => acquireGarden(s, featured.id));
        router.push({ pathname: '/jardin', params: { collection: featured.id } });
      },
    });
  };

  return (
    <BookScrollView
      ref={scroll}
      testID="seed-shop"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.page, { padding: width < 360 ? 10 : 14 }]}
    >
      {section !== 'accueil' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour à la boutique"
          onPress={() => open('accueil')}
          style={styles.back}
        >
          <Icon name="arrow-undo-outline" size={20} color={C.green} />
          <T style={{ fontFamily: F.medium, fontSize: 17 }}>Retour à la boutique</T>
        </Pressable>
      )}
      {section === 'accueil' && (
        <>
          <ShopPaper testID="golden-shop-entry" style={{ gap: 3, padding: compact ? 12 : 16 }}>
            <View style={styles.heroTop}>
              <T style={styles.eyebrow}>LES MERVEILLES</T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Découvrir les cinq merveilles"
                onPress={seeWonders}
                style={styles.more}
              >
                <T style={{ color: C.green, fontSize: 14 }}>Les 5 espèces</T>
                <Icon name="arrow-forward-outline" size={17} color={C.green} />
              </Pressable>
            </View>
            <View style={{ height: artHeight, alignItems: 'center' }}>
              <SpecimenHalo />
              <Image
                source={shopArtwork.phenix}
                resizeMode="contain"
                fadeDuration={0}
                style={{ width: '100%', height: '100%' }}
                accessibilityLabel="Aquarelle de l’Orchidée du Phénix"
              />
            </View>
            <T
              serif
              accessibilityRole="header"
              style={[styles.specimenName, { fontSize: compact ? 25 : 29 }]}
            >
              {phenix.name}
            </T>
            <T style={styles.centerHelp}>
              {phenixOwned ? 'Dans votre collection' : '5 puzzles à restaurer'}
            </T>
            <ShopRibbon
              disabled={!!save.testSession || (!phenixOwned && save.seeds < phenix.cost)}
              onPress={collectPhenix}
            >
              {phenixOwned ? 'Retrouver ma merveille' : `Collectionner · ${phenix.cost} graines`}
            </ShopRibbon>
            {!phenixOwned && save.seeds < phenix.cost && (
              <T style={[styles.centerHelp, { fontSize: 13 }]}>
                Encore {phenix.cost - save.seeds} graines.
              </T>
            )}
          </ShopPaper>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {!!featured && (
              <Pressable
                testID="shop-gardens-link"
                accessibilityRole="button"
                accessibilityLabel="Voir le jardin des orchidées"
                onPress={() => open('jardins')}
                style={({ pressed }) => [styles.category, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Image
                  source={shopArtwork.orchid}
                  resizeMode="contain"
                  fadeDuration={0}
                  style={{ width: compact ? 38 : 46, height: 72 }}
                  accessible={false}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T serif style={[styles.categoryTitle, { fontSize: compact ? 17 : 19 }]}>
                    Jardin des orchidées
                  </T>
                  <T style={styles.categoryPrice}>
                    {gardenOwned ? 'Mon jardin' : `${featured.cost} graines`}
                  </T>
                </View>
              </Pressable>
            )}
            <Pressable
              testID="shop-wallpapers-link"
              accessibilityRole="button"
              accessibilityLabel="Voir les décors"
              onPress={() => open('decors')}
              style={({ pressed }) => [styles.category, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Image
                source={shopArtwork.meadow}
                resizeMode="cover"
                fadeDuration={0}
                style={{ width: compact ? 38 : 46, height: 64, borderRadius: 9 }}
                accessible={false}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T serif style={[styles.categoryTitle, { fontSize: compact ? 17 : 19 }]}>
                  Décors
                </T>
                <T style={styles.categoryPrice}>
                  Dès {Math.min(...wallpapers.map((w) => w.cost))} graines
                </T>
              </View>
            </Pressable>
          </View>
          <Pressable
            testID="remove-ads-offer"
            accessibilityRole="button"
            accessibilityLabel="Retirer les pubs · 1,99 € · Bientôt disponible"
            accessibilityHint="Lire les informations sur cette offre à venir"
            onPress={() => setInfo('ads')}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <ShopPaper style={styles.noAds}>
              <PeacefulBook />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T serif style={{ fontSize: compact ? 21 : 24 }}>
                  Retirer les pubs
                </T>
                <T style={{ fontSize: 14, color: C.muted }}>Bientôt disponible</T>
              </View>
              <View style={styles.priceTag}>
                <T style={{ fontFamily: F.medium, fontSize: 19, color: C.green }}>1,99 €</T>
              </View>
            </ShopPaper>
          </Pressable>
        </>
      )}
      {section === 'jardins' && (
        <>
          {!!featured && (
            <ShopPaper testID="featured-garden" style={{ gap: 12 }}>
              <T style={styles.eyebrow}>LE JARDIN À LA UNE</T>
              <Image
                source={shopArtwork.orchid}
                resizeMode="contain"
                fadeDuration={0}
                style={{ width: '100%', height: compact ? 175 : 215 }}
                accessibilityLabel={featured.species[0].name}
              />
              <T serif accessibilityRole="header" style={styles.sectionTitle}>
                {featured.id === 'orchidees-lumiere' ? 'Jardin des orchidées' : featured.name}
              </T>
              <T style={styles.help}>Première orchidée + 5 puzzles inclus.</T>
              <T style={styles.help}>
                Autres espèces : {featured.species[1].cost} graines chacune.
              </T>
              <ShopRibbon
                disabled={!!save.testSession || (!gardenOwned && save.seeds < featured.cost)}
                onPress={buyGarden}
              >
                {gardenOwned
                  ? 'Entrer dans mon jardin'
                  : `Débloquer le jardin · ${featured.cost} graines`}
              </ShopRibbon>
              {!gardenOwned && save.seeds < featured.cost && (
                <T style={styles.help}>Encore {featured.cost - save.seeds} graines.</T>
              )}
              <T style={styles.help}>Votre jardin reste accessible après la saison.</T>
            </ShopPaper>
          )}
          {!!Object.keys(save.gardens ?? {}).length && (
            <Button secondary onPress={() => router.push('/jardin')}>
              Retrouver mes jardins
            </Button>
          )}
        </>
      )}
      {section === 'decors' && (
        <WallpaperGallery
          onPurchase={confirm}
          onSelect={() => scroll.current?.scrollTo({ y: 0, animated: save.settings.motion })}
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Comment gagner des graines ?"
        onPress={() => setInfo('seeds')}
        style={styles.rules}
      >
        <Icon name="book-outline" size={21} color={C.green} />
        <T
          style={{
            fontFamily: F.medium,
            fontSize: 16,
            color: C.green,
            textDecorationLine: 'underline',
            flexShrink: 1,
          }}
        >
          Comment gagner des graines ?
        </T>
      </Pressable>
      {purchase && (
        <CollectionPurchase
          purchase={purchase}
          motion={save.settings.motion}
          onClose={() => confirm(null)}
        />
      )}
      {info && (
        <ShopModal
          title={info === 'ads' ? 'Retirer les pubs' : 'Vos graines'}
          onClose={() => setInfo(null)}
          motion={save.settings.motion}
        >
          {info === 'ads' ? (
            <>
              <T style={{ fontFamily: F.medium, fontSize: 19, color: C.green }}>
                1,99 € · Offre à venir
              </T>
              <T>
                {campaignTestAdsEnabled
                  ? 'Cette version de test présente des annonces de démonstration. L’achat unique sera proposé lors de l’ouverture des paiements.'
                  : 'Cette version du jeu ne contient pas de publicités. L’offre sera proposée lorsque les achats seront disponibles.'}
              </T>
              <T style={styles.help}>Aucun achat n’est effectué ici.</T>
            </>
          ) : (
            <>
              <T>Campagne : 1 graine au premier résultat à trois étoiles de chaque page.</T>
              <T>Vitrail du jour : 1 graine après les trois défis du jour.</T>
              <T>
                Rejouer une page déjà récompensée ou terminer une page de collection n’ajoute pas de
                graines.
              </T>
              <T style={styles.help}>Les indices et les mélanges restent gratuits.</T>
            </>
          )}
        </ShopModal>
      )}
    </BookScrollView>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: 12, paddingBottom: 18 },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: {
    fontFamily: F.medium,
    fontSize: 11,
    letterSpacing: 1.7,
    color: C.muted,
    flexShrink: 1,
  },
  more: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 3 },
  specimenName: { fontFamily: F.displayBold, color: C.green, textAlign: 'center' },
  centerHelp: { fontSize: 16, lineHeight: 21, color: C.muted, textAlign: 'center' },
  category: {
    flex: 1,
    minWidth: 0,
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    borderRadius: 18,
    borderWidth: 0.8,
    borderColor: '#c7ad7a',
    backgroundColor: C.card,
  },
  categoryTitle: { fontFamily: F.displayBold, color: C.green, lineHeight: 23 },
  categoryPrice: { fontSize: 14, lineHeight: 19, color: C.muted, marginTop: 3 },
  noAds: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13 },
  priceTag: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#e4e6cf',
    borderRadius: 14,
    borderWidth: 0.7,
    borderColor: '#c1b28a',
  },
  sectionTitle: { fontSize: 28, lineHeight: 34, color: C.green },
  help: { fontSize: 16, lineHeight: 22, color: C.muted },
  rules: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
});
