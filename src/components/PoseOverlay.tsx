import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';
import { Pose, KeypointName, getKeypoint } from '../core/pose/types';
import { useTheme } from '../theme/ThemeProvider';

/** The bones we draw, as pairs of keypoint names. */
const SKELETON: Array<[KeypointName, KeypointName]> = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

interface PoseOverlayProps {
  pose: Pose | undefined;
  /** Coordinate space the pose keypoints live in. */
  sourceWidth: number;
  sourceHeight: number;
  /** On-screen size to scale the skeleton into. */
  width: number;
  height: number;
  minScore?: number;
  /** Mirror horizontally (front camera). */
  mirror?: boolean;
}

export function PoseOverlay({
  pose,
  sourceWidth,
  sourceHeight,
  width,
  height,
  minScore = 0.3,
  mirror = false,
}: PoseOverlayProps) {
  const theme = useTheme();
  if (!pose) return null;

  const sx = width / sourceWidth;
  const sy = height / sourceHeight;
  const project = (x: number, y: number) => ({
    x: mirror ? width - x * sx : x * sx,
    y: y * sy,
  });

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
      {SKELETON.map(([a, b], i) => {
        const ka = getKeypoint(pose, a);
        const kb = getKeypoint(pose, b);
        if (!ka || !kb || ka.score < minScore || kb.score < minScore) return null;
        const pa = project(ka.x, ka.y);
        const pb = project(kb.x, kb.y);
        return (
          <Line
            key={`bone-${i}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={theme.colors.accent}
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}
      {pose.keypoints.map((k, i) =>
        k.score < minScore ? null : (
          <Circle
            key={`kp-${i}`}
            {...(() => {
              const p = project(k.x, k.y);
              return { cx: p.x, cy: p.y };
            })()}
            r={5}
            fill={theme.colors.accentSoft}
          />
        ),
      )}
    </Svg>
  );
}
