import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BookScrollView } from '../src/components/BookScrollView';
import { HomeGarden } from '../src/components/HomeGarden';
import { Paper } from '../src/components/Paper';
import { VitrailBoard } from '../src/components/VitrailBoard';
import { VitrailLesson } from '../src/components/VitrailLesson';
import { useVitrailDate } from '../src/components/useVitrailDate';
import { CarnetIllustration, type CarnetEmblem } from '../src/components/CarnetIllustration';
import { Button, C, Icon, T } from '../src/components/ui';
import { F } from '../src/components/fonts';
import { useGame } from '../src/state/store';
import {
  acknowledgeOptics,
  activeVitrail,
  newOpticalLessons,
  openVitrail,
  rotateVitrail,
  undoVitrail,
} from '../src/state/vitrail';
import {
  lightColors,
  opticalMechanics,
  traceVitrail,
  vitrailHint,
  type OpticalMechanic,
} from '../src/engine/vitrail';
import { vitrailDifficulties, vitrailForDay, vitrailRange } from '../src/data/vitrails';

const dateLabel = (day: string) =>
  new Date(day + 'T12:00:00Z').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
const links: {
  title: string;
  path: '/herbier' | '/carte' | '/boutique' | '/parametres';
  emblem: CarnetEmblem;
}[] = [
  { title: 'Herbier', path: '/herbier', emblem: 'herbier' },
  { title: 'Écosystèmes', path: '/carte', emblem: 'ecosystemes' },
  { title: 'Boutique', path: '/boutique', emblem: 'boutique' },
  { title: 'Paramètres', path: '/parametres', emblem: 'parametres' },
];

export default function Vitrail() {
  const { save, setSave } = useGame(),
    today = useVitrailDate(),
    { day: requested } = useLocalSearchParams<{ day?: string }>();
  const { width, height } = useWindowDimensions();
  const day = typeof requested === 'string' ? requested : today,
    pack = vitrailForDay(day),
    allowed = !!pack && day <= today;
  const session = save.vitrail?.session?.day === day ? save.vitrail.session : undefined;
  const puzzle = session ? activeVitrail(session) : undefined;
  const [boardSpace, setBoardSpace] = useState(0),
    [selected, setSelected] = useState<number | null>(null),
    [note, setNote] = useState('');
  const [calendar, setCalendar] = useState(false),
    [month, setMonth] = useState(today.slice(0, 7));
  const [recall, setRecall] = useState<OpticalMechanic[] | null>(null);
  const entry = save.vitrail?.days[day],
    completed = entry?.completed ?? 0;
  const trace = puzzle && session ? traceVitrail(puzzle, session.rotations) : undefined;
  const lessons = puzzle && !trace?.solved ? newOpticalLessons(save, puzzle) : [];
  const lesson = lessons[0] ?? recall?.[0];
  useEffect(() => {
    if (save.started && allowed) setSave((s) => openVitrail(s, day));
  }, [day, save.started, !!save.testSession]);
  useEffect(() => {
    setSelected(null);
    setNote('');
    setRecall(null);
  }, [day, session?.level]);
  const restart = () => {
    if (!session) return;
    setSave((s) => openVitrail(s, day, session.level, true));
    setSelected(null);
    setNote('');
  };
  const boardWidth = puzzle
    ? Math.max(
        0,
        Math.min(
          boardSpace || Math.max(220, width - 48),
          Math.max((puzzle.size + 1) * 44, Math.min(430, height * 0.38)),
        ),
      )
    : 0;
  const archived = day !== today;
  const monthDate = new Date(month + '-01T12:00:00Z');
  const offset = (monthDate.getUTCDay() + 6) % 7;
  const monthLength = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const moveMonth = (delta: number) =>
    setMonth(
      new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + delta, 1))
        .toISOString()
        .slice(0, 7),
    );
  return (
    <View testID="daily-vitrail-screen" style={{ flex: 1, minHeight: 0 }}>
      <HomeGarden width={width} height={height} motion={save.settings.motion} />
      <BookScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 650,
          alignSelf: 'center',
          padding: 10,
          paddingTop: 0,
          gap: 10,
        }}
      >
        <View style={{ alignItems: 'center', gap: 2 }}>
          <T serif accessibilityRole="header" style={{ fontSize: 32, textAlign: 'center' }}>
            Le Vitrail du jour
          </T>
          <T testID="vitrail-date" style={{ fontFamily: F.scientific, fontSize: 17 }}>
            {allowed ? dateLabel(day) : 'Les prochains feuillets'}
          </T>
        </View>
        {save.testSession ? (
          <Paper style={{ padding: 22, borderRadius: 24, backgroundColor: C.card, gap: 14 }}>
            <T>Retrouvez votre carnet pour jouer les vitraux du jour.</T>
            <Button onPress={() => router.push('/parametres')}>Retrouver ma partie</Button>
          </Paper>
        ) : !allowed ? (
          <Paper
            testID="vitrail-unavailable"
            style={{ padding: 24, borderRadius: 24, backgroundColor: C.card, gap: 14 }}
          >
            <T>
              {day > today
                ? 'Ce feuillet n’est pas encore ouvert.'
                : 'De nouveaux vitraux sont en préparation. Une prochaine mise à jour prolongera le calendrier.'}
            </T>
            {day !== today && (
              <Button onPress={() => router.setParams({ day: undefined })}>
                Le trio d’aujourd’hui
              </Button>
            )}
            <Button
              secondary
              onPress={() => {
                setMonth(
                  vitrailRange.last.slice(0, 7) < today.slice(0, 7)
                    ? vitrailRange.last.slice(0, 7)
                    : today.slice(0, 7),
                );
                setCalendar(true);
              }}
            >
              Consulter les feuillets passés
            </Button>
          </Paper>
        ) : (
          <>
            <View
              testID="vitrail-stages"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              {vitrailDifficulties.map((label, index) => {
                const current = session?.level === index,
                  done = completed > index,
                  locked = index > completed;
                return (
                  <Pressable
                    key={label}
                    testID={`vitrail-stage-${index}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Vitrail ${index + 1}, ${label}${done ? ', terminé' : locked ? ', verrouillé' : ''}`}
                    accessibilityState={{ disabled: locked, selected: current }}
                    disabled={locked || !!lesson}
                    onPress={() => setSave((s) => openVitrail(s, day, index))}
                    style={{
                      flex: 1,
                      minHeight: 58,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: '#af8b49',
                        backgroundColor: current ? C.green : '#f4ead6e8',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done ? (
                        <Icon name="leaf-outline" size={20} color={current ? '#f8efd3' : C.green} />
                      ) : locked ? (
                        <Icon name="lock-closed-outline" size={16} color={C.muted} />
                      ) : (
                        <T style={{ fontSize: 20, color: current ? '#f8efd3' : C.ink }}>
                          {index + 1}
                        </T>
                      )}
                    </View>
                    <T
                      style={{
                        fontFamily: F.scientific,
                        fontSize: 14,
                        color: locked ? C.muted : C.green,
                      }}
                    >
                      {label}
                    </T>
                  </Pressable>
                );
              })}
            </View>
            <T
              testID="vitrail-progress"
              accessibilityLiveRegion="polite"
              style={{ fontFamily: F.scientific, fontSize: 16, textAlign: 'center' }}
            >
              {completed} / 3 vitraux terminés
            </T>
            {archived && (
              <T style={{ textAlign: 'center', fontSize: 13, color: C.muted }}>
                Feuillet passé · entraînement gratuit, sans nouvelle graine.
              </T>
            )}
            {puzzle && session && trace ? (
              <Paper
                testID="vitrail-play-card"
                style={{ padding: 12, borderRadius: 26, backgroundColor: '#f4ead6f2', gap: 8 }}
              >
                <T
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.5,
                    color: '#8e754a',
                    textAlign: 'center',
                  }}
                >
                  VITRAIL {session.level + 1} ·{' '}
                  {vitrailDifficulties[session.level].toLocaleUpperCase('fr-FR')}
                </T>
                <View
                  onLayout={(e) => setBoardSpace(e.nativeEvent.layout.width)}
                  style={{ alignItems: 'center', width: '100%' }}
                >
                  <VitrailBoard
                    puzzle={puzzle}
                    rotations={session.rotations}
                    width={boardWidth}
                    selected={selected}
                    patterns={save.settings.patterns}
                    disabled={!!lesson || trace.solved}
                    onRotate={(cell) => {
                      setSelected(cell);
                      setNote('');
                      setSave((s) => rotateVitrail(s, cell));
                    }}
                  />
                </View>
                <T
                  testID="vitrail-target-status"
                  accessibilityLiveRegion="polite"
                  style={{ fontFamily: F.scientific, fontSize: 14, textAlign: 'center' }}
                >
                  {trace.lit.filter(Boolean).length} / {puzzle.targets.length} fleurs éclairées
                </T>
                {trace.solved ? (
                  <>
                    <T testID="vitrail-victory" serif style={{ fontSize: 23, textAlign: 'center' }}>
                      {session.level === 2
                        ? 'Les trois vitraux rayonnent'
                        : 'Votre vitrail s’illumine'}
                    </T>
                    {session.level < 2 ? (
                      <Button
                        onPress={() => setSave((s) => openVitrail(s, day, session.level + 1))}
                      >
                        Passer au vitrail {session.level + 2}
                      </Button>
                    ) : (
                      <Button onPress={() => setCalendar(true)}>Voir mon calendrier</Button>
                    )}
                    <Button secondary onPress={restart}>
                      Rejouer ce vitrail
                    </Button>
                  </>
                ) : (
                  <>
                    <T style={{ fontFamily: F.scientific, fontSize: 15, textAlign: 'center' }}>
                      Touchez un fragment pour le faire pivoter.
                    </T>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Button
                        secondary
                        icon="arrow-undo-outline"
                        disabled={!session.history.length || !!lesson}
                        style={{ flex: 1, paddingHorizontal: 8 }}
                        onPress={() => {
                          setSave(undoVitrail);
                          setNote('');
                          setSelected(null);
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        icon="leaf-outline"
                        disabled={!!lesson}
                        style={{ flex: 1, paddingHorizontal: 8 }}
                        onPress={() => {
                          const cell = vitrailHint(puzzle, session.rotations);
                          setSelected(cell);
                          setNote(
                            cell === null
                              ? 'Toutes les fleurs sont éclairées.'
                              : `Faites pivoter le fragment de la ligne ${Math.floor(cell / puzzle.size) + 1}, colonne ${(cell % puzzle.size) + 1}.`,
                          );
                        }}
                      >
                        Indice
                      </Button>
                    </View>
                    {!!note && (
                      <T
                        testID="vitrail-hint"
                        accessibilityLiveRegion="polite"
                        style={{ fontSize: 14, textAlign: 'center' }}
                      >
                        {note}
                      </T>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={restart}
                        style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 }}
                      >
                        <T style={{ fontSize: 13, color: C.muted }}>Recommencer</T>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setRecall(opticalMechanics(puzzle))}
                        style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 }}
                      >
                        <T style={{ fontSize: 13, color: C.muted }}>Les règles du vitrail</T>
                      </Pressable>
                    </View>
                  </>
                )}
              </Paper>
            ) : (
              <T>Ouverture du vitrail…</T>
            )}
            <Paper
              testID="vitrail-reward"
              style={{
                padding: 12,
                borderRadius: 22,
                backgroundColor: '#f4ead6ed',
                gap: 2,
                alignItems: 'center',
              }}
            >
              <T serif style={{ fontSize: 21, textAlign: 'center' }}>
                {archived
                  ? 'Les feuillets de votre calendrier'
                  : entry?.rewarded
                    ? 'Graine du jour obtenue'
                    : '3 vitraux terminés = 1 graine'}
              </T>
              <T style={{ fontFamily: F.scientific, fontSize: 14, textAlign: 'center' }}>
                {archived
                  ? 'Vos vitraux restent rejouables.'
                  : entry?.rewarded
                    ? 'Rejouez librement, votre récompense est conservée.'
                    : 'Une seule récompense par jour.'}
              </T>
            </Paper>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              <Button
                secondary
                onPress={() => {
                  setMonth(day.slice(0, 7));
                  setCalendar(true);
                }}
              >
                Mon calendrier
              </Button>
              {archived && (
                <Button secondary onPress={() => router.setParams({ day: undefined })}>
                  Aujourd’hui
                </Button>
              )}
            </View>
            <T style={{ fontSize: 11, textAlign: 'center', color: C.muted }}>
              Trois nouveaux vitraux chaque jour · renouvellement à minuit UTC.
            </T>
          </>
        )}
        <View
          style={{
            flexDirection: 'row',
            padding: 5,
            borderRadius: 24,
            backgroundColor: '#f5ecd2e8',
            borderWidth: 0.6,
            borderColor: '#b6a67b77',
          }}
        >
          {links.map((link) => (
            <Pressable
              key={link.path}
              accessibilityRole="link"
              accessibilityLabel={link.title}
              onPress={() => router.push(link.path)}
              style={{
                width: '25%',
                minHeight: 58,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CarnetIllustration name={link.emblem} size={27} />
              <T
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontFamily: F.scientific, fontSize: 14, textAlign: 'center' }}
              >
                {link.title}
              </T>
            </Pressable>
          ))}
        </View>
      </BookScrollView>
      {lesson && (
        <VitrailLesson
          mechanic={lesson}
          motion={save.settings.motion}
          onAcknowledge={() => {
            setSave((s) => acknowledgeOptics(s, lesson));
            if (recall) setRecall(recall.slice(1));
          }}
          onClose={() => {
            if (recall) setRecall(null);
            else router.dismissTo('/');
          }}
        />
      )}
      <Modal
        visible={calendar}
        transparent
        animationType={save.settings.motion ? 'fade' : 'none'}
        onRequestClose={() => setCalendar(false)}
      >
        <View
          style={{
            flex: 1,
            padding: 16,
            backgroundColor: '#233e31bd',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ScrollView
            style={{ width: '100%', maxWidth: 430, maxHeight: '90%' }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <Paper
              testID="vitrail-calendar"
              accessibilityViewIsModal
              style={{ padding: 18, borderRadius: 26, backgroundColor: C.card, gap: 12 }}
            >
              <T serif accessibilityRole="header" style={{ fontSize: 27, textAlign: 'center' }}>
                Le calendrier des vitraux
              </T>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mois précédent"
                  disabled={month <= vitrailRange.first.slice(0, 7)}
                  onPress={() => moveMonth(-1)}
                  style={{
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: month <= vitrailRange.first.slice(0, 7) ? 0.3 : 1,
                  }}
                >
                  <Icon name="arrow-undo-outline" size={23} />
                </Pressable>
                <T style={{ fontFamily: F.scientific, fontSize: 19 }}>
                  {monthDate.toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mois suivant"
                  disabled={month >= today.slice(0, 7) || month >= vitrailRange.last.slice(0, 7)}
                  onPress={() => moveMonth(1)}
                  style={{
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity:
                      month >= today.slice(0, 7) || month >= vitrailRange.last.slice(0, 7)
                        ? 0.3
                        : 1,
                  }}
                >
                  <Icon name="arrow-forward-outline" size={23} />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row' }}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => (
                  <T
                    key={i}
                    style={{ width: '14.2857%', textAlign: 'center', fontSize: 12, color: C.muted }}
                  >
                    {label}
                  </T>
                ))}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: offset + monthLength }, (_, i) => {
                  const number = i - offset + 1,
                    key = month + '-' + String(number).padStart(2, '0');
                  const valid = number > 0 && !!vitrailForDay(key) && key <= today,
                    progress = save.vitrail?.days[key];
                  return (
                    <Pressable
                      key={i}
                      testID={number > 0 ? `vitrail-calendar-${key}` : undefined}
                      accessibilityRole={number > 0 ? 'button' : undefined}
                      accessibilityLabel={
                        number > 0
                          ? `${dateLabel(key)}, ${progress?.completed ?? 0} vitraux sur 3 terminés`
                          : undefined
                      }
                      disabled={!valid}
                      onPress={() => {
                        router.setParams({ day: key === today ? undefined : key });
                        setCalendar(false);
                      }}
                      style={{
                        width: '14.2857%',
                        minHeight: 52,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          key === today
                            ? '#dfe6cf'
                            : progress?.completed === 3
                              ? '#eee0ba'
                              : undefined,
                        borderRadius: 12,
                        opacity: valid ? 1 : 0.3,
                      }}
                    >
                      {number > 0 && (
                        <>
                          <T style={{ fontSize: 15 }}>{number}</T>
                          <T
                            style={{
                              fontSize: 9,
                              color: progress?.completed === 3 ? C.green : C.muted,
                            }}
                          >
                            {progress ? `${progress.completed}/3` : '·'}
                          </T>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <T style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>
                Rejouer un feuillet passé ne donne pas de nouvelle graine.
              </T>
              <Button onPress={() => setCalendar(false)}>Fermer le calendrier</Button>
            </Paper>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
