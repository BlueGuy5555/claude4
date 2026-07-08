import React, { useMemo } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Screen } from '../components/Screen';
import { AppText } from '../components/Typography';
import { Card } from '../components/Card';
import { useTheme } from '../theme/ThemeProvider';
import { useHistory } from '../context/HistoryContext';
import { EXERCISES } from '../core/reps/exercises';
import { SessionRecord } from '../data/types';
import { dayKey } from '../data/aggregate';

/** "1:05" style mm:ss from a millisecond duration. */
function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = `${totalSeconds % 60}`.padStart(2, '0');
  return `${mins}:${secs}`;
}

/** "HH:MM" local time from an ISO timestamp (locale-independent). */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = `${d.getHours()}`.padStart(2, '0');
  const m = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

/** Friendly day label, e.g. "Today", "Yesterday", or "2026-07-06". */
function formatDayLabel(key: string, now: Date = new Date()): string {
  const today = dayKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  if (key === today) return 'Today';
  if (key === dayKey(yesterdayDate)) return 'Yesterday';
  return key;
}

interface DayGroup {
  day: string;
  records: SessionRecord[];
}

/** Group sessions by calendar day, newest day and newest session first. */
function groupByDay(sessions: SessionRecord[]): DayGroup[] {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
  const groups: DayGroup[] = [];
  for (const record of sorted) {
    const key = dayKey(new Date(record.startedAt));
    const existing = groups.find((g) => g.day === key);
    if (existing) existing.records.push(record);
    else groups.push({ day: key, records: [record] });
  }
  return groups;
}

export function HistoryScreen() {
  const theme = useTheme();
  const { sessions, removeSession } = useHistory();

  const groups = useMemo(() => groupByDay(sessions), [sessions]);

  const confirmDelete = (record: SessionRecord) => {
    const exercise = EXERCISES[record.exerciseId];
    Alert.alert('Delete this set?', `${record.reps} ${exercise.name} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeSession(record.id) },
    ]);
  };

  if (sessions.length === 0) {
    return (
      <Screen>
        <AppText variant="title" style={{ marginBottom: 8 }}>
          History
        </AppText>
        <Card>
          <AppText variant="subheading">No workouts yet</AppText>
          <AppText variant="caption" muted style={{ marginTop: 6 }}>
            Finish a set on the Home tab and it will be saved here on your device.
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title" style={{ marginBottom: 16 }}>
        History
      </AppText>

      {groups.map((group) => (
        <View key={group.day} style={{ marginBottom: 20 }}>
          <AppText variant="subheading" muted style={{ marginBottom: 10 }}>
            {formatDayLabel(group.day)}
          </AppText>
          <Card padded={false}>
            {group.records.map((record, idx) => {
              const exercise = EXERCISES[record.exerciseId];
              return (
                <Pressable
                  key={record.id}
                  onLongPress={() => confirmDelete(record)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <AppText style={{ fontSize: 24 }}>{exercise.emoji}</AppText>
                    <View style={{ flex: 1 }}>
                      <AppText variant="body">{exercise.name}</AppText>
                      <AppText variant="caption" muted>
                        {formatTime(record.startedAt)} · {formatDuration(record.durationMs)}
                        {record.autoDetected ? ' · auto' : ''}
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="subheading" accent>
                    {record.reps} reps
                  </AppText>
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}

      <AppText variant="caption" muted style={{ textAlign: 'center' }}>
        Long-press a set to delete it. Everything is stored only on this device.
      </AppText>
    </Screen>
  );
}
