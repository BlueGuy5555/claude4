import React from 'react';
import { View } from 'react-native';
import { Card } from './Card';
import { AppText } from './Typography';

interface StatTileProps {
  label: string;
  value: string | number;
  emoji?: string;
  accent?: boolean;
}

export function StatTile({ label, value, emoji, accent = false }: StatTileProps) {
  return (
    <Card style={{ flex: 1 }}>
      <View style={{ gap: 6 }}>
        {emoji ? <AppText style={{ fontSize: 20 }}>{emoji}</AppText> : null}
        <AppText variant="heading" accent={accent}>
          {value}
        </AppText>
        <AppText variant="caption" muted>
          {label}
        </AppText>
      </View>
    </Card>
  );
}
