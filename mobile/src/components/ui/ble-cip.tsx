import { useTheme } from '@/theme/theme-provider';
import { bleCipMetni, useBle } from '@/state/ble-context';

import { Pill } from './pill';

/**
 * Araç bağlantısı çipi — **tek** kaynak.
 *
 * Eskiden beş ekran bu çipi sabit metinle çiziyordu (`BLE bağlı`, yeşil noktayla) ve
 * hiçbiri hiçbir yerden okumuyordu; yalnızca Araç ekranı doğruyu söylüyordu. Araçta
 * henüz hiçbir fiziksel iş yapılmadı, bağlanacak denetleyici yok — yani beş ekran
 * olmayan bir bağlantıyı olgu gibi gösteriyordu.
 *
 * Nokta rengi durumu **tek başına** taşımıyor: metin de değişiyor
 * (`accessibility.md`: renkle taşınan bilgi her zaman metinle de verilir).
 */
export function BleCip() {
  const { colors } = useTheme();
  const { arac } = useBle();
  const renk =
    arac === 'bagli' ? colors.ok : arac === 'baglaniyor' ? colors.warn : colors.dim;
  return <Pill dotColor={renk}>{bleCipMetni(arac)}</Pill>;
}
