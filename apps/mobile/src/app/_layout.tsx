import '../global.css';

import { configureApi } from '@cl/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { View } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { authHeaders, configureGoogleSignIn } from '@/auth/googleAuth';
import { useIdleTimeout } from '@/auth/useIdleTimeout';
import { SignInScreen } from '@/components/auth/SignInScreen';
import { FinancialYearProvider } from '@/financialYear/FinancialYearProvider';
import { ThemePreferenceProvider } from '@/theme/ThemePreferenceProvider';
import { ThemeRoot } from '@/theme/ThemeRoot';
import { API_BASE_URL, AUTH_ENABLED } from '@/utils/config';

if (AUTH_ENABLED) configureGoogleSignIn();
configureApi({ baseUrl: API_BASE_URL, ...(AUTH_ENABLED ? { getHeaders: authHeaders } : {}) });

const queryClient = new QueryClient();

/** The app once signed in; the sign-in screen until then. Signs out after 30 idle minutes. */
function AppStack() {
  const { status, signOut } = useAuth();
  const signedIn = status === 'signedIn';
  const recordActivity = useIdleTimeout(() => void signOut('idle'), AUTH_ENABLED && signedIn);
  if (!signedIn) return <SignInScreen />;
  return (
    // Sees every touch on its way down (returning false leaves it to the touched view).
    <View className="flex-1" onStartShouldSetResponderCapture={() => (recordActivity(), false)}>
      <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: 'minimal' }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FinancialYearProvider>
          <ThemePreferenceProvider>
            <ThemeRoot>
              <AppStack />
            </ThemeRoot>
          </ThemePreferenceProvider>
        </FinancialYearProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
