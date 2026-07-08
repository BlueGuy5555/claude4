import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pose } from '../core/pose/types';
import { RepCounter } from '../core/reps/RepCounter';
import { EXERCISES } from '../core/reps/exercises';
import { ExerciseId, RepState } from '../core/reps/types';
import { detectExercise } from '../core/reps/autoDetect';

interface UseRepSessionArgs {
  /** The user-chosen exercise, or the current best guess when auto-detecting. */
  initialExercise: ExerciseId;
  autoDetect: boolean;
  /** Called once per completed rep (for haptics / sound). */
  onRep?: (reps: number) => void;
}

interface RepSessionState {
  reps: number;
  repState: RepState;
  activeExercise: ExerciseId;
  lastPose: Pose | undefined;
  detectConfidence: number;
  /** Feed a pose from the camera (or demo) into the session. */
  pushPose: (pose: Pose) => void;
  reset: () => void;
}

const AUTO_WINDOW = 24; // ~1s of frames

/**
 * Owns the live counting state for one workout. It is deliberately unaware of
 * *where* poses come from — the screen pumps poses in via `pushPose`, whether
 * they come from the current synthetic mover or, in future, a real on-device
 * pose detector.
 *
 * When `autoDetect` is on, it keeps a rolling window of poses and re-classifies
 * the exercise; switching exercises rebuilds the counter so thresholds match.
 */
export function useRepSession({ initialExercise, autoDetect, onRep }: UseRepSessionArgs): RepSessionState {
  const [activeExercise, setActiveExercise] = useState<ExerciseId>(initialExercise);
  const [reps, setReps] = useState(0);
  const [repState, setRepState] = useState<RepState>('unknown');
  const [lastPose, setLastPose] = useState<Pose | undefined>(undefined);
  const [detectConfidence, setDetectConfidence] = useState(0);

  const counterRef = useRef<RepCounter>(new RepCounter(EXERCISES[initialExercise]));
  const windowRef = useRef<Pose[]>([]);
  const onRepRef = useRef(onRep);
  onRepRef.current = onRep;

  // Rebuild the counter whenever the active exercise changes.
  useEffect(() => {
    counterRef.current = new RepCounter(EXERCISES[activeExercise]);
    setReps(0);
    setRepState('unknown');
  }, [activeExercise]);

  const pushPose = useCallback(
    (pose: Pose) => {
      setLastPose(pose);

      if (autoDetect) {
        const w = windowRef.current;
        w.push(pose);
        if (w.length > AUTO_WINDOW) w.shift();
        const result = detectExercise(w);
        setDetectConfidence(result.confidence);
        // Only switch before the user has started repping, to avoid resetting a
        // set mid-way because of a noisy classification.
        if (result.exercise && result.exercise !== activeExercise && counterRef.current.reps === 0) {
          setActiveExercise(result.exercise);
          return; // counter rebuilds on the next render
        }
      }

      const update = counterRef.current.update(pose);
      setReps(update.reps);
      setRepState(update.state);
      if (update.repCompleted) onRepRef.current?.(update.reps);
    },
    [autoDetect, activeExercise],
  );

  const reset = useCallback(() => {
    counterRef.current.reset();
    windowRef.current = [];
    setReps(0);
    setRepState('unknown');
    setDetectConfidence(0);
  }, []);

  return useMemo(
    () => ({ reps, repState, activeExercise, lastPose, detectConfidence, pushPose, reset }),
    [reps, repState, activeExercise, lastPose, detectConfidence, pushPose, reset],
  );
}
