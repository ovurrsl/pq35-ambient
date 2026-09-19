import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { FONTS } from '@/theme/tokens';

/** Egzoz — Bölgeler sekmesinden açılır, Kontrolcü B'de yaşar. */
export default function EgzozLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerBackTitle: 'Bölgeler',
        headerTintColor: colors.accent,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { ...FONTS.bodySemiBold, color: colors.text },
        headerLargeTitleStyle: { ...FONTS.display, color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="index" options={{ title: 'Egzoz' }} />
    </Stack>
  );
}
