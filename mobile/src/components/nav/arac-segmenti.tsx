import { useCallback, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING } from '@/theme/tokens';

/**
 * Araç sekmesinin segment kontrolü: `Canlı · Sürüşler · Konum` (CLAUDE.md §7.1).
 *
 * NEDEN PAYLAŞILAN BİR BİLEŞEN:
 * Kontrol eskiden yalnızca `Canlı` ekranındaydı ve diğer iki segmente `router.push` ile
 * gidiyordu. Sonuç, segment kılığında tek yönlü bir itmeydi: `Sürüşler`e geçince kontrol
 * ekrandan kayboluyordu, oradan `Konum`a geçilemiyordu, her geçiş geri yığınına bir kayıt
 * ekliyordu ve seçili segment `disabled` çiziliyordu — VoiceOver bir sekme listesi
 * duyuruyor ama seçili sekme devre dışı görünüyordu.
 *
 * HIG (`segmented-controls.md › Best practices`): "Keep control types consistent within a
 * single segmented control. Don't assign actions to segments in a control that otherwise
 * represents selection state."
 *
 * İki karar:
 * - Kontrol **üç ekranda da** aynı biçimde çiziliyor, yani seçili segment her zaman
 *   görünür durumda.
 * - Geçiş `router.replace` ile: segment bir gezinme değil bir **seçim**, bu yüzden yığın
 *   derinleşmiyor. (`Sürüş detayı` yine `push` ile açılır, geri düğmesini o hak eder.)
 *
 * Seçili segment `disabled` **değil**: bilgi `accessibilityState.selected` ile veriliyor.
 * HIG (`tab-bars.md › Best practices`): "Don't disable or hide tab bar buttons, even when
 * their content is unavailable."
 */

export type AracSegmenti = 'canli' | 'surusler' | 'konum';

interface SegmentTanimi {
  readonly id: AracSegmenti;
  readonly ad: string;
  readonly rota: '/arac' | '/arac/surusler' | '/arac/konum';
}

const SEGMENTLER: readonly SegmentTanimi[] = [
  { id: 'canli', ad: 'Canlı', rota: '/arac' },
  { id: 'surusler', ad: 'Sürüşler', rota: '/arac/surusler' },
  { id: 'konum', ad: 'Konum', rota: '/arac/konum' },
];

export function AracSegmentKontrolu({ aktif }: { aktif: AracSegmenti }): ReactElement {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.kap, { backgroundColor: colors.glassFallback, borderColor: colors.line }]}>
      {SEGMENTLER.map((segment) => (
        <SegmentDugmesi key={segment.id} segment={segment} secili={segment.id === aktif} />
      ))}
    </View>
  );
}

function SegmentDugmesi({
  segment,
  secili,
}: {
  segment: SegmentTanimi;
  secili: boolean;
}): ReactElement {
  const { colors } = useTheme();
  const router = useRouter();

  const bas = useCallback((): void => {
    if (secili) return;
    router.replace(segment.rota);
  }, [router, secili, segment.rota]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: secili }}
      accessibilityLabel={segment.ad}
      onPress={bas}
      style={({ pressed }) => [
        styles.segment,
        secili
          ? { backgroundColor: colors.surfaceRaised, borderColor: colors.line }
          : { backgroundColor: 'transparent', borderColor: 'transparent' },
        { opacity: pressed ? 0.6 : 1 },
      ]}>
      <Text
        style={[
          secili ? styles.seciliMetin : styles.metin,
          { color: secili ? colors.text : colors.muted },
        ]}
        maxFontSizeMultiplier={1.4}>
        {segment.ad}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kap: {
    flexDirection: 'row',
    gap: 3,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.sm + 1,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  metin: { ...FONTS.bodyMedium, fontSize: 14 },
  seciliMetin: { ...FONTS.bodySemiBold, fontSize: 14 },
});
