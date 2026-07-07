/**
 * Pure aggregation helpers that turn a flat list of {@link SessionRecord}s into
 * the numbers the Progress screen shows: totals, per-exercise breakdowns,
 * per-day series for charts, streaks and personal bests.
 *
 * Keeping these pure (no storage, no React) means the Progress screen is just a
 * thin renderer, and every statistic is unit-tested against fixed fixtures.
 */
import { ExerciseId } from '../core/reps/types';
import { SessionRecord } from './types';

/** Local calendar-day key, e.g. "2026-07-07". Uses the device's local time. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function totalReps(records: SessionRecord[]): number {
  return records.reduce((sum, r) => sum + r.reps, 0);
}

export function totalSessions(records: SessionRecord[]): number {
  return records.length;
}

export function repsByExercise(records: SessionRecord[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of records) {
    out[r.exerciseId] = (out[r.exerciseId] ?? 0) + r.reps;
  }
  return out;
}

/** Personal best (most reps in a single set) per exercise. */
export function personalBests(records: SessionRecord[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of records) {
    out[r.exerciseId] = Math.max(out[r.exerciseId] ?? 0, r.reps);
  }
  return out;
}

export interface DailyPoint {
  day: string;
  reps: number;
}

/**
 * Reps summed per day for the last `days` calendar days (oldest first),
 * including days with zero reps so the chart has a continuous x-axis.
 */
export function repsPerDay(records: SessionRecord[], days: number, now: Date = new Date()): DailyPoint[] {
  const byDay = new Map<string, number>();
  for (const r of records) {
    const key = dayKey(new Date(r.startedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + r.reps);
  }

  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = dayKey(d);
    points.push({ day: key, reps: byDay.get(key) ?? 0 });
  }
  return points;
}

/**
 * Current streak: number of consecutive calendar days (ending today or, if today
 * has no session yet, ending yesterday) on which at least one set was logged.
 */
export function currentStreak(records: SessionRecord[], now: Date = new Date()): number {
  if (records.length === 0) return 0;
  const activeDays = new Set(records.map((r) => dayKey(new Date(r.startedAt))));

  const cursor = new Date(now);
  // Allow the streak to be "alive" even if the user hasn't trained yet today.
  if (!activeDays.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface ProgressSummary {
  totalReps: number;
  totalSessions: number;
  streak: number;
  favoriteExercise: ExerciseId | undefined;
  bestSet: number;
}

export function summarize(records: SessionRecord[], now: Date = new Date()): ProgressSummary {
  const byExercise = repsByExercise(records);
  let favoriteExercise: ExerciseId | undefined;
  let favoriteReps = -1;
  for (const [id, reps] of Object.entries(byExercise)) {
    if (reps > favoriteReps) {
      favoriteReps = reps;
      favoriteExercise = id as ExerciseId;
    }
  }
  const bestSet = records.reduce((m, r) => Math.max(m, r.reps), 0);

  return {
    totalReps: totalReps(records),
    totalSessions: records.length,
    streak: currentStreak(records, now),
    favoriteExercise,
    bestSet,
  };
}
