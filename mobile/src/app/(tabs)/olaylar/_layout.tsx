import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { stackSecenekleri } from '@/theme/stack-secenekleri';

/**
 * Olaylar sekmesinin `Stack`i — şimdilik tek ekran.
 *
 * Alt ekranı olmasa da `Stack` var: başlık **sistemin** büyük başlığı olsun diye.
 * Elle çizilen bir başlık kaydırınca ekrandan çıkar ve yerini alacak standart başlık
 * olmaz; sistem başlığı küçülerek çubukta kalır ve Liquid Glass'ı da kendisi uygular
 * (`toolbars.md › Phone (iOS)`: "Use a large title to help people stay oriented as they
 * navigate and scroll. By default, a large title transitions to a standard title as
 * people begin scrolling the content").
 */
export default function OlaylarLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={stackSecenekleri(colors, 'Olaylar')}>
      <Stack.Screen name="index" options={{ title: 'Olaylar' }} />
    </Stack>
  );
}
