/**
 * Pure geometry helpers used by the rep-counting engine.
 *
 * Everything here operates on plain {x, y} points, so it is trivially testable
 * and has no dependency on the pose model or React Native.
 */
import { Keypoint, Pose, KeypointName, getKeypoint } from './types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Interior angle (in degrees) at vertex `b` formed by the segments b→a and b→c.
 *
 * Example: for an elbow, pass shoulder (a), elbow (b), wrist (c). A straight arm
 * yields ~180°, a fully bent arm approaches ~30–40°.
 */
export function angleAt(a: Point, b: Point, c: Point): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magAb = Math.hypot(abx, aby);
  const magCb = Math.hypot(cbx, cby);

  if (magAb === 0 || magCb === 0) return 0;

  // Clamp to avoid NaN from floating point drift outside [-1, 1].
  const cos = Math.max(-1, Math.min(1, dot / (magAb * magCb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Midpoint of two points. */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * The angle (degrees, 0–90) of the torso relative to the horizontal image axis.
 * ~0° means the person is lying flat (e.g. a push-up); ~90° means fully upright
 * (e.g. standing for a squat). Uses shoulder- and hip-midpoints.
 */
export function torsoInclination(pose: Pose): number | undefined {
  const shoulder = midpointOf(pose, 'left_shoulder', 'right_shoulder');
  const hip = midpointOf(pose, 'left_hip', 'right_hip');
  if (!shoulder || !hip) return undefined;

  const dx = Math.abs(shoulder.x - hip.x);
  const dy = Math.abs(shoulder.y - hip.y);
  if (dx === 0 && dy === 0) return undefined;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Returns the midpoint of two named keypoints if both clear `minScore`,
 * otherwise undefined.
 */
export function midpointOf(
  pose: Pose,
  a: KeypointName,
  b: KeypointName,
  minScore = 0,
): Point | undefined {
  const ka = getKeypoint(pose, a);
  const kb = getKeypoint(pose, b);
  if (!ka || !kb) return undefined;
  if (ka.score < minScore || kb.score < minScore) return undefined;
  return midpoint(ka, kb);
}

/**
 * Computes the joint angle at `b` from three named keypoints, returning
 * undefined when any keypoint is missing or below `minScore`.
 */
export function jointAngle(
  pose: Pose,
  a: KeypointName,
  b: KeypointName,
  c: KeypointName,
  minScore = 0.3,
): number | undefined {
  const ka = getKeypoint(pose, a);
  const kb = getKeypoint(pose, b);
  const kc = getKeypoint(pose, c);
  if (!ka || !kb || !kc) return undefined;
  if (ka.score < minScore || kb.score < minScore || kc.score < minScore) {
    return undefined;
  }
  return angleAt(ka, kb, kc);
}

/**
 * Picks whichever of the left/right joint triples has the highest combined
 * confidence and returns its angle. This makes counting robust to the user
 * being filmed from an angle where one side is occluded.
 */
export function bestSideJointAngle(
  pose: Pose,
  triples: ReadonlyArray<readonly [KeypointName, KeypointName, KeypointName]>,
  minScore = 0.3,
): number | undefined {
  let best: { angle: number; conf: number } | undefined;
  for (const [a, b, c] of triples) {
    const ka = getKeypoint(pose, a);
    const kb = getKeypoint(pose, b);
    const kc = getKeypoint(pose, c);
    if (!ka || !kb || !kc) continue;
    const conf = Math.min(ka.score, kb.score, kc.score);
    if (conf < minScore) continue;
    const angle = angleAt(ka, kb, kc);
    if (!best || conf > best.conf) best = { angle, conf };
  }
  return best?.angle;
}

/** Averages the `score` field across the provided keypoints. */
export function averageScore(keypoints: Keypoint[]): number {
  if (keypoints.length === 0) return 0;
  return keypoints.reduce((s, k) => s + k.score, 0) / keypoints.length;
}
