import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';

/**
 * Kimlik akışı. Bu gruptaki ekranlarda **alt sekme çubuğu yoktur** —
 * uygulama henüz açılmamıştır (CLAUDE.md §7.1).
 */
export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        // Geri gidip kilidi atlamak mümkün olmasın.
        gestureEnabled: false,
      }}>
      <Stack.Screen name="kurulum" />
      <Stack.Screen name="kilit" />
      <Stack.Screen name="giris" />
      <Stack.Screen name="dogrulama" />
      <Stack.Screen name="eslestirme" />
    </Stack>
  );
}
