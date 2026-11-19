import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';
import { Paper } from './Paper';
import { VictoryAction } from './VictoryAction';
import { CalendarCrest, VitrailDayStamp } from './VitrailCalendarStamps';
import { useMeasuredSize } from './useMeasuredSize';
import { useAmbientMotion } from './usePrimaryAnimation';
import { Icon, C, T } from './ui';
import { F } from './fonts';
import { useGame } from '../state/store';
import {
  calendarInitialMonth,
  calendarMonth,
  calendarVine,
  shiftCalendarMonth,
} from '../state/vitrailCalendar';
import { vitrailCalendarLayout } from '../layout/vitrailCalendar';
import { vitrailForDay } from '../data/vitrails';

function CalendarBook({
  initialDay,
  today,
  onSelect,
  onClose,
}: {
  initialDay: string;
  today: string;
  onSelect: (day: string) => void;
  onClose: () => void;
}) {
  const { save } = useGame(),
    screen = useWindowDimensions(),
    insets = useSafeAreaInsets(),
    measured = useMeasuredSize();
  const [month, setMonth] = useState(() => calendarInitialMonth(initialDay, today));
  const content = calendarMonth(month, today, save.vitrail);
  const horizontalInset = 12,
    top = Math.max(12, insets.top),
    bottom = Math.max(12, insets.bottom);
  const width = (measured.size.width || screen.width) - horizontalInset * 2,
    height = (measured.size.height || screen.height) - top - bottom;
  const layout = vitrailCalendarLayout(width, height, content.rows);
  const enabled = useAmbientMotion(
    save.settings.motion && month === today.slice(0, 7) && !!vitrailForDay(today),
  );
  const glow = useRef(new Animated.Value(0.5)).current,
    arrival = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let run: Animated.CompositeAnimation | undefined;
    const sync = (foreground: boolean) => {
      run?.stop();
      glow.setValue(0.5);
      if (!enabled || !foreground) return;
      run = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 0.95,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(glow, {
            toValue: 0.3,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      );
      run.start();
    };
    sync(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const listener = AppState.addEventListener('change', (state) => sync(state === 'active'));
    return () => {
      run?.stop();
      glow.stopAnimation();
      listener.remove();
    };
  }, [enabled, glow]);
  useEffect(() => {
    arrival.stopAnimation();
    if (!save.settings.motion) {
      arrival.setValue(1);
      return;
    }
    arrival.setValue(0);
    const run = Animated.timing(arrival, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    run.start();
    return () => run.stop();
  }, [month, save.settings.motion, arrival]);
  const date = new Date(month + '-01T12:00:00Z');
  const vine = calendarVine(content.cells, layout.cellWidth, layout.cellHeight);
  const shift = (amount: number) => {
    if (amount < 0 ? content.canPrevious : content.canNext)
      setMonth(shiftCalendarMonth(month, amount));
  };
  const title = (
    <View style={{ height: layout.headerHeight, alignItems: 'center', justifyContent: 'center' }}>
      <T
        serif
        accessibilityRole="header"
        maxFontSizeMultiplier={1.1}
        style={{
          fontSize: Math.min(28, layout.innerWidth / 12.1),
          lineHeight: 32,
          textAlign: 'center',
        }}
      >
        Le calendrier des vitraux
      </T>
      <T
        maxFontSizeMultiplier={1.1}
        style={{ fontFamily: F.scientific, fontSize: 12, lineHeight: 16, color: C.muted }}
      >
        Un jour, une empreinte de lumière.
      </T>
    </View>
  );
  const months = (
    <View
      testID="calendar-month-controls"
      style={{ height: layout.monthHeight, flexDirection: 'row', alignItems: 'center' }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mois précédent"
        accessibilityState={{ disabled: !content.canPrevious }}
        disabled={!content.canPrevious}
        onPress={() => shift(-1)}
        style={{
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: content.canPrevious ? 1 : 0.3,
        }}
      >
        <Icon name="arrow-undo-outline" size={24} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Afficher le mois d’aujourd’hui"
        onPress={() => setMonth(calendarInitialMonth(today, today))}
        style={{ flex: 1, minWidth: 0, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        {layout.compact && (
          <T
            maxFontSizeMultiplier={1}
            style={{ fontSize: 8, lineHeight: 11, letterSpacing: 0.7, color: C.muted }}
          >
            LE CALENDRIER DES VITRAUX
          </T>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!layout.landscape && (
            <CalendarCrest
              restored={content.restored}
              total={content.scheduled * 3}
              size={layout.compact ? 28 : 40}
            />
          )}
          <T
            testID="calendar-month-title"
            maxFontSizeMultiplier={1.1}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: F.scientific,
              fontSize: Math.min(24, (layout.gridWidth - 88 - (layout.landscape ? 0 : 46)) / 7.2),
              lineHeight: 29,
              textAlign: 'center',
              flexShrink: 1,
            }}
          >
            {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </T>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mois suivant"
        accessibilityState={{ disabled: !content.canNext }}
        disabled={!content.canNext}
        onPress={() => shift(1)}
        style={{
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: content.canNext ? 1 : 0.3,
        }}
      >
        <Icon name="arrow-forward-outline" size={24} />
      </Pressable>
    </View>
  );
  const summary = (
    <View
      testID="calendar-month-summary"
      style={{
        height: layout.summaryHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <T
        maxFontSizeMultiplier={1.1}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontFamily: F.scientific, fontSize: 13, lineHeight: 18, flexShrink: 1 }}
      >
        {content.stamped} {content.stamped === 1 ? 'journée estampillée' : 'journées estampillées'}
      </T>
      <T maxFontSizeMultiplier={1.1} style={{ fontSize: 11, lineHeight: 16, color: C.muted }}>
        {content.restored} vitraux
      </T>
    </View>
  );
  const weekdays = (
    <View style={{ height: layout.weekHeight, flexDirection: 'row', alignItems: 'center' }}>
      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => (
        <T
          key={i}
          maxFontSizeMultiplier={1}
          style={{
            width: layout.cellWidth,
            textAlign: 'center',
            fontSize: 10,
            lineHeight: 14,
            color: C.muted,
            letterSpacing: 1,
          }}
        >
          {label}
        </T>
      ))}
    </View>
  );
  const grid = (
    <ScrollView
      testID="calendar-date-scroll"
      style={{ height: layout.gridHeight, width: layout.gridWidth, flexGrow: 0, flexShrink: 0 }}
      contentContainerStyle={{ height: layout.gridContentHeight }}
      scrollEnabled={layout.gridContentHeight > layout.gridHeight}
      showsVerticalScrollIndicator={layout.gridContentHeight > layout.gridHeight}
      bounces={false}
    >
      <View
        testID="calendar-month-grid"
        style={{ height: layout.gridContentHeight, width: layout.gridWidth }}
      >
        {!!vine && (
          <Svg
            testID="calendar-living-vine"
            pointerEvents="none"
            width={layout.gridWidth}
            height={layout.gridContentHeight}
            style={{ position: 'absolute', top: 0, left: 0 }}
            accessible={false}
          >
            <Path d={vine} fill="none" stroke="#b49b63" strokeWidth={4} opacity={0.1} />
            <Path d={vine} fill="none" stroke="#6f8a61" strokeWidth={1} opacity={0.32} />
          </Svg>
        )}
        {content.cells.map((day, index) =>
          !day ? null : (
            <Pressable
              key={day.day}
              testID={`vitrail-calendar-${day.day}`}
              accessibilityRole="button"
              accessibilityLabel={`${new Date(day.day + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })}, ${day.completed} vitraux sur 3 terminés${day.completed === 3 ? ', journée estampillée' : ''}${day.today ? ', aujourd’hui' : ''}`}
              accessibilityState={{ disabled: !day.available, selected: day.day === initialDay }}
              disabled={!day.available}
              onPress={() => onSelect(day.day)}
              style={({ pressed }) => ({
                position: 'absolute',
                left: (index % 7) * layout.cellWidth,
                top: Math.floor(index / 7) * layout.cellHeight,
                width: layout.cellWidth,
                height: layout.cellHeight,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.72 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <VitrailDayStamp
                day={day}
                width={layout.cellWidth}
                height={layout.cellHeight}
                selected={day.day === initialDay}
                glow={glow}
              />
            </Pressable>
          ),
        )}
      </View>
    </ScrollView>
  );
  const legend = (
    <View
      testID="calendar-legend"
      style={{ height: layout.legendHeight, flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      {[
        { icon: 'leaf-outline' as const, text: 'En cours', color: '#829469' },
        { icon: 'ribbon-outline' as const, text: 'Estampillé', color: '#6e8662' },
        { icon: 'sunny-outline' as const, text: 'Aujourd’hui', color: '#aa8848' },
      ].map((item) => (
        <View
          key={item.text}
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Icon name={item.icon} size={13} color={item.color} />
          <T
            maxFontSizeMultiplier={1}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontSize: 10, lineHeight: 14, color: C.muted, flexShrink: 1 }}
          >
            {item.text}
          </T>
        </View>
      ))}
    </View>
  );
  const note = (
    <T
      testID="calendar-archive-rule"
      maxFontSizeMultiplier={1}
      numberOfLines={1}
      adjustsFontSizeToFit
      style={{
        height: layout.noteHeight,
        fontSize: 11,
        lineHeight: 16,
        color: C.muted,
        textAlign: 'center',
      }}
    >
      Archives gratuites · sans nouvelle graine.
    </T>
  );
  const close = (
    <View testID="calendar-close" style={{ height: 48, width: '100%', alignItems: 'center' }}>
      <VictoryAction
        compact
        narrow
        maxFontSizeMultiplier={1.15}
        label="Fermer le calendrier"
        icon="book-outline"
        onPress={onClose}
      >
        {layout.landscape ? 'Fermer' : 'Fermer le calendrier'}
      </VictoryAction>
    </View>
  );
  return (
    <View
      ref={measured.ref}
      collapsable={false}
      onLayout={measured.onLayout}
      testID="calendar-modal-viewport"
      style={{
        flex: 1,
        paddingHorizontal: horizontalInset,
        paddingTop: top,
        paddingBottom: bottom,
        backgroundColor: '#233e31c7',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        testID="vitrail-calendar"
        frame={false}
        accessibilityViewIsModal
        style={{
          width: layout.paperWidth,
          height: layout.paperHeight,
          padding: layout.padding,
          borderRadius: 26,
          backgroundColor: C.card,
        }}
      >
        {[0, 1, 2, 3].map((corner) => (
          <Svg
            key={corner}
            width={44}
            height={44}
            viewBox="0 0 44 44"
            accessible={false}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: corner < 2 ? 0 : undefined,
              bottom: corner >= 2 ? 0 : undefined,
              left: corner % 2 === 0 ? 0 : undefined,
              right: corner % 2 === 1 ? 0 : undefined,
              transform: [{ scaleX: corner % 2 === 1 ? -1 : 1 }, { scaleY: corner >= 2 ? -1 : 1 }],
            }}
          >
            <G stroke="#81926c" strokeWidth={0.8} fill="#a6b38a" opacity={0.65}>
              <Path d="M8 43Q6 8 43 8" fill="none" />
              <Path d="M9 32Q0 23 6 19Q14 22 9 32ZM14 19Q12 7 18 7Q23 13 14 19ZM27 10Q25 0 31 3Q36 6 27 10Z" />
            </G>
          </Svg>
        ))}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            right: 6,
            bottom: 6,
            borderRadius: 20,
            borderWidth: 0.8,
            borderColor: '#b49b6388',
          }}
        />
        <View
          testID={enabled ? 'calendar-glow-running' : 'calendar-glow-still'}
          pointerEvents="none"
          style={{ position: 'absolute', width: 0, height: 0 }}
        />
        <Animated.View
          style={{
            width: layout.innerWidth,
            height: layout.paperHeight - layout.padding * 2,
            gap: layout.landscape ? 12 : layout.gap,
            flexDirection: layout.landscape ? 'row' : 'column',
            opacity: arrival,
          }}
        >
          {layout.landscape ? (
            <>
              <View style={{ width: layout.gridWidth, gap: layout.gap }}>
                {months}
                {weekdays}
                {grid}
              </View>
              <View
                style={{ width: layout.sideWidth, height: '100%', justifyContent: 'space-between' }}
              >
                <T
                  serif
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1}
                  numberOfLines={layout.tightSide ? 1 : 2}
                  adjustsFontSizeToFit
                  style={{
                    fontSize: layout.tightSide ? 19 : 25,
                    lineHeight: layout.tightSide ? 24 : 29,
                    textAlign: 'center',
                  }}
                >
                  {layout.tightSide ? 'Jours de lumière' : 'Les jours de lumière'}
                </T>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  {!layout.tightSide && (
                    <CalendarCrest restored={content.restored} total={content.scheduled * 3} />
                  )}
                  <T
                    testID="calendar-side-summary"
                    maxFontSizeMultiplier={1.1}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{
                      fontFamily: F.scientific,
                      fontSize: 14,
                      lineHeight: 20,
                      textAlign: 'center',
                    }}
                  >
                    {content.stamped}{' '}
                    {content.stamped === 1 ? 'jour estampillé' : 'jours estampillés'}
                  </T>
                </View>
                <View style={{ gap: layout.tightSide ? 0 : 8 }}>
                  {[
                    { icon: 'leaf-outline' as const, text: 'Feuilles : en cours' },
                    { icon: 'ribbon-outline' as const, text: 'Tampon : journée terminée' },
                    { icon: 'sunny-outline' as const, text: 'Halo : aujourd’hui' },
                  ].map((item) => (
                    <View
                      key={item.text}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        height: layout.tightSide ? 11 : 18,
                      }}
                    >
                      <Icon name={item.icon} size={layout.tightSide ? 11 : 15} />
                      <T
                        maxFontSizeMultiplier={1}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          fontSize: layout.tightSide ? 9 : 12,
                          lineHeight: layout.tightSide ? 11 : 18,
                          flexShrink: 1,
                          color: C.muted,
                        }}
                      >
                        {item.text}
                      </T>
                    </View>
                  ))}
                </View>
                <T
                  maxFontSizeMultiplier={1}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ fontSize: 10, lineHeight: 16, color: C.muted, textAlign: 'center' }}
                >
                  Archives · sans graine.
                </T>
                {close}
              </View>
            </>
          ) : (
            <>
              {!!layout.headerHeight && title}
              {months}
              {!!layout.summaryHeight && summary}
              {weekdays}
              {grid}
              {!!layout.legendHeight && legend}
              {!!layout.noteHeight && note}
              {close}
            </>
          )}
        </Animated.View>
      </Paper>
    </View>
  );
}

export function VitrailCalendar({
  visible,
  initialDay,
  today,
  onSelect,
  onClose,
}: {
  visible: boolean;
  initialDay: string;
  today: string;
  onSelect: (day: string) => void;
  onClose: () => void;
}) {
  const { save } = useGame();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={save.settings.motion ? 'fade' : 'none'}
      onRequestClose={onClose}
    >
      {visible && <CalendarBook {...{ initialDay, today, onSelect, onClose }} />}
    </Modal>
  );
}
