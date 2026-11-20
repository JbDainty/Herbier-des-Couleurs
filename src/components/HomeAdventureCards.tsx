import React from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { Path } from 'react-native-svg';
import { Paper } from './Paper';
import { SvgBackdrop } from './SvgBackdrop';
import { VictoryAction } from './VictoryAction';
import { HomeEmblem } from './HomeArtwork';
import { T, Icon } from './ui';
import { F } from './fonts';
import { species } from '../data/botany';
import type { homeProgress } from '../state/home';

const ink = '#304c3b';
const muted = '#62705c';

function ModeFrame({
  angular = false,
  lavender = false,
}: {
  angular?: boolean;
  lavender?: boolean;
}) {
  const line = lavender ? '#ae98ad' : angular ? '#91a58c' : '#bba36b';
  return (
    <SvgBackdrop viewBox="0 0 360 240" preserveAspectRatio="none">
      <Path
        d={
          angular
            ? 'M20 7H340L353 21V219L340 233H20L7 219V21Z'
            : 'M24 8Q92 13 180 7Q268 13 336 8Q353 13 352 34L350 206Q351 230 330 232Q255 227 180 234Q102 228 29 233Q9 231 10 209L8 34Q7 13 24 8Z'
        }
        fill="none"
        stroke={line}
        strokeWidth={0.8}
      />
      <Path
        d={
          angular
            ? 'M24 14H336L346 25V215L336 226H24L14 215V25Z'
            : 'M30 15Q105 20 180 13Q257 20 330 15Q345 17 345 37L344 204Q345 223 326 225Q253 220 180 228Q105 221 32 226Q17 224 17 204L15 36Q15 18 30 15Z'
        }
        fill="none"
        stroke={line}
        strokeWidth={0.45}
        opacity={0.6}
      />
    </SvgBackdrop>
  );
}

function Ribbon({ label, width }: { label: string; width: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ width, height: 48, alignItems: 'center', justifyContent: 'center' }}
    >
      <SvgBackdrop viewBox="0 0 350 64" preserveAspectRatio="none">
        <Path
          d="M20 5Q80 8 175 3Q270 8 330 5C337 14 337 23 347 32C337 40 337 51 330 59Q250 55 175 61Q100 55 20 59C13 50 13 41 3 32C13 24 13 14 20 5Z"
          fill="#365c49"
          stroke="#b69b62"
          strokeWidth={0.8}
        />
        <Path
          d="M26 10Q95 13 175 8Q255 13 324 10M26 54Q100 50 175 56Q250 50 324 54"
          fill="none"
          stroke="#d1ba7b"
          strokeWidth={0.5}
          opacity={0.6}
        />
      </SvgBackdrop>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Icon name="leaf-outline" size={23} color="#f7edcd" />
        <T
          maxFontSizeMultiplier={1.15}
          style={{ fontFamily: F.display, fontSize: 19, lineHeight: 24, color: '#fff3d9' }}
        >
          {label}
        </T>
      </View>
    </View>
  );
}

export function RestorationCard({
  width,
  height,
  progress,
  onPlay,
  disabled,
  label,
}: {
  width: number;
  height: number;
  progress: ReturnType<typeof homeProgress>;
  onPlay: () => void;
  disabled: boolean;
  label: string;
}) {
  const { fontScale } = useWindowDimensions();
  const brief = height < 190;
  const padding = brief ? 12 : 18;
  const vertical = brief ? 10 : 16;
  const gap = brief ? 2 : 8;
  const showProgress = height >= 136;
  const titleSize = height < 150 ? 24 : brief ? 26 : width >= 500 ? 34 : 30;
  const titleLine = height < 150 ? 30 : brief ? 32 : width >= 500 ? 42 : 38;
  const titleScale = height < 128 ? 1 : brief ? 1.1 : 1.2;
  const bodyHeight = Math.max(
    0,
    height -
      vertical * 2 -
      titleLine * Math.min(titleScale, Math.max(1, fontScale)) -
      48 -
      gap * (showProgress ? 2 : 1),
  );
  const art = !brief && width >= 300 ? Math.min(116, Math.round(width * 0.3), bodyHeight) : 0;
  const description = bodyHeight >= 82;
  const infoSize = brief ? 12 : 14;
  const infoLine = brief ? 17 : 20;
  return (
    <Paper
      testID="home-restoration-card"
      frame={false}
      textureOpacity={0.45}
      style={{
        width,
        height,
        borderRadius: 24,
        paddingHorizontal: padding,
        paddingVertical: vertical,
        backgroundColor: '#fbefd8',
        gap,
        boxShadow: '0 3px 10px #3e594219',
      }}
    >
      <ModeFrame />
      <T
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        maxFontSizeMultiplier={titleScale}
        style={{
          fontFamily: F.displayBold,
          fontSize: titleSize,
          lineHeight: titleLine,
          color: ink,
        }}
      >
        La Restauration
      </T>
      {showProgress && (
        <View
          testID="home-restoration-content"
          style={{ flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            {description && (
              <T
                maxFontSizeMultiplier={1.15}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: muted }}
              >
                Faites refleurir l’herbier.
              </T>
            )}
            <View
              testID="home-restoration-progress"
              style={{
                alignSelf: 'flex-start',
                maxWidth: '100%',
                paddingHorizontal: brief ? 0 : 6,
                paddingVertical: brief ? 0 : 2,
                borderRadius: 7,
                backgroundColor: brief ? 'transparent' : '#eee2c9',
              }}
            >
              <T
                maxFontSizeMultiplier={1.15}
                numberOfLines={2}
                style={{
                  fontFamily: F.medium,
                  fontSize: infoSize,
                  lineHeight: infoLine,
                  color: '#4e674c',
                }}
              >
                <T
                  testID="home-current-species"
                  style={{
                    fontFamily: F.medium,
                    fontSize: infoSize,
                    lineHeight: infoLine,
                    color: '#4e674c',
                  }}
                >
                  {species[progress.plant].name}
                </T>
                {' · '}
                <T
                  testID="home-current-page"
                  style={{
                    fontFamily: F.medium,
                    fontSize: infoSize,
                    lineHeight: infoLine,
                    color: '#4e674c',
                  }}
                >
                  {'Page ' + String(progress.page).padStart(2, '0')}
                </T>
              </T>
            </View>
          </View>
          {art > 0 && (
            <Image
              testID="home-restoration-art"
              source={require('../../assets/home/herbarium.png')}
              accessible={false}
              fadeDuration={0}
              resizeMode="contain"
              style={{ width: art, height: art }}
            />
          )}
        </View>
      )}
      <View testID="home-restore-action" style={{ width: '100%', alignItems: 'center' }}>
        <VictoryAction
          compact
          icon="leaf-outline"
          onPress={onPlay}
          disabled={disabled}
          maxFontSizeMultiplier={1.15}
        >
          {label}
        </VictoryAction>
      </View>
    </Paper>
  );
}

export function DailyModeCard({
  width,
  height,
  availability,
  onPlay,
}: {
  width: number;
  height: number;
  availability: string;
  onPlay: () => void;
}) {
  const { fontScale } = useWindowDimensions();
  const mini = height < 132 || (width < 260 && height < 160);
  const compact = height < 190;
  const padding = compact ? 12 : 18;
  const vertical = mini ? 8 : compact ? 10 : 16;
  const gap = compact ? 4 : 8;
  const titleSize = mini
    ? width < 250
      ? 17
      : 21
    : width < 260
      ? 18
      : compact
        ? 24
        : width >= 500
          ? 34
          : 30;
  const titleLine = mini
    ? width < 260
      ? 21
      : 26
    : width < 260
      ? 23
      : compact
        ? 30
        : width >= 500
          ? 42
          : 38;
  const twoLines = width < 260;
  const titleScale = compact ? 1.1 : 1.15;
  const bodyHeight = Math.max(
    0,
    height -
      vertical * 2 -
      titleLine * (twoLines ? 2 : 1) * Math.min(titleScale, Math.max(1, fontScale)) -
      48 -
      gap * 2,
  );
  const art = mini ? (height < 95 ? 40 : 56) : Math.min(width >= 500 ? 96 : 80, bodyHeight);
  const description = !mini && bodyHeight >= 52;
  const miniWidth = Math.max(0, width - padding * 2 - art - 7);
  return (
    <Pressable
      testID="home-future-day"
      accessibilityRole="button"
      accessible
      accessibilityLabel={
        'Le Vitrail du jour. Trois vitraux, une graine. ' +
        (availability === 'Terminé' ? 'Défi du jour terminé. ' : '') +
        'Jouer.'
      }
      onPress={onPlay}
      style={({ pressed }) => ({ width, height, opacity: pressed ? 0.83 : 1 })}
    >
      <Paper
        testID="home-daily-card"
        frame={false}
        textureOpacity={0.22}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#e7ede0',
          borderRadius: 13,
          paddingHorizontal: padding,
          paddingVertical: vertical,
          gap: mini ? 0 : gap,
          justifyContent: mini ? 'space-between' : undefined,
        }}
      >
        <ModeFrame angular />
        <T
          accessibilityRole="header"
          maxFontSizeMultiplier={titleScale}
          numberOfLines={twoLines ? 2 : 1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={{
            width: mini ? miniWidth : '100%',
            fontFamily: F.displayBold,
            fontSize: titleSize,
            lineHeight: titleLine,
            color: ink,
          }}
        >
          Le Vitrail du jour
        </T>
        {mini ? (
          <>
            <Image
              testID="home-vitrail-art"
              source={require('../../assets/home/rosette.png')}
              accessible={false}
              fadeDuration={0}
              resizeMode="contain"
              style={{
                position: 'absolute',
                right: padding - 3,
                bottom: (height - art) / 2,
                width: art,
                height: art,
              }}
            />
            <View
              style={{
                width: miniWidth,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3,
              }}
            >
              <T
                testID="home-future-day-availability"
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={{ fontFamily: F.medium, fontSize: 11, lineHeight: 14, color: '#586e52' }}
              >
                {availability}
              </T>
              <T
                maxFontSizeMultiplier={1.1}
                style={{ fontFamily: F.bold, fontSize: 13, lineHeight: 16, color: '#365c49' }}
              >
                Jouer →
              </T>
            </View>
          </>
        ) : (
          <>
            <View
              testID="home-daily-content"
              style={{ flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                {description && (
                  <T
                    maxFontSizeMultiplier={1.15}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: '#526b53' }}
                  >
                    Trois vitraux, une graine.
                  </T>
                )}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 7,
                    backgroundColor: '#d9e4d1',
                  }}
                >
                  <T
                    testID="home-future-day-availability"
                    maxFontSizeMultiplier={1.1}
                    numberOfLines={1}
                    style={{ fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: '#4b6447' }}
                  >
                    {availability}
                  </T>
                </View>
              </View>
              {art >= 36 && (
                <Image
                  testID="home-vitrail-art"
                  source={require('../../assets/home/rosette.png')}
                  accessible={false}
                  fadeDuration={0}
                  resizeMode="contain"
                  style={{ width: art, height: art }}
                />
              )}
            </View>
            <View testID="home-daily-action" style={{ width: '100%', alignItems: 'center' }}>
              <Ribbon label="Jouer" width={Math.min(350, width - padding * 2)} />
            </View>
          </>
        )}
      </Paper>
    </Pressable>
  );
}

export function MysteryModeCard({ width, height }: { width: number; height: number }) {
  const brief = width < 290;
  return (
    <View
      testID="home-future-mystery"
      accessibilityLabel="Les Encres oubliées, mode à venir."
      style={{ width, height }}
    >
      <Paper
        frame={false}
        textureOpacity={0.15}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#eddfeb',
          borderRadius: 11,
          flexDirection: 'row',
          alignItems: 'center',
          gap: brief ? 5 : 8,
          paddingHorizontal: brief ? 12 : 16,
        }}
      >
        <ModeFrame angular lavender />
        <HomeEmblem name="mystery" size={height < 50 ? 26 : 36} />
        <T
          accessibilityRole="header"
          maxFontSizeMultiplier={1.1}
          numberOfLines={brief ? 2 : 1}
          adjustsFontSizeToFit
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: F.displayBold,
            fontSize: brief ? 15 : 20,
            lineHeight: brief ? 17.5 : 25,
            color: '#695568',
          }}
        >
          Les Encres oubliées
        </T>
        <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
          <Icon name="lock-closed-outline" size={13} color="#79637b" />
          <T
            testID="home-future-mystery-availability"
            maxFontSizeMultiplier={1.1}
            numberOfLines={1}
            style={{
              fontFamily: F.medium,
              fontSize: brief ? 10 : 12,
              lineHeight: 16,
              color: '#695568',
            }}
          >
            À venir
          </T>
        </View>
      </Paper>
    </View>
  );
}
