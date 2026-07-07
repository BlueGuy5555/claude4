/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import { Pose } from '../../core/pose/types';
import { MoveNetPoseProvider } from '../../services/pose/MoveNetPoseProvider';
import { PoseOverlay } from '../../components/PoseOverlay';

// MoveNet input resolution. Poses come back in this coordinate space, so the
// overlay is told to treat it as the source dimensions.
const TENSOR_WIDTH = 152;
const TENSOR_HEIGHT = 200;

const TensorCamera = cameraWithTensors(Camera as any);

interface CameraPoseViewProps {
  pose: Pose | undefined;
  onPose: (pose: Pose) => void;
  onError: (message: string) => void;
  cameraType: CameraType;
}

/**
 * Renders the live camera feed and runs MoveNet on each frame. The frame loop
 * pulls image tensors from tfjs-react-native's tensor stream, hands each to the
 * pose provider (which disposes it), and forwards any detected pose upward.
 */
export function CameraPoseView({ pose, onPose, onError, cameraType }: CameraPoseViewProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const providerRef = useRef<MoveNetPoseProvider | null>(null);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const provider = new MoveNetPoseProvider();
    providerRef.current = provider;
    provider
      .init()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => onError(e?.message ?? 'Failed to load the pose model.'));
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      void provider.dispose();
    };
  }, [onError]);

  const handleReady = useMemo(
    () =>
      (images: any) => {
        const loop = async () => {
          const provider = providerRef.current;
          const next = images.next().value;
          if (provider && next) {
            try {
              const detected = await provider.estimate(next);
              if (detected) onPose(detected);
            } catch (e: any) {
              onError(e?.message ?? 'Pose estimation failed.');
              return;
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      },
    [onPose, onError],
  );

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => setLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {ready ? (
        <TensorCamera
          style={{ flex: 1 }}
          type={cameraType}
          cameraTextureHeight={1200}
          cameraTextureWidth={1600}
          resizeHeight={TENSOR_HEIGHT}
          resizeWidth={TENSOR_WIDTH}
          resizeDepth={3}
          onReady={handleReady}
          autorender
          useCustomShadersToResize={false}
        />
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {layout.width > 0 ? (
        <PoseOverlay
          pose={pose}
          sourceWidth={TENSOR_WIDTH}
          sourceHeight={TENSOR_HEIGHT}
          width={layout.width}
          height={layout.height}
          mirror={cameraType === CameraType.front}
        />
      ) : null}
    </View>
  );
}
