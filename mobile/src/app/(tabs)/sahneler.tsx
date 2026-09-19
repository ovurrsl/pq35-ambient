import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, SectionLabel } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import {
  FONTS,
  HIT_SIZE,
  RADIUS,
  SPACING,
  TYPE_SCALE,
  ZONE_COLORS,
  type ZoneId,
} from '@/theme/tokens';

interface Sahne {
  readonly id: string;
  readonly ad: string;
  readonly aciklama: string;
  /** Sahnenin belirgin renkleri — önizleme şeridinde gösterilir. */
  readonly renkler: readonly ZoneId[];
}

/**
 * Sahneler, bölge renklerinin hazır bileşimleridir.
 * Taban katmanını değiştirirler; araç olayları (kapı, sinyal) yine üstlerine biner (§5).
 */
const SAHNELER: readonly Sahne[] = [
  { id: 'gece', ad: 'Gece sürüşü', aciklama: 'Kısık taban, ayak altları öne çıkar', renkler: ['z3', 'z7'] },
  { id: 'yan-yan', ad: 'Yan yana', aciklama: 'Sol mavi, sağ mor — taraflar ayrışır', renkler: ['z1', 'z2', 'z5', 'z6'] },
  { id: 'amber', ad: 'Konsol amber', aciklama: 'Yalnızca göğüs çıtası', renkler: ['z4'] },
  { id: 'tam', ad: 'Hepsi açık', aciklama: 'Yedi bölge, kendi renkleriyle', renkler: ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7'] },
];

export default function SahnelerEkrani() {
  const { colors } = useTheme();
  const [aktif, setAktif] = useState<string | null>(null);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.basliklar}>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Sahneler
        </Text>
        <Text style={[styles.altBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
          TABAN KATMANI · OLAYLAR ÜSTÜNE BİNER
        </Text>
      </View>

      <View style={styles.cipler}>
        <Pill dotColor={colors.ok}>BLE bağlı</Pill>
        <Pill dotColor={colors.warn}>LISTEN-ONLY</Pill>
      </View>

      {SAHNELER.map((s) => {
        const seciliMi = s.id === aktif;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: seciliMi }}
            accessibilityLabel={`${s.ad} sahnesini uygula`}
            accessibilityHint={s.aciklama}
            onPress={() => setAktif(s.id)}
            style={({ pressed }) => [
              styles.sahne,
              {
                backgroundColor: colors.surface,
                borderColor: seciliMi ? colors.accent : colors.line,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <View style={styles.sahneUst}>
              <View style={styles.sahneMetin}>
                <Text style={[styles.sahneAd, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
                  {s.ad}
                </Text>
                <Text style={[styles.sahneAciklama, { color: colors.muted }]} maxFontSizeMultiplier={2}>
                  {s.aciklama}
                </Text>
              </View>
              {seciliMi ? <Pill dotColor={colors.accent}>etkin</Pill> : null}
            </View>
            <View style={styles.serit} accessibilityElementsHidden>
              {s.renkler.map((z) => (
                <View key={z} style={[styles.seritParca, { backgroundColor: ZONE_COLORS[z] }]} />
              ))}
            </View>
          </Pressable>
        );
      })}

      <Card>
        <SectionLabel>NASIL ÇALIŞIR</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Sahne, taban katmanının rengini belirler. Taban = sahne rengi × gösterge dimmer ×
          far durumu. Kapı, sinyal, geri vites ve redline olayları bunun üstüne biner ve
          olay bitince taban geri gelir. Mesaj iki saniye kesilirse de tabana dönülür.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },
  basliklar: { gap: 2 },
  baslik: { ...FONTS.display, fontSize: 28 },
  altBaslik: { ...FONTS.mono, fontSize: TYPE_SCALE.micro, letterSpacing: 1.2 },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  sahne: {
    minHeight: HIT_SIZE + 26,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sahneUst: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sahneMetin: { flex: 1, gap: 2 },
  sahneAd: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.body },
  sahneAciklama: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 17 },
  serit: { flexDirection: 'row', gap: 3, height: 6 },
  seritParca: { flex: 1, borderRadius: RADIUS.pill },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
});
