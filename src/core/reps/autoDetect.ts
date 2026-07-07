/**
 * Auto exercise detection.
 *
 * When the user doesn't want to pick an exercise, we guess it from a short
 * rolling window of poses. This is deliberately a lightweight heuristic
 * classifier rather than a second neural net: it reads a few interpretable
 * body cues and scores each candidate exercise. That keeps it fully on-device,
 * dependency-free, and easy to reason about.
 *
 * Cues used
 * ---------
 *  - Torso inclination: ~horizontal ⇒ push-up family; ~vertical ⇒ standing lifts.
 *  - Wrists relative to shoulders/head: overhead ⇒ pull-up / shoulder press.
 *  - Which joint has the largest range of motion across the window:
 *      elbows ⇒ upper-body pressing/pulling; knees ⇒ squats/lunges;
 *      hips ⇒ hinge (deadlift) or trunk flexion (sit-up).
 */
import { Pose, getKeypoint } from '../pose/types';
import { torsoInclination, midpointOf } from '../pose/angles';
import { elbowAngle, kneeAngle, hipAngle, shoulderAbduction } from './exercises';
import { ExerciseId } from './types';

export interface AutoDetectResult {
  exercise: ExerciseId | undefined;
  /** Confidence in [0, 1]; undefined when there isn't enough signal yet. */
  confidence: number;
}

interface Range {
  min: number;
  max: number;
  count: number;
}

function track(range: Range | undefined, value: number | undefined): Range | undefined {
  if (value === undefined) return range;
  if (!range) return { min: value, max: value, count: 1 };
  return { min: Math.min(range.min, value), max: Math.max(range.max, value), count: range.count + 1 };
}

function span(range: Range | undefined): number {
  return range && range.count >= 2 ? range.max - range.min : 0;
}

/**
 * Classify the exercise from a window of poses (most recent last). Returns
 * `undefined` when the window is too short or the person isn't moving enough.
 */
export function detectExercise(window: Pose[]): AutoDetectResult {
  if (window.length < 6) return { exercise: undefined, confidence: 0 };

  let elbow: Range | undefined;
  let knee: Range | undefined;
  let hip: Range | undefined;
  let abduction: Range | undefined;
  let inclinationSum = 0;
  let inclinationCount = 0;
  let wristsOverheadFrames = 0;
  let overheadEligibleFrames = 0;

  for (const pose of window) {
    elbow = track(elbow, elbowAngle(pose));
    knee = track(knee, kneeAngle(pose));
    hip = track(hip, hipAngle(pose));
    abduction = track(abduction, shoulderAbduction(pose));

    const incl = torsoInclination(pose);
    if (incl !== undefined) {
      inclinationSum += incl;
      inclinationCount += 1;
    }

    const shoulders = midpointOf(pose, 'left_shoulder', 'right_shoulder', 0.3);
    const lw = getKeypoint(pose, 'left_wrist');
    const rw = getKeypoint(pose, 'right_wrist');
    if (shoulders && lw && rw && lw.score > 0.3 && rw.score > 0.3) {
      overheadEligibleFrames += 1;
      // Remember: larger y = lower on screen, so "above" means smaller y.
      if (lw.y < shoulders.y && rw.y < shoulders.y) wristsOverheadFrames += 1;
    }
  }

  const avgInclination = inclinationCount > 0 ? inclinationSum / inclinationCount : undefined;
  const overheadRatio = overheadEligibleFrames > 0 ? wristsOverheadFrames / overheadEligibleFrames : 0;

  const elbowSpan = span(elbow);
  const kneeSpan = span(knee);
  const hipSpan = span(hip);
  const abductionSpan = span(abduction);

  // Not enough motion anywhere → can't decide yet.
  if (Math.max(elbowSpan, kneeSpan, hipSpan, abductionSpan) < 20) {
    return { exercise: undefined, confidence: 0 };
  }

  const scores: Record<ExerciseId, number> = {
    push_up: 0,
    pull_up: 0,
    squat: 0,
    deadlift: 0,
    lunge: 0,
    bicep_curl: 0,
    shoulder_press: 0,
    sit_up: 0,
    jumping_jack: 0,
  };

  const horizontal = avgInclination !== undefined && avgInclination < 35;
  const vertical = avgInclination !== undefined && avgInclination > 55;

  // Upper-body, elbow-driven.
  scores.push_up += elbowSpan * (horizontal ? 1.5 : 0.4);
  scores.pull_up += elbowSpan * (overheadRatio > 0.5 ? 1.4 : 0.2);
  scores.bicep_curl += elbowSpan * (vertical && overheadRatio < 0.2 ? 1.0 : 0.3);
  scores.shoulder_press += elbowSpan * (overheadRatio > 0.4 && vertical ? 1.1 : 0.2);

  // Leg-driven.
  scores.squat += kneeSpan * (vertical ? 1.4 : 0.5);
  scores.lunge += kneeSpan * (vertical ? 1.0 : 0.4);

  // Hip / trunk driven.
  scores.deadlift += hipSpan * (vertical ? 1.3 : 0.4);
  scores.sit_up += hipSpan * (horizontal ? 1.3 : 0.3);

  // Full-body abduction.
  scores.jumping_jack += abductionSpan * (overheadRatio > 0.3 ? 1.2 : 0.5);

  let bestId: ExerciseId | undefined;
  let bestScore = 0;
  let total = 0;
  for (const id of Object.keys(scores) as ExerciseId[]) {
    const s = scores[id];
    total += s;
    if (s > bestScore) {
      bestScore = s;
      bestId = id;
    }
  }

  const confidence = total > 0 ? bestScore / total : 0;
  // Require the leader to be clearly ahead before committing.
  if (!bestId || confidence < 0.28) return { exercise: undefined, confidence };
  return { exercise: bestId, confidence };
}
