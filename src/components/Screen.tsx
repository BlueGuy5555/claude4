import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

/** Themed page container that handles safe-area insets and the status bar. */
export function Screen({ children, scroll = true, padded = true, style }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const base: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };
  const contentStyle: ViewStyle = {
    paddingTop: insets.top + (padded ? 12 : 0),
    paddingBottom: insets.bottom + 24,
    paddingHorizontal: padded ? 20 : 0,
  };

  return (
    <View style={base}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[contentStyle, style]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle, style]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
