import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { BUS_COLORS, FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Konum — SIM808 GPS (3. faz).
 *
 * Konum geçmişi hassas veridir: saklama süresi sınırlı, panelde maskelenir, dışa aktarım
 * denetim kaydına yazılır (CLAUDE.md §3.2). Bu ekran koordinat göstermez; gerçek harita
 * karosu da yoktur.
 */
export default function KonumEkrani() {
  const { colors } = useTheme();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.cipler}>
        <Pill dotColor={BUS_COLORS.ble}>3. faz</Pill>
        <Pill dotColor={colors.warn}>GPRS · SMS yedek</Pill>
      </View>

      {/* Şematik alan — gerçek harita katmanı bilerek yok; koordinat da gösterilmiyor. */}
      <View style={[styles.haritaAlani, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={[styles.aracNokta, { backgroundColor: colors.accent, borderColor: colors.bg }]} />
        <View style={[styles.dogrulukHalka, { borderColor: colors.accent }]} />
        <Text style={[styles.haritaNot, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
          ŞEMATİK — GERÇEK HARİTA KAROSU YOK · KOORDİNAT GÖSTERİLMEZ
        </Text>
      </View>

      <Card>
        <SectionLabel>SON SABİTLEME</SectionLabel>
        {[
          { etiket: 'Zaman', deger: '··:··' },
          { etiket: 'Doğruluk', deger: '— m' },
          { etiket: 'Uydu', deger: '—' },
          { etiket: 'Hız', deger: '— km/s' },
          { etiket: 'Kaynak', deger: '—' },
        ].map((s) => (
          <View key={s.etiket} style={styles.satir}>
            <Text style={[styles.etiket, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
              {s.etiket}
            </Text>
            <Text style={[styles.deger, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
              {s.deger}
            </Text>
          </View>
        ))}
        <UnverifiedBadge>MODÜL TAKILINCA GELECEK</UnverifiedBadge>
      </Card>

      <Card>
        <SectionLabel>VERİ SAKLAMA</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Konum kayıtları sınırlı süre tutulur, panelde maskeli gösterilir ve her dışa
          aktarım denetim kaydına yazılır. Kayıtları cihaz doğrudan yazmaz: payload AES-GCM
          ile şifrelenip Edge Function’a gider, fonksiyon doğrulayıp yazar.
        </Text>
      </Card>

      <RuleBox title="SIM808 2G-ONLY — TARİHLİ ÖMÜR">
        Şebekede 2G kapalıysa veri, SMS ve arama çalışmaz; GPS sabitleme alsa bile veriyi
        taşıyamaz. Sözleşmelerdeki kapanış son tarihi 30 Nisan 2029 — engel değil, tarihli
        bir ömür. Modül tek bir `modem` katmanının ardında durur ve o gün LTE Cat-1 ile
        değiştirilir. Operatör daha erken kapatabilir, teyit alınır.
      </RuleBox>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  haritaAlani: {
    height: 220,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aracNokta: { width: 14, height: 14, borderRadius: RADIUS.pill, borderWidth: 2, zIndex: 1 },
  dogrulukHalka: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  haritaNot: {
    position: 'absolute',
    bottom: SPACING.md,
    ...FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  satir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 28 },
  etiket: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.label },
  deger: { ...FONTS.mono, fontSize: TYPE_SCALE.caption },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
});
