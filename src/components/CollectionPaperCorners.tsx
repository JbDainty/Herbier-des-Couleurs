import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** Small immutable pen flourishes, kept clear of the specimen and the controls. */
export const CollectionPaperCorners = memo(function CollectionPaperCorners({
  inset = 9,
  size = 24,
}: {
  inset?: number;
  size?: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      {[0, 1, 2, 3].map((corner) => (
        <View
          key={corner}
          style={{
            position: 'absolute',
            ...(corner % 2 ? { right: inset } : { left: inset }),
            ...(corner > 1 ? { bottom: inset } : { top: inset }),
            width: size,
            height: size,
            transform: [{ scaleX: corner % 2 ? -1 : 1 }, { scaleY: corner > 1 ? -1 : 1 }],
          }}
        >
          <Svg width={size} height={size} viewBox="0 0 28 28" accessible={false}>
            <Path
              d="M26 3 H11 Q3 3 3 11 V26 M5 5 Q16-2 14 6 Q12 13 5 5 Q-2 16 6 14 Q13 12 5 5 M8 8 Q19 11 22 21 M13 12 Q20 9 21 14 Q19 18 13 12"
              fill="none"
              stroke="#b08e49"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M16 17 Q24 14 24 20 Q19 24 16 17Z"
              fill="#d9c58d"
              fillOpacity="0.5"
              stroke="#b08e49"
              strokeWidth="0.55"
            />
          </Svg>
        </View>
      ))}
    </View>
  );
});
