import { EXERCISES, EXERCISE_LIST, getExercise } from '../src/core/reps/exercises';
import { ExerciseId } from '../src/core/reps/types';
import { armPose, makePose } from './fixtures';

describe('exercise catalogue', () => {
  it('every exercise has a valid hysteresis band (low < high)', () => {
    for (const ex of EXERCISE_LIST) {
      expect(ex.lowThreshold).toBeLessThan(ex.highThreshold);
    }
  });

  it('exposes at least push-ups, pull-ups, squats and deadlift', () => {
    const ids = EXERCISE_LIST.map((e) => e.id);
    for (const id of ['push_up', 'pull_up', 'squat', 'deadlift'] as ExerciseId[]) {
      expect(ids).toContain(id);
    }
  });

  it('has a non-empty free tier and some premium exercises', () => {
    expect(EXERCISE_LIST.some((e) => e.freeTier)).toBe(true);
    expect(EXERCISE_LIST.some((e) => !e.freeTier)).toBe(true);
  });

  it('push-up signal reads the elbow angle', () => {
    expect(EXERCISES.push_up.signal(armPose(160))).toBeCloseTo(160, 0);
  });

  it('shoulder-press signal is inverted (rest is HIGH)', () => {
    // Rack position ~ elbow 90° should map to a high signal (180 - 90 = 90).
    expect(EXERCISES.shoulder_press.signal(armPose(90))).toBeCloseTo(90, 0);
    // Overhead lockout ~ elbow 170° maps to a low signal (180 - 170 = 10).
    expect(EXERCISES.shoulder_press.signal(armPose(170))).toBeCloseTo(10, 0);
  });

  it('returns undefined signal when joints are missing', () => {
    expect(EXERCISES.squat.signal(makePose({}))).toBeUndefined();
  });

  it('getExercise returns the definition by id', () => {
    expect(getExercise('deadlift').name).toBe('Deadlifts');
  });
});
