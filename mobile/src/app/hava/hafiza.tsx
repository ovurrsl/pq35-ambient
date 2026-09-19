import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { DataRow, RowDivider, ToggleRow } from '@/components/ui/row';
import { UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Hafıza konumları ve otomatik davranış.
 *
 * Sürtme koruması bilerek "yalnızca düşük hızda çalışır" diye anlatılır: yükselme
 * saniyeler sürerken 50 km/s'de 4 m ilerideki bir engel 0,29 saniye verir. Yüksek hızda
 * koruma sensörden değil, hıza bağlı otomatik yükseltmeden gelir (CLAUDE.md §3.4 ve
 * SurtmeKorumasi panosu).
 */

const KONUMLAR = [
  { id: 'yerde', ad: 'Yerde', alt: 'PARK · araç dururken' },
  { id: 'surus', ad: 'Sürüş', alt: 'VARSAYILAN · açılışta bu' },
  { id: 'yuksek', ad: 'Yüksek', alt: 'RAMPA · bilinen engeller için' },
] as const;

export default function HavaHafizaEkrani() {
  const { colors } = useTheme();
  const [otoYukselt, setOtoYukselt] = useState(true);
  const [surtmeKorumasi, setSurtmeKorumasi] = useState(true);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <Card>
        <SectionLabel>HAFIZA KONUMLARI</SectionLabel>
        {KONUMLAR.map((k, i) => (
          <View key={k.id}>
            {i > 0 ? <RowDivider /> : null}
            <View style={styles.kayitSatiri}>
              <View style={styles.kayitMetin}>
                <Text style={[styles.kayitAd, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
                  {k.ad}
                </Text>
                <Text style={[styles.kayitAlt, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
                  {k.alt}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${k.ad} konumuna şu anki yüksekliği kaydet`}
                style={({ pressed }) => [
                  styles.kaydet,
                  { borderColor: colors.line, backgroundColor: colors.surfaceRaised, opacity: pressed ? 0.6 : 1 },
                ]}>
                <Text style={[styles.kaydetMetin, { color: colors.text }]} maxFontSizeMultiplier={1.5}>
                  Şu anı kaydet
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Bilinen bir rampa için kayıtlı yükseklik hiçbir sensörden hızlıdır — sürücü
          önceden basar.
        </Text>
      </Card>

      <Card>
        <SectionLabel>HIZDA OTOMATİK YÜKSELTME</SectionLabel>
        <ToggleRow
          baslik="Hızda otomatik yükseltme"
          altBaslik="Eşiği geçince araç kendiliğinden yükselir"
          deger={otoYukselt}
          onDegisim={setOtoYukselt}
        />
        <RowDivider />
        <DataRow etiket="Hız eşiği" deger="—" sag={<UnverifiedBadge>ARAÇTA</UnverifiedBadge>} />
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Geri alınamaz: eşiğin üstünde aracı aşağı indiremezsin. Yüksek hızdaki koruma
          budur, sensör değil.
        </Text>
      </Card>

      <Card>
        <SectionLabel>SÜRTME KORUMASI</SectionLabel>
        <ToggleRow
          baslik="Sürtme koruması"
          altBaslik="Araç altı sensörü engel görünce yükseltir"
          deger={surtmeKorumasi}
          onDegisim={setSurtmeKorumasi}
        />
      </Card>

      <RuleBox title="YALNIZCA DÜŞÜK HIZDA ÇALIŞIR">
        Yükselme saniyeler sürer; 50 km/s’de 4 m ilerideki bir engel yalnızca 0,29 saniye
        bırakır. İleri bakan sensör bu yüzden ancak düşük hızda yetişir — ki sürtme zaten
        orada olur: rampa, kasis, garaj girişi, kaldırım.
      </RuleBox>

      <Card>
        <SectionLabel>YÜKSEKLİK KALİBRASYONU</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Sensörlerin sıfır noktası araçta öğrenilir. Kalibrasyon yapılmadan yükseklik
          kontrolü açılmaz.
        </Text>
        <UnverifiedBadge>YAPILMADI</UnverifiedBadge>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  kayitSatiri: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 48 },
  kayitMetin: { flex: 1, minWidth: 0, gap: 1 },
  kayitAd: { ...FONTS.body, fontSize: TYPE_SCALE.body },
  kayitAlt: { ...FONTS.mono, fontSize: 11 },
  kaydet: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kaydetMetin: { ...FONTS.body, fontSize: TYPE_SCALE.caption },
  not: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 17 },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
});
