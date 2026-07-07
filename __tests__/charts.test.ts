import { buildBarChart } from '../src/core/stats/charts';

describe('buildBarChart', () => {
  it('returns nothing for empty input', () => {
    expect(buildBarChart({ values: [], width: 100, height: 50 })).toEqual([]);
  });

  it('scales the tallest bar to fill the usable height', () => {
    const bars = buildBarChart({ values: [0, 5, 10], width: 100, height: 100, gap: 0, topPadding: 0 });
    expect(bars).toHaveLength(3);
    expect(bars[2]!.height).toBeCloseTo(100);
    expect(bars[1]!.height).toBeCloseTo(50);
    expect(bars[0]!.height).toBeCloseTo(0);
  });

  it('positions bars left-to-right with gaps', () => {
    const bars = buildBarChart({ values: [1, 1], width: 100, height: 50, gap: 10, topPadding: 0 });
    expect(bars[0]!.x).toBe(0);
    expect(bars[0]!.width).toBeCloseTo(45);
    expect(bars[1]!.x).toBeCloseTo(55);
  });

  it('keeps bars within the canvas height (y >= 0)', () => {
    const bars = buildBarChart({ values: [3, 7, 2], width: 60, height: 40 });
    for (const b of bars) {
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.height).toBeLessThanOrEqual(40 + 1e-9);
    }
  });
});
