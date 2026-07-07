import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from './SettingsContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { EntitlementProvider } from './EntitlementContext';
import { HistoryProvider } from './HistoryContext';

/**
 * Composes every app-wide provider in the right order:
 *   Settings → Theme (reads settings) → Entitlement → History.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <EntitlementProvider>
            <HistoryProvider>{children}</HistoryProvider>
          </EntitlementProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
