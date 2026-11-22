import { mechanicIds, mechanicDetails } from '../engine/mechanics';
import { MechanicVials } from './MechanicVials';
import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { CAPACITY, clone, pour, won, type Board } from '../engine/puzzle';
import { Botanical } from './Botanical';
import { CollectionPaperCorners } from './CollectionPaperCorners';
import { HerbariumBookButton } from './HerbariumBookButton';
import { Paper } from './Paper';
import { SettingsArtwork, SettingsFlourish } from './SettingsArtwork';
import { workshopActionIllustrations } from './WorkshopActionBar';
import { F } from './fonts';
import { C, Icon, T } from './ui';
import { VictoryAction } from './VictoryAction';

const trial: Board = [[0, 0, 1, 1], [1, 1, 0, 0], []];
const trialColors = ['#ae617b', '#548e83'];
const practiceInstruction = 'Touchez la fiole 1, puis la fiole 3.';

function GuideVial({
  tube,
  index,
  selected,
  motion,
  onPress,
}: {
  tube: number[];
  index: number;
  selected: boolean;
  motion: boolean;
  onPress: () => void;
}) {
  const id = 'guide-vial-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = Animated.timing(lift, {
      toValue: selected ? 1 : 0,
      duration: motion ? 180 : 0,
      useNativeDriver: Platform.OS !== 'web',
    });
    run.start();
    return () => run.stop();
  }, [selected, motion, lift]);
  const complete = tube.length === CAPACITY && tube.every((color) => color === tube[0]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Fiole d’essai ${index + 1}, ${tube.length === 0 ? 'vide' : complete ? 'complète' : `${tube.length} mesures`}${tube.length ? `, couleur du dessus : ${tube.at(-1) === 0 ? 'rose ancien' : 'vert d’eau'}` : ''}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        maxWidth: 96,
        minHeight: 149,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <Animated.View
        style={{
          width: '100%',
          height: 126,
          transform: [
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) },
          ],
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 86 180" accessible={false}>
          <Defs>
            <ClipPath id={`${id}-inside`}>
              <Path d="M21 21V147 Q21 170 43 170 Q65 170 65 147V21Z" />
            </ClipPath>
            <LinearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
              <Stop stopColor="#fffce8" stopOpacity={0.85} />
              <Stop offset="0.25" stopColor="#b1c4b0" stopOpacity={0.12} />
              <Stop offset="0.8" stopColor="#fffbe4" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#799b85" stopOpacity={0.4} />
            </LinearGradient>
          </Defs>
          <Ellipse cx={43} cy={172} rx={28} ry={4} fill="#8b7954" opacity={0.12} />
          <G clipPath={`url(#${id}-inside)`}>
            {tube.map((color, i) => (
              <Rect
                key={i}
                x={19}
                y={142 - i * 30}
                width={48}
                height={31}
                fill={trialColors[color]}
                opacity={0.88}
              />
            ))}
            {tube.length > 0 && (
              <Ellipse
                cx={43}
                cy={172 - tube.length * 30}
                rx={23}
                ry={3}
                fill="#f7e8b5"
                opacity={0.45}
              />
            )}
          </G>
          <Path
            d="M18 18V148 Q18 174 43 174 Q68 174 68 148V18"
            fill={`url(#${id}-glass)`}
            stroke={selected ? '#9b7438' : '#78907a'}
            strokeWidth={selected ? 1.8 : 1}
          />
          <Path
            d="M24 31V145 Q24 159 32 163 M61 28V139"
            fill="none"
            stroke="#fffbe5"
            strokeWidth={2}
            opacity={0.7}
            strokeLinecap="round"
          />
          <Ellipse
            cx={43}
            cy={18}
            rx={25}
            ry={5}
            fill="#f7efdb"
            fillOpacity={0.55}
            stroke="#78907a"
            strokeWidth={0.9}
          />
          {[0, 1, 2, 3].map((n) => (
            <Path
              key={n}
              d={`M68 ${142 - n * 30}h-6`}
              stroke="#83927a"
              strokeWidth={0.7}
              opacity={0.65}
            />
          ))}
          {complete && (
            <G transform="translate(69 9)" fill="none" stroke="#6d8157" strokeWidth={1.1}>
              <Circle r={9} fill="#eee7c6" />
              <Path d="M-4 0 0 4 5-4 M0 4Q-2-4 2-6" />
            </G>
          )}
        </Svg>
      </Animated.View>
      <T
        style={{
          fontFamily: F.scientific,
          fontSize: 15,
          lineHeight: 21,
          color: selected ? '#926c36' : C.muted,
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </T>
    </Pressable>
  );
}

/** A separate, real puzzle: practice never touches the player's save or audio mixer. */
function FirstPour({ motion }: { motion: boolean }) {
  const [board, setBoard] = useState(() => clone(trial));
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState(practiceInstruction);
  const done = won(board);
  const tap = (index: number) => {
    if (done) return;
    if (selected === index) {
      setSelected(null);
      return;
    }
    if (selected === null) {
      if (!board[index].length) {
        setNote('Choisissez une fiole qui contient du liquide.');
        return;
      }
      setSelected(index);
      setNote(`Fiole ${index + 1} choisie. Touchez une fiole vide ou la même teinte en surface.`);
      return;
    }
    const next = pour(board, selected, index);
    setSelected(null);
    if (!next) {
      setNote('Essayez une fiole vide ou la même teinte en surface, avec de la place.');
      return;
    }
    setBoard(next);
    setNote(
      won(next)
        ? 'Vous avez le geste ! Les deux fioles sont complètes.'
        : 'Continuez jusqu’à remplir deux fioles unies.',
    );
  };
  return (
    <View testID="guide-practice" style={{ alignItems: 'center', marginTop: 10 }}>
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 5,
          paddingTop: 10,
        }}
      >
        {board.map((tube, i) => (
          <GuideVial
            key={i}
            tube={tube}
            index={i}
            selected={selected === i}
            motion={motion}
            onPress={() => tap(i)}
          />
        ))}
      </View>
      <View
        style={{
          width: '90%',
          height: 4,
          borderRadius: 3,
          backgroundColor: '#b49a68',
          opacity: 0.5,
          marginTop: 3,
        }}
      />
      <T
        testID="guide-practice-note"
        accessibilityLiveRegion="polite"
        style={[
          styles.prose,
          {
            marginTop: 13,
            minHeight: 44,
            width: '100%',
            textAlign: 'center',
            color: done ? C.green : '#766344',
          },
        ]}
      >
        {note}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recommencer l’essai"
        onPress={() => {
          setBoard(clone(trial));
          setSelected(null);
          setNote(practiceInstruction);
        }}
        style={({ pressed }) => ({
          minHeight: 44,
          flexDirection: 'row',
          gap: 7,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Image
          source={workshopActionIllustrations.restart}
          accessible={false}
          fadeDuration={0}
          style={styles.restartIcon}
        />
        <T style={styles.practiceLabel}>Recommencer l’essai</T>
      </Pressable>
      <T style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>
        Essai gratuit, sans effet sur votre partie.
      </T>
    </View>
  );
}

const cards = [
  { id: 'gestes', title: 'Les gestes' },
  { id: 'plante', title: 'Restaurer une plante' },
  { id: 'graines', title: 'Étoiles et graines' },
  { id: 'fioles', title: 'Fioles spéciales' },
] as const;

type GuideCardId = (typeof cards)[number]['id'];

export function BotanicalGuide({
  nickname,
  motion,
  firstRun = false,
  onEnter,
  onClose,
}: {
  nickname: string;
  motion: boolean;
  firstRun?: boolean;
  onEnter: () => void;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 760;
  const artworkSize = compact ? 37 : 47;
  const [expanded, setExpanded] = useState<GuideCardId | null>('gestes');
  const [practicing, setPracticing] = useState(false);

  return (
    <View testID="botanical-guide" style={styles.screen}>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        <Image
          source={require('../../assets/home/clearing.jpg')}
          resizeMode="cover"
          resizeMethod="resize"
          fadeDuration={0}
          style={styles.background}
        />
      </View>
      <ScrollView
        testID="guide-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.page, compact && styles.compactPage]}
      >
        <View style={[styles.header, compact && styles.compactHeader]}>
          <View style={styles.headerTitle}>
            <T
              serif
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              style={[styles.title, compact && styles.compactTitle]}
            >
              Aide
            </T>
            <SettingsFlourish />
          </View>
          <View style={styles.menu}>
            {firstRun ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aller directement au jeu"
                onPress={onClose}
                style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
              >
                <Icon name="arrow-forward-outline" size={23} color={C.green} />
                <T style={styles.practiceLabel}>Jouer</T>
              </Pressable>
            ) : (
              <HerbariumBookButton
                compact={compact}
                motion={motion}
                onHome={onClose}
                accessibilityLabel="Fermer l’aide"
              />
            )}
          </View>
        </View>
        {firstRun && (
          <T style={styles.welcome}>
            {nickname
              ? `Bienvenue dans votre carnet, ${nickname}.`
              : 'Bienvenue dans votre carnet.'}
          </T>
        )}
        {cards.map(({ id, title }) => {
          const open = id === expanded;
          const keepPractice = id === 'gestes' && practicing;
          return (
            <Paper
              key={id}
              testID={`guide-card-${id}`}
              frame={false}
              textureOpacity={0.38}
              style={[styles.card, open && styles.openCard]}
            >
              <View pointerEvents="none" style={styles.innerBorder} />
              <CollectionPaperCorners size={open ? 17 : 13} inset={7} />
              <Pressable
                testID={`guide-toggle-${id}`}
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityState={{ expanded: open }}
                aria-expanded={open}
                onPress={() => setExpanded(open ? null : id)}
                style={({ pressed }) => [
                  styles.cardHeader,
                  compact && styles.compactCardHeader,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  pointerEvents="none"
                  accessible={false}
                  aria-hidden
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.emblem, { width: artworkSize, height: artworkSize }]}
                >
                  {id === 'gestes' && (
                    <Icon name="leaf-outline" size={artworkSize} color="#6e8557" />
                  )}
                  {id === 'plante' && (
                    <Botanical index={2} stage={4} size={artworkSize * 0.73} labels={false} />
                  )}
                  {id === 'graines' && <SettingsArtwork kind="motion" size={artworkSize} />}
                  {id === 'fioles' && <SettingsArtwork kind="patterns" size={artworkSize} />}
                </View>
                <T
                  serif
                  maxFontSizeMultiplier={1.35}
                  style={[styles.cardTitle, compact && styles.compactCardTitle]}
                >
                  {title}
                </T>
                <View pointerEvents="none" style={[styles.chevron, open && styles.chevronUp]} />
              </Pressable>
              {(open || keepPractice) && (
                <View
                  testID={`guide-content-${id}`}
                  style={[styles.cardBody, !open && styles.hidden]}
                >
                  {id === 'gestes' && (
                    <>
                      <T style={styles.prose}>Versez dans une fiole vide ou sur la même couleur.</T>
                      <T style={styles.prose}>
                        Pour finir, remplissez chaque fiole utilisée d’une seule couleur.
                      </T>
                      {practicing ? (
                        <FirstPour motion={motion} />
                      ) : (
                        <Image
                          source={require('../../assets/illustrations/aide-versement.webp')}
                          accessible={false}
                          fadeDuration={0}
                          resizeMode="contain"
                          style={[styles.demoArt, compact && styles.compactDemoArt]}
                        />
                      )}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ expanded: practicing }}
                        aria-expanded={practicing}
                        onPress={() => setPracticing((current) => !current)}
                        style={({ pressed }) => [styles.practiceButton, pressed && styles.pressed]}
                      >
                        <Icon name="leaf-outline" size={20} color="#637a53" />
                        <T style={styles.practiceLabel}>
                          {practicing ? 'Fermer l’essai' : 'Tester un versement'}
                        </T>
                      </Pressable>
                    </>
                  )}
                  {id === 'plante' && (
                    <>
                      <T style={styles.prose}>
                        Révélez les couleurs après chaque page. Quatre pages complètent l’aquarelle.
                        La cinquième ajoute le sceau.
                      </T>
                      <T style={styles.prose}>
                        Touchez le timbre de la plante pour voir son avancement. L’Herbier conserve
                        vos découvertes.
                      </T>
                    </>
                  )}
                  {id === 'graines' && (
                    <>
                      <T style={styles.prose}>
                        Terminez en peu de mouvements pour obtenir trois étoiles. Le seuil est
                        indiqué à la fin de la page.
                      </T>
                      <T style={styles.prose}>
                        Chaque page principale rapporte une graine la première fois que vous y
                        obtenez trois étoiles. Les pages de collection n’en rapportent pas.
                      </T>
                      <T style={styles.prose}>
                        Dépensez vos graines en boutique pour acheter des décors et des collections.
                      </T>
                      <T style={styles.prose}>
                        Les aides sont gratuites. Mélanger change la disposition et conserve les
                        étoiles acquises.
                      </T>
                    </>
                  )}
                  {id === 'fioles' &&
                    mechanicIds.map((mechanic) => (
                      <View key={mechanic} style={styles.mechanic}>
                        <MechanicVials mechanic={mechanic} width={compact ? 76 : 94} height={52} />
                        <View style={styles.mechanicText}>
                          <T serif style={styles.mechanicTitle}>
                            {mechanicDetails[mechanic].name}
                          </T>
                          <T style={styles.prose}>{mechanicDetails[mechanic].summary}</T>
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </Paper>
          );
        })}
        <View style={styles.footer}>
          <VictoryAction icon="flask-outline" onPress={onEnter} compact={compact} narrow>
            {firstRun ? 'Entrer dans la serre' : 'Retrouver mon atelier'}
          </VictoryAction>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: '#e1e5d9' },
  background: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  page: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
  },
  compactPage: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 16, gap: 6 },
  header: { minHeight: 96, justifyContent: 'center' },
  compactHeader: { minHeight: 68 },
  headerTitle: { alignItems: 'center', paddingHorizontal: 54 },
  menu: { position: 'absolute', left: 4, top: 3 },
  skip: { minWidth: 48, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.displayBold, fontSize: 48, lineHeight: 55, color: '#254233' },
  compactTitle: { fontSize: 38, lineHeight: 44 },
  welcome: {
    textAlign: 'center',
    fontFamily: F.scientific,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 3,
  },
  card: {
    backgroundColor: '#f9efd8',
    borderColor: '#bca570',
    borderWidth: 1,
    borderRadius: 19,
  },
  openCard: { backgroundColor: '#fbefd8', borderRadius: 22 },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: 15,
    borderWidth: 0.6,
    borderColor: '#d7c298',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 64,
    paddingVertical: 8,
    paddingLeft: 17,
    paddingRight: 23,
  },
  compactCardHeader: { minHeight: 54, paddingLeft: 14, paddingRight: 21 },
  cardTitle: { flex: 1, fontFamily: F.displayBold, fontSize: 25, lineHeight: 29, color: '#254233' },
  compactCardTitle: { fontSize: 22, lineHeight: 26 },
  emblem: { alignItems: 'center', justifyContent: 'center' },
  chevron: {
    width: 9,
    height: 9,
    marginLeft: 4,
    borderBottomWidth: 1.8,
    borderRightWidth: 1.8,
    borderColor: C.green,
    transform: [{ rotate: '45deg' }],
  },
  chevronUp: { transform: [{ rotate: '225deg' }] },
  cardBody: { paddingHorizontal: 24, paddingBottom: 17, gap: 9 },
  hidden: { display: 'none' },
  prose: { fontSize: 17, lineHeight: 22, color: '#444d3c' },
  demoArt: { width: '100%', height: 124, marginTop: 2, marginBottom: 1 },
  compactDemoArt: { height: 96 },
  practiceButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#fff4db85',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#667953',
  },
  pressed: { opacity: 0.7 },
  practiceLabel: { fontFamily: F.medium, fontSize: 17, lineHeight: 21, color: C.green },
  restartIcon: { width: 22, height: 22 },
  mechanic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    borderTopWidth: 0.7,
    borderColor: '#dbc9a1',
  },
  mechanicText: { flex: 1, gap: 2 },
  mechanicTitle: { fontFamily: F.displayBold, fontSize: 19, lineHeight: 23, color: C.green },
  footer: { alignItems: 'center', marginTop: 6 },
});
