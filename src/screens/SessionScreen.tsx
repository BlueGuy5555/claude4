import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { AppText } from '../components/Typography';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useHistory } from '../context/HistoryContext';
import { useSettings } from '../context/SettingsContext';
import { useRepSession } from '../hooks/useRepSession';
import { EXERCISES } from '../core/reps/exercises';
import { RootStackParamList } from '../navigation/types';
import { CameraPoseView } from './session/CameraPoseView';
import { DemoPoseView } from './session/DemoPoseView';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Session'>;
type SessionRoute = RouteProp<RootStackParamList, 'Session'>;

type Mode = 'camera' | 'demo';

function stateLabel(state: string): string {
  if (state === 'up') return 'Up';
  if (state === 'down') return 'Down';
  return 'Get ready';
}

export function SessionScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<SessionRoute>();
  const { addSession } = useHistory();
  const { prefs } = useSettings();

  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [mode, setMode] = useState<Mode>('demo');
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.back);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  const onRep = useCallback(() => {
    if (prefs.hapticsOn) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [prefs.hapticsOn]);

  const session = useRepSession({
    initialExercise: params.exerciseId,
    autoDetect: params.autoDetect,
    onRep,
  });

  // Decide the initial capture mode once we know the permission state.
  useEffect(() => {
    if (!permission) return;
    if (permission.granted) {
      setMode('camera');
    } else if (permission.canAskAgain) {
      requestPermission().then((res) => {
        setMode(res.granted ? 'camera' : 'demo');
        if (!res.granted) setNotice('Camera access denied — showing demo mode.');
      });
    } else {
      setMode('demo');
      setNotice('Camera access is off — showing demo mode. Enable it in system settings.');
    }
  }, [permission, requestPermission]);

  // Session timer.
  useEffect(() => {
    startedAtRef.current = Date.now();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 500);
    return () => clearInterval(interval);
  }, []);

  const handleCameraError = useCallback((message: string) => {
    setMode('demo');
    setNotice(`Camera unavailable (${message}). Showing demo mode.`);
  }, []);

  const finish = () => {
    const exercise = EXERCISES[session.activeExercise];
    if (session.reps > 0) {
      void addSession({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        exerciseId: session.activeExercise,
        reps: session.reps,
        startedAt: new Date(startedAtRef.current).toISOString(),
        durationMs: Date.now() - startedAtRef.current,
        autoDetected: params.autoDetect,
      });
      Alert.alert('Set saved 💪', `${session.reps} ${exercise.name} logged.`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const mins = Math.floor(elapsed / 60);
  const secs = `${elapsed % 60}`.padStart(2, '0');
  const activeExercise = EXERCISES[session.activeExercise];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Capture area */}
      <View style={{ flex: 1 }}>
        {mode === 'camera' ? (
          <CameraPoseView
            pose={session.lastPose}
            onPose={session.pushPose}
            onError={handleCameraError}
            cameraType={cameraType}
          />
        ) : (
          <DemoPoseView exerciseId={session.activeExercise} pose={session.lastPose} onPose={session.pushPose} />
        )}
      </View>

      {/* Top bar */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: theme.colors.scrim, borderRadius: 999, padding: 10 }}
        >
          <AppText style={{ fontSize: 16 }}>✕</AppText>
        </Pressable>
        <View style={{ backgroundColor: theme.colors.scrim, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
          <AppText variant="subheading">
            {activeExercise.emoji} {activeExercise.name}
            {params.autoDetect ? '  ·  auto' : ''}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {mode === 'camera' ? (
            <Pressable
              onPress={() => setCameraType((t) => (t === CameraType.back ? CameraType.front : CameraType.back))}
              style={{ backgroundColor: theme.colors.scrim, borderRadius: 999, padding: 10 }}
            >
              <AppText style={{ fontSize: 16 }}>🔄</AppText>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setMode((m) => (m === 'camera' ? 'demo' : 'camera'))}
            style={{ backgroundColor: theme.colors.scrim, borderRadius: 999, padding: 10 }}
          >
            <AppText style={{ fontSize: 16 }}>{mode === 'camera' ? '🎬' : '📷'}</AppText>
          </Pressable>
        </View>
      </View>

      {notice ? (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 60,
            left: 16,
            right: 16,
            backgroundColor: theme.colors.scrim,
            borderRadius: 12,
            padding: 10,
          }}
        >
          <AppText variant="caption">{notice}</AppText>
        </View>
      ) : null}

      {/* Bottom HUD */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 16,
          paddingTop: 20,
          paddingHorizontal: 20,
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          gap: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <AppText variant="caption" muted>
              REPS
            </AppText>
            <AppText style={{ fontSize: 72, fontWeight: '800', color: theme.colors.accent, letterSpacing: -2 }}>
              {session.reps}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <View
              style={{
                backgroundColor: session.repState === 'down' ? theme.colors.accent : theme.colors.surfaceAlt,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <AppText
                variant="caption"
                style={{
                  fontWeight: '700',
                  color: session.repState === 'down' ? theme.colors.onAccent : theme.colors.text,
                }}
              >
                {stateLabel(session.repState)}
              </AppText>
            </View>
            <AppText variant="caption" muted>
              ⏱ {mins}:{secs}
            </AppText>
          </View>
        </View>

        {params.autoDetect ? (
          <AppText variant="caption" muted>
            Detecting… confidence {Math.round(session.detectConfidence * 100)}%
          </AppText>
        ) : null}

        <Button label="Finish set" icon="✅" onPress={finish} />
      </View>
    </View>
  );
}
