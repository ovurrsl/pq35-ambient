import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, usePathname, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { BleProvider } from '@/state/ble-context';
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
/** Sekme ağacının kökleri. Bunların dışındaki bir yol, oturum açıkken geçerli değildir. */
const SEKME_YOLLARI = ['/bolgeler', '/olaylar', '/arac', '/sahneler', '/ayarlar'] as const;

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
    } else if (durum.ad === 'acik' || durum.ad === 'cevrimdisi') {
      /**
       * Sekmelerin DIŞINDAKİ her yoldan sekmelere dön — yalnızca kimlik akışından değil.
       *
       * Eskiden koşul `if (kimlikAkisinda)` idi ve bu, `/` kaybolunca uygulamayı
       * kilitledi: açılışta gelinen `/` ne bir sekme ne de bir kimlik ekranıydı, bu
       * yüzden hiçbir yönlendirme tetiklenmiyor ve kullanıcı "Unmatched Route"ta
       * kalıyordu. Artık eşleşmeyen herhangi bir yol da buraya düşüyor.
       */
      const sekmelerde = SEKME_YOLLARI.some((y) => pathname.startsWith(y));
      if (!sekmelerde && !pathname.startsWith('/onay')) {
        router.replace('/(tabs)/bolgeler');
      }
    } else if (durum.ad === 'kilitli' || durum.ad === 'cevrimdisi-kilitli') {
      if (!pathname.startsWith('/kilit')) router.replace('/(auth)/kilit');
    } else if (!kimlikAkisinda) {
      router.replace('/(auth)/giris');
    }
  }, [durum, pathname, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      {/*
        İki detent: grabber artık gerçekten bir şey yapıyor. Tek detent'te grabber,
        değiştiremeyeceği bir sürükleme ve döngüleyeceği ikinci bir durak olmayan bir
        dokunma vaat ediyordu (`sheets.md`: "Include a grabber in a resizable sheet. A
        grabber shows people that they can drag the sheet to resize it; they can also tap
        it to cycle through the detents.").
        Vazgeç ekranın kendi `headerLeft`inde — HIG onu başlığın sol kenarında istiyor.
      */}
      <Stack.Screen
        name="onay"
        options={{
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.6, 1.0],
        }}
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
            <BleProvider>
              <Chrome />
            </BleProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
