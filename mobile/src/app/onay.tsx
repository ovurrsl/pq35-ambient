import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { KRITIK_KOMUTLAR } from '@/lib/ble/protocol';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Geri alınamayan komut için onay sayfası (modal sheet).
 *
 * Bu ekran **biyometrik bir kapı değildir.** Face ID yalnızca uygulama açılışında sorulur
 * (araç sahibinin kararı, CLAUDE.md §7.1); buradaki onay düz bir doğrulamadır — yanlışlıkla
 * gönderilen kilit veya arama komutunu engellemek içindir.
 *
 * Gerçek güvenlik bu ekranda değil: komut oturum anahtarıyla imzalanır ve tekrar sayacı
 * taşır, misafir yetkisinde ise kart komutu hiç kabul etmez.
 */
export default function OnayEkrani() {
  const { colors } = useTheme();
  const router = useRouter();
  const { komut, baslik } = useLocalSearchParams<{ komut?: string; baslik?: string }>();
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const komutAdi = baslik ?? 'Kapıları kilitle';

  const gonder = useCallback(() => {
    setGonderiliyor(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Gönderim BLE katmanı bağlandığında buraya gelir; şimdilik sayfa kapanıyor.
    router.back();
  }, [router]);

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.basliklar}>
        <Text style={[styles.ustBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          KOMUTU ONAYLA
        </Text>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          {komutAdi}
        </Text>
      </View>

      <Card>
        <SectionLabel>KOMUT ÖZETİ</SectionLabel>
        {[
          { etiket: 'Hedef', deger: 'Araç · ESP32-S3' },
          { etiket: 'Kanal', deger: 'BLE · yedek: GPRS / SMS' },
          { etiket: 'Yetki', deger: 'Sahip' },
          { etiket: 'Tekrar sayacı', deger: '#······' },
          ...(komut ? [{ etiket: 'Komut', deger: komut }] : []),
        ].map((satir) => (
          <View key={satir.etiket} style={styles.ozetSatir}>
            <Text style={[styles.ozetEtiket, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
              {satir.etiket}
            </Text>
            <Text style={[styles.ozetDeger, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
              {satir.deger}
            </Text>
          </View>
        ))}
      </Card>

      <View style={styles.eylemler}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={komutAdi}
          disabled={gonderiliyor}
          onPress={gonder}
          style={({ pressed }) => [
            styles.birincil,
            { backgroundColor: colors.accent, opacity: pressed || gonderiliyor ? 0.7 : 1 },
          ]}>
          <Text style={[styles.birincilMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
            {gonderiliyor ? 'Gönderiliyor…' : komutAdi}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Vazgeç"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.ikincil,
            { borderColor: colors.line, opacity: pressed ? 0.6 : 1 },
          ]}>
          <Text style={[styles.ikincilMetin, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
            Vazgeç
          </Text>
        </Pressable>
      </View>

      <View style={styles.cipler}>
        <Pill dotColor={colors.ok}>oturum anahtarıyla imzalı</Pill>
        <Pill dotColor={colors.accent}>tekrar sayacı taşır</Pill>
      </View>
      <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
        Aynı paket ikinci kez kabul edilmez.
      </Text>

      <RuleBox title="KURAL">
        {`${KRITIK_KOMUTLAR.join(', ')} komutları misafir yetkisinde tamamen kapalıdır. Kapı, uygulama kilidi (Face ID), eşleşmiş telefon ve imzalı komuttur — bu onay ekranı yanlışlıkla göndermeyi engeller, kimlik doğrulamaz.`}
      </RuleBox>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  basliklar: { gap: 4 },
  ustBaslik: { ...FONTS.mono, fontSize: TYPE_SCALE.micro, letterSpacing: 1.4 },
  baslik: { ...FONTS.display, fontSize: 26 },
  ozetSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 30 },
  ozetEtiket: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.label },
  ozetDeger: { ...FONTS.mono, fontSize: TYPE_SCALE.caption, textAlign: 'right' },
  eylemler: { gap: SPACING.sm },
  birincil: { height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  birincilMetin: { ...FONTS.bodySemiBold, fontSize: 16 },
  ikincil: {
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ikincilMetin: { ...FONTS.bodySemiBold, fontSize: 15 },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  not: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 17 },
});
