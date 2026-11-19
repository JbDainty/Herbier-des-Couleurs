import React, { useContext, useEffect, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { BookChromeContext } from './BookScrollView';
import { useMeasuredSize } from './useMeasuredSize';
import { VitrailBoard } from './VitrailBoard';
import { Paper } from './Paper';
import { HerbariumTitle } from './HerbariumTitle';
import { SeedPouch } from './SeedPouch';
import { VictoryAction } from './VictoryAction';
import { C, Icon, T } from './ui';
import { F } from './fonts';
import { vitrailLayout } from '../layout/vitrail';
import { useGame } from '../state/store';
import { openVitrail, rotateVitrail, undoVitrail, type VitrailSession } from '../state/vitrail';
import { traceVitrail, vitrailHint, type VitrailPuzzle } from '../engine/vitrail';
import { vitrailDifficulties } from '../data/vitrails';

export function VitrailScene({
  day,
  today,
  date,
  session,
  puzzle,
  blocked,
  onCalendar,
  onRules,
}: {
  day: string;
  today: string;
  date: string;
  session: VitrailSession;
  puzzle: VitrailPuzzle;
  blocked: boolean;
  onCalendar: () => void;
  onRules: () => void;
}) {
  const { save, setSave } = useGame(),
    window = useWindowDimensions(),
    chrome = useContext(BookChromeContext),
    measured = useMeasuredSize();
  const width = measured.size.width || chrome.availableWidth || window.width,
    height = measured.size.height || chrome.availableHeight || window.height;
  const layout = vitrailLayout(width, height, puzzle.size, window.fontScale);
  const [selected, setSelected] = useState<number | null>(null),
    [hint, setHint] = useState<number | null>(null);
  useEffect(() => {
    setSelected(null);
    setHint(null);
  }, [day, session.level]);
  const trace = traceVitrail(puzzle, session.rotations),
    completed = save.vitrail?.days[day]?.completed ?? 0,
    rewarded = !!save.vitrail?.days[day]?.rewarded,
    archived = day !== today;
  const restart = () => {
    setSave((s) => openVitrail(s, day, session.level, true));
    setSelected(null);
    setHint(null);
  };
  const tool = (
    name: string,
    label: string,
    icon: React.ComponentProps<typeof Icon>['name'],
    action: () => void,
    disabled = false,
    primary = false,
  ) => (
    <Pressable
      key={name}
      testID={`vitrail-tool-${name}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled || blocked}
      onPress={action}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        height: layout.actionsHeight,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        borderRadius: 14,
        borderWidth: 0.8,
        borderColor: primary ? C.green : '#cabb98',
        backgroundColor: primary ? C.green : '#f7efd488',
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={19} color={primary ? '#fff4dd' : C.green} />
      <T
        maxFontSizeMultiplier={1.15}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={{
          fontSize: 11,
          lineHeight: 14,
          textAlign: 'center',
          color: primary ? '#fff4dd' : C.green,
        }}
      >
        {name === 'rules'
          ? 'Règles'
          : name === 'restart'
            ? layout.controlsWidth < 320
              ? 'Repartir'
              : 'Recommencer'
            : name === 'replay'
              ? 'Rejouer'
              : label}
      </T>
    </Pressable>
  );
  const header = (
    <View
      testID="vitrail-header"
      style={{ height: layout.headerHeight, width: '100%', justifyContent: 'center' }}
    >
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu principal"
          onPress={() => router.dismissTo('/')}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="book-outline" size={22} />
          <T
            maxFontSizeMultiplier={1.1}
            style={{ fontFamily: F.scientific, fontSize: 9, lineHeight: 11 }}
          >
            Menu
          </T>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
          {layout.tight ? (
            <T
              serif
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              maxFontSizeMultiplier={1.1}
              style={{
                fontSize: Math.min(23, Math.max(14, (layout.controlsWidth - 112) / 9)),
                lineHeight: 26,
                textAlign: 'center',
                width: '100%',
              }}
            >
              Le Vitrail du jour
            </T>
          ) : (
            <HerbariumTitle compact hud motion={save.settings.motion} />
          )}
          {layout.tight && (
            <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'center' }}>
              <T
                testID="vitrail-date"
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontFamily: F.scientific, fontSize: 11, lineHeight: 14, flexShrink: 1 }}
              >
                {date}
              </T>
              <T
                testID="vitrail-progress"
                accessibilityLabel={`${completed} vitraux sur 3 terminés`}
                accessibilityLiveRegion="polite"
                maxFontSizeMultiplier={1.1}
                style={{ fontSize: 11, lineHeight: 14 }}
              >
                {completed} / 3
              </T>
            </View>
          )}
        </View>
        <SeedPouch compact count={save.seeds} motion={save.settings.motion} />
      </View>
      {!layout.tight && (
        <View
          style={{
            height: layout.headerHeight - 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T
            serif
            accessibilityRole="header"
            maxFontSizeMultiplier={1.15}
            style={{ fontSize: 29, lineHeight: 33 }}
          >
            Le Vitrail du jour
          </T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <T
              testID="vitrail-date"
              maxFontSizeMultiplier={1.15}
              style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 18 }}
            >
              {date}
            </T>
            <T
              testID="vitrail-progress"
              accessibilityLiveRegion="polite"
              maxFontSizeMultiplier={1.15}
              style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 18 }}
            >
              {completed} / 3 vitraux terminés
            </T>
          </View>
        </View>
      )}
    </View>
  );
  const stages = (
    <View
      testID="vitrail-stages"
      style={{ height: layout.stagesHeight, flexDirection: 'row', gap: 4 }}
    >
      {vitrailDifficulties.map((label, index) => {
        const active = session.level === index,
          done = completed > index,
          locked = index > completed;
        return (
          <Pressable
            key={index}
            testID={`vitrail-stage-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`Vitrail ${index + 1}, ${label}${done ? ', terminé' : locked ? ', verrouillé' : ''}`}
            accessibilityState={{ disabled: locked, selected: active }}
            disabled={locked || blocked}
            onPress={() => setSave((s) => openVitrail(s, day, index))}
            style={{
              flex: 1,
              minWidth: 0,
              height: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              borderRadius: 16,
              borderWidth: 0.7,
              borderColor: active ? '#8e9d73' : '#cabb9888',
              backgroundColor: active ? '#dce4c9e8' : '#f4ead6bb',
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: active ? C.green : '#f4ead6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {done ? (
                <Icon name="leaf-outline" size={15} color={active ? '#fff4dd' : C.green} />
              ) : locked ? (
                <Icon name="lock-closed-outline" size={13} />
              ) : (
                <T
                  maxFontSizeMultiplier={1}
                  style={{ fontSize: 13, lineHeight: 17, color: active ? '#fff4dd' : C.green }}
                >
                  {index + 1}
                </T>
              )}
            </View>
            <T
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 18, flexShrink: 1 }}
            >
              {index === 1 && layout.controlsWidth < 320 ? 'Moyen' : label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
  const caption = (
    <View
      testID="vitrail-caption"
      style={{
        height: layout.captionHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: trace.solved ? 'center' : 'space-between',
        gap: 6,
        paddingHorizontal: 4,
      }}
    >
      {trace.solved ? (
        <T
          testID="vitrail-victory"
          serif
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.15}
          style={{
            fontSize: layout.tight ? 18 : 21,
            lineHeight: layout.tight ? 22 : 26,
            textAlign: 'center',
          }}
        >
          {session.level === 2 ? 'Les trois vitraux rayonnent' : 'Votre vitrail s’illumine'}
        </T>
      ) : (
        <>
          <T
            testID="vitrail-target-status"
            maxFontSizeMultiplier={1.15}
            accessibilityLiveRegion="polite"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: F.scientific,
              fontSize: 13,
              lineHeight: layout.tight ? 22 : 26,
              flexShrink: 1,
            }}
          >
            {trace.lit.filter(Boolean).length} / {puzzle.targets.length} fleurs éclairées
          </T>
          <T
            testID={hint === null ? 'vitrail-instruction' : 'vitrail-hint'}
            accessibilityLiveRegion="polite"
            accessibilityLabel={
              hint === null
                ? undefined
                : `Faites pivoter le fragment de la ligne ${Math.floor(hint / puzzle.size) + 1}, colonne ${(hint % puzzle.size) + 1}.`
            }
            maxFontSizeMultiplier={1.15}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontSize: 12,
              lineHeight: layout.tight ? 22 : 26,
              color: hint === null ? C.muted : C.green,
              flexShrink: 1,
            }}
          >
            {hint === null
              ? 'Touchez pour pivoter'
              : `Faites pivoter L${Math.floor(hint / puzzle.size) + 1} · C${(hint % puzzle.size) + 1}`}
          </T>
        </>
      )}
    </View>
  );
  const actions = (
    <View
      testID="vitrail-actions"
      style={{ height: layout.actionsHeight, flexDirection: 'row', gap: 6 }}
    >
      {trace.solved ? (
        <>
          <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <VictoryAction
              compact
              narrow
              maxFontSizeMultiplier={1.15}
              label={
                session.level < 2 ? `Passer au vitrail ${session.level + 2}` : 'Rejouer ce vitrail'
              }
              icon={session.level < 2 ? 'leaf-outline' : 'refresh-outline'}
              onPress={() => {
                if (session.level < 2) setSave((s) => openVitrail(s, day, session.level + 1));
                else restart();
              }}
            >
              {layout.controlsWidth < 320
                ? session.level < 2
                  ? 'Vitrail suivant'
                  : 'Rejouer'
                : session.level < 2
                  ? `Passer au vitrail ${session.level + 2}`
                  : 'Rejouer ce vitrail'}
            </VictoryAction>
          </View>
          <View style={{ width: 64 }}>
            {session.level < 2
              ? tool('replay', 'Rejouer ce vitrail', 'refresh-outline', restart)
              : tool('rules', 'Les règles du vitrail', 'book-outline', onRules)}
          </View>
        </>
      ) : (
        <>
          {tool(
            'undo',
            'Annuler',
            'arrow-undo-outline',
            () => {
              setSave(undoVitrail);
              setSelected(null);
              setHint(null);
            },
            !session.history.length,
          )}
          {tool(
            'hint',
            'Indice',
            'bulb-outline',
            () => {
              const cell = vitrailHint(puzzle, session.rotations);
              setSelected(cell);
              setHint(cell);
            },
            false,
            true,
          )}
          {tool('restart', 'Recommencer', 'refresh-outline', restart)}
          {tool('rules', 'Les règles du vitrail', 'book-outline', onRules)}
        </>
      )}
    </View>
  );
  const footer = (
    <View
      testID="vitrail-footer"
      style={{
        height: layout.footerHeight,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 18,
        backgroundColor: '#f4ead6ed',
      }}
    >
      {archived ? (
        <Pressable
          testID="vitrail-reward"
          accessibilityRole="button"
          accessibilityLabel="Aujourd’hui"
          onPress={() => router.setParams({ day: undefined })}
          style={{
            flex: 1,
            minWidth: 0,
            height: 48,
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <T
            accessibilityLabel="Archive, sans nouvelle graine"
            maxFontSizeMultiplier={1.1}
            style={{ fontSize: 11, lineHeight: 15, color: C.muted }}
          >
            {layout.controlsWidth < 320 ? 'Archives' : 'Archive · sans graine'}
          </T>
          <T
            maxFontSizeMultiplier={1.15}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: F.scientific,
              fontSize: layout.controlsWidth < 320 ? 12 : 14,
              lineHeight: 18,
              textDecorationLine: 'underline',
            }}
          >
            Aujourd’hui
          </T>
        </Pressable>
      ) : (
        <View
          testID="vitrail-reward"
          style={{ flex: 1, minWidth: 0, paddingHorizontal: 4, justifyContent: 'center' }}
        >
          <T
            accessibilityLabel={
              rewarded
                ? 'Graine du jour obtenue'
                : '3 vitraux terminés = 1 graine, une seule fois par jour'
            }
            maxFontSizeMultiplier={1.15}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{ fontFamily: F.scientific, fontSize: 15, lineHeight: 18 }}
          >
            {layout.controlsWidth < 320
              ? rewarded
                ? 'Graine obtenue'
                : 'Trio = 1 graine'
              : rewarded
                ? 'Graine du jour obtenue'
                : '3 vitraux terminés = 1 graine'}
          </T>
        </View>
      )}
      <View style={{ width: Math.min(190, Math.max(166, layout.controlsWidth * 0.5)) }}>
        <VictoryAction
          compact
          narrow
          maxFontSizeMultiplier={1.15}
          label={trace.solved && session.level === 2 ? 'Voir mon calendrier' : 'Mon calendrier'}
          icon="book-outline"
          onPress={onCalendar}
        >
          Calendrier
        </VictoryAction>
      </View>
    </View>
  );
  const board = (
    <VitrailBoard
      puzzle={puzzle}
      rotations={session.rotations}
      width={layout.boardSize}
      selected={trace.solved ? null : selected}
      patterns={save.settings.patterns}
      disabled={blocked || trace.solved}
      onRotate={(cell) => {
        setSelected(cell);
        setHint(null);
        setSave((s) => rotateVitrail(s, cell));
      }}
    />
  );
  return (
    <View
      ref={measured.ref}
      collapsable={false}
      onLayout={measured.onLayout}
      testID="vitrail-viewport"
      style={{ flex: 1, minHeight: 0, alignItems: 'center' }}
    >
      <View
        testID="vitrail-fixed-layout"
        style={{
          width: layout.contentWidth + layout.padding * 2,
          height,
          padding: layout.padding,
          gap: layout.gap,
          flexDirection: layout.landscape ? 'row' : 'column',
        }}
      >
        {layout.landscape ? (
          <>
            <Paper
              testID="vitrail-play-card"
              frame={false}
              style={{
                width: layout.boardSize,
                height: layout.contentHeight,
                borderRadius: 18,
                backgroundColor: '#f4ead6ef',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {board}
            </Paper>
            <View
              style={{
                width: layout.controlsWidth,
                height: layout.contentHeight,
                justifyContent: 'center',
                gap: layout.gap,
              }}
            >
              {header}
              {stages}
              {caption}
              {actions}
              {footer}
            </View>
          </>
        ) : (
          <>
            {header}
            {stages}
            <Paper
              testID="vitrail-play-card"
              frame={!layout.tight}
              style={{
                height: layout.panelHeight,
                padding: layout.panelPadding,
                borderRadius: 22,
                backgroundColor: '#f4ead6ef',
                gap: layout.gap,
              }}
            >
              <View
                style={{
                  height: layout.boardAreaHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {board}
              </View>
              {caption}
              {actions}
            </Paper>
            {footer}
          </>
        )}
      </View>
    </View>
  );
}
