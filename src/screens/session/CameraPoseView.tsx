import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { Pose } from '../../core/pose/types';
import { ExerciseId } from '../../core/reps/types';
import { EXERCISES } from '../../core/reps/exercises';
import { MockPoseProvider } from '../../services/pose/MockPoseProvider';
import { AppText } from '../../components/Typography';
import { useTheme } from '../../theme/ThemeProvider';

interface CameraPoseViewProps {
  exerciseId: ExerciseId;
  /** Feed a pose into the rep session (drives the counter). */
  onPose: (pose: Pose) => void;
  /** Called if the camera fails to mount so the caller can fall back to demo. */
  onError: (message: string) => void;
  facing: CameraType;
}

/**
 * Live camera preview for the workout session.
 *
 * On-device pose detection is intentionally *not* wired up yet (see the
 * placeholder banner below). To keep the whole UI — the rep counter, the finish
 * flow, history and stats — functional in the meantime, we drive a temporary
 * synthetic "mover" ({@link MockPoseProvider}) on a fixed interval and push its
 * poses into the rep session. The real camera frames are shown purely as a
 * preview; they are not analysed.
 *
 * When pose detection lands, the only change needed here is to replace the
 * synthetic interval with real frame analysis and forward the detected pose.
 */
export function CameraPoseView({ exerciseId, onPose, onError, facing }: CameraPoseViewProps) {
  const theme = useTheme();
  const providerRef = useRef<MockPoseProvider>(new MockPoseProvider(EXERCISES[exerciseId]));

  // Keep the synthetic mover in sync with the selected exercise.
  useEffect(() => {
    providerRef.current.setExercise(EXERCISES[exerciseId]);
  }, [exerciseId]);

  // TEMPORARY: synthesize movement (~30 fps) so the fake rep counter ticks up.
  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (!active) return;
      const pose = await providerRef.current.estimate(undefined);
      if (pose) onPose(pose);
    };
    const interval = setInterval(tick, 33);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [onPose]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        onMountError={(e) => onError(e?.message ?? 'Camera failed to start.')}
      />

      {/* Placeholder banner — pose detection is deferred to a later milestone. */}
      <View style={styles.bannerWrap} pointerEvents="none">
        <View style={[styles.banner, { backgroundColor: theme.colors.scrim }]}>
          <AppText variant="subheading" style={styles.bannerText}>
            Pose Detection will be implemented later.
          </AppText>
          <AppText variant="caption" muted style={styles.bannerText}>
            The rep counter below is temporary and simulated.
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 6,
    maxWidth: 320,
  },
  bannerText: {
    textAlign: 'center',
  },
});
