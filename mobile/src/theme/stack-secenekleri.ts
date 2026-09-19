import type { ThemeColors } from './tokens';
import { FONTS } from './tokens';

/**
 * Sekme içi `Stack`lerin ortak başlık ayarları.
 *
 * Üç sekmenin de (Bölgeler, Araç, Ayarlar) kendi `Stack`i var; başlık ayarlarını üç
 * yerde kopyalamak, birinde değişiklik yapıldığında diğerlerinin sessizce ayrışması
 * demekti. Buradaki tek kaynak onu engelliyor.
 *
 * Başlık **sistemin** büyük başlığıdır, kendi çizdiğimiz bir başlık değil: iOS 26'da
 * Liquid Glass'ı, kaydırınca küçülmeyi ve Şeffaflığı Azalt davranışını sistem kendisi
 * uygular (CLAUDE.md §9.1, madde 4). `headerLargeTitle` ile eşleşmesi için içerik
 * `ScrollView`lerinde `contentInsetAdjustmentBehavior="automatic"` gerekir.
 *
 * Dönüş tipi bilerek yazılmadı: `NativeStackNavigationOptions` yalnızca expo-router'ın
 * `build/` altındaki iç yolundan açılıyor ve o yol sürümle değişir. Çıkarım
 * kullanıldığında tip kontrolü `Stack screenOptions` atamasında zaten yapılıyor.
 */
export function stackSecenekleri(colors: ThemeColors, geriBasligi: string) {
  return {
    headerShown: true,
    headerLargeTitle: true,
    headerBackTitle: geriBasligi,
    headerTintColor: colors.accent,
    headerStyle: { backgroundColor: colors.bg },
    headerTitleStyle: { ...FONTS.bodySemiBold, color: colors.text },
    headerLargeTitleStyle: { ...FONTS.display, color: colors.text },
    contentStyle: { backgroundColor: colors.bg },
  } as const;
}
