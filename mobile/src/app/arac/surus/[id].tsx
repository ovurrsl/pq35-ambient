import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Card, SectionLabel } from '@/components/ui/card';
import { DataRow, RowDivider } from '@/components/ui/row';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Tek sürüş detayı.
 *
 * Ortalama hız İKİ ayrı sayıdır: hareketteki ve toplam. Şehir içinde ikisi çok farklı
 * çıkar ve tek bir sayı yanıltır (CLAUDE.md §3.4).
 *
 * Harita `expo-maps` ile Apple Haritalar'a bağlanacak; kütüphane alfa aşamasındadır ve
 * Expo Go'da çalışmaz — development build zaten BLE için de gerekiyor.
 */

/** Hıza göre rota renklendirmesi: tek hue, üç kademe. Renk burada bilgi taşıyor. */
const HIZ_BANDI = ['#2F4A6B', '#4C7FC0', '#8FD0FF'] as const;

export default function SurusDetayEkrani() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.cipler}>
        <Pill>KARTTA</Pill>
        <Pill dotColor={colors.muted}>zaman kaynağı GPS</Pill>
      </View>

      <View style={[styles.harita, { backgroundColor: colors.glassFallback, borderColor: colors.line }]}>
        <Text style={[styles.haritaNot, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
          HARİTA — APPLE HARİTALAR · DEVELOPMENT BUILD GEREKİR
        </Text>
      </View>

      <View style={styles.efsane}>
        <Text style={[styles.efsaneEtiket, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          HIZ
        </Text>
        {HIZ_BANDI.map((renk) => (
          <View key={renk} style={[styles.efsaneCizgi, { backgroundColor: renk }]} />
        ))}
        <Text style={[styles.efsaneEtiket, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          YAVAŞ → HIZLI
        </Text>
      </View>

      <Card>
        <SectionLabel>ÖZET</SectionLabel>
        <DataRow etiket="Mesafe" deger="—" />
        <RowDivider />
        <DataRow etiket="Süre" deger="—" />
        <RowDivider />
        <DataRow etiket="En yüksek hız" deger="—" />
        <RowDivider />
        <DataRow etiket="Ortalama — harekette" deger="—" />
        <RowDivider />
        <DataRow etiket="Ortalama — toplam" deger="—" />
        <RowDivider />
        <DataRow etiket="Rölanti" deger="—" />
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          İki ortalama ayrı gösterilir: şehir içinde aralarındaki fark büyüktür ve tek bir
          sayı yanıltıcı olur.
        </Text>
      </Card>

      <Card>
        <SectionLabel>OLAYLAR</SectionLabel>
        <DataRow etiket="Sert hızlanma" deger="—" />
        <RowDivider />
        <DataRow etiket="Sert frenleme" deger="—" />
        <RowDivider />
        <DataRow etiket="Sert viraj" deger="—" />
        <RowDivider />
        <DataRow etiket="Duruş" deger="—" />
        <UnverifiedBadge>EŞİKLER ARAÇTA BELİRLENECEK</UnverifiedBadge>
      </Card>

      <Text style={[styles.kayitId, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
        kayıt {id ?? '—'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  harita: {
    height: 200,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haritaNot: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  efsane: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  efsaneEtiket: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.6 },
  efsaneCizgi: { width: 18, height: 4, borderRadius: RADIUS.pill },
  not: { fontFamily: FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 17 },
  kayitId: { fontFamily: FONTS.mono, fontSize: TYPE_SCALE.micro, textAlign: 'center' },
});
