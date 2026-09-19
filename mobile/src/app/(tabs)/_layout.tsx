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
 *
 * SEMBOLLER TEK AİLE: beşinin de bir `.fill` seçili varyantı var. Eskiden yalnızca ilk
 * sekmede vardı; Bölgeler'i seçince glif kalınlaşıyor, diğer dördünde yalnızca ton
 * değişiyordu — bitmemiş bir set gibi okunuyordu.
 *
 * Araç sekmesi `gauge.with.dots.needle.33percent` kullanıyordu; o glifin **`.fill`
 * kardeşi yok** (`speedometer` ve `gauge.open…` için de yok), üstelik içindeki iğne
 * konumu ve noktalar komşularından farklı bir detay seviyesi taşıyordu. Yerine `car` /
 * `car.fill`: dolgusu var, sekmenin kendi etiketiyle ("Araç") eşleşiyor.
 *
 * HIG (`icons.md › Best practices`): "Maintain visual consistency across all interface
 * icons in your app… all interface icons in your app need to use a consistent size, level
 * of detail, stroke thickness (or weight), and perspective."
 */
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.accent} minimizeBehavior="onScrollDown">
      <NativeTabTrigger name="bolgeler">
        <NativeTabTrigger.Icon sf={{ default: 'light.panel', selected: 'light.panel.fill' }} />
        <NativeTabTrigger.Label>Bölgeler</NativeTabTrigger.Label>
      </NativeTabTrigger>

      <NativeTabTrigger name="olaylar">
        <NativeTabTrigger.Icon sf={{ default: 'bolt', selected: 'bolt.fill' }} />
        <NativeTabTrigger.Label>Olaylar</NativeTabTrigger.Label>
      </NativeTabTrigger>

      <NativeTabTrigger name="arac">
        <NativeTabTrigger.Icon sf={{ default: 'car', selected: 'car.fill' }} />
        <NativeTabTrigger.Label>Araç</NativeTabTrigger.Label>
      </NativeTabTrigger>

      <NativeTabTrigger name="sahneler">
        <NativeTabTrigger.Icon
          sf={{ default: 'square.stack.3d.up', selected: 'square.stack.3d.up.fill' }}
        />
        <NativeTabTrigger.Label>Sahneler</NativeTabTrigger.Label>
      </NativeTabTrigger>

      <NativeTabTrigger name="ayarlar">
        <NativeTabTrigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <NativeTabTrigger.Label>Ayarlar</NativeTabTrigger.Label>
      </NativeTabTrigger>
    </NativeTabs>
  );
}
