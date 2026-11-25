import { ecosystemForPage } from '../src/data/ecology';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View, Pressable, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { chapters } from '../src/data/botany';
import { useGame } from '../src/state/store';
import { campaignStarTotal, unlocked, loadLevel, restoration } from '../src/state/model';
import { T, Icon, C } from '../src/components/ui';
import { JourneyPageBook } from '../src/components/JourneyPageBook';
import { BookActionsContext } from '../src/components/BookActions';
import { BookChromeContext } from '../src/components/BookScrollView';
import { PageTurnContext } from '../src/components/PageTurn';
import { StarFlower } from '../src/components/RewardStars';
import { SvgBackdrop } from '../src/components/SvgBackdrop';
import { JourneyMap } from '../src/components/JourneyMap';
import { journeyFrontier } from '../src/journey/layout';

export default function Carte() {
  const { save, setSave } = useGame();
  const turnPage = useContext(PageTurnContext);
  const { openWorkshop, enteringWorkshop } = useContext(BookActionsContext);
  const { header } = useContext(BookChromeContext);
  const { height, width } = useWindowDimensions();
  const short = height < 550;
  const frontier = journeyFrontier(save);
  const [biome, setBiome] = useState(ecosystemForPage(save.current));
  const [selected, setSelected] = useState<number | null>(null);
  const launching = useRef(false);
  const choose = useCallback((id: number) => {
    launching.current = false;
    setSelected(id);
  }, []);
  const chapter = chapters[biome];
  const total = useMemo(() => campaignStarTotal(save.completed), [save.completed]);
  const starCounter = (
    <View
      testID="journey-star-total"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${total} ${total > 1 ? 'étoiles' : 'étoile'} au total dans la campagne`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
    >
      <StarFlower filled size={short ? 24 : 30} />
      <T
        serif
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={{ fontSize: short ? 19 : 22, color: C.ink }}
      >
        {total}
      </T>
    </View>
  );
  const completed = selected ? save.completed[selected] : null;
  const resume = selected === save.current && save.moves > 0;
  const play = () => {
    if (!selected || launching.current || enteringWorkshop || !unlocked(save, selected)) return;
    launching.current = true;
    const id = selected;
    setSelected(null);
    turnPage(id, () => {
      // Continuing the current attempt keeps its tubes, moves and acquired hint.
      if (!(id === save.current && !save.completed[id])) setSave((s) => loadLevel(s, id));
      openWorkshop();
    });
  };
  return (
    <View testID="ecosystems-screen" style={{ flex: 1, minHeight: 0 }}>
      {short ? (
        <View
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu principal"
            onPress={() => router.dismissTo('/')}
            style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
          >
            <Icon name="book-outline" size={26} />
          </Pressable>
          <T serif accessibilityRole="header" testID="ecosystems-heading" style={{ fontSize: 23 }}>
            Écosystèmes
          </T>
          {starCounter}
        </View>
      ) : (
        header
      )}
      <View
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          maxWidth: 780,
          alignSelf: 'center',
          paddingHorizontal: width < 380 ? 10 : 18,
          paddingBottom: 2,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 5,
            paddingTop: short ? 0 : 1,
            marginBottom: short ? 4 : 10,
            gap: 8,
          }}
        >
          <View
            style={{
              flexShrink: 1,
              minWidth: 0,
              paddingLeft: 14,
              paddingRight: 23,
              paddingVertical: short ? 3 : 8,
            }}
          >
            <SvgBackdrop viewBox="0 0 240 48">
              <Path d="M0 0H240L230 24L240 48H0Z" fill={C.green} />
              <Path d="M3 3H224M3 44H224" fill="none" stroke="#aba77e" strokeWidth="0.8" />
            </SvgBackdrop>
            <T
              testID="journey-biome-title"
              serif
              maxFontSizeMultiplier={1.25}
              numberOfLines={2}
              adjustsFontSizeToFit
              style={{ color: '#f9efce', fontSize: short ? 23 : 27, lineHeight: short ? 27 : 31 }}
            >
              {chapter.name}
            </T>
          </View>
          {!short && starCounter}
        </View>
        <JourneyMap save={save} frontier={frontier} onSelect={choose} onBiome={setBiome} />
      </View>
      <Modal
        visible={selected !== null}
        transparent
        animationType={save.settings.motion ? 'fade' : 'none'}
        onRequestClose={() => setSelected(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#253c31a6' }}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 13,
              paddingVertical: 8,
            }}
          >
            <Pressable
              accessibilityLabel="Fermer la fiche de page"
              accessibilityRole="button"
              onPress={() => setSelected(null)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            {selected !== null && (
              <JourneyPageBook
                page={selected}
                stage={restoration(save, Math.floor((selected - 1) / 5))}
                stars={completed?.stars ?? 0}
                action={
                  completed ? 'Rejouer la page' : resume ? 'Reprendre la page' : 'Jouer la page'
                }
                onPlay={play}
                onClose={() => setSelected(null)}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
