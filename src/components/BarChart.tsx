import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { buildBarChart } from '../core/stats/charts';
import { DailyPoint } from '../data/aggregate';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './Typography';

interface BarChartProps {
  data: DailyPoint[];
  height?: number;
}

/** A minimal reps-per-day bar chart. Layout math lives in `buildBarChart`. */
export function BarChart({ data, height = 140 }: BarChartProps) {
  const theme = useTheme();
  const [width, setWidth] = React.useState(0);
  const values = data.map((d) => d.reps);
  const bars = buildBarChart({ values, width, height, gap: 4, topPadding: 8 });
  const maxReps = Math.max(...values, 0);

  return (
    <View style={{ gap: 8 }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {bars.map((b) => (
              <Rect
                key={b.index}
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                rx={3}
                fill={values[b.index]! > 0 ? theme.colors.accent : theme.colors.track}
              />
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" muted>
          {data[0]?.day.slice(5) ?? ''}
        </AppText>
        <AppText variant="caption" muted>
          peak {maxReps}
        </AppText>
        <AppText variant="caption" muted>
          {data[data.length - 1]?.day.slice(5) ?? ''}
        </AppText>
      </View>
    </View>
  );
}
