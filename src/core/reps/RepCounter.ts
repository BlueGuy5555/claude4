/**
 * The rep-counting state machine.
 *
 * Given a stream of poses (one per camera frame) it emits a running rep count.
 * The design goals are: (1) never count jitter as a rep, and (2) never count a
 * half-rep. We achieve both with a two-state machine plus hysteresis.
 *
 * How it works
 * ------------
 * We track a single scalar `signal` (see {@link ExerciseDef}) whose convention
 * is "rest is HIGH, effort peak is LOW". The machine has two committed states:
 *
 *   up   — signal is above `highThreshold` (person at rest / top of the rep)
 *   down — signal is below `lowThreshold`  (person at the bottom / effort peak)
 *
 * The gap between the thresholds is a dead-band: while the signal sits inside it
 * the state is *held*, which is exactly what kills jitter. A rep is counted on
 * each full `down → up` transition, i.e. the user must reach the bottom AND
 * return to the top. Reaching only one extreme never counts.
 *
 * We also smooth the signal with an EMA before thresholding, and ignore frames
 * where the signal is undefined (low confidence), so brief occlusions don't
 * corrupt the count.
 */
import { Pose } from '../pose/types';
import { Ema } from '../pose/smoothing';
import { ExerciseDef, RepState, RepUpdate } from './types';

export interface RepCounterOptions {
  /** EMA smoothing factor in (0, 1]. Lower = smoother. Default 0.5. */
  smoothing?: number;
}

export class RepCounter {
  private state: RepState = 'unknown';
  private repCount = 0;
  /**
   * Whether we've ever observed a clean "up" (rest) position. We refuse to count
   * the very first down→up if detection happened to start at the bottom of a
   * movement, which would otherwise log a phantom half-rep.
   */
  private hasBeenUp = false;
  private readonly ema: Ema;

  constructor(
    private readonly exercise: ExerciseDef,
    options: RepCounterOptions = {},
  ) {
    this.ema = new Ema(options.smoothing ?? 0.5);
    if (exercise.lowThreshold >= exercise.highThreshold) {
      throw new Error(
        `Exercise ${exercise.id} has lowThreshold >= highThreshold; ` +
          'hysteresis requires low < high.',
      );
    }
  }

  get reps(): number {
    return this.repCount;
  }

  get currentState(): RepState {
    return this.state;
  }

  /** Feed one pose. Returns the updated count and whether a rep just completed. */
  update(pose: Pose): RepUpdate {
    return this.updateSignal(this.exercise.signal(pose));
  }

  /** Feed a raw signal value directly (also used by tests and replay). */
  updateSignal(raw: number | undefined): RepUpdate {
    if (raw === undefined) {
      // Low-confidence frame: hold state, don't advance the smoother.
      return { reps: this.repCount, state: this.state, repCompleted: false, signal: undefined };
    }

    const signal = this.ema.next(raw);
    let repCompleted = false;

    if (signal >= this.exercise.highThreshold) {
      if (this.state === 'down' && this.hasBeenUp) {
        // Completed a full down → up cycle from a known top: that's one rep.
        this.repCount += 1;
        repCompleted = true;
      }
      this.state = 'up';
      this.hasBeenUp = true;
    } else if (signal <= this.exercise.lowThreshold) {
      this.state = 'down';
    }
    // else: inside the dead-band → hold current state.

    return { reps: this.repCount, state: this.state, repCompleted, signal };
  }

  reset(): void {
    this.state = 'unknown';
    this.repCount = 0;
    this.hasBeenUp = false;
    this.ema.reset();
  }
}
