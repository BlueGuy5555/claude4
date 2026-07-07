import React, { useMemo, useState } from 'react';
import { View, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AppText } from '../components/Typography';
import { StatTile } from '../components/StatTile';
import { Button } from '../components/Button';
import { ExerciseGrid } from '../components/ExerciseGrid';
import { useTheme } from '../theme/ThemeProvider';
import { useHistory } from '../context/HistoryContext';
import { useEntitlement } from '../context/EntitlementContext';
import { useSettings } from '../context/SettingsContext';
import { RootStackParamList } from '../navigation/types';
import { EXERCISES, EXERCISE_LIST } from '../core/reps/exercises';
import { ExerciseId } from '../core/reps/types';
import { currentStreak, dayKey, totalReps } from '../data/aggregate';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { sessions } = useHistory();
  const { entitled } = useEntitlement();
  const { prefs, update } = useSettings();

  const [selected, setSelected] = useState<ExerciseId>('push_up');

  const lockedIds = useMemo(
    () => new Set(EXERCISE_LIST.filter((e) => !e.freeTier && !entitled).map((e) => e.id)),
    [entitled],
  );

  const today = dayKey(new Date());
  const todayReps = totalReps(sessions.filter((s) => dayKey(new Date(s.startedAt)) === today));
  const streak = currentStreak(sessions);

  const startWorkout = () => {
    if (lockedIds.has(selected)) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('Session', { exerciseId: selected, autoDetect: prefs.autoDetectDefault });
  };

  return (
    <Screen>
      <AppText variant="caption" muted>
        Let’s move
      </AppText>
      <AppText variant="title" style={{ marginBottom: 16 }}>
        RepCam
      </AppText>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <StatTile label="Day streak" value={streak} emoji="🔥" accent />
        <StatTile label="Reps today" value={todayReps} emoji="💥" />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <AppText variant="subheading">Auto-detect exercise</AppText>
          <AppText variant="caption" muted>
            Let RepCam recognise the movement for you.
          </AppText>
        </View>
        <Switch
          value={prefs.autoDetectDefault}
          onValueChange={(v) => update({ autoDetectDefault: v })}
          trackColor={{ true: theme.colors.accent, false: theme.colors.track }}
          thumbColor={theme.colors.onAccent}
        />
      </View>

      <AppText variant="subheading" style={{ marginBottom: 10 }}>
        Choose an exercise
      </AppText>
      <ExerciseGrid selected={selected} onSelect={setSelected} lockedIds={lockedIds} />

      <View style={{ height: 20 }} />
      <AppText variant="caption" muted style={{ marginBottom: 10 }}>
        {EXERCISES[selected].hint}
      </AppText>

      <Button
        label={prefs.autoDetectDefault ? 'Start (auto-detect)' : `Start ${EXERCISES[selected].name}`}
        icon="📷"
        onPress={startWorkout}
      />
    </Screen>
  );
}
