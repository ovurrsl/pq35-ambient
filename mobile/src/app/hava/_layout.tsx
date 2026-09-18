import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { FONTS } from '@/theme/tokens';

/** Hava süspansiyon — Bölgeler sekmesinden açılır, Kontrolcü B'de yaşar. */
export default function HavaLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerBackTitle: 'Geri',
        headerTintColor: colors.accent,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontFamily: FONTS.bodySemiBold, color: colors.text },
        headerLargeTitleStyle: { fontFamily: FONTS.display, color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="index" options={{ title: 'Hava süspansiyon' }} />
      <Stack.Screen name="hafiza" options={{ title: 'Hafıza ve ayarlar' }} />
      <Stack.Screen name="denge" options={{ title: 'Denge ve kurulum' }} />
    </Stack>
  );
}
