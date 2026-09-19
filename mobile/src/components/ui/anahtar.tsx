import { Switch } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * Tek anahtar bileşeni — uygulamadaki her `Switch` bundan geçer.
 *
 * NEDEN: iki ekran `Switch`i iki ayrı şemayla boyuyordu ve ikisi de KAPALI durumu
 * okunamaz hâle getiriyordu. Ölçüm:
 *   bölgeler:  thumb #131A22 / track #1B2430 = **1.12:1** (açık temada 1.13:1)
 *   satır:     thumb #0B0F14 / track #2A3746 = **1.59:1** (açık temada 1.29:1)
 * AÇIK durumda ikisi de 10.53:1. Yani kontrolün iki durumu neredeyse yalnızca track
 * rengiyle ayrılıyordu ve koyu temada topuz, iOS'un beyaz çizdiği yerde nerdeyse siyahtı.
 * React Native bu iki prop'u iOS'ta `thumbTintColor`/`tintColor`'a bağlar, yani override
 * gerçekten uygulanıyordu.
 *
 * HIG (`accessibility.md › Vision`): "Prefer system-defined colors. These colors have
 * their own accessible variants that automatically adapt when people adjust their color
 * preferences, such as enabling Increase Contrast or toggling between the light and dark
 * appearances."
 *
 * Bu yüzden `thumbColor` ve `ios_backgroundColor` verilmiyor: topuzu ve KAPALI track'i
 * `UISwitch` kendi çiziyor. AÇIK track projenin `ok` yeşili olarak kalıyor — orada
 * kontrast zaten 10.53:1 ve renk bir anlam taşıyor.
 */
export function Anahtar({
  deger,
  onDegisim,
  kilitli = false,
  erisimEtiketi,
  erisimIpucu,
  /**
   * AÇIK track'in rengi. Varsayılan `colors.ok` — "bu açık" demek. Yalnızca renk bir
   * **anlam** taşıdığında değiştir: olay anahtarlarında olayın kendi rengi (kapı kırmızısı,
   * sinyal sarısı) o olayın kimliğidir ve listede satırı tanıtır.
   */
  acikRengi,
}: {
  deger: boolean;
  /** Yok ise anahtar etkileşimsizdir; o durumda `kilitli` de verilmeli, yoksa dokunan bir
   *  kullanıcı hiçbir şey olmadığını görür. */
  onDegisim?: (yeni: boolean) => void;
  kilitli?: boolean;
  erisimEtiketi?: string;
  erisimIpucu?: string;
  acikRengi?: string;
}) {
  const { colors } = useTheme();
  return (
    <Switch
      accessibilityRole="switch"
      accessibilityLabel={erisimEtiketi}
      accessibilityHint={erisimIpucu}
      accessibilityState={{ checked: deger, disabled: kilitli }}
      value={deger}
      onValueChange={onDegisim}
      disabled={kilitli}
      trackColor={{ true: acikRengi ?? colors.ok, false: undefined }}
    />
  );
}
