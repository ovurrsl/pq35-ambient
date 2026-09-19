import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AracSegmentKontrolu } from '@/components/nav/arac-segmenti';
import { Card, SectionLabel } from '@/components/ui/card';
import { NavRow, RowDivider } from '@/components/ui/row';
import { Pill } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Sürüş listesi.
 *
 * Eşitleme durumu üç değer alır ve bu üçlü bir tasarım kararıdır (CLAUDE.md §3.4):
 * tam çözünürlüklü log varsayılan olarak buluta YÜKLENMEZ — 2G onu taşımaz, üstelik
 * sürüş verisi konum kaydından daha hassastır. Buluta yalnızca özet ve seyreltilmiş
 * rota gider; tam log BLE ile telefona iner.
 */

export type EsitlemeDurumu = 'kartta' | 'ozet' | 'tam';

export interface SurusOzeti {
  readonly id: string;
  readonly baslik: string;
  readonly ozet: string;
  readonly durum: EsitlemeDurumu;
}

const DURUM_ETIKET: Readonly<Record<EsitlemeDurumu, string>> = {
  kartta: 'KARTTA',
  ozet: 'ÖZET',
  tam: 'TAM',
};

/** Cihaz bağlanana kadar liste boştur; buradaki satırlar yerleşimi gösterir. */
const SURUSLER: readonly SurusOzeti[] = [];

export default function SuruslerEkrani() {
  const { colors } = useTheme();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <AracSegmentKontrolu aktif="surusler" />

      <View style={styles.cipler}>
        <Pill dotColor={colors.ok}>Kayıt açık</Pill>
        <Pill>10 Hz</Pill>
      </View>

      <Card>
        <SectionLabel>KART DOLULUĞU</SectionLabel>
        <View style={[styles.cubuk, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
          <View style={[styles.cubukDolu, { backgroundColor: colors.muted, width: '0%' }]} />
        </View>
        <Text style={[styles.mono, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
          — / —
        </Text>
      </Card>

      <Card>
        <SectionLabel>SON SÜRÜŞLER</SectionLabel>
        {SURUSLER.length === 0 ? (
          <Text style={[styles.bos, { color: colors.muted }]} maxFontSizeMultiplier={2}>
            Henüz sürüş kaydı yok. Kontrolcü B araca takılıp kontak açıldığında kayıt
            kendiliğinden başlar.
          </Text>
        ) : (
          SURUSLER.map((s, i) => (
            <View key={s.id}>
              {i > 0 ? <RowDivider /> : null}
              <NavRow
                href={{ pathname: '/arac/surus/[id]', params: { id: s.id } }}
                baslik={s.baslik}
                altBaslik={s.ozet}
                sag={
                  <Text style={[styles.durum, { color: s.durum === 'tam' ? colors.ok : colors.muted }]}>
                    {DURUM_ETIKET[s.durum]}
                  </Text>
                }
              />
            </View>
          ))
        )}
      </Card>

      <Card>
        <SectionLabel>NE NEREDE DURUYOR</SectionLabel>
        {(
          [
            ['KARTTA', 'Tam çözünürlük araçtaki kartta. Yüklenmedi.'],
            ['ÖZET', 'Özet ve seyreltilmiş rota GPRS ile buluta gitti.'],
            ['TAM', 'Tam log telefona BLE ile indirildi.'],
          ] as const
        ).map(([rozet, aciklama]) => (
          <View key={rozet} style={styles.aciklamaSatiri}>
            <Text
              style={[
                styles.rozet,
                {
                  color: rozet === 'TAM' ? colors.ok : colors.muted,
                  borderColor: colors.line,
                  backgroundColor: colors.surfaceRaised,
                },
              ]}
              maxFontSizeMultiplier={1.4}>
              {rozet}
            </Text>
            <Text style={[styles.aciklama, { color: colors.muted }]} maxFontSizeMultiplier={2}>
              {aciklama}
            </Text>
          </View>
        ))}
        <RowDivider />
        <Text style={[styles.aciklama, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Tam log varsayılan olarak buluta yüklenmez. 2G bunu taşımaz, üstelik sürüş
          verisi hassastır: nerede olduğunu değil, nasıl sürdüğünü de söyler.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  cubuk: {
    height: 8,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cubukDolu: { height: '100%' },
  mono: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  bos: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
  durum: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  aciklamaSatiri: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  rozet: {
    ...FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  aciklama: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 17 },
});
