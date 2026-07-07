import { Pose } from '../../core/pose/types';

/**
 * Abstraction over "something that turns a camera frame into a Pose".
 *
 * The workout screen talks only to this interface, which lets us plug in either
 * the real on-device MoveNet model or a synthetic generator (for demos, and for
 * environments where the native TF backend isn't available).
 */
export interface PoseProvider {
  /** Load model weights / warm up. Safe to call more than once. */
  init(): Promise<void>;
  /**
   * Estimate a single pose. The `input` shape is provider-specific:
   *   - MoveNet expects a TF tensor (from tfjs-react-native's camera stream).
   *   - The mock provider ignores the input entirely.
   */
  estimate(input: unknown): Promise<Pose | undefined>;
  /** Release native resources. */
  dispose(): Promise<void>;
  readonly id: string;
}
