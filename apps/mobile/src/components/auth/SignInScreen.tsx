import { LogIn } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/LoadState';
import { useThemeColors } from '@/theme/useThemeColors';

/** Shown instead of the app until the user has signed in with Google. */
export function SignInScreen() {
  const { status, signingIn, error, signIn } = useAuth();
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="items-center gap-3">
          <LogIn color={colors.primary} size={40} />
          <Text className="text-2xl font-bold text-foreground">Client Ledger</Text>
          <Text className="text-center text-sm text-muted-foreground">
            Sign In With Your Google Account To Continue.
          </Text>
        </View>

        {status === 'checking' ? (
          <Loading />
        ) : (
          <View className="gap-3">
            <Button
              label={signingIn ? 'Signing In…' : 'Sign In With Google'}
              disabled={signingIn}
              onPress={signIn}
            />
            {error && <Text className="text-center text-sm text-destructive">{error}</Text>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
