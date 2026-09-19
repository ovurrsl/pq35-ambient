import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { NavRow, RowDivider } from '@/components/ui/row';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

import { HAVA_RENGI, KOSE_ADLARI, KOSE_IDS } from '@/lib/hava-kose';

/**
 * Hava süspansiyon — dört köşe bağımsız.
 *
 * Hız kilidi kapatılamaz: araç hareket hâlindeyken minimum yüksekliğin altına inilmez
 * (kilit 01). Hız zaten `0x351`'den bedavaya geliyor.
 *
 * Yükseklik, sensörler araçta kalibre edilmeden gösterilmez (kilit 06).
 */
export default function HavaEkrani() {
  const { colors } = useTheme();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.cipler}>
        <Pill dotColor={HAVA_RENGI}>4 köşe bağımsız</Pill>
        <Pill dotColor={colors.ok}>0 km/s</Pill>
      </View>

      <RuleBox title="HIZ KİLİDİ ETKİN">
        Araç hareket hâlindeyken minimum yüksekliğin altına inilmez. Bu kilit yazılımda tek
        noktadan uygulanır ve arayüzden kapatılamaz.
      </RuleBox>

      <Card>
        <SectionLabel>KÖŞELER</SectionLabel>
        <View style={styles.kosegrid}>
          {KOSE_IDS.map((k) => (
            <View
              key={k}
              style={[styles.kose, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
              <Text style={[styles.koseEtiket, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
                {KOSE_ADLARI[k].toUpperCase()}
              </Text>
              <View style={[styles.koseCubuk, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                <View style={[styles.koseCubukDolu, { backgroundColor: HAVA_RENGI, width: '0%' }]} />
              </View>
              <Text style={[styles.koseDeger, { color: colors.dim }]} maxFontSizeMultiplier={1.5}>
                — mm
              </Text>
              <Text style={[styles.koseBasinc, { color: colors.dim }]} maxFontSizeMultiplier={1.5}>
                basınç —
              </Text>
            </View>
          ))}
        </View>
        <UnverifiedBadge>KALİBRE EDİLMEDİ</UnverifiedBadge>
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Sensörlerin sıfır noktası araçta öğrenilmeden yükseklik gösterilmez.
        </Text>
      </Card>

      <Card>
        <SectionLabel>TANK</SectionLabel>
        <View style={[styles.tank, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
          <View style={[styles.tankDolu, { backgroundColor: HAVA_RENGI, width: '0%' }]} />
          <View style={[styles.rezervCizgi, { backgroundColor: colors.danger }]} />
        </View>
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Kırmızı çizgi rezerv sınırıdır: yükselmeye yetecek basınç bırakmayan bir indirme
          kabul edilmez.
        </Text>
      </Card>

      <Card>
        <NavRow href="/arac/hava/hafiza" baslik="Hafıza ve ayarlar" altBaslik="Konumlar · otomatik yükseltme · sürtme koruması" />
        <RowDivider />
        <NavRow href="/arac/hava/denge" baslik="Denge ve kurulum" altBaslik="Köşe ağırlığı · basınç dağılımı · yük dengeleme" />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  kosegrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  kose: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.sm,
    gap: 4,
  },
  koseEtiket: { ...FONTS.mono, fontSize: 11, letterSpacing: 0.6 },
  koseCubuk: {
    height: 7,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  koseCubukDolu: { height: '100%' },
  koseDeger: { ...FONTS.mono, fontSize: 18 },
  koseBasinc: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  tank: {
    height: 10,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tankDolu: { height: '100%' },
  rezervCizgi: { position: 'absolute', left: '26%', width: 2, height: '100%' },
  not: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 17 },
});
