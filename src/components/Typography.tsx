import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'stat';

const SIZES: Record<Variant, TextStyle> = {
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '700' },
  subheading: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '500' },
  stat: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
};

interface AppTextProps {
  children: React.ReactNode;
  variant?: Variant;
  muted?: boolean;
  accent?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function AppText({
  children,
  variant = 'body',
  muted = false,
  accent = false,
  style,
  numberOfLines,
}: AppTextProps) {
  const theme = useTheme();
  const color = accent ? theme.colors.accent : muted ? theme.colors.textMuted : theme.colors.text;
  return (
    <Text numberOfLines={numberOfLines} style={[SIZES[variant], { color }, style]}>
      {children}
    </Text>
  );
}
