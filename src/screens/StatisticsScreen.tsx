import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { AppText } from '../components/Typography';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { BarChart } from '../components/BarChart';
import { SegmentedControl } from '../components/SegmentedControl';
import { useHistory } from '../context/HistoryContext';
import { useTheme } from '../theme/ThemeProvider';
import { EXERCISES } from '../core/reps/exercises';
import { ExerciseId } from '../core/reps/types';
import { personalBests, repsByExercise, repsPerDay, summarize } from '../data/aggregate';

type Range = '7' | '30';

export function StatisticsScreen() {
  const theme = useTheme();
  const { sessions } = useHistory();
  const [range, setRange] = useState<Range>('7');

  const summary = useMemo(() => summarize(sessions), [sessions]);
  const series = useMemo(() => repsPerDay(sessions, range === '7' ? 7 : 30), [sessions, range]);
  const byExercise = useMemo(() => repsByExercise(sessions), [sessions]);
  const bests = useMemo(() => personalBests(sessions), [sessions]);

  const breakdown = (Object.keys(byExercise) as ExerciseId[]).sort(
    (a, b) => (byExercise[b] ?? 0) - (byExercise[a] ?? 0),
  );

  if (sessions.length === 0) {
    return (
      <Screen>
        <AppText variant="title" style={{ marginBottom: 8 }}>
          Statistics
        </AppText>
        <Card>
          <AppText variant="subheading">No workouts yet</AppText>
          <AppText variant="caption" muted style={{ marginTop: 6 }}>
            Finish a set on the Home tab and your reps, streaks and personal bests will show up here.
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title" style={{ marginBottom: 16 }}>
        Statistics
      </AppText>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <StatTile label="Total reps" value={summary.totalReps} emoji="🏆" accent />
        <StatTile label="Sessions" value={summary.totalSessions} emoji="📅" />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <StatTile label="Day streak" value={summary.streak} emoji="🔥" />
        <StatTile label="Best set" value={summary.bestSet} emoji="⭐" />
      </View>

      <Card style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
          <AppText variant="subheading">Reps per day</AppText>
        </View>
        <BarChart data={series} />
        <View style={{ height: 12 }} />
        <SegmentedControl
          segments={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
          ]}
          value={range}
          onChange={setRange}
        />
      </Card>

      <AppText variant="subheading" style={{ marginBottom: 10 }}>
        By exercise
      </AppText>
      <Card>
        {breakdown.map((id, idx) => (
          <View
            key={id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AppText style={{ fontSize: 20 }}>{EXERCISES[id].emoji}</AppText>
              <View>
                <AppText variant="body">{EXERCISES[id].name}</AppText>
                <AppText variant="caption" muted>
                  best set {bests[id] ?? 0}
                </AppText>
              </View>
            </View>
            <AppText variant="subheading" accent>
              {byExercise[id]}
            </AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
