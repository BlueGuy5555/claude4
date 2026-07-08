import { Pose } from '../../core/pose/types';

/**
 * Abstraction over "something that produces a Pose".
 *
 * The workout screen talks only to this interface, which keeps the UI decoupled
 * from where poses come from. Today the only implementation is
 * {@link MockPoseProvider}, a synthetic generator that drives the temporary rep
 * counter and the demo skeleton. When on-device pose detection is added later,
 * it can implement this same interface without touching any screen code.
 */
export interface PoseProvider {
  /** Load any resources / warm up. Safe to call more than once. */
  init(): Promise<void>;
  /**
   * Estimate a single pose. The `input` shape is provider-specific; the mock
   * provider ignores the input entirely.
   */
  estimate(input: unknown): Promise<Pose | undefined>;
  /** Release any resources. */
  dispose(): Promise<void>;
  readonly id: string;
}
