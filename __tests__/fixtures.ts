import { KEYPOINT_NAMES, Keypoint, KeypointName, Pose } from '../src/core/pose/types';

type PartialKp = { x: number; y: number; score?: number };

/**
 * Builds a full 17-keypoint pose from a partial map. Any keypoint not provided
 * defaults to score 0 (i.e. "not detected"), which mirrors how the real model
 * behaves when a joint is occluded.
 */
export function makePose(parts: Partial<Record<KeypointName, PartialKp>>): Pose {
  const keypoints: Keypoint[] = KEYPOINT_NAMES.map((name) => {
    const p = parts[name];
    return {
      name,
      x: p?.x ?? 0,
      y: p?.y ?? 0,
      score: p?.score ?? (p ? 1 : 0),
    };
  });
  return { keypoints, score: 1 };
}

/**
 * Builds a pose for an arm with a given elbow angle, in the image plane.
 * Shoulder at origin-ish, elbow below it, wrist positioned to realize `deg`.
 */
export function armPose(deg: number, side: 'left' | 'right' = 'left', score = 1): Pose {
  const rad = (deg * Math.PI) / 180;
  const shoulder = { x: 100, y: 100, score };
  const elbow = { x: 100, y: 160, score };
  // Vector from elbow along the forearm; angle measured from the upper-arm
  // direction (pointing up, from elbow to shoulder).
  const wrist = {
    x: elbow.x + 60 * Math.sin(rad),
    y: elbow.y - 60 * Math.cos(rad),
    score,
  };
  return makePose({
    [`${side}_shoulder`]: shoulder,
    [`${side}_elbow`]: elbow,
    [`${side}_wrist`]: wrist,
  });
}
