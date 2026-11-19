import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BookScrollView } from '../src/components/BookScrollView';
import { HomeGarden } from '../src/components/HomeGarden';
import { Paper } from '../src/components/Paper';
import { VitrailScene } from '../src/components/VitrailScene';
import { VitrailLesson } from '../src/components/VitrailLesson';
import { useVitrailDate } from '../src/components/useVitrailDate';
import { Button, C, Icon, T } from '../src/components/ui';
import { F } from '../src/components/fonts';
import { useGame } from '../src/state/store';
import {
  acknowledgeOptics,
  activeVitrail,
  newOpticalLessons,
  openVitrail,
} from '../src/state/vitrail';
import { opticalMechanics, traceVitrail, type OpticalMechanic } from '../src/engine/vitrail';
import { vitrailForDay, vitrailRange } from '../src/data/vitrails';

const dateLabel = (day: string) =>
  new Date(day + 'T12:00:00Z').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
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
  const [calendar, setCalendar] = useState(false),
    [month, setMonth] = useState(today.slice(0, 7));
  const [recall, setRecall] = useState<OpticalMechanic[] | null>(null);
  const trace = puzzle && session ? traceVitrail(puzzle, session.rotations) : undefined;
  const lessons = puzzle && !trace?.solved ? newOpticalLessons(save, puzzle) : [];
  const lesson = lessons[0] ?? recall?.[0];
  useEffect(() => {
    if (save.started && allowed) setSave((s) => openVitrail(s, day));
  }, [day, save.started, !!save.testSession]);
  useEffect(() => {
    setRecall(null);
  }, [day, session?.level]);
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
      {allowed && !save.testSession && puzzle && session ? (
        <VitrailScene
          day={day}
          today={today}
          date={dateLabel(day)}
          session={session}
          puzzle={puzzle}
          blocked={!!lesson}
          onCalendar={() => {
            setMonth(day.slice(0, 7));
            setCalendar(true);
          }}
          onRules={() => setRecall(opticalMechanics(puzzle))}
        />
      ) : (
        <BookScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <T serif style={{ fontSize: 30, textAlign: 'center' }}>
            Le Vitrail du jour
          </T>
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
            <T>Ouverture du vitrail…</T>
          )}
        </BookScrollView>
      )}
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
