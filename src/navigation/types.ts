import { ExerciseId } from '../core/reps/types';

export type RootStackParamList = {
  Tabs: undefined;
  Session: { exerciseId: ExerciseId; autoDetect: boolean };
  Paywall: undefined;
};

export type TabParamList = {
  Home: undefined;
  Progress: undefined;
  Settings: undefined;
};
