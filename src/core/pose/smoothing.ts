/**
 * A tiny exponential-moving-average smoother.
 *
 * Raw joint angles jitter frame-to-frame because pose detection is noisy. Left
 * unsmoothed, that jitter would trip our rep state machine's thresholds and
 * produce phantom reps. An EMA removes most of the noise while adding only a
 * few frames of lag.
 *
 *   smoothed_t = alpha * value_t + (1 - alpha) * smoothed_{t-1}
 *
 * `alpha` in (0, 1]: higher reacts faster (less smoothing), lower is smoother.
 */
export class Ema {
  private value: number | undefined;

  constructor(private readonly alpha: number) {
    if (alpha <= 0 || alpha > 1) {
      throw new Error(`Ema alpha must be in (0, 1], got ${alpha}`);
    }
  }

  next(sample: number): number {
    this.value =
      this.value === undefined ? sample : this.alpha * sample + (1 - this.alpha) * this.value;
    return this.value;
  }

  get current(): number | undefined {
    return this.value;
  }

  reset(): void {
    this.value = undefined;
  }
}
