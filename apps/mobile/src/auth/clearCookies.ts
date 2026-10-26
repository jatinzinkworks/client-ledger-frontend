import { Platform } from 'react-native';
// React Native exposes cookie clearing only on its networking module (no public export).
import RCTNetworking from 'react-native/Libraries/Network/RCTNetworking';

/** Drops every cookie the native HTTP stack holds (e.g. one IAP set). Resolves even on failure. */
export function clearCookies(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  return new Promise((resolve) => {
    try {
      RCTNetworking.clearCookies(() => resolve());
    } catch {
      resolve();
    }
  });
}
