import { angleAt, distance, midpoint, jointAngle, bestSideJointAngle, torsoInclination } from '../src/core/pose/angles';
import { makePose, armPose } from './fixtures';

describe('angleAt', () => {
  it('measures a right angle', () => {
    expect(angleAt({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(90);
  });

  it('measures a straight angle', () => {
    expect(angleAt({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(180);
  });

  it('measures a zero angle when both rays coincide', () => {
    expect(angleAt({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0);
  });

  it('returns 0 for degenerate (zero-length) rays', () => {
    expect(angleAt({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0);
  });
});

describe('distance & midpoint', () => {
  it('computes euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
  it('computes midpoint', () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 4, y: 2 })).toEqual({ x: 2, y: 1 });
  });
});

describe('jointAngle', () => {
  it('returns the elbow angle from a constructed arm pose', () => {
    const pose = armPose(90, 'left');
    expect(jointAngle(pose, 'left_shoulder', 'left_elbow', 'left_wrist')).toBeCloseTo(90, 0);
  });

  it('returns undefined when a keypoint is below the confidence threshold', () => {
    const pose = armPose(90, 'left', 0.1);
    expect(jointAngle(pose, 'left_shoulder', 'left_elbow', 'left_wrist', 0.3)).toBeUndefined();
  });
});

describe('bestSideJointAngle', () => {
  it('prefers the higher-confidence side', () => {
    const left = armPose(160, 'left', 0.4).keypoints;
    const right = armPose(90, 'right', 0.9).keypoints;
    const pose = { keypoints: [...left.filter((k) => k.name.startsWith('left')), ...right.filter((k) => k.name.startsWith('right'))] };
    const angle = bestSideJointAngle(pose, [
      ['left_shoulder', 'left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow', 'right_wrist'],
    ]);
    expect(angle).toBeCloseTo(90, 0);
  });
});

describe('torsoInclination', () => {
  it('is ~0 for a horizontal torso (push-up)', () => {
    const pose = makePose({
      left_shoulder: { x: 100, y: 100 },
      right_shoulder: { x: 100, y: 100 },
      left_hip: { x: 200, y: 100 },
      right_hip: { x: 200, y: 100 },
    });
    expect(torsoInclination(pose)).toBeCloseTo(0, 0);
  });

  it('is ~90 for a vertical torso (standing)', () => {
    const pose = makePose({
      left_shoulder: { x: 100, y: 100 },
      right_shoulder: { x: 100, y: 100 },
      left_hip: { x: 100, y: 200 },
      right_hip: { x: 100, y: 200 },
    });
    expect(torsoInclination(pose)).toBeCloseTo(90, 0);
  });
});
