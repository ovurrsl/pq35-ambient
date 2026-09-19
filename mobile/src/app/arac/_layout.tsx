import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { FONTS } from '@/theme/tokens';

/**
 * Araç sekmesinin alt ekranları.
 *
 * Segment üçtür: Canlı · Sürüşler · Konum. Performans, Canlı'nın içinden açılan bir
 * ekrandır; İletişim ise segmentte değil, başlık çubuğundaki telefon düğmesidir —
 * arama telemetri değil, bir eylemdir (CLAUDE.md §3.4).
 */
export default function AracLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerBackTitle: 'Araç',
        headerTintColor: colors.accent,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { ...FONTS.bodySemiBold, color: colors.text },
        headerLargeTitleStyle: { ...FONTS.display, color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="konum" options={{ title: 'Konum' }} />
      <Stack.Screen name="surusler" options={{ title: 'Sürüşler' }} />
      <Stack.Screen name="surus/[id]" options={{ title: 'Sürüş', headerBackTitle: 'Sürüşler' }} />
      <Stack.Screen name="performans" options={{ title: 'Performans' }} />
      <Stack.Screen name="iletisim" options={{ title: 'İletişim' }} />
    </Stack>
  );
}
