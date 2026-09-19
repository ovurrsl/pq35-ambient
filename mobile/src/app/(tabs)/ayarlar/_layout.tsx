import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { stackSecenekleri } from '@/theme/stack-secenekleri';

/**
 * Ayarlar sekmesinin `Stack`i — Güvenlik ve Cihazlar (CLAUDE.md §7.1).
 *
 * Bu `Stack` eskiden kök `Stack`in altındaydı, yani sekme çubuğunun kardeşiydi;
 * Güvenlik'e girildiğinde çubuk kapanıyordu. Artık sekmenin içinde
 * (`tab-bars.md › Best practices`).
 */
export default function AyarlarLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={stackSecenekleri(colors, 'Ayarlar')}>
      <Stack.Screen name="index" options={{ title: 'Ayarlar' }} />
      <Stack.Screen name="guvenlik" options={{ title: 'Güvenlik' }} />
      <Stack.Screen name="cihazlar" options={{ title: 'Cihazlar' }} />
    </Stack>
  );
}
