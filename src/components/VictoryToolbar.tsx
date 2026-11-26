import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { C, Icon, T } from './ui';
import { F } from './fonts';
import { HerbariumBookCover } from './HerbariumBookButton';

type Props = {
  reveal: boolean;
  onReplay: () => void;
  onMiddle: () => void;
  onMenu: () => void;
};

export function VictoryToolbar({ reveal, onReplay, onMiddle, onMenu }: Props) {
  const actions = [
    {
      title: 'Rejouer',
      label: 'Rejouer la page',
      icon: <Icon name="refresh-outline" size={20} color={C.green} />,
      press: onReplay,
    },
    {
      title: reveal ? 'Herbier' : 'Passer',
      label: reveal ? 'Ouvrir l’herbier' : 'Passer l’animation',
      icon: (
        <Icon name={reveal ? 'book-outline' : 'arrow-forward-outline'} size={20} color={C.green} />
      ),
      press: onMiddle,
    },
    {
      title: 'Menu',
      label: 'Retour au menu principal',
      icon: <HerbariumBookCover height={22} />,
      press: onMenu,
      highlighted: true,
    },
  ];
  return (
    <View testID="victory-toolbar" style={styles.bar}>
      {actions.map((action, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={styles.divider} />}
          <Pressable
            testID="victory-action-secondary"
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.press}
            style={({ pressed }) => [
              styles.button,
              action.highlighted && styles.menu,
              pressed && styles.pressed,
            ]}
          >
            <View pointerEvents="none" style={styles.icon}>
              {action.icon}
            </View>
            <T
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.3}
              style={styles.text}
            >
              {action.title}
            </T>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    maxWidth: 350,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 13,
    borderColor: '#b49d6f',
    backgroundColor: '#fbefd8',
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  icon: { height: 22, justifyContent: 'center', alignItems: 'center' },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'center',
    height: 28,
    backgroundColor: '#c6b387',
  },
  menu: { backgroundColor: '#e1e8ce' },
  pressed: { backgroundColor: '#d6dfc5' },
  text: { fontFamily: F.medium, fontSize: 16, lineHeight: 20, color: C.green, textAlign: 'center' },
});
