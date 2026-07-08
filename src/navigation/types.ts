import { ExerciseId } from '../core/reps/types';

export type RootStackParamList = {
  Tabs: undefined;
  Session: { exerciseId: ExerciseId; autoDetect: boolean };
  Paywall: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Statistics: undefined;
  Settings: undefined;
};
