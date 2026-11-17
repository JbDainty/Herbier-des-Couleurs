import React, { useEffect, useRef, useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BookScrollView } from '../src/components/BookScrollView';
import { Paper } from '../src/components/Paper';
import { Button, C, Label, T, ui } from '../src/components/ui';
import { CollectionPurchase, type Purchase } from '../src/components/CollectionPurchase';
import { LiquidBoard } from '../src/components/LiquidBoard';
import { useGame } from '../src/state/store';
import { collections, collectionById } from '../src/data/collections';
import { GoldenPlantSilhouette } from '../src/components/GoldenHerbarium';
import { collectionArtwork } from '../src/data/collectionArtwork';
import { acquireGardenSpecies } from '../src/state/economy';
import {
  gardenPuzzle,
  gardenStage,
  loadGardenPage,
  moveGarden,
  startGarden,
  undoGarden,
} from '../src/state/gardens';
import { pour, type Move } from '../src/engine/puzzle';
import { findHintPath } from '../src/engine/hintSearch';
import { playPourSound } from '../src/services/pourSound';

export default function Jardin() {
  const { save, setSave } = useGame();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ collection?: string }>();
  const requested = collectionById(params.collection ?? '');
  const [playing, setPlaying] = useState(
    !!save.gardenSession &&
      (!requested ||
        (save.gardenSession.collection === requested.id && !save.gardenSession.rewarded)),
  );
  useEffect(() => {
    setPlaying(
      !!save.gardenSession &&
        (!requested ||
          (save.gardenSession.collection === requested.id && !save.gardenSession.rewarded)),
    );
  }, [params.collection]);
  const [purchase, confirm] = useState<Purchase | null>(null);
  const [selected, select] = useState<number | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [note, setNote] = useState('');
  const [pouring, setPouring] = useState<Move | null>(null);
  const pending = useRef<Move | null>(null);
  const search = useRef<AbortController | null>(null);
  const stopPour = useRef<() => void>(() => {});
  const session = save.gardenSession;
  const sessionKey = session ? `${session.collection}/${session.species}/${session.page}` : '';
  useEffect(() => {
    pending.current = null;
    select(null);
    setHint(null);
    setPouring(null);
    setNote('');
    search.current?.abort();
  }, [sessionKey]);
  useEffect(
    () => () => {
      search.current?.abort();
      stopPour.current();
    },
    [],
  );
  const resetSelection = () => {
    select(null);
    setHint(null);
    setNote('');
    search.current?.abort();
  };
  const tap = (to: number) => {
    if (!session || session.rewarded || pending.current) return;
    search.current?.abort();
    setHint(null);
    setNote('');
    if (selected === null) {
      if (session.board[to].length) select(to);
      return;
    }
    if (to === selected) {
      select(null);
      return;
    }
    const board = pour(session.board, selected, to);
    if (!board) {
      setNote('Versez sur une couleur identique ou dans une fiole vide.');
      select(session.board[to].length ? to : null);
      return;
    }
    stopPour.current();
    stopPour.current = playPourSound(
      save.settings,
      session.board[selected].length - board[selected].length,
    );
    if (!save.settings.motion) {
      setSave((s) => moveGarden(s, selected, to));
      select(null);
      return;
    }
    pending.current = { from: selected, to };
    setPouring(pending.current);
  };
  const finish = () => {
    const move = pending.current;
    pending.current = null;
    if (move) setSave((s) => moveGarden(s, move.from, move.to));
    select(null);
    setPouring(null);
  };
  const askHint = async () => {
    if (!session || session.rewarded || pending.current) return;
    search.current?.abort();
    const controller = new AbortController();
    search.current = controller;
    const result = await findHintPath(session.board, undefined, {
      signal: controller.signal,
    }).catch(() => ({ status: 'limit' as const, expanded: 0 }));
    if (controller.signal.aborted) return;
    if (result.status === 'found' && result.path[0]) {
      setHint(result.path[0]);
      setNote(
        `Versez le flacon ${result.path[0].from + 1} dans le flacon ${result.path[0].to + 1}.`,
      );
    } else setNote('Essayez d’annuler un versement ou de recommencer cette page.');
  };
  const owned = requested
    ? [requested]
    : collections.filter((c) => !!save.gardens?.[c.id] || c.kind === 'golden');
  const garden = session && collections.find((c) => c.id === session.collection);
  const flower = garden?.species.find((s) => s.id === session?.species);
  const play = playing && session && garden && flower;
  return (
    <BookScrollView
      testID="collection-garden"
      style={requested?.kind === 'golden' ? { backgroundColor: '#f2dfb3aa' } : undefined}
      contentContainerStyle={[ui.page, { gap: 16 }]}
    >
      <Label>
        {requested?.kind === 'golden'
          ? 'LES CINQ MERVEILLES · COLLECTION PERMANENTE'
          : 'LES JARDINS DE COLLECTION'}
      </Label>
      <T serif style={ui.title}>
        {play ? flower.name : (requested?.name ?? 'Mes jardins')}
      </T>
      {!owned.length && !requested && (
        <Paper style={[ui.card, { gap: 16 }]}>
          <T>
            Les jardins de collection se découvrent dans la boutique. Une première orchidée et ses
            cinq pages sont incluses avec le jardin.
          </T>
          <Button onPress={() => router.push('/boutique')}>Découvrir le jardin à la une</Button>
        </Paper>
      )}
      {play ? (
        <>
          <T>
            {garden.name} · Page {session.page + 1} sur 5
          </T>
          <T style={ui.muted}>Vos pages de la campagne principale vous attendent à votre retour.</T>
          {!session.rewarded ? (
            <Paper style={[ui.card, { padding: 10, gap: 14 }]}>
              <View style={{ alignItems: 'center' }}>
                <LiquidBoard
                  board={session.board}
                  selected={selected}
                  hint={hint}
                  pouring={pouring}
                  disabled={!!pouring}
                  motion={save.settings.motion}
                  patterns={save.settings.patterns}
                  initialWidth={Math.max(220, Math.min(width - 80, 620))}
                  maxHeight={Math.max(240, Math.min(height - 420, 380))}
                  onTap={tap}
                  onFinish={finish}
                />
              </View>
              <View style={{ gap: 6, flexDirection: 'row' }}>
                <Button
                  secondary
                  style={{ flex: 1, paddingHorizontal: 4 }}
                  disabled={!!pouring || !session.history.length}
                  onPress={() => {
                    setSave(undoGarden);
                    resetSelection();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  secondary
                  style={{ flex: 1, paddingHorizontal: 4 }}
                  disabled={!!pouring}
                  onPress={() => {
                    setSave((s) =>
                      loadGardenPage(s, session.collection, session.species, session.page),
                    );
                    resetSelection();
                  }}
                >
                  Recommencer
                </Button>
                <Button
                  secondary
                  style={{ flex: 1, paddingHorizontal: 4 }}
                  disabled={!!pouring}
                  onPress={() => void askHint()}
                >
                  Indice gratuit
                </Button>
              </View>
              {!!note && <T accessibilityLiveRegion="polite">{note}</T>}
            </Paper>
          ) : (
            <Paper
              testID="garden-victory"
              style={[
                ui.card,
                {
                  gap: 14,
                  alignItems: 'center',
                  backgroundColor: garden.kind === 'golden' ? '#ead098' : '#f0e7f2',
                },
              ]}
            >
              <Image
                source={collectionArtwork[flower.id]}
                resizeMode="contain"
                resizeMethod="resize"
                style={{ width: '100%', height: Math.min(330, height * 0.4) }}
                accessibilityLabel={flower.name}
              />
              <T serif style={{ fontSize: 30, lineHeight: 36, textAlign: 'center' }}>
                {session.page === 4
                  ? garden.kind === 'golden'
                    ? 'Votre merveille rayonne'
                    : 'Votre orchidée rayonne'
                  : 'Une nouvelle nuance retrouvée'}
              </T>
              <T>{gardenStage(save, garden.id, flower.id)} / 5 pages restaurées</T>
              <T style={ui.muted}>Les pages de ce jardin ne rapportent pas de graines.</T>
              <Button
                onPress={() => {
                  resetSelection();
                  if (session.page < 4)
                    setSave((s) => loadGardenPage(s, garden.id, flower.id, session.page + 1));
                  else {
                    setSave((s) => ({ ...s, gardenSession: undefined }));
                    setPlaying(false);
                  }
                }}
              >
                {session.page < 4
                  ? 'Restaurer la page suivante'
                  : garden.kind === 'golden'
                    ? 'Contempler mon herbier doré'
                    : 'Contempler mon jardin'}
              </Button>
            </Paper>
          )}
          <Button
            secondary
            disabled={!!pouring}
            onPress={() => {
              search.current?.abort();
              setPlaying(false);
            }}
          >
            {garden.kind === 'golden'
              ? 'Retrouver mes cinq merveilles'
              : 'Retrouver toutes mes orchidées'}
          </Button>
        </>
      ) : (
        owned.map((garden) => (
          <View key={garden.id} style={{ gap: 14 }}>
            <T serif style={{ fontSize: 30, lineHeight: 36, color: '#6c527b' }}>
              {garden.name}
            </T>
            <T>{garden.subtitle}</T>
            {garden.kind === 'golden' && (
              <T>
                Chaque espèce coûte 200 graines, avec cinq pages à restaurer. L’herbier s’ouvre
                librement et vos acquisitions restent dans votre collection. Ces pages ne rapportent
                pas de graines.
              </T>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {garden.species.map((flower) => {
                const acquired = save.gardens?.[garden.id]?.species.includes(flower.id) ?? false;
                const stage = gardenStage(save, garden.id, flower.id);
                const inProgress =
                  save.gardenSession?.collection === garden.id &&
                  save.gardenSession.species === flower.id;
                return (
                  <Paper
                    testID={`garden-species-${flower.id}`}
                    key={flower.id}
                    style={[
                      ui.card,
                      {
                        width: width >= 700 ? '47%' : '100%',
                        gap: 12,
                        backgroundColor:
                          garden.kind === 'golden' ? '#ead098' : acquired ? '#f1e9ef' : '#f4eddf',
                      },
                    ]}
                  >
                    {garden.kind === 'golden' && !acquired ? (
                      <View
                        testID={`golden-silhouette-${flower.id}`}
                        style={{ alignItems: 'center' }}
                      >
                        <GoldenPlantSilhouette
                          species={flower.id}
                          height={250}
                          width={Math.min(width - 110, 260)}
                        />
                      </View>
                    ) : (
                      <Image
                        source={collectionArtwork[flower.id]}
                        resizeMode="contain"
                        resizeMethod="resize"
                        style={{
                          width: '100%',
                          height: garden.kind === 'golden' ? 320 : 210,
                          opacity: acquired ? 1 : 0.55,
                          borderRadius: 12,
                        }}
                        accessibilityLabel={`Aperçu : ${flower.name}`}
                      />
                    )}
                    <T serif style={{ fontSize: 27, lineHeight: 33 }}>
                      {flower.name}
                    </T>
                    <T>{flower.description}</T>
                    <T style={{ color: C.muted }}>
                      {acquired
                        ? `${stage} / 5 pages restaurées`
                        : `${flower.cost} graines · cinq nouvelles pages`}
                    </T>
                    <Button
                      disabled={!!save.testSession || (!acquired && save.seeds < flower.cost)}
                      onPress={() => {
                        if (acquired) {
                          setSave((s) => startGarden(s, garden.id, flower.id));
                          setPlaying(true);
                          return;
                        }
                        confirm({
                          title: `Accueillir ${flower.name.toLowerCase()} ?`,
                          cost: flower.cost,
                          detail:
                            garden.kind === 'golden'
                              ? 'Cette merveille et ses cinq puzzles rejoindront définitivement votre herbier doré. Cet achat ne débloque que cette espèce, sans frais d’entrée supplémentaires.'
                              : 'Cette espèce et ses cinq puzzles rejoindront définitivement votre jardin. Votre première orchidée reste acquise.',
                          action: () =>
                            setSave((s) => acquireGardenSpecies(s, garden.id, flower.id)),
                        });
                      }}
                    >
                      {acquired
                        ? stage === 5
                          ? garden.kind === 'golden'
                            ? 'Rejouer cette merveille'
                            : 'Rejouer cette orchidée'
                          : inProgress
                            ? garden.kind === 'golden'
                              ? 'Continuer cette merveille'
                              : 'Continuer cette orchidée'
                            : garden.kind === 'golden'
                              ? 'Restaurer cette merveille'
                              : 'Restaurer cette orchidée'
                        : `${garden.kind === 'golden' ? 'Acquérir cette merveille' : 'Accueillir cette orchidée'} · ${flower.cost} graines`}
                    </Button>
                  </Paper>
                );
              })}
            </View>
          </View>
        ))
      )}
      {requested?.kind === 'golden' && (
        <Button secondary onPress={() => router.push('/herbier?volume=20')}>
          Retrouver le grand herbier doré
        </Button>
      )}
      <Button secondary onPress={() => router.push('/boutique')}>
        Retour à la boutique
      </Button>
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
