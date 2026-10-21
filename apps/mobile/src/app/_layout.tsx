import '../global.css';

import { configureApi } from '@cl/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { authHeaders, configureGoogleSignIn } from '@/auth/googleAuth';
import { SignInScreen } from '@/components/auth/SignInScreen';
import { FinancialYearProvider } from '@/financialYear/FinancialYearProvider';
import { ThemeRoot } from '@/theme/ThemeRoot';
import { API_BASE_URL, AUTH_ENABLED } from '@/utils/config';

if (AUTH_ENABLED) configureGoogleSignIn();
configureApi({ baseUrl: API_BASE_URL, ...(AUTH_ENABLED ? { getHeaders: authHeaders } : {}) });

const queryClient = new QueryClient();

/** The app once signed in; the sign-in screen until then. */
function AppStack() {
  const { status } = useAuth();
  if (status !== 'signedIn') return <SignInScreen />;
  return <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: 'minimal' }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FinancialYearProvider>
          <ThemeRoot>
            <AppStack />
          </ThemeRoot>
        </FinancialYearProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
