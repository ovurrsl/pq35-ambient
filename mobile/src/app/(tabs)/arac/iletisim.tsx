import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { BUS_COLORS, FONTS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * İletişim — SIM808 GSM hattı (3. faz).
 *
 * KISIT: **iPhone bu hattın ahizesi olamaz.** BLE gerçek zamanlı ses taşımaz, ESP32-S3'te
 * LE Audio yok, klasik Bluetooth'ta telefon daima audio gateway tarafındadır ve iOS üçüncü
 * parti bir cihaz için kulaklık rolüne geçmez. Ses araç içindeki mikrofon ve hoparlörden
 * yürür; uygulama yalnızca kumandadır. Bu kısıt gizlenmez, ekranda yazar (CLAUDE.md §3.2).
 */
export default function IletisimEkrani() {
  const { colors } = useTheme();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.cipler}>
        <Pill dotColor={BUS_COLORS.ble}>3. faz</Pill>
        <Pill dotColor={colors.warn}>2G</Pill>
      </View>

      <Card>
        <SectionLabel>SIM DURUMU</SectionLabel>
        {[
          { etiket: 'SIM kart', deger: '—' },
          { etiket: 'Operatör', deger: '··········' },
          { etiket: 'Sinyal', deger: '·· dBm' },
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

      <RuleBox title="KONUŞMA ARAÇ İÇİNDEDİR">
        Bu hattın ahizesi telefon değildir. Arama başlatılabilir, kapatılabilir ve gelen
        arama görülebilir; ancak ses araç içindeki mikrofon ve hoparlörden yürür. iOS,
        telefonu üçüncü parti bir cihazın ahizesi yapmaya izin vermez.
      </RuleBox>

      <Card>
        <SectionLabel>NE ZAMAN ÇALIŞIR</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          SIM808 yalnızca 2G konuşur. Operatör 2G’yi kapattıysa arama, SMS ve veri hiç
          çalışmaz. Modül ayrıca kendi 5 V / ≥2 A hattından beslenmelidir; iletimde 2 A’e
          varan anlık akım çeker ve ortak regülatörden beslenirse tüm sistem resetlenir.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  satir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 28 },
  etiket: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.label },
  deger: { ...FONTS.mono, fontSize: TYPE_SCALE.caption },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
});
