import { NativeTabs, NativeTabTrigger } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/theme/theme-provider';

/**
 * Alt sekme çubuğu — 5 sekme, değişmez (CLAUDE.md §7.1):
 *   Bölgeler · Olaylar · Araç · Sahneler · Ayarlar
 *
 * `NativeTabs` gerçek bir `UITabBar` kullanır; iOS 26'da Liquid Glass'ı sistem kendisi
 * uygular ve içerik altından kayarken çubuk buna tepki verir. Bunu elle taklit etmek
 * (kendi blur'ümüzü çizmek) hem yanlış görünür hem de Şeffaflığı Azalt gibi erişilebilirlik
 * ayarlarını es geçer.
 *
 * `minimizeBehavior="onScrollDown"` iOS 26'nın aşağı kaydırırken çubuğu küçültme
 * davranışıdır; eski sürümlerde yok sayılır.
 */
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.accent} minimizeBehavior="onScrollDown">
      <NativeTabTrigger name="index">
        <NativeTabTrigger.Icon sf={{ default: 'light.panel', selected: 'light.panel.fill' }} />
        <NativeTabTrigger.Label>Bölgeler</NativeTabTrigger.Label>
      </NativeTabTrigger>

      <NativeTabTrigger name="olaylar">
        <NativeTabTrigger.Icon sf="bolt" />
        <NativeTabTrigger.Label>Olaylar</NativeTabTrigger.Label>
      </NativeTabTrigger>

      <NativeTabTrigger name="arac">
        <NativeTabTrigger.Icon sf="gauge.with.dots.needle.33percent" />
        <NativeTabTrigger.Label>Araç</NativeTabTrigger.Label>
      </NativeTabTrigger>

      <NativeTabTrigger name="sahneler">
        <NativeTabTrigger.Icon sf="square.stack.3d.up" />
        <NativeTabTrigger.Label>Sahneler</NativeTabTrigger.Label>
      </NativeTabTrigger>

      <NativeTabTrigger name="ayarlar">
        <NativeTabTrigger.Icon sf="gearshape" />
        <NativeTabTrigger.Label>Ayarlar</NativeTabTrigger.Label>
      </NativeTabTrigger>
    </NativeTabs>
  );
}
