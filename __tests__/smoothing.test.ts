import { Ema } from '../src/core/pose/smoothing';

describe('Ema', () => {
  it('returns the first sample unchanged', () => {
    const ema = new Ema(0.5);
    expect(ema.next(10)).toBe(10);
  });

  it('blends toward new samples', () => {
    const ema = new Ema(0.5);
    ema.next(0);
    expect(ema.next(10)).toBe(5);
    expect(ema.next(10)).toBe(7.5);
  });

  it('with alpha=1 tracks the raw value exactly', () => {
    const ema = new Ema(1);
    ema.next(3);
    expect(ema.next(9)).toBe(9);
  });

  it('rejects invalid alpha', () => {
    expect(() => new Ema(0)).toThrow();
    expect(() => new Ema(1.5)).toThrow();
  });

  it('resets its state', () => {
    const ema = new Ema(0.5);
    ema.next(100);
    ema.reset();
    expect(ema.current).toBeUndefined();
    expect(ema.next(20)).toBe(20);
  });
});
