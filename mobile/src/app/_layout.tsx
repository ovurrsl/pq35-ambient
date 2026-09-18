import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, usePathname, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/state/auth-context';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

/**
 * Kimlik durumuna göre yönlendirme.
 * Kilitli veya çıkış yapılmış hâlde (tabs) grubuna girilemez.
 */
function AuthGate() {
  const { durum } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (durum.ad === 'baslatiliyor') return;

    // Kimlik akışı ekranları: kilit, giris, dogrulama, eslestirme.
    const kimlikAkisinda = pathname.startsWith('/kurulum')
      || pathname.startsWith('/kilit')
      || pathname.startsWith('/giris')
      || pathname.startsWith('/dogrulama')
      || pathname.startsWith('/eslestirme');

    if (durum.ad === 'yapilandirma-gerekli') {
      if (!pathname.startsWith('/kurulum')) router.replace('/(auth)/kurulum');
    } else if (durum.ad === 'acik') {
      if (kimlikAkisinda) router.replace('/(tabs)');
    } else if (durum.ad === 'kilitli') {
      if (!pathname.startsWith('/kilit')) router.replace('/(auth)/kilit');
    } else if (!kimlikAkisinda) {
      router.replace('/(auth)/giris');
    }
  }, [durum, pathname, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="hava" />
      <Stack.Screen name="egzoz" />
      <Stack.Screen
        name="onay"
        options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.8] }}
      />
    </Stack>
  );
}

function Chrome() {
  const { scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AuthGate />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Chrome />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
