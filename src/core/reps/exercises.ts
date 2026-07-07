/**
 * The exercise catalogue.
 *
 * Each entry pairs human-facing metadata with a pure `signal` function and the
 * two hysteresis thresholds the rep state machine needs. See {@link ExerciseDef}
 * for the "rest is HIGH, effort is LOW" convention.
 */
import { Pose } from '../pose/types';
import { bestSideJointAngle, jointAngle } from '../pose/angles';
import { ExerciseDef, ExerciseId } from './types';

/** Elbow angle (shoulder–elbow–wrist), best of the two visible sides. */
function elbowAngle(pose: Pose): number | undefined {
  return bestSideJointAngle(pose, [
    ['left_shoulder', 'left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow', 'right_wrist'],
  ]);
}

/** Knee angle (hip–knee–ankle), best of the two visible sides. */
function kneeAngle(pose: Pose): number | undefined {
  return bestSideJointAngle(pose, [
    ['left_hip', 'left_knee', 'left_ankle'],
    ['right_hip', 'right_knee', 'right_ankle'],
  ]);
}

/** Hip / torso-hinge angle (shoulder–hip–knee), best of the two visible sides. */
function hipAngle(pose: Pose): number | undefined {
  return bestSideJointAngle(pose, [
    ['left_shoulder', 'left_hip', 'left_knee'],
    ['right_shoulder', 'right_hip', 'right_knee'],
  ]);
}

/** Shoulder abduction (hip–shoulder–wrist): small when arms are down. */
function shoulderAbduction(pose: Pose): number | undefined {
  return bestSideJointAngle(pose, [
    ['left_hip', 'left_shoulder', 'left_wrist'],
    ['right_hip', 'right_shoulder', 'right_wrist'],
  ]);
}

export const EXERCISES: Record<ExerciseId, ExerciseDef> = {
  push_up: {
    id: 'push_up',
    name: 'Push-ups',
    emoji: '🙇',
    muscle: 'chest',
    hint: 'Keep a straight line from head to heels; lower until elbows ~90°.',
    lowThreshold: 100,
    highThreshold: 150,
    signal: elbowAngle,
    freeTier: true,
  },
  pull_up: {
    id: 'pull_up',
    name: 'Pull-ups',
    emoji: '🧗',
    muscle: 'back',
    hint: 'Start from a dead hang; pull until your chin passes the bar.',
    lowThreshold: 80,
    highThreshold: 150,
    signal: elbowAngle,
    freeTier: true,
  },
  squat: {
    id: 'squat',
    name: 'Squats',
    emoji: '🏋️',
    muscle: 'legs',
    hint: 'Sit back and down until thighs are ~parallel, then drive up.',
    lowThreshold: 100,
    highThreshold: 160,
    signal: kneeAngle,
    freeTier: true,
  },
  deadlift: {
    id: 'deadlift',
    name: 'Deadlifts',
    emoji: '🦵',
    muscle: 'back',
    hint: 'Hinge at the hips with a flat back; stand tall to lock out.',
    lowThreshold: 110,
    highThreshold: 165,
    signal: hipAngle,
    freeTier: false,
  },
  lunge: {
    id: 'lunge',
    name: 'Lunges',
    emoji: '🚶',
    muscle: 'legs',
    hint: 'Step forward and drop until the front knee is ~90°.',
    lowThreshold: 105,
    highThreshold: 160,
    signal: kneeAngle,
    freeTier: false,
  },
  bicep_curl: {
    id: 'bicep_curl',
    name: 'Bicep Curls',
    emoji: '💪',
    muscle: 'arms',
    hint: 'Keep elbows pinned; curl all the way up and control the way down.',
    lowThreshold: 60,
    highThreshold: 150,
    signal: elbowAngle,
    freeTier: false,
  },
  shoulder_press: {
    id: 'shoulder_press',
    name: 'Shoulder Press',
    emoji: '🙆',
    muscle: 'shoulders',
    hint: 'Press from the rack position until arms lock out overhead.',
    // Inverted: rack (rest) ≈ elbow 90° → signal 90 (high); overhead lockout
    // ≈ elbow 170° → signal 10 (low). Keeps the "rest is HIGH" convention.
    lowThreshold: 40,
    highThreshold: 75,
    signal: (pose: Pose) => {
      const a = elbowAngle(pose);
      return a === undefined ? undefined : 180 - a;
    },
    freeTier: false,
  },
  sit_up: {
    id: 'sit_up',
    name: 'Sit-ups',
    emoji: '🧘',
    muscle: 'core',
    hint: 'Curl up until your torso is upright, then lower under control.',
    lowThreshold: 70,
    highThreshold: 120,
    signal: hipAngle,
    freeTier: false,
  },
  jumping_jack: {
    id: 'jumping_jack',
    name: 'Jumping Jacks',
    emoji: '🤸',
    muscle: 'full_body',
    hint: 'Arms and legs out on the jump, back to your sides to reset.',
    // Inverted: arms down (rest) ≈ abduction 20° → signal 160 (high); arms
    // overhead ≈ abduction 160° → signal 20 (low).
    lowThreshold: 70,
    highThreshold: 130,
    signal: (pose: Pose) => {
      const a = shoulderAbduction(pose);
      return a === undefined ? undefined : 180 - a;
    },
    freeTier: false,
  },
};

export const EXERCISE_LIST: ExerciseDef[] = Object.values(EXERCISES);

export function getExercise(id: ExerciseId): ExerciseDef {
  return EXERCISES[id];
}

export { elbowAngle, kneeAngle, hipAngle, shoulderAbduction };
