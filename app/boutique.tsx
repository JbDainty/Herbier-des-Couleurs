import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BookScrollView } from '../src/components/BookScrollView';
import { Paper } from '../src/components/Paper';
import { CollectionPurchase, type Purchase } from '../src/components/CollectionPurchase';
import { useGame } from '../src/state/store';
import {
  acquireGarden,
  acquireWallpaper,
  wallpapers,
  wallpaperUnlocked,
} from '../src/state/economy';
import { featuredCollection } from '../src/data/collections';
import { collectionArtwork } from '../src/data/collectionArtwork';
import { wallpaperArtwork } from '../src/data/wallpaperArtwork';
import { Button, C, Label, T, ui } from '../src/components/ui';

export default function Boutique() {
  const { save, setSave } = useGame();
  const [selected, select] = useState(
    save.wallpaper?.startsWith('ecosystem-') ? save.wallpaper : wallpapers[0].id,
  );
  const [purchase, confirm] = useState<Purchase | null>(null);
  const item = wallpapers.find((w) => w.id === selected)!;
  const owned = save.ownedWallpapers?.includes(item.id);
  const unlocked = wallpaperUnlocked(save, item.id);
  const active = save.wallpaper === item.id;
  const featured = featuredCollection();
  const gardenOwned = featured && !!save.gardens?.[featured.id];
  return (
    <BookScrollView testID="seed-shop" contentContainerStyle={[ui.page, { gap: 16 }]}>
      <Label>LES TRÉSORS DU BOTANISTE</Label>
      <T serif style={ui.title}>
        La Boutique
      </T>
      <T style={ui.muted}>Vos graines font grandir votre collection et transforment votre décor.</T>
      <Paper style={[ui.card, { gap: 8 }]}>
        <Label>VOTRE RÉSERVE · {save.seeds} GRAINES</Label>
        <T>
          Une nouvelle page terminée donne une graine. Les premières trois étoiles en donnent une
          autre, une seule fois. Rejouer une page déjà réussie ne donne plus de graine, sauf pour
          obtenir ses trois étoiles pour la première fois.
        </T>
        <T style={ui.muted}>
          Les indices et les mélanges sont gratuits : gardez vos graines pour vos décors et vos
          jardins.
        </T>
        <T style={ui.muted}>
          Vos anciennes pages ont aussi été prises en compte. Les graines déjà gagnées et les
          papiers acquis sont conservés.
        </T>
      </Paper>
      {!!featured && (
        <Paper testID="featured-garden" style={[ui.card, { gap: 12, backgroundColor: '#f1e8f3' }]}>
          <Label>LE JARDIN À LA UNE</Label>
          <Image
            source={collectionArtwork[featured.species[0].id]}
            resizeMode="contain"
            resizeMethod="resize"
            style={{ width: '100%', height: 210 }}
            accessibilityLabel={featured.species[0].name}
          />
          <T serif style={{ fontSize: 30, lineHeight: 36, color: '#665078' }}>
            {featured.name}
          </T>
          <T>{featured.subtitle}</T>
          <T>
            Le jardin et la première orchidée : {featured.cost} graines. Puis{' '}
            {featured.species[1].cost} graines par nouvelle espèce, avec cinq pages à restaurer.
          </T>
          <T style={ui.muted}>
            Un jardin acquis reste accessible et complétable, même quand une nouvelle collection
            arrive à la une.
          </T>
          <Button
            disabled={!!save.testSession || (!gardenOwned && save.seeds < featured.cost)}
            onPress={() => {
              if (gardenOwned) {
                router.push('/jardin');
                return;
              }
              confirm({
                title: 'Ouvrir le jardin des orchidées ?',
                cost: featured.cost,
                detail:
                  'Votre première orchidée et ses cinq puzzles sont inclus. Les cinq autres espèces pourront être acquises séparément. Le jardin restera dans votre collection.',
                action: () => {
                  setSave((s) => acquireGarden(s, featured.id));
                  router.push('/jardin');
                },
              });
            }}
          >
            {gardenOwned
              ? 'Entrer dans mon jardin'
              : `Débloquer le jardin · ${featured.cost} graines`}
          </Button>
          {!gardenOwned && save.seeds < featured.cost && (
            <T style={ui.muted}>
              Encore {featured.cost - save.seeds} graines pour ouvrir ce jardin.
            </T>
          )}
        </Paper>
      )}
      {!!Object.keys(save.gardens ?? {}).length && (
        <Button secondary onPress={() => router.push('/jardin')}>
          Retrouver mes jardins
        </Button>
      )}
      <Label>LES DÉCORS DES ÉCOSYSTÈMES</Label>
      <T>
        Chaque paysage devient disponible à la découverte de son écosystème. Les graines garanties
        de son premier chapitre couvrent son prix.
      </T>
      <Paper testID="wallpaper-preview" style={[ui.card, { gap: 12 }]}>
        <Image
          source={wallpaperArtwork(item.id)}
          resizeMode="cover"
          resizeMethod="resize"
          style={{ width: '100%', height: 185, borderRadius: 14 }}
          accessibilityLabel={`Aperçu : ${item.name}`}
        />
        <T serif style={{ fontSize: 28, lineHeight: 34 }}>
          {item.name}
        </T>
        <T>
          {owned
            ? 'Ce décor est dans votre collection.'
            : `${item.cost} graines · décor de l’accueil, de l’atelier et du carnet.`}
        </T>
        {!unlocked && !owned && (
          <T style={ui.muted}>
            Disponible à la découverte de cet écosystème, page {item.firstPage}.
          </T>
        )}
        {unlocked && !owned && save.seeds < item.cost && (
          <T style={ui.muted}>Encore {item.cost - save.seeds} graines.</T>
        )}
        <Button
          disabled={
            active || !!save.testSession || (!owned && (!unlocked || save.seeds < item.cost))
          }
          onPress={() => {
            if (owned) {
              setSave((s) => acquireWallpaper(s, item.id));
              return;
            }
            confirm({
              title: `Acquérir « ${item.name} » ?`,
              cost: item.cost,
              detail:
                'Ce paysage sera appliqué immédiatement. Vous pourrez ensuite changer de décor gratuitement parmi vos acquisitions.',
              action: () => setSave((s) => acquireWallpaper(s, item.id)),
            });
          }}
        >
          {active
            ? 'Décor utilisé'
            : owned
              ? 'Utiliser ce décor'
              : `Acquérir ce décor · ${item.cost} graines`}
        </Button>
      </Paper>
      <View style={{ gap: 6 }}>
        {wallpapers.map((w) => (
          <Pressable
            key={w.id}
            testID={`wallpaper-choice-${w.ecosystem}`}
            accessibilityRole="button"
            accessibilityLabel={`Voir le décor ${w.name}`}
            accessibilityState={{ selected: selected === w.id }}
            onPress={() => select(w.id)}
            style={{
              minHeight: 48,
              padding: 12,
              borderRadius: 12,
              backgroundColor: selected === w.id ? '#dce5ce' : '#f5eddcdd',
              borderWidth: 1,
              borderColor: selected === w.id ? '#809563' : '#d9cba9',
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: w.color }} />
            <T style={{ flex: 1 }}>{w.name}</T>
            <T style={{ fontSize: 12, color: C.muted }}>
              {save.ownedWallpapers?.includes(w.id)
                ? 'Acquis'
                : wallpaperUnlocked(save, w.id)
                  ? `${w.cost} graines`
                  : 'À découvrir'}
            </T>
          </Pressable>
        ))}
      </View>
      <Button
        secondary
        disabled={!save.wallpaper || save.wallpaper === 'default'}
        onPress={() => setSave((s) => acquireWallpaper(s, 'default'))}
      >
        Retrouver le décor d’origine
      </Button>
      <T style={ui.muted}>Les achats en argent réel ne sont pas proposés dans cette version.</T>
      {purchase && (
        <CollectionPurchase
          purchase={purchase}
          motion={save.settings.motion}
          onClose={() => confirm(null)}
        />
      )}
    </BookScrollView>
  );
}
