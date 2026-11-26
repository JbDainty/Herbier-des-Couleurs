import React from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Save, restoration } from '../state/model';
import { pageStars, starLimits } from '../state/stars';
import { attemptPuzzle } from '../engine/remix';
import { species } from '../data/botany';
import { botanicalFact } from '../data/botanicalFacts';
import { useMeasuredSize } from './useMeasuredSize';
import { VictoryPaper } from './VictoryPaper';
import { VictoryAction } from './VictoryAction';
import { VictoryToolbar } from './VictoryToolbar';
import { RewardStars } from './RewardStars';
import { Botanical } from './Botanical';
import { ColorReveal } from './ColorReveal';
import { SealCeremony } from './SealCeremony';
import { T, C, Icon } from './ui';
import { BotanicalCollectionCard } from './BotanicalCollectionCard';
import { F } from './fonts';

type Props = {
  save: Save;
  replay: boolean;
  reveal: boolean;
  revealAnimated: boolean;
  sealFinished: boolean;
  onReveal: (animate?: boolean) => void;
  onContinue: () => void;
  onReplay: () => void;
  onHerbarium: () => void;
  onMenu: () => void;
  onSealDone: () => void;
};

/** A bounded result folio: artwork yields space to controls, without a scroll container. */
export function RestorationResult(props: Props) {
  const { ref, size: viewport, onLayout } = useMeasuredSize();
  return (
    <SafeAreaView
      testID="victory-safe-area"
      edges={Platform.OS === 'android' ? ['left', 'right'] : ['top', 'right', 'bottom', 'left']}
      style={{ flex: 1, backgroundColor: '#233e31b0' }}
    >
      <View
        ref={ref}
        collapsable={false}
        onLayout={onLayout}
        testID="victory-result-viewport"
        style={{
          flex: 1,
          minHeight: 0,
          margin: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {viewport.height > 0 && <ResultFolio {...props} viewport={viewport} />}
      </View>
    </SafeAreaView>
  );
}
function ResultFolio({
  save,
  replay,
  reveal,
  revealAnimated,
  sealFinished,
  onReveal,
  onContinue,
  onReplay,
  onHerbarium,
  onMenu,
  onSealDone,
  viewport,
}: Props & { viewport: { width: number; height: number } }) {
  const horizontal = viewport.width >= 420 && viewport.width > viewport.height * 1.1;
  const compact = viewport.height < 740 || (horizontal && viewport.height < 580);
  const tight = viewport.height < 570;
  const padding = compact ? 12 : 18;
  const horizontalPadding = compact ? 14 : 22;
  const frame = {
    width: Math.min(viewport.width, horizontal ? 860 : 500),
    height: Math.min(viewport.height, horizontal ? 580 : 920),
  };
  const bodyWidth = frame.width - horizontalPadding * 2;
  const artMeasure = useMeasuredSize(
    undefined,
    false,
    `${frame.width}/${frame.height}/${horizontal}`,
  );
  const art = artMeasure.size;
  const plateSize = Math.max(0, Math.min(300, art.width, art.height / 1.36));
  const plant = Math.floor((save.current - 1) / 5);
  const stage = restoration(save, plant);
  const s = species[plant];
  const sealPage = save.current % 5 === 0;
  const sealActive = sealPage && reveal && !sealFinished && revealAnimated;
  const motion = save.settings.motion && !(sealPage && reveal);
  const minimum = attemptPuzzle(save.current, save.remix).par;
  const target = starLimits(minimum).three;
  const stars = pageStars(save.moves, minimum);
  const best = save.completed[save.current]?.stars ?? 0;
  const showDetails = !tight;
  const showFact = viewport.height >= (horizontal ? 420 : 620);
  const continueLabel =
    save.current === 1000
      ? 'Contempler mon herbier'
      : sealPage
        ? 'Découvrir l’espèce suivante'
        : 'Poursuivre la restauration';
  const header = (
    <View testID="victory-summary" style={{ width: '100%', alignItems: 'center', flexShrink: 0 }}>
      <RewardStars count={stars} motion={motion} scale={tight ? 0.5 : compact ? 0.65 : 0.78} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 10,
          width: '100%',
          marginTop: compact ? 2 : 5,
        }}
      >
        <T
          testID="page-result-moves"
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLabel={`Page achevée en ${save.moves} mouvements. Minimum possible : ${minimum}. Objectif trois étoiles : ${target}.`}
          style={{
            fontFamily: F.medium,
            fontSize: compact ? 16 : 18,
            lineHeight: compact ? 22 : 24,
            color: C.green,
            flexShrink: 1,
          }}
        >
          {save.moves} {save.moves === 1 ? 'mouvement' : 'mouvements'}
        </T>
        <View
          testID="page-seed-reward-pill"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            flexShrink: 1,
            maxWidth: '58%',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 15,
            backgroundColor: '#f5e5bd',
            borderWidth: 0.6,
            borderColor: '#c5a565',
          }}
        >
          {!save.testSession && <Icon name="seed-outline" size={15} color="#ac8643" />}
          <T
            testID="page-seed-reward"
            accessibilityLabel={`${save.lastSeedReward ?? 0} graines ont rejoint votre réserve.`}
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{
              fontFamily: F.medium,
              fontSize: compact ? 12 : 13,
              lineHeight: 20,
              color: C.green,
              flexShrink: 1,
            }}
          >
            {save.testSession
              ? 'Essai : aucun gain enregistré'
              : `+${save.lastSeedReward ?? 0} ${(save.lastSeedReward ?? 0) === 1 ? 'graine' : 'graines'}`}
          </T>
        </View>
      </View>
      {showDetails && (
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <T
            testID="page-star-target"
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityLabel={`Minimum possible : ${minimum} mouvements. Trois étoiles jusqu’à ${target} mouvements.`}
            style={{ fontFamily: F.scientific, fontSize: 12, lineHeight: 17, color: C.muted }}
          >
            Objectif ★★★ : {target}
          </T>
          {best > stars && (
            <T
              testID="page-saved-best-stars"
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              accessibilityLabel={`Meilleur résultat conservé : ${best} étoiles`}
              style={{ fontFamily: F.scientific, fontSize: 12, lineHeight: 17, color: C.green }}
            >
              Record : {'★'.repeat(best)}
            </T>
          )}
        </View>
      )}
    </View>
  );
  const illustration = (
    <BotanicalCollectionCard name={s.name} latin={s.latin} compact={compact} motion={motion}>
      <View
        testID="victory-art-space"
        ref={artMeasure.ref}
        collapsable={false}
        onLayout={artMeasure.onLayout}
        style={{
          flex: 1,
          minHeight: 0,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {plateSize > 0 &&
          (!reveal ? (
            <Botanical
              index={plant}
              stage={sealPage ? 4 : replay ? stage : Math.max(0, stage - 1)}
              size={plateSize}
              labels={false}
            />
          ) : sealPage ? (
            <View
              testID="finished-plate-ceremony"
              style={{ width: plateSize, height: plateSize * 1.36 }}
            >
              <Botanical
                index={plant}
                stage={sealFinished ? 5 : 4}
                size={plateSize}
                labels={false}
              />
            </View>
          ) : (
            <ColorReveal
              index={plant}
              from={replay ? stage : Math.max(0, stage - 1)}
              to={stage}
              size={plateSize}
              motion={revealAnimated}
              labels={false}
            />
          ))}
      </View>
    </BotanicalCollectionCard>
  );
  const caption = showFact && (
    <View
      style={{ width: '100%', height: compact ? 28 : 34, justifyContent: 'center', flexShrink: 0 }}
    >
      {reveal && (
        <T
          testID="restoration-botanical-fact"
          maxFontSizeMultiplier={1.3}
          numberOfLines={2}
          adjustsFontSizeToFit
          style={{
            textAlign: 'center',
            fontFamily: F.scientific,
            color: C.muted,
            fontSize: compact ? 12 : 13,
            lineHeight: compact ? 14 : 17,
          }}
        >
          {botanicalFact(save.current, 'reveal')}
        </T>
      )}
    </View>
  );
  const actions = (
    <View
      testID="victory-actions"
      style={{ width: '100%', flexShrink: 0, gap: 5, alignItems: 'center' }}
    >
      {!reveal ? (
        <VictoryAction
          icon="water-outline"
          compact
          maxFontSizeMultiplier={1.3}
          onPress={() => onReveal()}
        >
          {sealPage ? 'Estampiller la planche' : 'Révéler la couleur'}
        </VictoryAction>
      ) : (
        <VictoryAction
          icon="arrow-forward-outline"
          compact
          maxFontSizeMultiplier={1.3}
          onPress={onContinue}
          disabled={sealPage && !sealFinished}
          label={continueLabel}
        >
          {save.current === 1000 ? 'Mon herbier' : sealPage ? 'Espèce suivante' : 'Page suivante'}
        </VictoryAction>
      )}
      <VictoryToolbar
        reveal={reveal}
        onReplay={onReplay}
        onMiddle={reveal ? onHerbarium : () => onReveal(false)}
        onMenu={onMenu}
      />
    </View>
  );
  return (
    <>
      <View
        testID="victory-result-view"
        pointerEvents={sealActive ? 'none' : 'auto'}
        accessibilityElementsHidden={sealActive}
        importantForAccessibility={sealActive ? 'no-hide-descendants' : 'auto'}
        style={{ width: frame.width, height: frame.height, opacity: sealActive ? 0 : 1 }}
      >
        <VictoryPaper
          motion={motion}
          sound={save.settings.sound}
          frame={frame}
          style={{
            width: frame.width,
            height: frame.height,
            paddingHorizontal: horizontalPadding,
            paddingVertical: padding,
          }}
        >
          {horizontal ? (
            <View style={{ width: '100%', height: '100%', flexDirection: 'row', gap: 12 }}>
              <View style={{ width: bodyWidth * 0.42, height: '100%', alignItems: 'center' }}>
                {illustration}
                {caption}
              </View>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: tight ? 5 : 12,
                }}
              >
                {header}
                {actions}
              </View>
            </View>
          ) : (
            <View
              style={{ width: '100%', height: '100%', alignItems: 'center', gap: compact ? 4 : 8 }}
            >
              {header}
              {illustration}
              {caption}
              {actions}
            </View>
          )}
        </VictoryPaper>
      </View>
      {sealActive && (
        <SealCeremony
          index={plant}
          name={s.name}
          sound={save.settings.sound}
          onDone={onSealDone}
          viewport={viewport}
        />
      )}
    </>
  );
}
