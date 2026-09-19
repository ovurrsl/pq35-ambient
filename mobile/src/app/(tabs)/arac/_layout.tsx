import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { stackSecenekleri } from '@/theme/stack-secenekleri';

/**
 * Araç sekmesinin `Stack`i.
 *
 * Segment üçtür: Canlı · Sürüşler · Konum. Performans, Canlı'nın içinden açılan bir
 * ekrandır; İletişim ise segmentte değil, başlık çubuğundaki telefon düğmesidir —
 * arama telemetri değil, bir eylemdir (CLAUDE.md §3.4).
 *
 * Egzoz ve hava süspansiyon da burada: ikisi de **Kontrolcü B** sistemi (CLAUDE.md
 * §3.3), yani ambiyans değil araç tarafı. Eskiden Bölgeler ekranındaki "ARAÇ
 * SİSTEMLERİ" kartından kök `Stack`e itiliyorlardı ve sekme çubuğunu kapatıyorlardı.
 *
 * `hava/` altında `_layout` **yok**: alt klasör kendi navigatörünü açmadığı için üç
 * ekran da bu `Stack`in ekranı olarak kalıyor. İkinci bir `Stack` ikinci bir başlık
 * çubuğu demekti.
 */
export default function AracLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={stackSecenekleri(colors, 'Araç')}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="konum" options={{ title: 'Konum' }} />
      <Stack.Screen name="surusler" options={{ title: 'Sürüşler' }} />
      <Stack.Screen name="surus/[id]" options={{ title: 'Sürüş', headerBackTitle: 'Sürüşler' }} />
      <Stack.Screen name="performans" options={{ title: 'Performans' }} />
      <Stack.Screen name="iletisim" options={{ title: 'İletişim' }} />
      <Stack.Screen name="egzoz" options={{ title: 'Egzoz' }} />
      <Stack.Screen name="hava/index" options={{ title: 'Hava süspansiyon' }} />
      <Stack.Screen
        name="hava/hafiza"
        options={{ title: 'Hafıza ve ayarlar', headerBackTitle: 'Hava' }}
      />
      <Stack.Screen
        name="hava/denge"
        options={{ title: 'Denge ve kurulum', headerBackTitle: 'Hava' }}
      />
    </Stack>
  );
}
