import React, { memo, useId } from 'react';
import { Asset } from 'expo-asset';
import Svg, { Defs, Image as SvgImage, LinearGradient, Mask, Rect, Stop } from 'react-native-svg';
import { journeyLandscapes } from '../data/journeyLandscapes';
import { MAP_WIDTH } from '../journey/layout';
import { BLEND_HEIGHT, blendImageBounds, landscapeJoin } from '../journey/scenery';

function painting(ecosystem: number, row: number, atBottom: boolean) {
  const source = journeyLandscapes[ecosystem];
  const asset = Asset.fromModule(source);
  return { href: source, ...blendImageBounds(row, atBottom, asset.width!, asset.height!) };
}

/** Each virtual row paints its half of the same static wash, beneath the route. */
export const JourneyLandscapeBlend = memo(function JourneyLandscapeBlend({
  row,
  frontier,
  edge,
  scale,
}: {
  row: number;
  frontier: number;
  edge: 'top' | 'bottom';
  scale: number;
}) {
  const id = 'wash' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const bottom = edge === 'bottom';
  const upperRow = bottom ? row : row + 1;
  const join = landscapeJoin(upperRow, frontier);
  if (!join) return null;
  const half = BLEND_HEIGHT / 2;
  return (
    <Svg
      testID={`journey-wash-${upperRow}-${edge}`}
      accessible={false}
      pointerEvents="none"
      width="100%"
      height={scale * half}
      viewBox={`0 ${bottom ? 0 : half} ${MAP_WIDTH} ${half}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, [edge]: 0 }}
    >
      <Defs>
        <LinearGradient id={`${id}-fade`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset={0} stopColor="#000" />
          <Stop offset={0.125} stopColor="#0b0b0b" />
          <Stop offset={0.25} stopColor="#282828" />
          <Stop offset={0.5} stopColor="#808080" />
          <Stop offset={0.75} stopColor="#d7d7d7" />
          <Stop offset={0.875} stopColor="#f4f4f4" />
          <Stop offset={1} stopColor="#fff" />
        </LinearGradient>
        <Mask
          id={id}
          x={0}
          y={0}
          width={MAP_WIDTH}
          height={BLEND_HEIGHT}
          maskUnits="userSpaceOnUse"
          maskType="luminance"
        >
          <Rect width={MAP_WIDTH} height={BLEND_HEIGHT} fill={`url(#${id}-fade)`} />
        </Mask>
      </Defs>
      <SvgImage {...painting(join.upper, upperRow, true)} preserveAspectRatio="none" />
      <SvgImage
        {...painting(join.lower, upperRow - 1, false)}
        preserveAspectRatio="none"
        mask={`url(#${id})`}
      />
    </Svg>
  );
});
