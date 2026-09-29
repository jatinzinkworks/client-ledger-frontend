import '../global.css';

import { configureApi } from '@cl/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { ThemeRoot } from '@/theme/ThemeRoot';
import { API_BASE_URL } from '@/utils/config';

configureApi({ baseUrl: API_BASE_URL });

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeRoot>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeRoot>
    </QueryClientProvider>
  );
}
