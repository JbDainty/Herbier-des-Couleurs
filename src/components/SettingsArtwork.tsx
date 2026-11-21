import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { type Settings } from '../state/model';

/** Small, static ink and watercolor drawings: no timer or animation loop. */
export const SettingsArtwork = memo(function SettingsArtwork({
  kind,
  size = 54,
}: {
  kind: keyof Settings;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" accessible={false}>
      <G stroke="#829269" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'sound' && (
          <>
            <Path d="M17 66Q29 32 45 16Q60 9 62 28" fill="none" strokeWidth="1.8" />
            <Path d="M19 61Q3 49 8 30Q24 37 19 61M21 57Q41 59 44 41Q29 42 21 57" fill="#9bad75" />
            <Path d="M20 60 11 36M22 55 39 45" fill="none" />
            <Path
              d="M38 26Q31 22 32 34L29 40Q36 44 42 39L40 33Q43 28 38 26M60 26Q53 23 53 34L50 41Q59 46 66 40L63 34Q65 29 60 26"
              fill="#fff0cd"
              stroke="#b5a06b"
            />
            <Circle cx="36" cy="42" r="2" fill="#c5ab70" stroke="none" />
            <Circle cx="58" cy="44" r="2" fill="#c5ab70" stroke="none" />
          </>
        )}
        {kind === 'music' && (
          <>
            <Path d="M34 46V15L59 8V38M34 24 59 17" fill="none" stroke="#65774c" strokeWidth="5" />
            <Ellipse cx="28" cy="48" rx="9" ry="6" fill="#879463" transform="rotate(-20 28 48)" />
            <Ellipse cx="53" cy="40" rx="9" ry="6" fill="#879463" transform="rotate(-20 53 40)" />
            <Path
              d="M12 68Q22 54 34 57M20 62Q8 59 9 47Q21 48 20 62M25 59Q29 48 41 51Q37 63 25 59"
              fill="#a9b98a"
            />
          </>
        )}
        {kind === 'haptics' && (
          <>
            <Ellipse cx="36" cy="53" rx="28" ry="10" fill="none" stroke="#afbea5" strokeWidth="2" />
            <Ellipse
              cx="36"
              cy="52"
              rx="19"
              ry="6"
              fill="none"
              stroke="#8fa88b"
              strokeWidth="1.5"
            />
            <Path d="M36 10Q16 34 27 43Q36 51 44 42Q54 32 36 10Z" fill="#bdd0b4" />
            <Path d="M34 20Q25 33 31 38" fill="none" stroke="#fff4d9" strokeWidth="2" />
            <Path d="M15 40Q5 44 6 49M57 40Q67 44 66 49" fill="none" stroke="#b9c4ab" />
          </>
        )}
        {kind === 'patterns' && (
          <>
            <Path d="M17 59Q2 49 7 35Q20 40 17 59M18 58Q26 48 33 52Q29 63 18 58" fill="#aaba8a" />
            <Path
              d="M29 17H47V27Q59 34 58 57Q57 65 38 65Q19 65 18 57Q17 34 29 27Z"
              fill="#ede4bf"
              stroke="#aa986b"
            />
            <Path d="M23 44Q37 40 53 44L53 57Q39 64 23 57Z" fill="#b4a5bd" stroke="#a190a9" />
            <Path d="M27 10Q38 7 49 10V19Q38 22 27 19Z" fill="#c5ac76" stroke="#aa8f5e" />
            <G fill="#e7d4e3" stroke="#99849e" strokeWidth="0.7">
              <Ellipse cx="38" cy="47" rx="3" ry="5" />
              <Ellipse cx="38" cy="55" rx="3" ry="5" />
              <Ellipse cx="34" cy="51" rx="5" ry="3" />
              <Ellipse cx="42" cy="51" rx="5" ry="3" />
            </G>
            <Circle cx="38" cy="51" r="2.5" fill="#e8ce85" stroke="#b8a16b" />
            <Path d="M23 32Q20 39 21 47" fill="none" stroke="#fff8e5" strokeWidth="2" />
          </>
        )}
        {kind === 'motion' && (
          <>
            <Circle cx="39" cy="29" r="19" fill="#f2df9f" fillOpacity="0.3" stroke="none" />
            <Path
              d="M39 8Q42 25 57 29Q42 33 39 50Q35 34 21 29Q35 25 39 8Z"
              fill="#e4c56f"
              stroke="#b99a51"
            />
            <Path d="M39 16V40M28 29H50" fill="none" stroke="#f8e9b6" />
            <Path
              d="m15 12 2 5 5 2-5 2-2 5-2-5-5-2 5-2Zm44 31 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"
              fill="#d6b66a"
              stroke="none"
            />
            <Path
              d="M12 68Q22 54 34 54M21 61Q8 58 9 47Q22 49 21 61M25 57Q29 46 40 49Q37 61 25 57"
              fill="#abbc8c"
            />
          </>
        )}
      </G>
    </Svg>
  );
});

export const SettingsFlourish = memo(function SettingsFlourish() {
  return (
    <Svg width="164" height="22" viewBox="0 0 164 22" accessible={false}>
      <Path d="M0 11H51M113 11H164" stroke="#b9a26c" strokeWidth="0.8" />
      <G fill="#b2bd92" stroke="#859366" strokeWidth="0.6">
        <Path d="M58 14Q67 11 75 12Q66 6 64 3Q63 10 75 12M73 12Q84 15 96 8M82 12Q77 4 81 2Q87 6 82 12M89 10Q89 3 95 4Q95 10 89 10M90 11Q97 12 100 16Q91 18 90 11" />
      </G>
      <Circle cx="104" cy="7" r="1.3" fill="#cfb366" />
    </Svg>
  );
});
