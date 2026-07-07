/**
 * On-device pose detection with MoveNet (SinglePose Lightning) running through
 * TensorFlow.js and the React Native backend.
 *
 * MoveNet Lightning is a small, fast model tuned for real-time single-person
 * pose estimation on mobile — exactly our use case. Everything runs locally on
 * the GPU/CPU via `tfjs-react-native`; no frame is ever uploaded anywhere,
 * which is what lets RepCam work fully offline with no backend.
 *
 * The `estimate` input is a 3-D image tensor ([height, width, 3]) produced by
 * tfjs-react-native's `cameraWithTensors` stream (see WorkoutScreen). We
 * dispose that tensor after each inference to avoid leaking GPU memory.
 */
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Pose, KeypointName } from '../../core/pose/types';
import { PoseProvider } from './PoseProvider';

export class MoveNetPoseProvider implements PoseProvider {
  readonly id = 'movenet-lightning';
  private detector: poseDetection.PoseDetector | undefined;
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    await tf.ready();
    this.detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    });
    this.ready = true;
  }

  async estimate(input: unknown): Promise<Pose | undefined> {
    if (!this.detector) return undefined;
    const tensor = input as tf.Tensor3D;
    try {
      const poses = await this.detector.estimatePoses(
        tensor as unknown as poseDetection.PoseDetectorInput,
        { flipHorizontal: false },
      );
      const first = poses[0];
      if (!first) return undefined;
      return {
        score: first.score,
        keypoints: first.keypoints.map((k) => ({
          x: k.x,
          y: k.y,
          score: k.score ?? 0,
          name: (k.name ?? 'nose') as KeypointName,
        })),
      };
    } finally {
      // The camera stream hands us a fresh tensor each frame; free it.
      tf.dispose(tensor);
    }
  }

  async dispose(): Promise<void> {
    this.detector?.dispose();
    this.detector = undefined;
    this.ready = false;
  }
}
