import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './Typography';
import { EXERCISE_LIST } from '../core/reps/exercises';
import { ExerciseId } from '../core/reps/types';

interface ExerciseGridProps {
  selected: ExerciseId | undefined;
  onSelect: (id: ExerciseId) => void;
  /** Ids that are locked behind the one-time purchase. */
  lockedIds: Set<ExerciseId>;
  disabled?: boolean;
}

export function ExerciseGrid({ selected, onSelect, lockedIds, disabled = false }: ExerciseGridProps) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {EXERCISE_LIST.map((ex) => {
        const isSelected = ex.id === selected;
        const locked = lockedIds.has(ex.id);
        return (
          <Pressable
            key={ex.id}
            onPress={() => onSelect(ex.id)}
            disabled={disabled}
            style={{
              width: '31%',
              minWidth: 100,
              flexGrow: 1,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? theme.colors.accent : theme.colors.border,
              backgroundColor: isSelected ? theme.colors.surfaceAlt : theme.colors.surface,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText style={{ fontSize: 24 }}>{ex.emoji}</AppText>
              {locked ? <AppText style={{ fontSize: 13 }}>🔒</AppText> : null}
            </View>
            <AppText variant="caption" style={{ marginTop: 8 }} numberOfLines={1}>
              {ex.name}
            </AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {ex.muscle.replace('_', ' ')}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
