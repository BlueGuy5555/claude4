import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, darkTheme, lightTheme } from './themes';
import { useSettings } from '../context/SettingsContext';

const ThemeContext = createContext<Theme>(darkTheme);

/**
 * Resolves the active theme from the user's preference:
 *   'system' → follow the OS color scheme
 *   'light'  → force the light (white/green) theme
 *   'dark'   → force the dark (black/red) theme
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { prefs } = useSettings();
  const system = useColorScheme();

  const theme = useMemo<Theme>(() => {
    const resolved = prefs.themeMode === 'system' ? (system ?? 'dark') : prefs.themeMode;
    return resolved === 'light' ? lightTheme : darkTheme;
  }, [prefs.themeMode, system]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
