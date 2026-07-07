import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Pose } from '../../core/pose/types';
import { ExerciseId } from '../../core/reps/types';
import { EXERCISES } from '../../core/reps/exercises';
import { MockPoseProvider } from '../../services/pose/MockPoseProvider';
import { PoseOverlay } from '../../components/PoseOverlay';
import { AppText } from '../../components/Typography';
import { useTheme } from '../../theme/ThemeProvider';

// The mock provider emits poses in this coordinate space.
const SRC_WIDTH = 200;
const SRC_HEIGHT = 360;

interface DemoPoseViewProps {
  exerciseId: ExerciseId;
  pose: Pose | undefined;
  onPose: (pose: Pose) => void;
}

/**
 * Demo / fallback view: instead of a camera, it animates a synthetic skeleton
 * performing the selected exercise so the full counting pipeline can be tried
 * without a device or camera permission.
 */
export function DemoPoseView({ exerciseId, pose, onPose }: DemoPoseViewProps) {
  const theme = useTheme();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const providerRef = useRef<MockPoseProvider>(new MockPoseProvider(EXERCISES[exerciseId]));

  useEffect(() => {
    providerRef.current.setExercise(EXERCISES[exerciseId]);
  }, [exerciseId]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (!active) return;
      const p = await providerRef.current.estimate(undefined);
      if (p) onPose(p);
    };
    const interval = setInterval(tick, 33); // ~30 fps
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [onPose]);

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}
      onLayout={(e) => setLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <View
        style={{
          position: 'absolute',
          top: 12,
          alignSelf: 'center',
          backgroundColor: theme.colors.scrim,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        }}
      >
        <AppText variant="caption">DEMO — synthetic movement</AppText>
      </View>
      {layout.width > 0 ? (
        <PoseOverlay
          pose={pose}
          sourceWidth={SRC_WIDTH}
          sourceHeight={SRC_HEIGHT}
          width={layout.width}
          height={layout.height}
        />
      ) : null}
    </View>
  );
}
