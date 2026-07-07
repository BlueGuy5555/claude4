import {
  dayKey,
  totalReps,
  repsByExercise,
  personalBests,
  repsPerDay,
  currentStreak,
  summarize,
} from '../src/data/aggregate';
import { SessionRecord } from '../src/data/types';
import { ExerciseId } from '../src/core/reps/types';

let seq = 0;
function rec(exerciseId: ExerciseId, reps: number, date: Date): SessionRecord {
  return {
    id: `r${seq++}`,
    exerciseId,
    reps,
    startedAt: date.toISOString(),
    durationMs: 60000,
    autoDetected: false,
  };
}

describe('dayKey', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(dayKey(new Date(2026, 6, 7))).toBe('2026-07-07');
    expect(dayKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});

describe('totals & breakdowns', () => {
  const records = [
    rec('push_up', 10, new Date(2026, 6, 1)),
    rec('push_up', 15, new Date(2026, 6, 2)),
    rec('squat', 20, new Date(2026, 6, 2)),
  ];

  it('sums total reps', () => {
    expect(totalReps(records)).toBe(45);
  });

  it('groups reps by exercise', () => {
    expect(repsByExercise(records)).toEqual({ push_up: 25, squat: 20 });
  });

  it('finds personal bests per exercise', () => {
    expect(personalBests(records)).toEqual({ push_up: 15, squat: 20 });
  });
});

describe('repsPerDay', () => {
  it('produces a continuous series including zero days', () => {
    const now = new Date(2026, 6, 7);
    const records = [rec('push_up', 10, new Date(2026, 6, 7)), rec('squat', 5, new Date(2026, 6, 5))];
    const series = repsPerDay(records, 3, now);
    expect(series).toEqual([
      { day: '2026-07-05', reps: 5 },
      { day: '2026-07-06', reps: 0 },
      { day: '2026-07-07', reps: 10 },
    ]);
  });
});

describe('currentStreak', () => {
  it('counts consecutive active days ending today', () => {
    const now = new Date(2026, 6, 7);
    const records = [
      rec('push_up', 5, new Date(2026, 6, 7)),
      rec('push_up', 5, new Date(2026, 6, 6)),
      rec('push_up', 5, new Date(2026, 6, 5)),
    ];
    expect(currentStreak(records, now)).toBe(3);
  });

  it('stays alive if today has no session but yesterday did', () => {
    const now = new Date(2026, 6, 7);
    const records = [rec('push_up', 5, new Date(2026, 6, 6)), rec('push_up', 5, new Date(2026, 6, 5))];
    expect(currentStreak(records, now)).toBe(2);
  });

  it('is zero when the last session was more than a day ago', () => {
    const now = new Date(2026, 6, 7);
    const records = [rec('push_up', 5, new Date(2026, 6, 4))];
    expect(currentStreak(records, now)).toBe(0);
  });

  it('is zero with no records', () => {
    expect(currentStreak([], new Date())).toBe(0);
  });
});

describe('summarize', () => {
  it('reports favorite exercise, best set and totals', () => {
    const now = new Date(2026, 6, 7);
    const records = [
      rec('push_up', 10, new Date(2026, 6, 7)),
      rec('push_up', 30, new Date(2026, 6, 7)),
      rec('squat', 12, new Date(2026, 6, 7)),
    ];
    const s = summarize(records, now);
    expect(s.totalReps).toBe(52);
    expect(s.totalSessions).toBe(3);
    expect(s.favoriteExercise).toBe('push_up');
    expect(s.bestSet).toBe(30);
    expect(s.streak).toBe(1);
  });
});
