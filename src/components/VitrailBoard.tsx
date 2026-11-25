import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import {
  lightColors,
  opposite,
  neighbor,
  type LightTrace,
  opticalLessons,
  type VitrailPuzzle,
  type GlassPort,
} from '../engine/vitrail';
import { C } from './ui';
import { useNativeProgress } from './useNativeProgress';

const delta = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
function Mirror({ rotation, unit, motion }: { rotation: number; unit: number; motion: boolean }) {
  const angle = useRef(new Animated.Value(rotation)).current;
  const turns = useRef(rotation);
  const previous = useRef(rotation);
  useEffect(() => {
    const changed = previous.current !== rotation;
    if (changed) turns.current++;
    previous.current = rotation;
    if (!motion || !changed) {
      angle.setValue(turns.current);
      return;
    }
    const run = Animated.timing(angle, {
      toValue: turns.current,
      duration: 145,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    });
    run.start();
    return () => run.stop();
  }, [rotation, motion, angle]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        transform: [
          { rotate: angle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
        ],
      }}
    >
      <Svg accessible={false} width={unit} height={unit} viewBox="-50 -50 100 100">
        <Path d="M-39 39 39-39" stroke="#ac995e" strokeWidth={9} strokeLinecap="round" />
        <Path d="M-39 37 37-39" stroke="#eaf1df" strokeWidth={4} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

function BeamFlash({ path, extent, width }: { path: string; extent: number; width: number }) {
  const { value, settled } = useNativeProgress(220, true);
  if (settled) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: value.interpolate({ inputRange: [0, 0.24, 1], outputRange: [0, 0.9, 0] }),
      }}
    >
      <Svg width={width} height={width} viewBox={`0 0 ${extent} ${extent}`} accessible={false}>
        <Path d={path} fill="none" stroke="#fff0c4" strokeWidth={3.5} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}
export function VitrailBoard({
  puzzle,
  rotations,
  trace,
  width,
  selected,
  patterns,
  motion,
  disabled,
  onRotate,
}: {
  puzzle: VitrailPuzzle;
  rotations: number[];
  trace: LightTrace;
  width: number;
  selected: number | null;
  patterns: boolean;
  motion: boolean;
  disabled: boolean;
  onRotate: (cell: number) => void;
}) {
  const gesture = useRef<{ before: typeof trace; expected: number[]; id: number } | null>(null);
  const extent = (puzzle.size + 1) * 100,
    unit = width / (puzzle.size + 1);
  const center = (cell: number) => [
    100 + (cell % puzzle.size) * 100,
    100 + Math.floor(cell / puzzle.size) * 100,
  ];
  const currentGesture = gesture.current;
  const trail =
    motion && currentGesture && currentGesture.expected.every((r, i) => r === rotations[i])
      ? trace.outgoing
          .flatMap((directions, i) =>
            directions.map((color, d) => {
              if (!color || currentGesture.before.outgoing[i][d] === color) return '';
              const [x, y] = center(i);
              const length = neighbor(i, d, puzzle.size) < 0 ? 70 : 100;
              return `M${x} ${y}l${delta[d][0] * length} ${delta[d][1] * length}`;
            }),
          )
          .join(' ')
      : '';
  const portPoint = (port: GlassPort) => {
    const [x, y] = center(port.cell),
      [dx, dy] = delta[port.side];
    // Keep the flower, its halo and its success mark inside the SVG on every edge.
    return [x + dx * 70, y + dy * 70];
  };
  const beam = (x1: number, y1: number, x2: number, y2: number, color: number, key: string) => (
    <G key={key}>
      <Line
        {...{ x1, y1, x2, y2 }}
        stroke={lightColors[color].hex}
        strokeWidth={13}
        opacity={0.16}
      />
      <Line
        {...{ x1, y1, x2, y2 }}
        stroke={lightColors[color].hex}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Line {...{ x1, y1, x2, y2 }} stroke="#fff9d8" strokeWidth={1.2} opacity={0.7} />
    </G>
  );
  return (
    <View testID="vitrail-board" style={{ width, height: width, alignSelf: 'center' }}>
      <Svg width={width} height={width} viewBox={`0 0 ${extent} ${extent}`} accessible={false}>
        <Rect
          x={47}
          y={47}
          width={puzzle.size * 100 + 6}
          height={puzzle.size * 100 + 6}
          rx={7}
          fill="#f4ead6"
          stroke="#af8b49"
          strokeWidth={2}
        />
        {puzzle.cells.map((kind, i) => {
          const [x, y] = center(i);
          return (
            <Rect
              key={`glass-${i}`}
              x={x - 49}
              y={y - 49}
              width={98}
              height={98}
              rx={3}
              fill={
                ['#dae5d9', '#e8e3ce', '#d6e3e6', '#f0dfc8'][(i + Math.floor(i / puzzle.size)) % 4]
              }
              fillOpacity={0.6}
              stroke="#a59a72"
              strokeWidth={1.2}
            />
          );
        })}
        {trace.incoming.map((directions, i) => {
          const [x, y] = center(i);
          return directions.map((color, d) =>
            color
              ? beam(
                  x + delta[opposite(d)][0] * 50,
                  y + delta[opposite(d)][1] * 50,
                  x,
                  y,
                  color,
                  `in-${i}-${d}`,
                )
              : null,
          );
        })}
        {trace.outgoing.map((directions, i) => {
          const [x, y] = center(i);
          return directions.map((color, d) =>
            color
              ? beam(x, y, x + delta[d][0] * 50, y + delta[d][1] * 50, color, `out-${i}-${d}`)
              : null,
          );
        })}
        {puzzle.cells.map((kind, i) => {
          const [x, y] = center(i),
            r = rotations[i];
          if (kind === 'glass') return null;
          return (
            <G key={`piece-${i}`} transform={`translate(${x} ${y})`}>
              {kind === 'mirror' ? null : (
                <G transform={`rotate(${r * 90})`}>
                  <Path
                    d={kind === 'splitter' ? 'M0 38V0H34M0 0V-34' : 'M0 36V-32M-31 0H31'}
                    fill="none"
                    stroke="#87936b"
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d={kind === 'splitter' ? 'M0 38V0H34M0 0V-34' : 'M0 36V-32M-31 0H31'}
                    fill="none"
                    stroke="#f0ebc9"
                    strokeWidth={6}
                    strokeLinecap="round"
                  />
                  {kind === 'mixer' ? (
                    <>
                      <Circle r={13} fill="#f4ead6" stroke="#af8b49" strokeWidth={2} />
                      <Path d="M-8-22 0-32 8-22" fill="none" stroke={C.green} strokeWidth={3} />
                    </>
                  ) : (
                    <>
                      <Circle r={9} fill="#f4ead6" stroke="#af8b49" strokeWidth={2} />
                      <Path
                        d="M-6-26 0-34 6-26M25-6 34 0 25 6"
                        fill="none"
                        stroke={C.green}
                        strokeWidth={2}
                      />
                    </>
                  )}
                </G>
              )}
              {selected === i && (
                <>
                  <Rect
                    id="vitrail-selected-piece"
                    x={-46}
                    y={-46}
                    width={92}
                    height={92}
                    rx={10}
                    stroke={C.green}
                    strokeWidth={4}
                    fill="none"
                  />
                  <Path
                    d="M23-29C39-29 39-14 27-13M27-19 22-13 28-8"
                    stroke={C.green}
                    strokeWidth={3}
                    fill="none"
                  />
                </>
              )}
            </G>
          );
        })}
        {puzzle.sources.map((port, i) => {
          const [x, y] = portPoint(port),
            [cx, cy] = center(port.cell),
            color = lightColors[port.color];
          return (
            <G key={`source-${i}`}>
              {beam(
                x,
                y,
                cx + delta[port.side][0] * 50,
                cy + delta[port.side][1] * 50,
                port.color,
                `source-ray-${i}`,
              )}
              <Circle cx={x} cy={y} r={22} fill="#f8edd0" stroke="#aa9562" strokeWidth={1.8} />
              <Circle cx={x} cy={y} r={15} fill={color.hex} fillOpacity={0.45} stroke={color.hex} />
              <Path
                d={`M${x - 4} ${y + 4}Q${x - 13} ${y - 9} ${x + 1} ${y - 13}`}
                fill="none"
                stroke="#fff9e3"
                strokeWidth={2}
              />
              {patterns && (
                <SvgText
                  x={x}
                  y={y + 5}
                  fontSize={port.color === 7 ? 12 : 16}
                  textAnchor="middle"
                  fill={C.ink}
                  fontWeight="bold"
                >
                  {color.mark}
                </SvgText>
              )}
            </G>
          );
        })}
        {puzzle.targets.map((port, i) => {
          const [x, y] = portPoint(port),
            [cx, cy] = center(port.cell),
            color = lightColors[port.color],
            lit = trace.lit[i];
          const received = trace.exits[`${port.cell}:${port.side}`];
          return (
            <G key={`target-${i}`} id={`vitrail-target-${i}`}>
              {received ? (
                beam(
                  cx + delta[port.side][0] * 50,
                  cy + delta[port.side][1] * 50,
                  x,
                  y,
                  received,
                  `target-ray-${i}`,
                )
              ) : (
                <Line
                  x1={cx + delta[port.side][0] * 50}
                  y1={cy + delta[port.side][1] * 50}
                  x2={x}
                  y2={y}
                  stroke="#9b9e70"
                  strokeWidth={2}
                />
              )}
              <Circle
                cx={x}
                cy={y}
                r={26}
                fill="none"
                stroke={color.hex}
                strokeWidth={7}
                opacity={lit ? 0.25 : 0.18}
              />
              <Circle
                id={`vitrail-target-halo-${i}`}
                cx={x}
                cy={y}
                r={24}
                fill="#f8efd6"
                stroke={color.hex}
                strokeWidth={lit ? 3.5 : 3}
              />
              <Circle
                cx={x}
                cy={y}
                r={22}
                fill="none"
                stroke="#fff9e5"
                strokeWidth={1.4}
                opacity={0.9}
              />
              <G transform={`translate(${x} ${y})`} opacity={lit ? 1 : 0.9}>
                {[0, 1, 2, 3, 4].map((p) => (
                  <Path
                    key={p}
                    d="M0 0C-17-8-10-27 0-21C10-27 17-8 0 0Z"
                    transform={`rotate(${p * 72})`}
                    fill={color.hex}
                    fillOpacity={lit ? 0.85 : 0.6}
                    stroke={color.hex}
                    strokeWidth={1}
                  />
                ))}
                <Circle r={5} fill={lit ? '#edcf70' : '#c7b78a'} />
              </G>
              {patterns && (
                <SvgText
                  x={x}
                  y={y + 5}
                  fontSize={port.color === 7 ? 11 : 15}
                  textAnchor="middle"
                  fill={C.ink}
                  fontWeight="bold"
                >
                  {color.mark}
                </SvgText>
              )}
              {lit && (
                <Path
                  id={`vitrail-target-check-${i}`}
                  d={`M${x + 10} ${y + 14}l4 4 7-9`}
                  fill="none"
                  stroke={C.green}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </G>
          );
        })}
      </Svg>
      {!!trail.trim() && (
        <BeamFlash key={currentGesture!.id} path={trail} extent={extent} width={width} />
      )}
      {puzzle.cells.map((kind, i) =>
        kind === 'glass' ? null : (
          <Pressable
            key={i}
            testID={`vitrail-cell-${i}`}
            accessibilityRole="button"
            accessibilityLabel={`Ligne ${Math.floor(i / puzzle.size) + 1}, colonne ${(i % puzzle.size) + 1} : ${opticalLessons[kind].name}, orientation ${rotations[i] + 1}`}
            accessibilityHint="Faire pivoter ce fragment d’un quart de tour"
            accessibilityState={{ disabled, selected: selected === i }}
            disabled={disabled}
            onPress={() => {
              if (motion) {
                const expected = rotations.slice();
                expected[i] = (expected[i] + 1) % (kind === 'mirror' ? 2 : 4);
                gesture.current = { expected, before: trace, id: (gesture.current?.id ?? 0) + 1 };
              }
              onRotate(i);
            }}
            style={{
              position: 'absolute',
              left: ((i % puzzle.size) + 0.5) * unit,
              top: (Math.floor(i / puzzle.size) + 0.5) * unit,
              width: unit,
              height: unit,
              borderRadius: 8,
            }}
          >
            {kind === 'mirror' && <Mirror unit={unit} motion={motion} rotation={rotations[i]} />}
          </Pressable>
        ),
      )}
    </View>
  );
}
