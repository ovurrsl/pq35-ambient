import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { stackSecenekleri } from '@/theme/stack-secenekleri';

/**
 * Bölgeler sekmesinin kendi `Stack`i.
 *
 * NEDEN VAR: bölge detayı eskiden kök `Stack`te, yani sekme çubuğunun **kardeşi**
 * olarak duruyordu; itildiğinde gerçek `UITabBar`'ın üstünü kapatıyordu. HIG bunu
 * açıkça yasaklıyor (`tab-bars.md › Best practices`): "Make sure the tab bar is
 * visible when people navigate to different sections of your app. If you hide the
 * tab bar, people can forget which area of the app they're in."
 *
 * Detay ekranı artık sekmenin içinde; çubuk yerinde kalıyor ve geri kaydırma da
 * sekme bağlamını koruyor.
 *
 * Kök ekranın büyük başlığı **sistemin**: "Ambiyans" (kanvas AppZonlar.dc.html; sekme
 * etiketi "Bölgeler", başlık "Ambiyans" — kanvas böyle istiyor, CLAUDE.md §9.1). Elle
 * çizilen başlık kaydırınca ekrandan çıkıyordu ve yerini alacak standart başlık yoktu.
 */
export default function BolgelerLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={stackSecenekleri(colors, 'Bölgeler')}>
      <Stack.Screen name="index" options={{ title: 'Ambiyans' }} />
      <Stack.Screen name="[id]" options={{ title: 'Bölge' }} />
    </Stack>
  );
}
