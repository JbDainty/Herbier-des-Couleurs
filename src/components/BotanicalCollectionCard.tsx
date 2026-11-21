import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Paper } from './Paper';
import { CollectionPaperCorners } from './CollectionPaperCorners';
import { T } from './ui';
import { F } from './fonts';
import { useNativeProgress } from './useNativeProgress';

/** A finite native settling motion; the specimen remains live for the existing colour reveal. */
export function BotanicalCollectionCard({
  children,
  name,
  latin,
  compact,
  motion,
}: {
  children: React.ReactNode;
  name: string;
  latin: string;
  compact: boolean;
  motion: boolean;
}) {
  const { value, settled } = useNativeProgress(560, motion);
  return (
    <Animated.View
      testID="botanical-collection-card"
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        maxWidth: 360,
        maxHeight: 520,
        borderRadius: 12,
        backgroundColor: '#fff3db',
        shadowColor: '#6b5435',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
        elevation: 1,
        opacity: motion
          ? value.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.2, 1, 1] })
          : 1,
        transform: motion
          ? [
              {
                translateY: value.interpolate({
                  inputRange: [0, 0.75, 1],
                  outputRange: [9, -1, 0],
                }),
              },
              {
                scale: value.interpolate({
                  inputRange: [0, 0.75, 1],
                  outputRange: [0.975, 1.002, 1],
                }),
              },
            ]
          : [],
      }}
    >
      <Paper
        testID={settled ? 'collection-card-settled' : 'collection-card-entering'}
        frame={false}
        textureOpacity={0.36}
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          paddingTop: 22,
          paddingBottom: 7,
          paddingHorizontal: 12,
          alignItems: 'center',
          backgroundColor: '#fff3db',
          borderWidth: 0.8,
          borderColor: '#c7ab75',
          borderRadius: 12,
        }}
      >
        <CollectionPaperCorners inset={6} size={20} />
        <View
          pointerEvents="none"
          accessible={false}
          style={{ position: 'absolute', top: 0, alignSelf: 'center', width: 52, height: 24 }}
        >
          <Svg width={52} height={24} viewBox="0 0 52 24" accessible={false}>
            <Path d="M1 0 H51 L26 23Z" fill="#9aab80" stroke="#c7ab75" strokeWidth="0.7" />
            <Path
              d="M26 17 V6 M26 13 Q17 12 20 6 Q26 6 26 13 M26 11 Q34 10 32 5 Q26 5 26 11"
              fill="none"
              stroke="#f7f0d5"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          </Svg>
        </View>
        {children}
        <View
          testID="collection-specimen-caption"
          style={{ width: '100%', flexShrink: 0, paddingTop: 4, alignItems: 'center' }}
        >
          <T
            testID="result-plant-name"
            serif
            maxFontSizeMultiplier={1.2}
            numberOfLines={2}
            adjustsFontSizeToFit
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: compact ? 18 : 21,
              lineHeight: compact ? 21 : 25,
              color: '#365844',
            }}
          >
            {name}
          </T>
          <T
            testID="result-plant-latin"
            maxFontSizeMultiplier={1.2}
            numberOfLines={2}
            adjustsFontSizeToFit
            style={{
              width: '100%',
              fontFamily: F.scientific,
              textAlign: 'center',
              fontSize: compact ? 11 : 13,
              lineHeight: compact ? 14 : 17,
              color: '#81704d',
            }}
          >
            {latin}
          </T>
        </View>
      </Paper>
    </Animated.View>
  );
}
