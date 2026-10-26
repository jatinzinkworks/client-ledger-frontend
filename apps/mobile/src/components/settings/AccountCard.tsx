import { SIGN_OUT_LABEL } from '@cl/schemas';
import { LogOut } from 'lucide-react-native';
import { Alert, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { useThemeColors } from '@/theme/useThemeColors';

/** Who is signed in, with Sign Out (asks first). Nothing when sign-in is off. */
export function AccountCard() {
  const { user, signOut } = useAuth();
  const colors = useThemeColors();
  if (!user) return null;

  const confirmSignOut = () =>
    Alert.alert('Sign Out?', 'You will need to sign in with Google again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: SIGN_OUT_LABEL, style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <Card>
      <View className="gap-1">
        <CardTitle>Account</CardTitle>
        <CardDescription>Signed In With Google.</CardDescription>
      </View>
      <View className="gap-0.5">
        {user.name ? <Text className="font-bold text-card-foreground">{user.name}</Text> : null}
        <Text className="text-sm text-muted-foreground">{user.email}</Text>
      </View>
      <Button
        variant="destructive"
        label={SIGN_OUT_LABEL}
        icon={<LogOut color={colors.destructive} size={18} />}
        onPress={confirmSignOut}
      />
    </Card>
  );
}
