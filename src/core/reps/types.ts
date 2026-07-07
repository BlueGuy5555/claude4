import { Pose } from '../pose/types';

export type ExerciseId =
  | 'push_up'
  | 'pull_up'
  | 'squat'
  | 'deadlift'
  | 'lunge'
  | 'bicep_curl'
  | 'shoulder_press'
  | 'sit_up'
  | 'jumping_jack';

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'arms' | 'shoulders' | 'core' | 'full_body';

/**
 * Static, data-only description of an exercise plus the pure function that turns
 * a pose into the single scalar "signal" we track for rep counting.
 *
 * Signal convention: **rest position is HIGH, effort/peak is LOW.** A rep is one
 * full dip-and-return of the signal. Encoding every exercise this way lets a
 * single generic state machine ({@link RepCounter}) count them all.
 */
export interface ExerciseDef {
  id: ExerciseId;
  name: string;
  emoji: string;
  muscle: MuscleGroup;
  /** One-line coaching hint shown in the UI. */
  hint: string;
  /** Signal is below this at the bottom of a rep (effort peak). */
  lowThreshold: number;
  /** Signal is above this at the top of a rep (rest). */
  highThreshold: number;
  /**
   * Extracts the tracked scalar from a pose. Returns undefined when the relevant
   * joints are missing or too low-confidence to trust this frame.
   */
  signal: (pose: Pose) => number | undefined;
  /** Whether this exercise is available on the free tier (before purchase). */
  freeTier: boolean;
}

export type RepState = 'unknown' | 'up' | 'down';

export interface RepUpdate {
  reps: number;
  state: RepState;
  /** True on the exact frame a rep was completed (for haptics / sound). */
  repCompleted: boolean;
  /** The (smoothed) signal used this frame, for debugging / overlays. */
  signal: number | undefined;
}
