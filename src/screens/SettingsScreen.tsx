import React from 'react';
import { Alert, Switch, View } from 'react-native';
import { Screen } from '../components/Screen';
import { AppText } from '../components/Typography';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { useTheme } from '../theme/ThemeProvider';
import { useSettings } from '../context/SettingsContext';
import { useEntitlement } from '../context/EntitlementContext';
import { useHistory } from '../context/HistoryContext';
import { ThemeMode } from '../data/types';

function Row({ label, hint, value, onValueChange }: { label: string; hint: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <AppText variant="body">{label}</AppText>
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.accent, false: theme.colors.track }}
        thumbColor={theme.colors.onAccent}
      />
    </View>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const { prefs, update } = useSettings();
  const { entitled, price, purchase, restore } = useEntitlement();
  const { clearAll } = useHistory();

  const confirmClear = () => {
    Alert.alert('Clear all history?', 'This permanently deletes every logged workout on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void clearAll() },
    ]);
  };

  return (
    <Screen>
      <AppText variant="title" style={{ marginBottom: 16 }}>
        Settings
      </AppText>

      <AppText variant="subheading" style={{ marginBottom: 10 }}>
        Appearance
      </AppText>
      <Card style={{ marginBottom: 20 }}>
        <AppText variant="caption" muted style={{ marginBottom: 10 }}>
          Dark uses a black background with red accents; Light uses white with green.
        </AppText>
        <SegmentedControl<ThemeMode>
          segments={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={prefs.themeMode}
          onChange={(v) => update({ themeMode: v })}
        />
      </Card>

      <AppText variant="subheading" style={{ marginBottom: 10 }}>
        Workout
      </AppText>
      <Card style={{ marginBottom: 20 }}>
        <Row
          label="Auto-detect by default"
          hint="Start sessions in auto-detect mode."
          value={prefs.autoDetectDefault}
          onValueChange={(v) => update({ autoDetectDefault: v })}
        />
        <View style={{ height: 1, backgroundColor: theme.colors.border }} />
        <Row
          label="Haptics"
          hint="Vibrate on every counted rep."
          value={prefs.hapticsOn}
          onValueChange={(v) => update({ hapticsOn: v })}
        />
      </Card>

      <AppText variant="subheading" style={{ marginBottom: 10 }}>
        RepCam Pro
      </AppText>
      <Card style={{ marginBottom: 20 }}>
        {entitled ? (
          <AppText variant="body">✅ Unlocked — thank you! You own every exercise, forever.</AppText>
        ) : (
          <>
            <AppText variant="body" style={{ marginBottom: 4 }}>
              One-time purchase · {price}
            </AppText>
            <AppText variant="caption" muted style={{ marginBottom: 12 }}>
              Unlock every exercise. No subscription, ever.
            </AppText>
            <Button label={`Unlock everything · ${price}`} onPress={() => void purchase()} />
            <View style={{ height: 8 }} />
            <Button label="Restore purchase" variant="ghost" onPress={() => void restore()} />
          </>
        )}
      </Card>

      <AppText variant="subheading" style={{ marginBottom: 10 }}>
        Data
      </AppText>
      <Card style={{ marginBottom: 20 }}>
        <AppText variant="caption" muted style={{ marginBottom: 12 }}>
          Everything is stored only on this device. RepCam has no account and no servers — your camera
          feed never leaves your phone.
        </AppText>
        <Button label="Clear workout history" variant="secondary" onPress={confirmClear} />
      </Card>

      <AppText variant="caption" muted style={{ textAlign: 'center' }}>
        RepCam v1.0.0 · on-device AI · made for movement
      </AppText>
    </Screen>
  );
}
