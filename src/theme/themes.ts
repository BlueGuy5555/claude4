/**
 * The two themes RepCam ships with:
 *
 *   Dark  — near-black background with reddish content/accents.
 *   Light — white background with green content/accents.
 *
 * Every screen and component reads colors from the active {@link Theme} via the
 * `useTheme()` hook, so switching themes recolors the whole app instantly and
 * there are no hard-coded colors scattered around the UI.
 */
export interface ThemeColors {
  /** App background. */
  background: string;
  /** Card / elevated surface. */
  surface: string;
  /** Slightly different surface, e.g. inputs, chart tracks. */
  surfaceAlt: string;
  /** Primary text. */
  text: string;
  /** Secondary / muted text. */
  textMuted: string;
  /** Brand accent — reddish in dark, green in light. */
  accent: string;
  /** A softer variant of the accent for gradients / highlights. */
  accentSoft: string;
  /** Text/icon color that sits on top of the accent color. */
  onAccent: string;
  /** Hairline borders and dividers. */
  border: string;
  /** Neutral track for progress bars / chart backgrounds. */
  track: string;
  /** Positive / success color. */
  success: string;
  /** Warning / destructive color. */
  danger: string;
  /** Scrim behind camera overlays. */
  scrim: string;
}

export interface Theme {
  name: 'dark' | 'light';
  colors: ThemeColors;
  /** True for the dark theme; drives status-bar style, etc. */
  isDark: boolean;
}

export const darkTheme: Theme = {
  name: 'dark',
  isDark: true,
  colors: {
    background: '#0B0B0F',
    surface: '#16161C',
    surfaceAlt: '#20202A',
    text: '#F6F6F8',
    textMuted: '#9A9AA6',
    accent: '#FF3B3B',
    accentSoft: '#FF6B6B',
    onAccent: '#FFFFFF',
    border: '#2A2A34',
    track: '#26262F',
    success: '#3BD07A',
    danger: '#FF5A5A',
    scrim: 'rgba(0,0,0,0.55)',
  },
};

export const lightTheme: Theme = {
  name: 'light',
  isDark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#F4F8F4',
    surfaceAlt: '#E9F2EA',
    text: '#0E1A12',
    textMuted: '#5C6B60',
    accent: '#16A34A',
    accentSoft: '#22C55E',
    onAccent: '#FFFFFF',
    border: '#DBE7DD',
    track: '#E4EFE5',
    success: '#16A34A',
    danger: '#DC2626',
    scrim: 'rgba(255,255,255,0.65)',
  },
};
