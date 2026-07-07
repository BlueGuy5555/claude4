import { detectExercise } from '../src/core/reps/autoDetect';
import { makePose } from './fixtures';
import { KeypointName, Pose } from '../src/core/pose/types';

/** Rotate the unit vector pointing from `pivot` towards `ref` by `deg` degrees. */
function limbEnd(pivot: { x: number; y: number }, ref: { x: number; y: number }, deg: number, len: number) {
  const ux = ref.x - pivot.x;
  const uy = ref.y - pivot.y;
  const mag = Math.hypot(ux, uy) || 1;
  const nx = ux / mag;
  const ny = uy / mag;
  const rad = (deg * Math.PI) / 180;
  const rx = nx * Math.cos(rad) - ny * Math.sin(rad);
  const ry = nx * Math.sin(rad) + ny * Math.cos(rad);
  return { x: pivot.x + rx * len, y: pivot.y + ry * len };
}

/** A standing pose whose knee angle we control; everything else stays fixed. */
function squatFrame(kneeDeg: number): Pose {
  const shoulder = { x: 100, y: 60 };
  const hip = { x: 100, y: 160 };
  const knee = { x: 100, y: 240 };
  const ankle = limbEnd(knee, hip, kneeDeg, 80);
  const wrist = { x: 100, y: 150 }; // by the side, below shoulders
  const parts: Partial<Record<KeypointName, { x: number; y: number }>> = {
    left_shoulder: shoulder,
    right_shoulder: shoulder,
    left_hip: hip,
    right_hip: hip,
    left_knee: knee,
    right_knee: knee,
    left_ankle: ankle,
    right_ankle: ankle,
    left_wrist: wrist,
    right_wrist: wrist,
  };
  return makePose(parts);
}

/** A horizontal (plank) pose whose elbow angle we control. */
function pushupFrame(elbowDeg: number): Pose {
  const shoulder = { x: 100, y: 150 };
  const hip = { x: 250, y: 150 };
  const knee = { x: 330, y: 150 };
  const elbow = { x: 100, y: 185 };
  const wrist = limbEnd(elbow, shoulder, elbowDeg, 45); // near shoulder level, not overhead
  const parts: Partial<Record<KeypointName, { x: number; y: number }>> = {
    left_shoulder: shoulder,
    right_shoulder: shoulder,
    left_hip: hip,
    right_hip: hip,
    left_knee: knee,
    right_knee: knee,
    left_elbow: elbow,
    right_elbow: elbow,
    left_wrist: wrist,
    right_wrist: wrist,
  };
  return makePose(parts);
}

describe('detectExercise', () => {
  it('returns undefined for a too-short window', () => {
    expect(detectExercise([squatFrame(170)]).exercise).toBeUndefined();
  });

  it('returns undefined when there is not enough motion', () => {
    const still = Array.from({ length: 10 }, () => squatFrame(170));
    expect(detectExercise(still).exercise).toBeUndefined();
  });

  it('detects squats from a vertical torso with knee motion', () => {
    const window: Pose[] = [];
    for (let i = 0; i < 12; i++) {
      window.push(squatFrame(i % 2 === 0 ? 170 : 95));
    }
    expect(detectExercise(window).exercise).toBe('squat');
  });

  it('detects push-ups from a horizontal torso with elbow motion', () => {
    const window: Pose[] = [];
    for (let i = 0; i < 12; i++) {
      window.push(pushupFrame(i % 2 === 0 ? 170 : 85));
    }
    expect(detectExercise(window).exercise).toBe('push_up');
  });
});
