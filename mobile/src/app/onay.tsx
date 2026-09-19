import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { KRITIK_KOMUTLAR } from '@/lib/ble/protocol';
import { bleCipMetni, useBle } from '@/state/ble-context';
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
 *
 * ÜÇ SHEET KURALI BURADA UYGULANIYOR:
 *
 * 1. **Vazgeç başlık çubuğunun sol kenarında.** `sheets.md › Mobile (iOS, iPadOS)`: "In iOS
 *    and iPadOS, for sheets with a single view, the Cancel button belongs on the leading edge
 *    of the top toolbar." Eskiden kaydırmanın ortasındaydı.
 * 2. **Eylem sabit bir ayakta.** Birincil düğme `ScrollView`'in içindeyken, %80 yükseklikli
 *    bir sheet'te büyük Dynamic Type ayarında katlamanın altına düşebiliyordu. Artık özet
 *    kayar, düğme altta durur.
 * 3. **Grabber ile detent tutarlı.** Tek detent'te grabber, değiştiremeyeceği bir sürükleme
 *    ve döngüleyeceği ikinci bir durak olmayan bir dokunma vaat ediyordu. İki detent
 *    verildi: `sheets.md`: "Include a grabber in a resizable sheet."
 */
export default function OnayEkrani() {
  const { colors } = useTheme();
  const { arac } = useBle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { komut, baslik } = useLocalSearchParams<{ komut?: string; baslik?: string }>();
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const komutAdi = baslik ?? 'Kapıları kilitle';
  const gonderilebilir = arac === 'bagli';

  /**
   * Gönderim henüz yok.
   *
   * Eskiden bu fonksiyon `setGonderiliyor(true)` → **Success haptiği** → `router.back()`
   * zincirini tek tick içinde çalıştırıyordu. İki sonucu vardı: `Gönderiliyor…` etiketi hiç
   * render edilemiyordu ve **hiç gönderilmemiş** bir komut için olumlu bir haptik
   * veriyordu — üstelik `kilit` için, yani kritik komutlardan biri için.
   *
   * HIG (`playing-haptics.md › Best practices`): "It's important to build a clear, causal
   * relationship between each haptic and the action that causes it."
   *
   * BLE yazma katmanı gelene kadar **haptik hiç çalmıyor**: sonucu görsel taşıyor, haptik
   * yalnızca ona eşlik edecek. Gönderim bağlandığında bu fonksiyon `async` olur, `await`
   * eder ve ancak ondan sonra `Success` ya da başarısızlıkta `Warning` çalar.
   */
  const gonder = useCallback(() => {
    if (!gonderilebilir) return;
    setGonderiliyor(true);
  }, [gonderilebilir]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Komutu onayla',
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { ...FONTS.bodySemiBold, color: colors.text },
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vazgeç"
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Text
                style={[styles.iptalMetin, { color: colors.accent }]}
                maxFontSizeMultiplier={1.4}>
                Vazgeç
              </Text>
            </Pressable>
          ),
        }}
      />

      <View style={[styles.kap, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.page}>
          <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
            {komutAdi}
          </Text>

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
                <Text
                  style={[styles.ozetEtiket, { color: colors.muted }]}
                  maxFontSizeMultiplier={1.6}>
                  {satir.etiket}
                </Text>
                <Text
                  style={[styles.ozetDeger, { color: colors.text }]}
                  maxFontSizeMultiplier={1.6}>
                  {satir.deger}
                </Text>
              </View>
            ))}
          </Card>

          <View style={styles.cipler}>
            <Pill dotColor={colors.ok}>
              Oturum anahtarıyla imzalı
            </Pill>
            <Pill dotColor={colors.accent}>
              Tekrar sayacı taşır
            </Pill>
          </View>
          <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
            Aynı paket ikinci kez kabul edilmez.
          </Text>

          <RuleBox title="KRİTİK KOMUTLAR VE MİSAFİR YETKİSİ">
            {`${KRITIK_KOMUTLAR.join(', ')} komutları misafir yetkisinde tamamen kapalıdır. Kapı, uygulama kilidi, eşleşmiş telefon ve imzalı komuttur — bu onay ekranı yanlışlıkla göndermeyi engeller, kimlik doğrulamaz.`}
          </RuleBox>
        </ScrollView>

        {/*
          Sabit ayak: birincil eylem her punto ayarında aynı yerde. Kaydırmanın içindeyken
          %80 yükseklikli sheet'te katlamanın altına düşebiliyordu.
        */}
        <View
          style={[
            styles.ayak,
            { borderColor: colors.line, paddingBottom: insets.bottom + SPACING.md },
          ]}>
          {gonderilebilir ? null : (
            <Text
              style={[styles.engelNot, { color: colors.warn }]}
              accessibilityRole="alert"
              maxFontSizeMultiplier={2}>
              Komut gönderilemiyor — {bleCipMetni(arac).toLocaleLowerCase('tr-TR')}.
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={komutAdi}
            accessibilityHint={gonderilebilir ? undefined : 'Araç bağlanınca etkinleşir'}
            disabled={gonderiliyor || !gonderilebilir}
            onPress={gonder}
            style={({ pressed }) => [
              styles.birincil,
              {
                backgroundColor: gonderilebilir ? colors.accent : colors.surfaceRaised,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            {gonderiliyor ? <ActivityIndicator color={colors.bg} /> : null}
            <Text
              style={[
                styles.birincilMetin,
                { color: gonderilebilir ? colors.bg : colors.dim },
              ]}
              maxFontSizeMultiplier={1.4}>
              {gonderiliyor ? 'Gönderiliyor…' : komutAdi}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  kap: { flex: 1 },
  page: { padding: SPACING.lg, gap: SPACING.lg },
  baslik: { ...FONTS.display, fontSize: 26 },
  iptalMetin: { ...FONTS.body, fontSize: TYPE_SCALE.body },
  ozetSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 30 },
  ozetEtiket: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.label },
  ozetDeger: { ...FONTS.mono, fontSize: TYPE_SCALE.caption, textAlign: 'right' },
  ayak: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  engelNot: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 17 },
  birincil: {
    flexDirection: 'row',
    gap: SPACING.sm,
    minHeight: HIT_SIZE + 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birincilMetin: { ...FONTS.bodySemiBold, fontSize: 16 },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  not: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 17 },
});
