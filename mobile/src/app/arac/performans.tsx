import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { NavRow, RowDivider } from '@/components/ui/row';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Performans ölçümü.
 *
 * İki dürüstlük maddesi arayüzde yazılı durur (CLAUDE.md §3.4):
 *  1. Süreler GÖSTERGE hızıyla ölçülür; gösterge gerçek hızın altını okumaz, sonuç
 *     olduğundan iyi çıkar.
 *  2. Çözünürlüğü `0x351` frame aralığı belirler ve o aralık henüz bilinmiyor.
 *
 * Hiçbir ölçüm sonucu buraya sayı olarak yazılmaz — hepsi yer tutucudur.
 */

interface Olcum {
  readonly id: string;
  readonly ad: string;
}

const OLCUMLER: readonly Olcum[] = [
  { id: '0-100', ad: '0 – 100 km/s' },
  { id: '100-0', ad: '100 – 0 fren' },
  { id: '80-120', ad: '80 – 120 esneklik' },
  { id: '400m', ad: '400 m' },
];

export default function PerformansEkrani() {
  const { colors } = useTheme();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.cipler}>
        <Pill dotColor={colors.ok}>Hazır</Pill>
        <Pill>gösterge hızı</Pill>
      </View>

      <Card>
        <SectionLabel>CANLI g</SectionLabel>
        <View style={styles.gSatir}>
          <View
            style={[styles.gDairesi, { borderColor: colors.line }]}
            accessible
            accessibilityLabel="g diyagramı: boylamsal 0,00 g, yanal 0,00 g">
            <View style={[styles.gIcHalka, { borderColor: colors.line }]} />
            <View style={[styles.gNokta, { backgroundColor: colors.text }]} />
          </View>
          <View style={styles.gDegerler}>
            <View style={styles.gDeger}>
              <Text style={[styles.gEtiket, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
                BOYLAMSAL
              </Text>
              <Text style={[styles.gSayi, { color: colors.text }]} maxFontSizeMultiplier={1.5}>
                0,00 g
              </Text>
            </View>
            <View style={styles.gDeger}>
              <Text style={[styles.gEtiket, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
                YANAL
              </Text>
              <Text style={[styles.gSayi, { color: colors.text }]} maxFontSizeMultiplier={1.5}>
                0,00 g
              </Text>
            </View>
            <Text style={[styles.gNot, { color: colors.dim }]} maxFontSizeMultiplier={1.8}>
              IMU’dan · araçtan gelmiyor
            </Text>
          </View>
        </View>
        <UnverifiedBadge>IMU TAKILINCA GELECEK</UnverifiedBadge>
      </Card>

      <Card>
        <View style={styles.olcumBaslik}>
          <SectionLabel>ÖLÇÜMLER</SectionLabel>
          <Text style={[styles.sutunBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
            SON · EN İYİ
          </Text>
        </View>
        {OLCUMLER.map((o, i) => (
          <View key={o.id}>
            {i > 0 ? <RowDivider /> : null}
            <NavRow
              href={{ pathname: '/arac/performans', params: { olcum: o.id } }}
              baslik={o.ad}
              sag={
                <Text style={[styles.olcumDeger, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
                  — · —
                </Text>
              }
            />
          </View>
        ))}
      </Card>

      <Card>
        <SectionLabel>NASIL TETİKLENİR</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Araç duruyorken ilk hareket saati başlatır, hedef hıza ulaşınca durdurur. Ölçüm
          kendiliğinden başlar ve biter; sonuç listeye düşer.
        </Text>
        <Text style={[styles.govde, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Sürüş sırasında ekrana dokunulmaz. Bu bir kolaylık değil, tasarım kuralıdır.
        </Text>
      </Card>

      <RuleBox title="SONUÇ NE ANLAMA GELİYOR">
        Süreler gösterge hızıyla ölçülür; gösterge gerçek hızın altını okumaz, bu yüzden
        sonuç olduğundan iyi çıkar. Çözünürlüğü CAN frame aralığı belirler ve o aralık
        henüz ölçülmedi. Rollout yok — sayılar dergi ölçümleriyle karşılaştırılmaz.
      </RuleBox>

      <Card>
        <SectionLabel>GPS İLE KALİBRASYON</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Sabit hızda seyrederken CAN hızı ile GPS hızı karşılaştırılır ve bir düzeltme
          katsayısı çıkarılır. Ölçülebilir bir işlemdir; tahmin değil.
        </Text>
        <UnverifiedBadge>YAPILMADI</UnverifiedBadge>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  gSatir: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  gDairesi: {
    width: 128,
    height: 128,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gIcHalka: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  gNokta: { width: 12, height: 12, borderRadius: RADIUS.pill },
  gDegerler: { flex: 1, minWidth: 0, gap: SPACING.sm },
  gDeger: { gap: 1 },
  gEtiket: { ...FONTS.mono, fontSize: 10, letterSpacing: 0.6 },
  gSayi: { ...FONTS.mono, fontSize: 22 },
  gNot: { ...FONTS.mono, fontSize: 10, lineHeight: 14 },
  olcumBaslik: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sutunBaslik: { ...FONTS.mono, fontSize: 10, letterSpacing: 0.6 },
  olcumDeger: { ...FONTS.mono, fontSize: TYPE_SCALE.body },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
});
