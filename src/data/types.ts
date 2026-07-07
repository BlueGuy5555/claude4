import { ExerciseId } from '../core/reps/types';

/**
 * One completed workout set, persisted locally on the device. This is the only
 * thing we ever store — there is no account and no server.
 */
export interface SessionRecord {
  id: string;
  exerciseId: ExerciseId;
  reps: number;
  /** ISO-8601 timestamp of when the set started. */
  startedAt: string;
  /** How long the set took, in milliseconds. */
  durationMs: number;
  /** True if the exercise was chosen by the auto-detector rather than the user. */
  autoDetected: boolean;
}

export type ThemeMode = 'system' | 'light' | 'dark';

/** Locally-persisted user preferences. */
export interface Preferences {
  themeMode: ThemeMode;
  hapticsOn: boolean;
  autoDetectDefault: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  themeMode: 'system',
  hapticsOn: true,
  autoDetectDefault: false,
};
