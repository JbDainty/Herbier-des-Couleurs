import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import type { CalendarDay } from '../state/vitrailCalendar';
import { T, C } from './ui';
import { F } from './fonts';

const inks = ['#52775d', '#a37d3f', '#866788'];
export function CalendarSealMotif({ motif = 0, ink = C.green }: { motif?: number; ink?: string }) {
  return (
    <G
      fill={ink}
      fillOpacity={0.16}
      stroke={ink}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {motif === 0 ? (
        <>
          <Path d="M48 85Q55 65 50 51" fill="none" />
          <Path d="M51 74Q31 76 34 61Q48 59 51 74ZM52 67Q70 68 68 55Q55 54 52 67ZM50 58Q39 53 46 44Q56 46 50 58Z" />
        </>
      ) : motif === 1 ? (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <Path
              key={i}
              d="M50 67C34 62 40 48 50 54C60 48 66 62 50 67Z"
              transform={`rotate(${i * 72} 50 67)`}
            />
          ))}
          <Circle cx={50} cy={67} r={4} fill={ink} fillOpacity={0.5} />
          <Path d="M50 80V87M42 85Q50 77 58 85" fill="none" />
        </>
      ) : (
        <>
          <Circle cx={50} cy={67} r={12} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Path key={i} d="M50 48V44" transform={`rotate(${i * 45} 50 67)`} />
          ))}
          <Path d="M31 86Q50 80 69 86" fill="none" />
        </>
      )}
    </G>
  );
}

/** Real text stays legible above a deterministic, slightly tilted ink impression. */
export function VitrailDayStamp({
  day,
  width,
  height,
  selected,
  glow,
}: {
  day: CalendarDay;
  width: number;
  height: number;
  selected: boolean;
  glow: Animated.Value;
}) {
  const diameter = Math.max(24, Math.min(width - 8, height - 8, 56));
  const stamped = day.completed === 3,
    ink = inks[day.motif];
  const font = diameter < 38 ? 13 : diameter < 48 ? 15 : 17;
  return (
    <View
      pointerEvents="none"
      style={{ width, height, alignItems: 'center', justifyContent: 'center' }}
    >
      {selected && !day.today && (
        <View
          style={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            left: 3,
            right: 3,
            borderWidth: 0.8,
            borderColor: '#6f8765',
            borderRadius: 13,
            backgroundColor: '#dce6cf44',
          }}
        />
      )}
      {day.today && (
        <Animated.View
          testID="calendar-today-halo"
          style={{
            position: 'absolute',
            width: diameter + 6,
            height: diameter + 6,
            borderRadius: (diameter + 6) / 2,
            borderColor: '#b4914d',
            borderWidth: 1.5,
            backgroundColor: '#ebcc7540',
            opacity: glow,
          }}
        />
      )}
      <View
        testID={
          stamped
            ? `calendar-stamp-${day.day}`
            : day.completed
              ? `calendar-progress-${day.day}`
              : undefined
        }
        style={{
          width: diameter,
          height: diameter,
          transform: [{ rotate: stamped ? `${day.tilt}deg` : '0deg' }],
        }}
      >
        <Svg width={diameter} height={diameter} viewBox="0 0 100 100" accessible={false}>
          {stamped ? (
            <>
              <Circle
                cx={50}
                cy={50}
                r={44}
                fill="#f8efd6"
                fillOpacity={0.9}
                stroke={ink}
                strokeWidth={1.5}
                strokeDasharray="2 2"
                opacity={0.9}
              />
              <Circle
                cx={50}
                cy={50}
                r={39}
                fill={ink}
                fillOpacity={0.055}
                stroke={ink}
                strokeWidth={0.8}
              />
              <Path
                d="M16 32Q10 52 18 68M83 32Q89 51 82 68"
                fill="none"
                stroke={ink}
                strokeWidth={2.5}
                opacity={0.3}
              />
              <G transform="translate(0 3)">
                <CalendarSealMotif motif={day.motif} ink={ink} />
              </G>
              <G fill={ink} opacity={0.25}>
                <Circle cx={21} cy={70} r={1.5} />
                <Circle cx={78} cy={25} r={1} />
                <Circle cx={26} cy={28} r={1.2} />
              </G>
            </>
          ) : (
            <>
              {day.available && (
                <Circle
                  cx={50}
                  cy={50}
                  r={41}
                  fill={day.today ? '#f8efd6' : '#f4ebd6'}
                  fillOpacity={0.55}
                  stroke={day.today ? '#b4914d' : '#cfbf9d'}
                  strokeWidth={0.9}
                  strokeDasharray={day.today ? undefined : '2 4'}
                />
              )}
              {day.completed > 0 ? (
                <G>
                  {[0, 1, 2].map((index) => (
                    <Path
                      key={index}
                      d="M0 8Q-8 1 0-7Q8 1 0 8Z"
                      transform={`translate(${33 + index * 17} 73) rotate(18)`}
                      fill={index < day.completed ? '#6f8a61' : 'none'}
                      stroke={index < day.completed ? '#55704e' : '#b5b18c'}
                      strokeWidth={1.8}
                    />
                  ))}
                </G>
              ) : day.available ? (
                <Path
                  d="M50 78Q38 64 50 59Q62 64 50 78ZM50 78V85"
                  fill="#bbc69f"
                  fillOpacity={0.3}
                  stroke="#97a37a"
                  strokeWidth={1.3}
                />
              ) : null}
            </>
          )}
        </Svg>
        <T
          maxFontSizeMultiplier={1.1}
          style={{
            position: 'absolute',
            top: diameter * 0.1,
            left: 0,
            width: '100%',
            textAlign: 'center',
            fontFamily: stamped ? F.bold : F.body,
            fontSize: font,
            lineHeight: font + 3,
            color: day.available ? C.ink : '#91896e',
            opacity: day.available ? 1 : 0.55,
          }}
        >
          {day.number}
        </T>
      </View>
    </View>
  );
}

export function CalendarCrest({
  restored,
  total,
  size = 80,
}: {
  restored: number;
  total: number;
  size?: number;
}) {
  const lit = Math.round(Math.min(1, restored / Math.max(1, total)) * 8);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Circle
        cx={50}
        cy={50}
        r={43}
        fill="#e7dbac"
        fillOpacity={0.4}
        stroke="#b49b63"
        strokeWidth={1}
      />
      <Circle
        cx={50}
        cy={50}
        r={38}
        fill="none"
        stroke="#b49b63"
        strokeWidth={0.6}
        strokeDasharray="2 4"
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Path
          key={i}
          d="M50 50Q30 32 50 18Q70 32 50 50Z"
          transform={`rotate(${i * 45} 50 50)`}
          fill={i < lit ? ['#98b6a0', '#ccac68', '#b49cbd'][i % 3] : '#e4ddc5'}
          fillOpacity={i < lit ? 0.7 : 0.4}
          stroke="#7e916c"
          strokeWidth={0.7}
        />
      ))}
      <Circle cx={50} cy={50} r={8} fill="#d2b063" stroke="#a48d55" strokeWidth={1} />
    </Svg>
  );
}
