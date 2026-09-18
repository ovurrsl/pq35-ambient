import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, TYPE_SCALE } from '@/theme/tokens';

/**
 * Ayarlar alt ekranları — Güvenlik ve Cihazlar (CLAUDE.md §7.1).
 *
 * Başlık burada **sistemin** büyük başlığıdır, kendi çizdiğimiz bir başlık değil:
 * iOS 26'da Liquid Glass'ı, kaydırınca küçülmeyi ve Şeffaflığı Azalt davranışını
 * sistem kendisi uygular. Bunu elle taklit etmek hem yanlış görünür hem erişilebilirlik
 * ayarlarını es geçer (CLAUDE.md §9.1, madde 4).
 */
export default function AyarlarLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerTintColor: colors.accent,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: {
          color: colors.text,
          fontFamily: FONTS.bodySemiBold,
          fontSize: TYPE_SCALE.body + 2,
        },
        headerLargeTitleStyle: {
          color: colors.text,
          fontFamily: FONTS.display,
        },
        headerBackTitle: 'Ayarlar',
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="guvenlik" options={{ title: 'Güvenlik' }} />
      <Stack.Screen name="cihazlar" options={{ title: 'Cihazlar' }} />
    </Stack>
  );
}
