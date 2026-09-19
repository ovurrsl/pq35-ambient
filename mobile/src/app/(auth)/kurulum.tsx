import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { eksikDegiskenler, expoGoIcinde } from '@/lib/env';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Kurulum ekranı.
 *
 * Supabase yapılandırılmadan giriş denemenin anlamı yok. Eskiden eksik ortam değişkeni
 * uygulamayı açılışta çökertiyordu; artık burada ne eksik olduğu ve nereye yazılacağı
 * söyleniyor. Bu ekran yalnızca geliştirme sırasında görünür.
 */
export default function KurulumEkrani() {
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.basliklar}>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Kurulum gerekli
        </Text>
        <Text style={[styles.altBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
          SUPABASE YAPILANDIRILMADI
        </Text>
      </View>

      {expoGoIcinde ? (
        <View style={styles.cipler}>
          <Pill dotColor={colors.warn}>Expo Go</Pill>
          <Pill dotColor={colors.dim}>BLE yok</Pill>
        </View>
      ) : null}

      <Card>
        <SectionLabel>EKSİK DEĞİŞKENLER</SectionLabel>
        {eksikDegiskenler.map((ad) => (
          <View key={ad} style={styles.satir}>
            <View style={[styles.nokta, { backgroundColor: colors.danger }]} />
            <Text style={[styles.mono, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
              {ad}
            </Text>
          </View>
        ))}
        <Text style={[styles.govde, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Bunlar <Text style={[styles.mono, { color: colors.text }]}>mobile/.env.local</Text>{' '}
          dosyasına yazılır. Örnek için{' '}
          <Text style={[styles.mono, { color: colors.text }]}>.env.example</Text> dosyasına bak.
        </Text>
      </Card>

      <Card>
        <SectionLabel>SIRAYLA</SectionLabel>
        {[
          'Supabase’de proje aç (ücretsiz planda 2 aktif proje sınırı var).',
          'supabase/migrations/ altındaki iki dosyayı uygula.',
          'Proje URL’sini ve publishable (anon) anahtarı .env.local’a yaz.',
          'Uygulamayı yeniden başlat.',
        ].map((adim, i) => (
          <View key={adim} style={styles.satir}>
            <Text style={[styles.adimNo, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
              {i + 1}
            </Text>
            <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
              {adim}
            </Text>
          </View>
        ))}
      </Card>

      <RuleBox title="ANON ANAHTAR GİZLİ DEĞİLDİR">
        EXPO_PUBLIC_ ile başlayan her değişken pakete gömülür ve okunabilir. Oraya yalnızca
        publishable anahtar konur. Güvenlik, her tabloda açık ve varsayılan reddet olan RLS
        politikalarından gelir — anahtarın gizliliğinden değil.
      </RuleBox>

      {expoGoIcinde ? (
        <Card>
          <SectionLabel>EXPO GO KISITI</SectionLabel>
          <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
            Ekranlar burada gezilebilir ama araç bağlantısı çalışmaz: BLE yerel bir modül ve
            Expo Go onu taşımaz. Araçla konuşmak için development build gerekir.
          </Text>
          <Text style={[styles.mono, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
            eas build --profile development --platform ios
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg, justifyContent: 'center' },
  basliklar: { gap: 2 },
  baslik: { ...FONTS.display, fontSize: 28 },
  altBaslik: { ...FONTS.mono, fontSize: TYPE_SCALE.micro, letterSpacing: 1.4 },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  satir: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, minHeight: 26 },
  nokta: { width: 7, height: 7, borderRadius: RADIUS.pill, marginTop: 7 },
  adimNo: { ...FONTS.mono, fontSize: TYPE_SCALE.caption, minWidth: 14 },
  mono: { ...FONTS.mono, fontSize: TYPE_SCALE.caption },
  govde: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
});
