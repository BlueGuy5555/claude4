/**
 * A very small typed wrapper around AsyncStorage.
 *
 * RepCam has no backend: everything the user creates (workout history, prefs,
 * their purchase entitlement) lives in the device's key-value store. This helper
 * centralizes JSON (de)serialization and swallows read errors into a fallback so
 * a corrupt value can never crash the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const StorageKeys = {
  sessions: 'repcam.sessions.v1',
  preferences: 'repcam.preferences.v1',
  entitlement: 'repcam.entitlement.v1',
} as const;
