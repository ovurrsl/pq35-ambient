import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { FONTS } from '@/theme/tokens';

/** Araç sekmesinin alt ekranları — segment kontrolünün diğer iki sekmesi. */
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
        headerTitleStyle: { fontFamily: FONTS.bodySemiBold, color: colors.text },
        headerLargeTitleStyle: { fontFamily: FONTS.display, color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="konum" options={{ title: 'Konum' }} />
      <Stack.Screen name="iletisim" options={{ title: 'İletişim' }} />
    </Stack>
  );
}
