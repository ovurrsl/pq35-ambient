import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { kilitYetenegi, type KilitYetenegi } from '@/lib/biyometri';
import { useAuth } from '@/state/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Uygulama kilidi — Face ID kapısı.
 *
 * Bu ekranın en önemli işi bir yanlış anlamayı düzeltmek:
 * **Face ID kimlik doğrulama değildir.** Cihazda yereldir, sunucuya hiçbir şey kanıtlamaz.
 * Tek yaptığı Keychain'deki refresh token'ı açmaktır; sunucuya karşı kimlik Supabase JWT'dir.
 */
export default function KilitEkrani() {
  const { colors } = useTheme();
  const { durum, kilidiAc, cikisYap } = useAuth();
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  // Cihazda ne varsa onu yazıyoruz: iPad'lerin çoğunda Touch ID, bazılarında Face ID.
  const [kilit, setKilit] = useState<KilitYetenegi | null>(null);

  useEffect(() => {
    let alive = true;
    void kilitYetenegi().then((k) => {
      if (alive) setKilit(k);
    });
    return () => {
      alive = false;
    };
  }, []);

  const maskeli = durum.ad === 'kilitli' ? durum.maskeliEposta : null;

  const ac = useCallback(async () => {
    setCalisiyor(true);
    setHata(null);
    const sonuc = await kilidiAc();
    setCalisiyor(false);

    if (sonuc.kind === 'ok') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (sonuc.kind === 'iptal') {
      setHata(`${kilit?.ad ?? 'Kilit'} doğrulanmadı. Tekrar dene veya şifrenle gir.`);
    } else if (sonuc.kind === 'yeniden-giris') {
      setHata(`Kayıtlı anahtar geçersiz: ${sonuc.sebep} Yeniden giriş gerekiyor.`);
    }
  }, [kilidiAc, kilit]);

  /** Face ID'yi atlayıp şifreyle girmek, saklanan anahtardan vazgeçmek demektir. */
  const sifreIleGir = useCallback(async () => {
    await cikisYap();
  }, [cikisYap]);

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.durumSatiri}>
        <Pill dotColor={colors.ok}>Araç BLE menzilinde</Pill>
        <Pill dotColor={colors.warn}>Bulut oturumu kilitli</Pill>
      </View>

      <View style={styles.merkez}>
        <SymbolView
          name="faceid"
          size={92}
          tintColor={colors.accent}
          fallback={<View style={[styles.ikonYedek, { borderColor: colors.accent }]} />}
        />
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Uygulamayı aç
        </Text>
        {maskeli ? (
          <Text style={[styles.hesap, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
            {maskeli}
          </Text>
        ) : null}
      </View>

      {hata ? (
        <Text
          style={[styles.hata, { color: colors.danger, borderColor: colors.danger }]}
          accessibilityRole="alert"
          maxFontSizeMultiplier={2}>
          {hata}
        </Text>
      ) : null}

      <View style={styles.eylemler}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${kilit?.ad ?? 'Kilit'} ile aç`}
          disabled={calisiyor}
          onPress={ac}
          style={({ pressed }) => [
            styles.birincil,
            { backgroundColor: colors.accent, opacity: pressed || calisiyor ? 0.7 : 1 },
          ]}>
          <Text style={[styles.birincilMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
            {calisiyor ? 'Doğrulanıyor…' : `${kilit?.ad ?? 'Kilit'} ile aç`}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Şifre ile gir"
          accessibilityHint="Saklanan anahtarı siler ve e-posta ile şifre girişine döner"
          disabled={calisiyor}
          onPress={sifreIleGir}
          style={({ pressed }) => [
            styles.ikincil,
            { borderColor: colors.line, opacity: pressed ? 0.6 : 1 },
          ]}>
          <Text style={[styles.ikincilMetin, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
            Şifre ile gir
          </Text>
        </Pressable>
      </View>

      <Card>
        <SectionLabel>NE OLUYOR</SectionLabel>
        <View style={styles.zincir}>
          {[
            { ad: kilit?.ad ?? 'Kilit', alt: 'cihazda yerel' },
            { ad: 'Keychain', alt: 'biometryCurrentSet' },
            { ad: 'refresh token', alt: 'saklanan anahtar' },
            { ad: 'Supabase JWT', alt: 'sunucu kimliği' },
          ].map((adim, i, hepsi) => (
            <View key={adim.ad} style={styles.zincirSatir}>
              <View style={[styles.nokta, { backgroundColor: i === 3 ? colors.ok : colors.accent }]} />
              <View style={styles.zincirMetin}>
                <Text style={[styles.zincirAd, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
                  {adim.ad}
                </Text>
                <Text style={[styles.zincirAlt, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
                  {adim.alt}
                </Text>
              </View>
              {i < hepsi.length - 1 ? (
                <Text style={[styles.ok, { color: colors.dim }]} accessibilityElementsHidden>
                  ↓
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </Card>

      {kilit && !kilit.saklanabilir ? (
        <Card>
          <SectionLabel>BU CİHAZDA OTURUM SAKLANAMAZ</SectionLabel>
          <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
            Saklanan anahtar biyometriye bağlanır; bu cihazda kayıtlı biyometri yok. Her
            açılışta e-posta, şifre ve TOTP ile giriş gerekir. Cihaz parolası uygulamayı
            korur ama anahtarı bağlayamaz.
          </Text>
          <UnverifiedBadge>BİYOMETRİ KURULUNCA DEĞİŞİR</UnverifiedBadge>
        </Card>
      ) : null}

      <RuleBox title={`${(kilit?.ad ?? 'KİLİT').toLocaleUpperCase('tr-TR')} KİMLİK DOĞRULAMA DEĞİLDİR`}>
        Face ID cihazda yereldir ve sunucuya hiçbir şey kanıtlamaz. Sunucuya karşı kimlik
        Supabase JWT’dir. Kayıtlı yüz seti değişirse saklanan anahtar geçersiz olur ve
        e-posta, şifre ve TOTP ile yeniden giriş gerekir.
      </RuleBox>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg, justifyContent: 'center' },
  durumSatiri: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  merkez: { alignItems: 'center', gap: SPACING.sm },
  ikonYedek: { width: 92, height: 92, borderRadius: RADIUS.xl, borderWidth: 2 },
  baslik: { ...FONTS.display, fontSize: 28 },
  hesap: { ...FONTS.mono, fontSize: TYPE_SCALE.label },
  hata: {
    ...FONTS.body,
    fontSize: TYPE_SCALE.label,
    lineHeight: 19,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  eylemler: { gap: SPACING.sm },
  birincil: {
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birincilMetin: { ...FONTS.bodySemiBold, fontSize: 16 },
  ikincilMetin: { ...FONTS.bodySemiBold, fontSize: 15 },
  ikincil: {
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zincir: { gap: 2 },
  zincirSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 34 },
  nokta: { width: 8, height: 8, borderRadius: RADIUS.pill },
  zincirMetin: { flex: 1 },
  zincirAd: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.label },
  zincirAlt: { ...FONTS.mono, fontSize: 10 },
  ok: { fontSize: 14 },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
});
