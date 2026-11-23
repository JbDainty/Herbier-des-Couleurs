import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { Paper } from './Paper';
import { CollectionPaperCorners } from './CollectionPaperCorners';
import { SvgBackdrop } from './SvgBackdrop';
import { T, C, Button } from './ui';
import { F } from './fonts';

export const shopArtwork = {
  phenix: require('../../assets/shop/phenix.webp'),
  orchid: require('../../assets/shop/orchid.webp'),
  meadow: require('../../assets/shop/meadow.webp'),
};

/** Quiet paper and static pen flourishes, shared with the collection and settings pages. */
export function ShopPaper({ children, style, ...props }: ViewProps) {
  return (
    <Paper {...props} frame={false} textureOpacity={0.4} style={[styles.paper, style]}>
      <View pointerEvents="none" style={styles.innerBorder} />
      <CollectionPaperCorners size={20} inset={8} />
      {children}
    </Paper>
  );
}

export function ShopRibbon({
  children,
  onPress,
  disabled = false,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.ribbon, { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}
    >
      <SvgBackdrop viewBox="0 0 350 54" preserveAspectRatio="none">
        <Path
          d="M17 4Q100 7 175 3Q250 7 333 4L348 27L333 50Q250 47 175 51Q100 47 17 50L2 27Z"
          fill={C.green}
          stroke="#b39c68"
          strokeWidth="0.8"
        />
        <Path
          d="M25 10Q105 12 175 8Q245 12 325 10M25 44Q105 42 175 46Q245 42 325 44"
          fill="none"
          stroke="#b8ad7c"
          strokeWidth="0.6"
          opacity="0.6"
        />
        <G fill="none" stroke="#d7d5a7" strokeWidth="0.8" opacity="0.8">
          <Path d="M18 37Q26 29 22 15M23 28Q14 27 17 20Q24 22 23 28M24 25Q31 23 28 17Q22 19 24 25M332 37Q324 29 328 15M327 28Q336 27 333 20Q326 22 327 28M326 25Q319 23 322 17Q328 19 326 25" />
        </G>
      </SvgBackdrop>
      <T
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        maxFontSizeMultiplier={1.3}
        style={styles.ribbonText}
      >
        {children}
      </T>
    </Pressable>
  );
}

export function SpecimenHalo() {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 320 260"
        preserveAspectRatio="xMidYMid meet"
        accessible={false}
      >
        <Path
          d="M45 235V126Q45 17 160 14Q275 17 275 126V235"
          fill="#e6d39a"
          fillOpacity="0.16"
          stroke="#c9b17a"
          strokeWidth="0.65"
        />
        <Path
          d="M51 233V127Q51 25 160 21Q269 25 269 127V233"
          fill="none"
          stroke="#d6c69b"
          strokeWidth="0.6"
        />
        <G fill="#bda16a" opacity="0.7">
          <Path d="m62 72 2 7 7 2-7 2-2 7-2-7-7-2 7-2Zm203 106 1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5Z" />
          <Circle cx="256" cy="66" r="1.5" />
        </G>
      </Svg>
    </View>
  );
}

export function PeacefulBook() {
  return (
    <Svg width="48" height="58" viewBox="0 0 48 58" accessible={false}>
      <Path
        d="M8 9Q21 7 39 8L40 48Q24 46 9 50Q4 48 5 43V15Q5 11 8 9Z"
        fill="#789070"
        stroke="#586f51"
        strokeWidth="1"
      />
      <Path
        d="M10 13Q23 11 35 12V43Q23 42 10 46Z"
        fill="#dfe5c8"
        stroke="#b6ad7c"
        strokeWidth="0.8"
      />
      <Path
        d="M18 38Q22 28 28 20M21 31Q11 29 15 21Q24 23 21 31M24 27Q27 16 33 21Q31 28 24 27"
        fill="#9ead7b"
        stroke="#70825a"
        strokeWidth="0.9"
      />
      <Path
        d="M9 48Q24 44 40 47L39 51Q23 48 10 53"
        fill="#f6e8c7"
        stroke="#ad996c"
        strokeWidth="0.8"
      />
    </Svg>
  );
}

export function ShopModal({
  title,
  children,
  onClose,
  motion,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  motion: boolean;
}) {
  return (
    <Modal visible transparent animationType={motion ? 'fade' : 'none'} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ width: '100%', maxWidth: 420, maxHeight: '90%' }}
        >
          <ShopPaper accessibilityViewIsModal style={{ padding: 24, gap: 16 }}>
            <T serif accessibilityRole="header" style={{ fontSize: 28, lineHeight: 34 }}>
              {title}
            </T>
            {children}
            <Button secondary onPress={onClose}>
              Revenir à la boutique
            </Button>
          </ShopPaper>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  paper: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 0.8,
    borderColor: '#c7ad7a',
    backgroundColor: '#fbefd8',
    overflow: 'hidden',
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 5,
    borderRadius: 19,
    borderWidth: 0.5,
    borderColor: '#dfcda7',
  },
  ribbon: {
    width: '100%',
    minHeight: 50,
    paddingVertical: 10,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonText: {
    fontFamily: F.display,
    fontSize: 20,
    lineHeight: 25,
    color: '#fff0cf',
    textAlign: 'center',
    flexShrink: 1,
  },
  modalBackdrop: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20392ed9',
  },
});
