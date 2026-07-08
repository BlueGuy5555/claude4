/**
 * A synthetic pose generator.
 *
 * This provider ignores the camera and instead "acts out" the selected exercise
 * by oscillating the relevant joint through its full range. It currently powers
 * the whole app: the demo skeleton, and the temporary "fake" rep counter shown
 * behind the live camera while real on-device pose detection is still deferred.
 * Because it drives the very same rep-counting pipeline the real detector will,
 * every downstream feature — counting, history, charts — is fully exercised.
 */
import { KeypointName, Keypoint, Pose, KEYPOINT_NAMES } from '../../core/pose/types';
import { ExerciseDef, ExerciseId } from '../../core/reps/types';
import { PoseProvider } from './PoseProvider';

type Point = { x: number; y: number };

interface Driver {
  joint: KeypointName; // vertex to rotate around (left side; right mirrors)
  anchor: KeypointName; // reference limb direction
  distal: KeypointName; // the point we move to realize the target angle
  limbLength: number;
}

/** Which joint drives each exercise's rep signal. */
const DRIVERS: Record<ExerciseId, Driver> = {
  push_up: { joint: 'left_elbow', anchor: 'left_shoulder', distal: 'left_wrist', limbLength: 45 },
  pull_up: { joint: 'left_elbow', anchor: 'left_shoulder', distal: 'left_wrist', limbLength: 45 },
  bicep_curl: { joint: 'left_elbow', anchor: 'left_shoulder', distal: 'left_wrist', limbLength: 45 },
  shoulder_press: { joint: 'left_elbow', anchor: 'left_shoulder', distal: 'left_wrist', limbLength: 45 },
  squat: { joint: 'left_knee', anchor: 'left_hip', distal: 'left_ankle', limbLength: 70 },
  lunge: { joint: 'left_knee', anchor: 'left_hip', distal: 'left_ankle', limbLength: 70 },
  deadlift: { joint: 'left_hip', anchor: 'left_shoulder', distal: 'left_knee', limbLength: 70 },
  sit_up: { joint: 'left_hip', anchor: 'left_shoulder', distal: 'left_knee', limbLength: 70 },
  jumping_jack: { joint: 'left_shoulder', anchor: 'left_hip', distal: 'left_wrist', limbLength: 60 },
};

const BASE: Record<KeypointName, Point> = {
  nose: { x: 100, y: 40 },
  left_eye: { x: 95, y: 36 },
  right_eye: { x: 105, y: 36 },
  left_ear: { x: 90, y: 40 },
  right_ear: { x: 110, y: 40 },
  left_shoulder: { x: 85, y: 90 },
  right_shoulder: { x: 115, y: 90 },
  left_elbow: { x: 78, y: 135 },
  right_elbow: { x: 122, y: 135 },
  left_wrist: { x: 74, y: 180 },
  right_wrist: { x: 126, y: 180 },
  left_hip: { x: 90, y: 190 },
  right_hip: { x: 110, y: 190 },
  left_knee: { x: 90, y: 260 },
  right_knee: { x: 110, y: 260 },
  left_ankle: { x: 90, y: 330 },
  right_ankle: { x: 110, y: 330 },
};

function rotateToAngle(pivot: Point, anchor: Point, deg: number, len: number): Point {
  const ux = anchor.x - pivot.x;
  const uy = anchor.y - pivot.y;
  const mag = Math.hypot(ux, uy) || 1;
  const nx = ux / mag;
  const ny = uy / mag;
  const rad = (deg * Math.PI) / 180;
  const rx = nx * Math.cos(rad) - ny * Math.sin(rad);
  const ry = nx * Math.sin(rad) + ny * Math.cos(rad);
  return { x: pivot.x + rx * len, y: pivot.y + ry * len };
}

export class MockPoseProvider implements PoseProvider {
  readonly id = 'mock';
  private phase = 0;

  constructor(private exercise: ExerciseDef) {}

  setExercise(exercise: ExerciseDef): void {
    this.exercise = exercise;
    this.phase = 0;
  }

  async init(): Promise<void> {
    /* nothing to load */
  }

  async estimate(_input: unknown): Promise<Pose | undefined> {
    // Advance the animation; ~0.5 rad per frame gives a natural cadence.
    this.phase += 0.5;
    // Oscillate the *actual* joint angle across a wide range (40°–175°) so the
    // exercise's signal reliably crosses both hysteresis thresholds each cycle.
    const t = (Math.sin(this.phase) + 1) / 2; // 0..1
    const jointAngle = 40 + t * 135;

    const driver = DRIVERS[this.exercise.id];
    const points: Record<KeypointName, Point> = { ...BASE };

    const pivot = points[driver.joint];
    const anchor = points[driver.anchor];
    const moved = rotateToAngle(pivot, anchor, jointAngle, driver.limbLength);
    points[driver.distal] = moved;
    // Mirror to the right side so the skeleton looks symmetric.
    const mirror = mirrorName(driver.distal);
    if (mirror) points[mirror] = { x: 200 - moved.x, y: moved.y };

    const keypoints: Keypoint[] = KEYPOINT_NAMES.map((name) => ({
      name,
      x: points[name].x,
      y: points[name].y,
      score: 0.9,
    }));
    return { keypoints, score: 0.9 };
  }

  async dispose(): Promise<void> {
    /* no-op */
  }
}

function mirrorName(name: KeypointName): KeypointName | undefined {
  if (name.startsWith('left_')) return name.replace('left_', 'right_') as KeypointName;
  if (name.startsWith('right_')) return name.replace('right_', 'left_') as KeypointName;
  return undefined;
}
