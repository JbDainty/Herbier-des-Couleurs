import React, { useRef } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Paper } from './Paper';
import { Button, C, T } from './ui';
export type Purchase = { title: string; cost: number; detail: string; action: () => void };
export function CollectionPurchase({
  purchase,
  onClose,
  motion,
}: {
  purchase: Purchase;
  onClose: () => void;
  motion: boolean;
}) {
  const submitted = useRef(false);
  return (
    <Modal visible transparent animationType={motion ? 'fade' : 'none'} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          padding: 20,
          backgroundColor: '#20392ed9',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ScrollView
          style={{ width: '100%', maxWidth: 420, maxHeight: '90%' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <Paper
            testID="collection-purchase"
            accessibilityViewIsModal
            style={{ padding: 24, borderRadius: 24, backgroundColor: C.card, gap: 18 }}
          >
            <T serif accessibilityRole="header" style={{ fontSize: 28, lineHeight: 34 }}>
              {purchase.title}
            </T>
            <T>{purchase.detail}</T>
            <T style={{ color: C.green }}>Prix : {purchase.cost} graines</T>
            <Button
              onPress={() => {
                if (submitted.current) return;
                submitted.current = true;
                purchase.action();
                onClose();
              }}
            >
              Confirmer pour {purchase.cost} graines
            </Button>
            <Button secondary onPress={onClose}>
              Garder mes graines
            </Button>
          </Paper>
        </ScrollView>
      </View>
    </Modal>
  );
}
