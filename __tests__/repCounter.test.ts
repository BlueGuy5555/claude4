import { RepCounter } from '../src/core/reps/RepCounter';
import { ExerciseDef } from '../src/core/reps/types';
import { EXERCISES } from '../src/core/reps/exercises';
import { armPose } from './fixtures';

const testExercise: ExerciseDef = {
  id: 'push_up',
  name: 'Test',
  emoji: '🙂',
  muscle: 'chest',
  hint: '',
  lowThreshold: 100,
  highThreshold: 150,
  signal: () => undefined,
  freeTier: true,
};

/** Drive a sequence of raw signal values with smoothing disabled (alpha=1). */
function run(counter: RepCounter, values: number[]): number {
  for (const v of values) counter.updateSignal(v);
  return counter.reps;
}

describe('RepCounter', () => {
  it('counts full down→up cycles', () => {
    const c = new RepCounter(testExercise, { smoothing: 1 });
    // up, down, up, down, up  => 2 reps
    expect(run(c, [160, 90, 160, 90, 160])).toBe(2);
  });

  it('does not count half-reps that only dip into the dead-band', () => {
    const c = new RepCounter(testExercise, { smoothing: 1 });
    // 160 (up), 120 (dead-band, hold), 160 (still up) => no rep
    expect(run(c, [160, 120, 160, 120, 160])).toBe(0);
  });

  it('ignores small jitter around the top', () => {
    const c = new RepCounter(testExercise, { smoothing: 1 });
    expect(run(c, [155, 151, 158, 149.9, 152, 160])).toBe(0);
  });

  it('does not count a phantom rep when detection starts at the bottom', () => {
    const c = new RepCounter(testExercise, { smoothing: 1 });
    // starts down, comes up (should NOT count), then a real rep
    expect(run(c, [90, 160, 90, 160])).toBe(1);
  });

  it('holds state through low-confidence (undefined) frames', () => {
    const c = new RepCounter(testExercise, { smoothing: 1 });
    c.updateSignal(160); // up
    c.updateSignal(90); // down
    c.updateSignal(undefined); // occluded, hold
    c.updateSignal(undefined);
    const res = c.updateSignal(160); // up -> rep
    expect(res.reps).toBe(1);
    expect(res.repCompleted).toBe(true);
  });

  it('flags repCompleted exactly once per rep', () => {
    const c = new RepCounter(testExercise, { smoothing: 1 });
    const flags = [160, 90, 160, 160, 90, 160].map((v) => c.updateSignal(v).repCompleted);
    expect(flags.filter(Boolean)).toHaveLength(2);
  });

  it('reset clears count and state', () => {
    const c = new RepCounter(testExercise, { smoothing: 1 });
    run(c, [160, 90, 160]);
    c.reset();
    expect(c.reps).toBe(0);
    expect(c.currentState).toBe('unknown');
  });

  it('rejects a config where low >= high', () => {
    expect(
      () => new RepCounter({ ...testExercise, lowThreshold: 150, highThreshold: 150 }),
    ).toThrow();
  });

  it('counts real push-up poses via the exercise signal', () => {
    const c = new RepCounter(EXERCISES.push_up, { smoothing: 1 });
    // extended arm (~170°) = up, bent (~80°) = down
    const up = armPose(170);
    const down = armPose(80);
    c.update(up);
    c.update(down);
    c.update(up);
    c.update(down);
    const res = c.update(up);
    expect(res.reps).toBe(2);
  });

  it('smooths out a single-frame spike (does not create a rep)', () => {
    const c = new RepCounter(testExercise, { smoothing: 0.4 });
    // Sit at the top, then one bad frame dips low; smoothing should absorb it.
    const values = [160, 160, 160, 60, 160, 160, 160];
    expect(run(c, values)).toBe(0);
  });
});
