import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { mechanicDetails, type Mechanic } from '../engine/mechanics';
import { MechanicVials } from './MechanicVials';
import { Paper } from './Paper';
import { T, Button, C, Icon } from './ui';

/** One compact lesson at a time. Only an explicitly acknowledged card is remembered. */
export function MechanicIntroduction({
  mechanics,
  motion,
  onAcknowledge,
  onClose,
  mode = 'discovery',
}: {
  mechanics: Mechanic[];
  motion: boolean;
  onAcknowledge: (id: Mechanic) => void;
  onClose: () => void;
  mode?: 'discovery' | 'reference';
}) {
  const { height } = useWindowDimensions();
  const short = height < 550;
  const total = useRef(mechanics.length).current;
  const [referenceIndex, setReferenceIndex] = useState(0);
  const [detailsFor, setDetailsFor] = useState<Mechanic | null>(null);
  const current = mechanics[mode === 'reference' ? referenceIndex : 0];
  if (!current) return null;
  const detail = mechanicDetails[current];
  const expanded = detailsFor === current;
  const position = mode === 'reference' ? referenceIndex + 1 : total - mechanics.length + 1;
  const acknowledge = () => {
    onAcknowledge(current);
    if (mode === 'reference') {
      if (referenceIndex + 1 < mechanics.length) setReferenceIndex((index) => index + 1);
      else onClose();
    }
  };
  return (
    <Modal transparent visible animationType={motion ? 'fade' : 'none'} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#233e31bd',
          padding: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ScrollView
          style={{ maxHeight: '92%', width: '100%', maxWidth: 380 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          bounces={false}
        >
          <Paper
            testID="mechanic-introduction"
            accessibilityViewIsModal
            style={{
              padding: short ? 16 : 20,
              borderRadius: 24,
              backgroundColor: C.card,
              gap: short ? 8 : 10,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <T style={{ flex: 1, fontSize: 10, letterSpacing: 1.3, color: C.muted }}>
                {mode === 'discovery' ? 'UNE NOUVELLE MÉCANIQUE' : 'LES RÈGLES DE CETTE PAGE'}
              </T>
              {total > 1 && (
                <T
                  testID="mechanic-lesson-position"
                  accessibilityLabel={`Explication ${position} sur ${total}`}
                  style={{ fontSize: 12, color: C.muted }}
                >
                  {position} / {total}
                </T>
              )}
              {mode === 'reference' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fermer les règles"
                  onPress={onClose}
                  style={{
                    minHeight: 44,
                    minWidth: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="close-outline" size={23} />
                </Pressable>
              )}
            </View>
            <T
              testID="mechanic-lesson-title"
              accessibilityRole="header"
              serif
              style={{
                fontSize: short ? 24 : 27,
                lineHeight: short ? 28 : 32,
                textAlign: 'center',
              }}
            >
              {detail.name}
            </T>
            {(height >= 500 || expanded) && (
              <View style={{ alignItems: 'center' }}>
                <MechanicVials mechanic={current} width={220} height={short ? 64 : 82} />
              </View>
            )}
            <T testID="mechanic-lesson-summary" style={{ fontSize: 16, lineHeight: 22 }}>
              {detail.summary}
            </T>
            {expanded && (
              <T
                testID="mechanic-lesson-detail"
                style={{ fontSize: 15, lineHeight: 21, color: C.muted }}
              >
                {detail.intro}
              </T>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={expanded ? 'Réduire l’explication' : 'En savoir plus'}
                onPress={() => setDetailsFor(expanded ? null : current)}
                style={{ minHeight: 44, paddingHorizontal: 5, justifyContent: 'center' }}
              >
                <T style={{ fontSize: 13, color: C.green, textDecorationLine: 'underline' }}>
                  {expanded ? 'Voir le résumé' : 'En savoir plus'}
                </T>
              </Pressable>
              <Button style={{ flex: 1, paddingHorizontal: 8 }} onPress={acknowledge}>
                {mode === 'discovery'
                  ? 'J’ai compris'
                  : referenceIndex + 1 < mechanics.length
                    ? 'Suivant'
                    : 'Revenir au jeu'}
              </Button>
            </View>
          </Paper>
        </ScrollView>
      </View>
    </Modal>
  );
}
