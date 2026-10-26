import { versionLabel } from '@cl/schemas';
import { Text } from 'react-native';

// Read from app.json itself, bundled with the JavaScript, rather than `Constants.expoConfig`:
// that is a copy made when the native app was last built, so a development build made under an
// older version keeps showing it. In a release build both are the same.
import appJson from '../../../app.json';

/** The release version from app.json (`expo.version`), at the foot of Settings. */
export function AppVersion() {
  const { version } = appJson.expo;
  if (!version) return null;
  return <Text className="text-center text-xs text-muted-foreground">{versionLabel(version)}</Text>;
}
