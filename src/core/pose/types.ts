/**
 * Pose types shared across the app.
 *
 * We follow the standard 17-keypoint COCO topology used by common mobile pose
 * models (e.g. MoveNet / BlazePose). Keeping this list defined here — rather than
 * importing it from a model package — means the pure core can be unit-tested
 * without pulling in any native / ML dependency, and leaves a clean seam for a
 * real detector to plug into later.
 */

export type KeypointName =
  | 'nose'
  | 'left_eye'
  | 'right_eye'
  | 'left_ear'
  | 'right_ear'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle';

export const KEYPOINT_NAMES: readonly KeypointName[] = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
];

export interface Keypoint {
  /** Pixel (or normalized) x coordinate. Larger = further right. */
  x: number;
  /** Pixel (or normalized) y coordinate. Larger = further *down* the image. */
  y: number;
  /** Detector confidence in [0, 1]. */
  score: number;
  name: KeypointName;
}

export interface Pose {
  keypoints: Keypoint[];
  /** Overall pose confidence in [0, 1], when the detector provides it. */
  score?: number;
}

/** Convenience accessor: returns the keypoint with the given name, or undefined. */
export function getKeypoint(pose: Pose, name: KeypointName): Keypoint | undefined {
  return pose.keypoints.find((k) => k.name === name);
}
