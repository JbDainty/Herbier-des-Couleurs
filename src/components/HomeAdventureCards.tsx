import React from 'react';
import { Image, Pressable, View } from 'react-native';
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
      style={{ width, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <SvgBackdrop viewBox="0 0 220 44" preserveAspectRatio="none">
        <Path
          d="M14 4Q60 6 110 3Q165 6 206 4L216 22L206 40Q161 37 110 41Q57 38 14 40L4 22Z"
          fill="#365c49"
          stroke="#b69b62"
          strokeWidth={0.8}
        />
        <Path
          d="M17 8Q60 10 110 7Q164 10 202 8M17 36Q62 33 110 37Q161 34 202 36"
          fill="none"
          stroke="#d1ba7b"
          strokeWidth={0.5}
          opacity={0.6}
        />
      </SvgBackdrop>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Icon name="leaf-outline" size={17} color="#f7edcd" />
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
  const brief = height < 155;
  const padding = brief ? 12 : 18;
  const art = height >= 180 && width >= 300 ? Math.min(158, Math.round(height * 0.52)) : 0;
  const showProgress = height >= 136;
  const description = height >= 205;
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
        paddingVertical: brief ? 10 : 16,
        backgroundColor: '#fbefd8',
        justifyContent: 'space-between',
        boxShadow: '0 3px 10px #3e594219',
      }}
    >
      <ModeFrame />
      {!!art && (
        <Image
          testID="home-restoration-art"
          source={require('../../assets/home/herbarium.png')}
          accessible={false}
          fadeDuration={0}
          resizeMode="contain"
          style={{ position: 'absolute', width: art, height: art, right: 14, bottom: 70 }}
        />
      )}
      <View style={{ gap: 2 }}>
        <T
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={brief ? 1.1 : 1.2}
          style={{
            fontFamily: F.displayBold,
            fontSize: brief ? 26 : width >= 500 ? 38 : 32,
            lineHeight: brief ? 30 : width >= 500 ? 43 : 38,
            color: ink,
          }}
        >
          La Restauration
        </T>
        {description && (
          <T
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.15}
            style={{
              fontFamily: F.medium,
              fontSize: 14,
              lineHeight: 20,
              color: muted,
              paddingRight: art ? art - 18 : 0,
            }}
          >
            Faites refleurir l’herbier.
          </T>
        )}
      </View>
      {showProgress && (
        <View style={{ flex: 1, justifyContent: 'center', paddingRight: art ? art + 2 : 0 }}>
          <T
            maxFontSizeMultiplier={1.15}
            numberOfLines={2}
            style={{
              fontFamily: F.medium,
              fontSize: brief ? 12 : 14,
              lineHeight: brief ? 17 : 20,
              color: '#4e674c',
            }}
          >
            <T
              testID="home-current-species"
              style={{
                fontFamily: F.medium,
                fontSize: brief ? 12 : 14,
                lineHeight: brief ? 17 : 20,
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
                fontSize: brief ? 12 : 14,
                lineHeight: brief ? 17 : 20,
                color: '#4e674c',
              }}
            >
              {'Page ' + String(progress.page).padStart(2, '0')}
            </T>
          </T>
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
  const brief = height < 160;
  const padding = brief ? 12 : 18;
  const art = brief ? (height < 95 ? 40 : 62) : Math.min(126, Math.round(height * 0.57));
  const titleSize = brief
    ? width < 250
      ? 17
      : width < 280 || height < 95
        ? 18
        : 23
    : width >= 500
      ? 33
      : 27;
  const labelWidth = Math.max(0, width - padding * 2 - (brief ? art + 7 : 0));
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
        frame={false}
        textureOpacity={0.22}
        testID="home-daily-card"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#e7ede0',
          borderRadius: 13,
          paddingHorizontal: padding,
          paddingVertical: brief ? 8 : 16,
          justifyContent: 'space-between',
        }}
      >
        <ModeFrame angular />
        <Image
          testID="home-vitrail-art"
          source={require('../../assets/home/rosette.png')}
          accessible={false}
          fadeDuration={0}
          resizeMode="contain"
          style={{
            position: 'absolute',
            right: padding - 3,
            bottom: brief ? (height - art) / 2 : 10,
            width: art,
            height: art,
          }}
        />
        <View style={{ width: labelWidth }}>
          <T
            accessibilityRole="header"
            maxFontSizeMultiplier={brief ? 1.1 : 1.15}
            numberOfLines={brief && width < 260 ? 2 : 1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{
              fontFamily: F.displayBold,
              fontSize: titleSize,
              lineHeight: brief && width < 260 ? 21 : titleSize + 5,
              color: ink,
            }}
          >
            Le Vitrail du jour
          </T>
          {!brief && (
            <T
              maxFontSizeMultiplier={1.15}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontFamily: F.medium,
                fontSize: 14,
                lineHeight: 20,
                color: '#526b53',
                marginTop: 3,
              }}
            >
              Trois vitraux, une graine.
            </T>
          )}
        </View>
        <View
          style={{
            width: brief ? labelWidth : Math.min(178, width - padding * 2 - art - 6),
            gap: 3,
            flexDirection: brief ? 'row' : 'column',
            alignItems: brief ? 'center' : undefined,
            justifyContent: brief ? 'space-between' : undefined,
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
          {brief ? (
            <T
              maxFontSizeMultiplier={1.1}
              style={{ fontFamily: F.bold, fontSize: 13, lineHeight: 16, color: '#365c49' }}
            >
              Jouer →
            </T>
          ) : (
            <Ribbon label="Jouer" width={Math.min(178, width - padding * 2 - art - 6)} />
          )}
        </View>
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
