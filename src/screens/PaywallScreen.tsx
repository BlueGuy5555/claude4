import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { AppText } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useEntitlement } from '../context/EntitlementContext';
import { useTheme } from '../theme/ThemeProvider';

const FEATURES = [
  { emoji: '🦵', text: 'Every exercise: deadlift, lunges, curls, presses, sit-ups & more' },
  { emoji: '🤖', text: 'Auto exercise detection' },
  { emoji: '📈', text: 'Unlimited history & progress charts' },
  { emoji: '🔒', text: 'Fully on-device — no account, no tracking' },
  { emoji: '♾️', text: 'One payment. Yours forever. No subscription.' },
];

export function PaywallScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { price, purchase, restore } = useEntitlement();
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    setBusy(true);
    const ok = await purchase();
    setBusy(false);
    if (ok) navigation.goBack();
  };

  const doRestore = async () => {
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    if (ok) navigation.goBack();
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <AppText style={{ fontSize: 44 }}>💪</AppText>
        <AppText variant="title" style={{ marginTop: 8 }}>
          RepCam Pro
        </AppText>
        <AppText variant="body" muted style={{ textAlign: 'center', marginTop: 4 }}>
          Buy once. Train forever.
        </AppText>
      </View>

      <Card style={{ marginBottom: 20 }}>
        {FEATURES.map((f, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 10,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <AppText style={{ fontSize: 20 }}>{f.emoji}</AppText>
            <AppText variant="body" style={{ flex: 1 }}>
              {f.text}
            </AppText>
          </View>
        ))}
      </Card>

      <Button label={`Unlock everything · ${price}`} onPress={buy} loading={busy} />
      <View style={{ height: 10 }} />
      <Button label="Restore purchase" variant="ghost" onPress={doRestore} disabled={busy} />
      <View style={{ height: 6 }} />
      <Button label="Maybe later" variant="ghost" onPress={() => navigation.goBack()} disabled={busy} />
    </Screen>
  );
}
