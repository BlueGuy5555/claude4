/**
 * Pure chart geometry.
 *
 * The Progress screen draws a simple bar chart with `react-native-svg`. Rather
 * than compute bar positions inside the component (hard to test, easy to get
 * off-by-one wrong), we compute the layout here as plain numbers and let the
 * component just map them to <Rect> elements.
 */
export interface BarLayoutInput {
  values: number[];
  width: number;
  height: number;
  gap?: number;
  /** Leave room at the top so the tallest bar doesn't touch the edge. */
  topPadding?: number;
}

export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Original index into `values`. */
  index: number;
}

export function buildBarChart(input: BarLayoutInput): Bar[] {
  const { values, width, height, gap = 2, topPadding = 8 } = input;
  const n = values.length;
  if (n === 0 || width <= 0 || height <= 0) return [];

  const max = Math.max(...values, 1); // avoid divide-by-zero; flat data → tiny bars
  const usableHeight = Math.max(0, height - topPadding);
  const barWidth = Math.max(1, (width - gap * (n - 1)) / n);

  return values.map((v, index) => {
    const clamped = Math.max(0, v);
    const barHeight = (clamped / max) * usableHeight;
    const x = index * (barWidth + gap);
    const y = height - barHeight;
    return { x, y, width: barWidth, height: barHeight, index };
  });
}
