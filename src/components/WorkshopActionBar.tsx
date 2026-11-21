import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Paper } from './Paper';
import { T } from './ui';
import { F } from './fonts';
import type { SpellIconName } from './SpellIcon';
import type { workshopLayout } from '../layout/workshop';

const illustrations = {
  undo: require('../../assets/workshop-actions/undo.webp'),
  restart: require('../../assets/workshop-actions/restart.webp'),
  mix: require('../../assets/workshop-actions/mix.webp'),
  hint: require('../../assets/workshop-actions/hint.webp'),
};

type Action = {
  name: string;
  icon: SpellIconName;
  action: () => void;
  disabled: boolean;
};

/** The menu's ivory navigation treatment, with independent accessible game actions. */
export function WorkshopActionBar({
  layout,
  actions,
  disabled,
}: {
  layout: ReturnType<typeof workshopLayout>;
  actions: readonly Action[];
  disabled: boolean;
}) {
  return (
    <Paper
      testID="game-actions"
      frame={false}
      textureOpacity={0.32}
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: layout.actionVerticalPadding,
        paddingHorizontal: layout.actionHorizontalPadding,
        borderRadius: layout.actionsHeight / 2,
        borderWidth: 1,
        borderColor: '#b69c66',
        backgroundColor: '#fbefd8',
        width: '100%',
        height: layout.actionsHeight,
        maxWidth: 480,
        alignSelf: 'center',
      }}
    >
      <View
        testID="ivory-action-outline"
        pointerEvents="none"
        accessible={false}
        style={[
          StyleSheet.absoluteFill,
          {
            margin: 2,
            borderRadius: layout.actionsHeight / 2,
            borderWidth: 0.5,
            borderColor: '#fff8e8',
          },
        ]}
      />
      {actions.map((action) => {
        const unavailable = disabled || action.disabled;
        return (
          <Pressable
            key={action.icon}
            accessibilityLabel={action.name}
            accessibilityRole="button"
            accessibilityHint={
              action.icon === 'hint' ? 'Conseil gratuit, sans dépenser de graines' : undefined
            }
            accessibilityState={{ disabled: unavailable }}
            onPress={action.action}
            disabled={unavailable}
            style={({ pressed }) => ({
              alignItems: 'center',
              gap: layout.actionContentGap,
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: 0,
              borderRadius: 18,
              opacity: unavailable ? 0.4 : pressed ? 0.8 : 1,
              backgroundColor: pressed ? '#dce5cc66' : 'transparent',
            })}
          >
            <Image
              testID={`workshop-action-icon-${action.icon}`}
              source={illustrations[action.icon]}
              accessible={false}
              fadeDuration={0}
              resizeMode="contain"
              style={{ width: layout.actionIconSize, height: layout.actionIconSize }}
            />
            {layout.showActionLabels && (
              <T
                testID={`workshop-action-label-${action.icon}`}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.15}
                style={{
                  fontFamily: F.medium,
                  fontSize: layout.actionLabelSize,
                  lineHeight: layout.actionLabelLine,
                  height: layout.actionLabelHeight,
                  color: '#3d5a42',
                  textAlign: 'center',
                  maxWidth: '100%',
                }}
              >
                {action.name}
              </T>
            )}
          </Pressable>
        );
      })}
    </Paper>
  );
}
