import React, { useContext, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { BookChromeContext } from '../src/components/BookScrollView';
import { CollectionPaperCorners } from '../src/components/CollectionPaperCorners';
import { TestPageTools } from '../src/components/TestPageTools';
import { AccountConnections } from '../src/components/AccountConnections';
import { ResetProgressDialog } from '../src/components/ResetProgressDialog';
import { SettingsArtwork } from '../src/components/SettingsArtwork';
import { Paper } from '../src/components/Paper';
import { F } from '../src/components/fonts';
import { T, Button, C, Icon } from '../src/components/ui';
import { useGame } from '../src/state/store';
import { campaignTestAdsEnabled } from '../src/services/campaignAds';
import { campaignStarTotal, normalizeNickname, type Settings } from '../src/state/model';
import { unlockAmbience } from '../src/services/ambience';

type Tab = 'jeu' | 'carnet' | 'apropos';
const tabs: { key: Tab; label: string }[] = [
  { key: 'jeu', label: 'Jeu' },
  { key: 'carnet', label: 'Carnet' },
  { key: 'apropos', label: 'À propos' },
];
const options: { key: keyof Settings; name: string; detail: string; accessibleName: string }[] = [
  { key: 'sound', name: 'Sons', detail: 'Effets du jeu.', accessibleName: 'Sons de l’atelier' },
  {
    key: 'music',
    name: 'Musique',
    detail: 'Ambiances douces.',
    accessibleName: 'Musique du livre',
  },
  {
    key: 'haptics',
    name: 'Vibrations',
    detail: 'Retours légers.',
    accessibleName: 'Vibrations légères',
  },
  {
    key: 'patterns',
    name: 'Symboles',
    detail: 'Distinguer les couleurs.',
    accessibleName: 'Symboles dans les liquides',
  },
  {
    key: 'motion',
    name: 'Animations',
    detail: 'Effets et transitions.',
    accessibleName: 'Animations douces',
  },
];

export default function Parametres() {
  const { save, setSave, error, reset } = useGame();
  const { header, availableHeight } = useContext(BookChromeContext);
  const { width, height } = useWindowDimensions();
  const compact = (availableHeight || height) < 820 || width < 360;
  const [tab, setTab] = useState<Tab>('jeu');
  const [nickname, setNickname] = useState(save.nickname);
  const [note, setNote] = useState('');
  const [invalidName, setInvalidName] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const sign = () => {
    const name = normalizeNickname(nickname);
    if (name.length < 2) {
      setInvalidName(true);
      setNote('Choisissez un pseudo de 2 à 24 caractères.');
      return;
    }
    setSave((s) => ({ ...s, nickname: name }));
    setNickname(name);
    setInvalidName(false);
    setNote('Signature enregistrée.');
  };

  return (
    <View testID="settings-screen" style={styles.screen}>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        <Image
          source={require('../assets/home/clearing.jpg')}
          resizeMode="cover"
          fadeDuration={0}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f6efdf30' }]} />
      </View>
      {header}
      <View style={[styles.page, { paddingHorizontal: width < 360 ? 10 : 16 }]}>
        <View
          accessibilityRole="tablist"
          accessibilityLabel="Rubriques des paramètres"
          style={styles.tabs}
        >
          {tabs.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item.key }}
              aria-selected={tab === item.key}
              accessibilityLabel={item.label}
              onPress={() => {
                setTab(item.key);
                scroll.current?.scrollTo({ y: 0, animated: false });
              }}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: tab === item.key ? C.green : '#fbefd8',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <T
                serif
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                maxFontSizeMultiplier={1.25}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  flexShrink: 1,
                  fontSize: compact ? 20 : 22,
                  color: tab === item.key ? '#fff2d5' : C.green,
                }}
              >
                {item.label}
              </T>
            </Pressable>
          ))}
        </View>
        <Paper frame={false} textureOpacity={0.36} style={styles.folio}>
          <View pointerEvents="none" style={styles.innerBorder} />
          <CollectionPaperCorners size={20} inset={9} />
          <ScrollView
            ref={scroll}
            testID="settings-panel-scroll"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, { padding: compact ? 18 : 22 }]}
          >
            {tab === 'jeu' && (
              <View testID="settings-game-panel" style={{ flexGrow: 1 }}>
                <View style={{ flexGrow: 1, justifyContent: 'center' }}>
                  {options.map((option, i) => {
                    const checked = save.settings[option.key] !== false;
                    return (
                      <Pressable
                        key={option.key}
                        accessibilityRole="switch"
                        accessibilityLabel={option.accessibleName}
                        accessibilityHint={option.detail}
                        accessibilityState={{ checked }}
                        aria-checked={checked}
                        onPress={() => {
                          unlockAmbience();
                          setSave((s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              [option.key]: s.settings[option.key] === false,
                            },
                          }));
                        }}
                        style={({ pressed }) => [
                          styles.setting,
                          {
                            minHeight: compact ? 74 : 86,
                            opacity: pressed ? 0.72 : 1,
                            borderBottomWidth: i < options.length - 1 ? 0.7 : 0,
                          },
                        ]}
                      >
                        <View
                          pointerEvents="none"
                          accessible={false}
                          importantForAccessibility="no-hide-descendants"
                        >
                          <SettingsArtwork kind={option.key} size={compact ? 42 : 54} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <T
                            serif
                            style={{ fontFamily: F.displayBold, fontSize: compact ? 22 : 25 }}
                          >
                            {option.name}
                          </T>
                          <T style={styles.help}>{option.detail}</T>
                        </View>
                        <View
                          pointerEvents="none"
                          style={[
                            styles.switchTrack,
                            {
                              backgroundColor: checked ? C.green : '#d8ceba',
                              alignItems: checked ? 'flex-end' : 'flex-start',
                            },
                          ]}
                        >
                          <View style={styles.switchThumb} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
            {tab === 'carnet' && (
              <View testID="settings-notebook-panel" style={{ gap: 20 }}>
                <T serif accessibilityRole="header" style={styles.sectionTitle}>
                  {save.nickname ? `Le carnet de ${save.nickname}` : 'Mon carnet'}
                </T>
                <View style={styles.stats}>
                  {[
                    [Object.keys(save.completed).length, 'pages'],
                    [campaignStarTotal(save.completed), 'étoiles'],
                    [save.pigments.length, 'découvertes'],
                  ].map(([n, label]) => (
                    <View key={label} style={styles.stat}>
                      <T serif style={{ fontSize: 32, lineHeight: 38 }}>
                        {n}
                      </T>
                      <T style={{ fontSize: 14, color: C.muted, textAlign: 'center' }}>{label}</T>
                    </View>
                  ))}
                </View>
                <View style={{ gap: 8 }}>
                  <T style={styles.subheading}>Ma signature</T>
                  <TextInput
                    accessibilityLabel="Votre pseudo"
                    value={nickname}
                    onChangeText={setNickname}
                    maxLength={24}
                    placeholder="Votre nom de botaniste"
                    placeholderTextColor={C.muted}
                    returnKeyType="done"
                    onSubmitEditing={sign}
                    style={styles.signature}
                  />
                  <Button icon="leaf-outline" secondary onPress={sign}>
                    Modifier ma signature
                  </Button>
                  {!!note && (
                    <T
                      accessibilityRole={invalidName ? 'alert' : undefined}
                      accessibilityLiveRegion="polite"
                      style={styles.help}
                    >
                      {note}
                    </T>
                  )}
                </View>
                <View style={styles.localSave}>
                  <Icon name="book-outline" size={32} color={C.green} />
                  <View style={{ flex: 1 }}>
                    <T style={styles.subheading}>Sauvegarde locale</T>
                    <T style={styles.help}>Sur cet appareil.</T>
                  </View>
                </View>
                <AccountConnections />
                {!!error && <T accessibilityRole="alert">{error}</T>}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remettre ma progression à zéro"
                  onPress={() => setResetOpen(true)}
                  style={({ pressed }) => [styles.reset, { opacity: pressed ? 0.65 : 1 }]}
                >
                  <Icon name="refresh-outline" size={28} color="#956a52" />
                  <View style={{ flex: 1 }}>
                    <T serif style={{ fontSize: 23, color: '#805747' }}>
                      Recommencer l’herbier
                    </T>
                    <T style={styles.help}>Efface votre progression.</T>
                  </View>
                </Pressable>
                <TestPageTools />
              </View>
            )}
            {tab === 'apropos' && (
              <View testID="settings-about-panel" style={{ flexGrow: 1, gap: 16 }}>
                <T serif accessibilityRole="header" style={styles.sectionTitle}>
                  Herbier des couleurs
                </T>
                <T style={[styles.help, { marginTop: -10 }]}>Volume I</T>
                <AboutSection
                  title="Confidentialité"
                  summary="Votre progression reste sur cet appareil."
                >
                  {campaignTestAdsEnabled
                    ? 'Cette version contacte Google AdMob pour charger des annonces de démonstration. La progression est enregistrée localement.'
                    : 'Aucune mesure d’audience ni publicité active. La progression est enregistrée localement. Les connexions Apple et Google ne sont pas encore disponibles.'}
                </AboutSection>
                <AboutSection
                  title="Illustrations & sons"
                  summary="Créations originales et licences libres."
                >
                  Illustrations et papier créés pour ce jeu. Compositions originales sous CC0 ;
                  instruments acoustiques FluidR3 sous MIT. Eau du ruisseau enregistrée par
                  jackthemurray sous CC0. Les notices de ces ressources sont incluses dans le jeu.
                </AboutSection>
                <AboutSection
                  title="Notes botaniques"
                  summary="Floraisons indicatives et références."
                >
                  Les périodes de floraison sont indicatives. Aucun conseil de consommation ou
                  d’usage médicinal n’est fourni. La nomenclature et les illustrations demandent une
                  validation botanique pour tout usage scientifique. Références : GBIF Backbone
                  Taxonomy, Plants of the World Online (Royal Botanic Gardens, Kew) et TAXREF/INPN.
                </AboutSection>
              </View>
            )}
          </ScrollView>
        </Paper>
        <T style={styles.version}>Version {Constants.expoConfig?.version ?? '1.0.4'}</T>
      </View>
      {resetOpen && (
        <ResetProgressDialog
          motion={save.settings.motion}
          onCancel={() => setResetOpen(false)}
          onConfirm={async () => {
            const success = await reset();
            if (success) {
              setNote('');
              setResetOpen(false);
              router.replace('/');
            }
            return success;
          }}
        />
      )}
    </View>
  );
}

function AboutSection({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.aboutSection}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: 64,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flex: 1 }}>
          <T serif style={{ fontSize: 23 }}>
            {title}
          </T>
          <T style={styles.help}>{summary}</T>
        </View>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="arrow-forward-outline" size={22} color={C.green} />
        </View>
      </Pressable>
      {open && (
        <T style={{ fontSize: 16, lineHeight: 23, color: C.muted, paddingBottom: 12 }}>
          {children}
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: '#e4e8dc' },
  page: { flex: 1, minHeight: 0, width: '100%', maxWidth: 640, alignSelf: 'center', paddingTop: 8 },
  tabs: { flexDirection: 'row', gap: 5, paddingHorizontal: 10, marginBottom: -1 },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    paddingVertical: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#bca46e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  folio: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#fbefd8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#c7ad7a',
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 6,
    borderRadius: 18,
    borderWidth: 0.6,
    borderColor: '#dfcda7',
  },
  content: { flexGrow: 1 },
  setting: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderColor: '#d8c7a4',
    paddingVertical: 10,
  },
  help: { fontSize: 16, lineHeight: 21, color: '#66674f' },
  switchTrack: {
    width: 51,
    height: 31,
    padding: 3,
    borderRadius: 18,
    borderWidth: 0.7,
    borderColor: '#9e9e7e',
  },
  switchThumb: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#fff0cf',
    borderWidth: 0.7,
    borderColor: '#d4c6a5',
  },
  sectionTitle: { fontSize: 28, lineHeight: 34, color: C.green },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#e7e9d27a',
    borderRadius: 16,
    paddingVertical: 12,
  },
  stat: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 2 },
  subheading: { fontFamily: F.medium, fontSize: 19, color: C.green },
  signature: {
    fontFamily: F.body,
    fontSize: 22,
    color: C.ink,
    borderBottomWidth: 1,
    borderColor: C.line,
    minHeight: 48,
    padding: 8,
    backgroundColor: '#fff5e142',
    borderRadius: 8,
  },
  localSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: 0.7,
    borderBottomWidth: 0.7,
    borderColor: '#d8c7a4',
  },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 64,
    paddingVertical: 14,
    borderTopWidth: 0.7,
    borderColor: '#d8c7a4',
  },
  aboutSection: { borderBottomWidth: 0.7, borderColor: '#d8c7a4', paddingVertical: 4 },
  version: {
    fontSize: 13,
    lineHeight: 20,
    color: '#495b40',
    textAlign: 'center',
    paddingVertical: 6,
  },
});
