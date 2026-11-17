import React, { useEffect, useRef, useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { BookScrollView } from '../src/components/BookScrollView';
import { Paper } from '../src/components/Paper';
import { Button, C, Label, T, ui } from '../src/components/ui';
import { CollectionPurchase, type Purchase } from '../src/components/CollectionPurchase';
import { LiquidBoard } from '../src/components/LiquidBoard';
import { useGame } from '../src/state/store';
import { collections } from '../src/data/collections';
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
  const [playing, setPlaying] = useState(!!save.gardenSession);
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
  const owned = collections.filter((c) => !!save.gardens?.[c.id]);
  const garden = session && collections.find((c) => c.id === session.collection);
  const flower = garden?.species.find((s) => s.id === session?.species);
  const play = playing && session && garden && flower;
  return (
    <BookScrollView testID="collection-garden" contentContainerStyle={[ui.page, { gap: 16 }]}>
      <Label>LES JARDINS DE COLLECTION</Label>
      <T serif style={ui.title}>
        {play ? flower.name : 'Mes jardins'}
      </T>
      {!owned.length && (
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
              style={[ui.card, { gap: 14, alignItems: 'center', backgroundColor: '#f0e7f2' }]}
            >
              <Image
                source={collectionArtwork[flower.id]}
                resizeMode="contain"
                resizeMethod="resize"
                style={{ width: '100%', height: Math.min(330, height * 0.4) }}
                accessibilityLabel={flower.name}
              />
              <T serif style={{ fontSize: 30, lineHeight: 36, textAlign: 'center' }}>
                {session.page === 4 ? 'Votre orchidée rayonne' : 'Une nouvelle nuance retrouvée'}
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
                {session.page < 4 ? 'Restaurer la page suivante' : 'Contempler mon jardin'}
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
            Retrouver toutes mes orchidées
          </Button>
        </>
      ) : (
        owned.map((garden) => (
          <View key={garden.id} style={{ gap: 14 }}>
            <T serif style={{ fontSize: 30, lineHeight: 36, color: '#6c527b' }}>
              {garden.name}
            </T>
            <T>{garden.subtitle}</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {garden.species.map((flower) => {
                const acquired = save.gardens![garden.id].species.includes(flower.id);
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
                        backgroundColor: acquired ? '#f1e9ef' : '#f4eddf',
                      },
                    ]}
                  >
                    <Image
                      source={collectionArtwork[flower.id]}
                      resizeMode="contain"
                      resizeMethod="resize"
                      style={{ width: '100%', height: 210, opacity: acquired ? 1 : 0.55 }}
                      accessibilityLabel={`Aperçu : ${flower.name}`}
                    />
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
                            'Cette espèce et ses cinq puzzles rejoindront définitivement votre jardin. Votre première orchidée reste acquise.',
                          action: () =>
                            setSave((s) => acquireGardenSpecies(s, garden.id, flower.id)),
                        });
                      }}
                    >
                      {acquired
                        ? stage === 5
                          ? 'Rejouer cette orchidée'
                          : inProgress
                            ? 'Continuer cette orchidée'
                            : 'Restaurer cette orchidée'
                        : `Accueillir cette orchidée · ${flower.cost} graines`}
                    </Button>
                  </Paper>
                );
              })}
            </View>
          </View>
        ))
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
