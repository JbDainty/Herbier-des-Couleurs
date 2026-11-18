import React from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { opticalLessons, type OpticalMechanic } from '../engine/vitrail';
import { Paper } from './Paper';
import { Button, C, T } from './ui';

export function VitrailLesson({
  mechanic,
  motion,
  onAcknowledge,
  onClose,
}: {
  mechanic: OpticalMechanic;
  motion: boolean;
  onAcknowledge: () => void;
  onClose: () => void;
}) {
  const detail = opticalLessons[mechanic];
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
          style={{ width: '100%', maxWidth: 380, maxHeight: '90%' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <Paper
            testID="vitrail-lesson"
            accessibilityViewIsModal
            style={{ padding: 22, borderRadius: 24, backgroundColor: C.card, gap: 16 }}
          >
            <T style={{ fontSize: 10, letterSpacing: 1.5, color: C.muted }}>
              LES SECRETS DU VITRAIL
            </T>
            <T testID="vitrail-lesson-title" serif style={{ fontSize: 28, textAlign: 'center' }}>
              {detail.name}
            </T>
            <T style={{ fontSize: 17, lineHeight: 24 }}>{detail.summary}</T>
            <Button onPress={onAcknowledge}>J’ai compris</Button>
          </Paper>
        </ScrollView>
      </View>
    </Modal>
  );
}
