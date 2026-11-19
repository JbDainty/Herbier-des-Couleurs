import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BookScrollView } from '../src/components/BookScrollView';
import { HomeGarden } from '../src/components/HomeGarden';
import { Paper } from '../src/components/Paper';
import { VitrailScene } from '../src/components/VitrailScene';
import { VitrailLesson } from '../src/components/VitrailLesson';
import { VitrailCalendar } from '../src/components/VitrailCalendar';
import { useVitrailDate } from '../src/components/useVitrailDate';
import { Button, C, T } from '../src/components/ui';
import { useGame } from '../src/state/store';
import {
  acknowledgeOptics,
  activeVitrail,
  newOpticalLessons,
  openVitrail,
} from '../src/state/vitrail';
import { opticalMechanics, traceVitrail, type OpticalMechanic } from '../src/engine/vitrail';
import { vitrailForDay } from '../src/data/vitrails';

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
  const [calendar, setCalendar] = useState(false);
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
              <Button secondary onPress={() => setCalendar(true)}>
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
      <VitrailCalendar
        visible={calendar}
        initialDay={allowed ? day : today}
        today={today}
        onSelect={(key) => {
          router.setParams({ day: key === today ? undefined : key });
          setCalendar(false);
        }}
        onClose={() => setCalendar(false)}
      />
    </View>
  );
}
