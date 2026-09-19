import { Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/theme/theme-provider';
import { HIT_SIZE } from '@/theme/tokens';

/**
 * İletişim düğmesi — başlık çubuğunun sağ kenarında.
 *
 * NEDEN BAŞLIKTA: arama araç telemetrisi değil, bir eylemdir; bu yüzden segment
 * kontrolünde değil (CLAUDE.md §3.4). Eskiden ekranın kaydırılabilir içeriğinin içindeydi
 * ve başlık bloğuyla birlikte yukarı kayıp gözden kayboluyordu — yani İletişim ekranının
 * tek girişi, listenin başına dönülmeden erişilemez hâle geliyordu.
 *
 * HIG (`toolbars.md › Item groupings`): "Trailing edge. The trailing edge contains
 * important items that need to remain available… Items on the trailing edge remain
 * visible at all window sizes."
 *
 * Kendi dolgusunu/çerçevesini çizmiyor: başlık çubuğunun kendi malzemesi (iOS 26'da
 * Liquid Glass) altında duruyor, üstüne ikinci bir yüzey koymak onu bozardı.
 */
export function IletisimDugmesi() {
  const { colors } = useTheme();
  return (
    <Link href="/arac/iletisim" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="İletişim: ara ve mesaj"
        hitSlop={(HIT_SIZE - 22) / 2}
        style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}>
        <SymbolView name="phone" size={22} tintColor={colors.accent} fallback={null} />
      </Pressable>
    </Link>
  );
}
