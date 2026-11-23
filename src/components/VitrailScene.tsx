import React, { useContext, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { BookChromeContext } from './BookScrollView';
import { CollectionPaperCorners } from './CollectionPaperCorners';
import { useMeasuredSize } from './useMeasuredSize';
import { useVitrailMelody } from './useVitrailMelody';
import { VitrailBoard } from './VitrailBoard';
import { Paper } from './Paper';
import { HerbariumBookButton } from './HerbariumBookButton';
import { SeedPouch } from './SeedPouch';
import { VictoryAction } from './VictoryAction';
import { workshopActionIllustrations } from './WorkshopActionBar';
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
  const trace = traceVitrail(puzzle, session.rotations);
  const layout = vitrailLayout(width, height, puzzle.size, window.fontScale, trace.solved);
  const tabsWidth = layout.landscape ? layout.controlsWidth : layout.panelWidth;
  const [selected, setSelected] = useState<number | null>(null),
    [hint, setHint] = useState<number | null>(null);
  useEffect(() => {
    setSelected(null);
    setHint(null);
  }, [day, session.level]);
  const completed = save.vitrail?.days[day]?.completed ?? 0,
    rewarded = !!save.vitrail?.days[day]?.rewarded,
    archived = day !== today;
  const prepareMelody = useVitrailMelody(day, session.level, trace.solved, save.settings.sound);
  const restart = () => {
    setSave((s) => openVitrail(s, day, session.level, true));
    setSelected(null);
    setHint(null);
  };
  const tool = (
    name: 'undo' | 'hint' | 'restart' | 'replay' | 'rules',
    label: string,
    action: () => void,
    disabled = false,
  ) => {
    const primary = name === 'hint';
    const unavailable = disabled || blocked;
    const iconSize = layout.tight ? 21 : 28;
    const artwork =
      name === 'rules'
        ? undefined
        : workshopActionIllustrations[name === 'replay' ? 'restart' : name];

    return (
      <Pressable
        testID={`vitrail-tool-${name}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: unavailable }}
        disabled={unavailable}
        onPress={action}
        style={({ pressed }) => [
          styles.tool,
          primary && styles.activeTool,
          { opacity: unavailable ? 0.5 : pressed ? 0.8 : 1 },
        ]}
      >
        {artwork ? (
          <Image
            testID={`vitrail-tool-icon-${name}`}
            source={artwork}
            accessible={false}
            fadeDuration={0}
            resizeMode="contain"
            style={{ width: iconSize, height: iconSize }}
          />
        ) : (
          <Icon name="book-outline" size={iconSize} color={C.green} />
        )}
        <T
          serif
          maxFontSizeMultiplier={1.15}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={{
            fontSize: layout.actionWidth < 340 ? 11 : 13,
            lineHeight: layout.tight ? 15 : 18,
            textAlign: 'center',
            color: primary ? '#fff4dd' : C.green,
          }}
        >
          {name === 'rules'
            ? 'Règles'
            : name === 'replay'
              ? 'Rejouer'
              : name === 'restart' && layout.actionWidth < 280
                ? 'Repartir'
                : label}
        </T>
      </Pressable>
    );
  };
  const header = (
    <View testID="vitrail-header" style={[styles.header, { height: layout.headerHeight }]}>
      <View style={[styles.headerSide, { alignItems: 'flex-start' }]}>
        <HerbariumBookButton
          compact={layout.tight}
          motion={save.settings.motion}
          onHome={() => router.dismissTo('/')}
        />
      </View>
      <View style={styles.heading}>
        <T
          serif
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          maxFontSizeMultiplier={1.1}
          style={{
            fontFamily: F.displayBold,
            fontSize: Math.min(layout.tight ? 25 : 39, (layout.controlsWidth - 126) / 7),
            lineHeight: layout.tight ? 26 : 44,
            color: '#294938',
            textAlign: 'center',
            width: '100%',
          }}
        >
          Vitrail du jour
        </T>
        {!layout.tight && (
          <View pointerEvents="none" accessible={false} style={styles.headingOrnament}>
            <View style={styles.headingRule} />
            <Icon name="leaf-outline" size={18} color="#778a5c" />
            <View style={styles.headingRule} />
          </View>
        )}
        <T
          testID="vitrail-date"
          maxFontSizeMultiplier={1.15}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontFamily: F.scientific,
            fontSize: layout.tight ? 13 : 18,
            lineHeight: layout.tight ? 17 : 24,
            textAlign: 'center',
          }}
        >
          {date}
        </T>
      </View>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
        <View style={styles.seedBadge}>
          <SeedPouch compact count={save.seeds} motion={save.settings.motion} />
        </View>
      </View>
    </View>
  );
  const stages = (
    <View
      testID="vitrail-stages"
      accessibilityRole="tablist"
      accessibilityLabel="Difficulté du vitrail"
      style={[
        styles.stageTabs,
        { height: layout.stagesHeight, paddingHorizontal: layout.tight ? 5 : 11 },
      ]}
    >
      {vitrailDifficulties.map((label, index) => {
        const active = session.level === index,
          done = completed > index,
          locked = index > completed;
        const color = active ? '#fff4dd' : C.green;
        return (
          <Pressable
            key={index}
            testID={`vitrail-stage-${index}`}
            accessibilityRole="tab"
            accessibilityLabel={`Vitrail ${index + 1}, ${label}${done ? ', terminé' : locked ? ', verrouillé' : ''}`}
            accessibilityState={{ disabled: locked || blocked, selected: active }}
            aria-selected={active}
            disabled={locked || blocked}
            onPress={() => setSave((s) => openVitrail(s, day, index))}
            style={({ pressed }) => [
              styles.stageTab,
              { flex: index === 1 ? 1.23 : 1 },
              active && styles.activeTab,
              pressed && styles.pressedTab,
            ]}
          >
            {done && <Icon name="leaf-outline" size={14} color={color} />}
            {locked && <Icon name="lock-closed-outline" size={13} color={color} />}
            <T
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{
                fontFamily: F.scientific,
                fontSize: tabsWidth < 340 ? 14 : 17,
                lineHeight: 22,
                color,
                flexShrink: 1,
              }}
            >
              {index === 1 && tabsWidth < 280 ? 'Moyen' : label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
  const row = hint === null ? null : Math.floor(hint / puzzle.size) + 1;
  const column = hint === null ? null : (hint % puzzle.size) + 1;
  const caption = !trace.solved && (
    <View
      testID="vitrail-caption"
      style={[styles.caption, { height: layout.captionHeight, width: layout.actionWidth }]}
    >
      <T
        testID="vitrail-target-status"
        maxFontSizeMultiplier={1.15}
        accessibilityLiveRegion="polite"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontFamily: F.scientific, fontSize: 14, flexShrink: 1 }}
      >
        {trace.lit.filter(Boolean).length} / {puzzle.targets.length}{' '}
        {puzzle.targets.length === 1 ? 'fleur éclairée' : 'fleurs éclairées'}
      </T>
      {hint !== null && (
        <T
          testID="vitrail-hint"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Faites pivoter le fragment de la ligne ${row}, colonne ${column}.`}
          maxFontSizeMultiplier={1.15}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ fontSize: 12, color: C.green, flexShrink: 1 }}
        >
          Faites pivoter L{row} · C{column}
        </T>
      )}
    </View>
  );
  const hasNext = session.level < 2;
  const victoryLabel = hasNext ? `Passer au vitrail ${session.level + 2}` : 'Rejouer ce vitrail';
  const actions = (
    <View
      testID="vitrail-actions"
      style={[styles.actions, { width: layout.actionWidth, height: layout.actionsHeight }]}
    >
      {trace.solved ? (
        <>
          <View testID="vitrail-victory" style={styles.victory}>
            <VictoryAction
              compact
              narrow
              disabled={blocked}
              maxFontSizeMultiplier={1.15}
              label={victoryLabel}
              icon={hasNext ? undefined : workshopActionIllustrations.restart}
              onPress={() => {
                if (hasNext) setSave((s) => openVitrail(s, day, session.level + 1));
                else restart();
              }}
            >
              {layout.actionWidth < 280 ? (hasNext ? 'Vitrail suivant' : 'Rejouer') : victoryLabel}
            </VictoryAction>
          </View>
          <View style={styles.victoryTool}>
            {hasNext
              ? tool('replay', 'Rejouer ce vitrail', restart)
              : tool('rules', 'Les règles du vitrail', onRules)}
          </View>
        </>
      ) : (
        <>
          {tool(
            'undo',
            'Annuler',
            () => {
              setSave(undoVitrail);
              setSelected(null);
              setHint(null);
            },
            !session.history.length,
          )}
          {tool('hint', 'Indice', () => {
            const cell = vitrailHint(puzzle, session.rotations);
            setSelected(cell);
            setHint(cell);
          })}
          {tool('restart', 'Recommencer', restart)}
          {tool('rules', 'Les règles du vitrail', onRules)}
        </>
      )}
    </View>
  );
  const compactFooter = archived || (layout.tight && rewarded);
  const reward = archived ? (
    <Pressable
      testID="vitrail-reward"
      accessibilityRole="button"
      accessibilityLabel="Aujourd’hui"
      onPress={() => router.setParams({ day: undefined })}
      style={styles.today}
    >
      <T
        maxFontSizeMultiplier={1.1}
        numberOfLines={1}
        style={{ fontSize: 11, lineHeight: 13, color: C.muted }}
      >
        Archive · sans graine
      </T>
      <T maxFontSizeMultiplier={1.15} numberOfLines={1} style={styles.todayLabel}>
        Aujourd’hui
      </T>
    </Pressable>
  ) : rewarded ? (
    <T
      testID="vitrail-reward"
      maxFontSizeMultiplier={1.15}
      numberOfLines={compactFooter ? 2 : 1}
      style={[styles.reward, compactFooter && styles.compactReward]}
    >
      Graine du jour obtenue
    </T>
  ) : null;
  const footer = (
    <View
      testID="vitrail-footer"
      style={[
        styles.footer,
        {
          height: layout.footerHeight,
          padding: layout.footerInset,
          flexDirection: compactFooter ? 'row' : 'column',
        },
      ]}
    >
      {compactFooter && reward}
      <View style={{ width: compactFooter ? '58%' : '100%', alignItems: 'center' }}>
        <VictoryAction
          compact
          narrow
          maxFontSizeMultiplier={1.15}
          label={trace.solved && !hasNext ? 'Voir mon calendrier' : 'Mon calendrier'}
          icon="book-outline"
          onPress={onCalendar}
        >
          Calendrier
        </VictoryAction>
      </View>
      {!compactFooter && reward}
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
        prepareMelody();
        setSelected(cell);
        setHint(null);
        setSave((s) => rotateVitrail(s, cell));
      }}
    />
  );
  const paperBorder = (
    <>
      <View pointerEvents="none" style={styles.paperBorder} />
      {!layout.tight && <View pointerEvents="none" style={styles.paperInnerBorder} />}
      {layout.framed && <CollectionPaperCorners size={17} inset={8} />}
    </>
  );
  return (
    <View
      ref={measured.ref}
      collapsable={false}
      onLayout={measured.onLayout}
      testID="vitrail-viewport"
      style={styles.viewport}
    >
      <View
        testID="vitrail-fixed-layout"
        style={{
          width: layout.contentWidth + layout.padding * 2,
          height,
          padding: layout.padding,
          gap: layout.gap,
          flexDirection: layout.landscape ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {layout.landscape ? (
          <>
            <Paper
              testID="vitrail-play-card"
              frame={false}
              textureOpacity={0.4}
              style={[styles.paper, { width: layout.boardSize, height: layout.panelHeight }]}
            >
              {paperBorder}
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
            <View testID="vitrail-play-area" style={{ width: layout.panelWidth }}>
              {stages}
              <Paper
                testID="vitrail-play-card"
                frame={false}
                textureOpacity={0.4}
                style={[
                  styles.paper,
                  {
                    height: layout.panelHeight,
                    paddingHorizontal: layout.panelPadding,
                    paddingVertical: layout.panelVerticalPadding,
                    gap: layout.gap,
                  },
                ]}
              >
                {paperBorder}
                {board}
                {caption}
                {actions}
              </Paper>
            </View>
            {footer}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, minHeight: 0, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 3 },
  headerSide: { minWidth: 62 },
  heading: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  headingOrnament: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingRule: { width: 44, height: 1, backgroundColor: '#ac9b6b' },
  seedBadge: {
    backgroundColor: '#fff4dded',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#c7ad7a',
  },
  stageTabs: { width: '100%', flexDirection: 'row', gap: 4 },
  stageTab: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#bca46e',
    backgroundColor: '#fbefd8',
  },
  activeTab: { backgroundColor: C.green },
  pressedTab: { opacity: 0.8 },
  paper: { borderRadius: 22, backgroundColor: '#fbefd8', justifyContent: 'center' },
  paperBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: '#bca46e',
    borderRadius: 22,
  },
  paperInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 5,
    borderWidth: 0.6,
    borderColor: '#d4bf91',
    borderRadius: 17,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 3,
  },
  actions: { alignSelf: 'center', flexDirection: 'row', gap: 5 },
  tool: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: '#c4aa75',
    backgroundColor: '#fff4dd86',
  },
  activeTool: { borderColor: C.green, backgroundColor: C.green },
  victory: { flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'center' },
  victoryTool: { width: 64 },
  footer: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  today: { flex: 1, minWidth: 0, minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  todayLabel: { fontFamily: F.scientific, fontSize: 14, textDecorationLine: 'underline' },
  reward: { fontFamily: F.scientific, fontSize: 13, lineHeight: 16, textAlign: 'center' },
  compactReward: { flex: 1, minWidth: 0 },
});
