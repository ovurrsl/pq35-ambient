import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { Session } from '@supabase/supabase-js';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Giriş — yalnızca Sign in with Apple, ya da hesapsız devam.
 *
 * E-POSTA + ŞİFRE YOLU KALDIRILDI. Bu araç sahibinin kararıydı ve Apple'ın kuralıyla
 * birebir örtüşüyor (HIG, Sign in with Apple):
 *
 *   "Don't ask people to supply a password. A key benefit of Sign in with Apple is that
 *    people don't have to create and memorize additional passwords."
 *
 * Uygulamayı tek kişi kullanıyor; ikinci bir kimlik yolu yalnızca ikinci bir saldırı
 * yüzeyi ve bakımı gereken ikinci bir ekran demekti.
 *
 * Apple akışında şifre diye bir şey yoktur: Apple imzalı bir `identityToken` döner,
 * Supabase onu `signInWithIdToken` ile doğrular. Token'ı Apple imzaladığı için istemciye
 * güvenmek gerekmez. Native akışta sağlayıcı tarafında gizli anahtar da gerekmez;
 * yalnızca bundle identifier tanıtılır.
 *
 * Hesapsız devam seçeneği de HIG'in kendi tavsiyesi:
 *
 *   "Delay sign-in as long as possible. People often abandon apps when they're forced to
 *    sign in before doing anything useful."
 *
 * Uygulamanın tuttuğu tek sır Keychain'deki refresh token'dır. Oran kısıtlaması ve hatalı
 * deneme sınırı sunucuda uygulanır; istemci tarafı bir sayaç güvenlik sağlamaz.
 */
export default function GirisEkrani() {
  const { colors, scheme } = useTheme();
  const { girisTamamlandi, cevrimdisiDevamEt } = useAuth();
  const router = useRouter();

  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [appleVar, setAppleVar] = useState<boolean | null>(null);

  // Sign in with Apple yalnızca iOS 13+ üzerinde vardır. `null` "henüz bilinmiyor"
  // demektir; düğme yerine boşluk göstermemek için bu ayrım korunuyor.
  useEffect(() => {
    let iptal = false;
    AppleAuthentication.isAvailableAsync()
      .then((v) => !iptal && setAppleVar(v))
      .catch(() => !iptal && setAppleVar(false));
    return () => {
      iptal = true;
    };
  }, []);

  /** Girişin ortak sonu: MFA gerekiyor mu, gerekmiyorsa oturumu aç. */
  const oturumuTamamla = useCallback(
    async (session: Session | null) => {
      // MFA açıksa Supabase oturumu "aal1" seviyesinde döner; TOTP doğrulaması gerekir.
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
        router.push('/(auth)/dogrulama');
        return;
      }
      if (session) {
        await girisTamamlandi(session);
      }
    },
    [girisTamamlandi, router],
  );

  const appleIleGir = useCallback(async () => {
    setCalisiyor(true);
    setHata(null);
    try {
      const kimlik = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Apple ad ve e-postayı YALNIZCA ilk girişte gönderir; sonraki girişlerde alan boş
      // gelir. Kalıcı olan tek şey identityToken içindeki `sub`, Supabase kullanıcıyı
      // ona bağlar.
      if (!kimlik.identityToken) {
        setHata('Apple kimlik jetonu alınamadı.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: kimlik.identityToken,
      });

      if (error) {
        setHata(error.message);
        return;
      }

      await oturumuTamamla(data.session);
    } catch (e) {
      // Kullanıcı Apple sayfasını kapattıysa bu bir hata değil, sessizce geç.
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      setHata(e instanceof Error ? e.message : 'Apple ile giriş başarısız.');
    } finally {
      setCalisiyor(false);
    }
  }, [oturumuTamamla]);

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.basliklar}>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Giriş
        </Text>
        <Text style={[styles.altBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
          SIGN IN WITH APPLE
        </Text>
      </View>

      {appleVar === true ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={RADIUS.md}
          style={[styles.appleDugme, calisiyor && styles.calisiyor]}
          onPress={appleIleGir}
        />
      ) : null}

      {appleVar === false ? (
        <RuleBox title="APPLE İLE GİRİŞ YOK">
          Bu cihazda Sign in with Apple bulunmuyor. Hesap gerektiren özellikler — konum
          geçmişi, sürüş kaydı senkronu ve uzaktan erişim — kullanılamaz. Geri kalan her
          şey hesapsız çalışır.
        </RuleBox>
      ) : null}

      {hata ? (
        <Text
          style={[styles.hata, { color: colors.danger, borderColor: colors.danger }]}
          accessibilityRole="alert"
          maxFontSizeMultiplier={2}>
          {hata}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Hesap açmadan devam et"
        accessibilityHint="Bulut özellikleri kapalı kalır, araç bağlantısı çalışır"
        onPress={cevrimdisiDevamEt}
        style={({ pressed }) => [
          styles.ikincil,
          { borderColor: colors.line, opacity: pressed ? 0.6 : 1 },
        ]}>
        <Text style={[styles.ikincilMetin, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
          Hesap açmadan devam et
        </Text>
      </Pressable>

      <RuleBox title="HESAP NE İÇİN GEREKLİ">
        Araç bağlantısı hesap istemez: telefon ile denetleyici arasındaki güven BLE
        eşleşmesine dayanır ve araç yakındayken internet gerekmez. Hesap yalnızca konum
        geçmişi, sürüş kaydı senkronu ve uzaktan erişim içindir — üçü de 3. faz. Hesapsız
        devam edersen bu üçü kapalı görünür, geri kalan her şey çalışır.
      </RuleBox>

      <Card>
        <SectionLabel>BUNDAN SONRA NE OLUR</SectionLabel>
        {[
          'Apple kimliği doğrular; şifre ne oluşturulur ne sorulur.',
          'İki adımlı doğrulama açıksa TOTP kodu istenir.',
          'Refresh token Keychain’e biyometrik korumayla yazılır.',
          'Bir daha bu ekran görünmez; açılışta Face ID yeter.',
        ].map((satir, i) => (
          <View key={satir} style={styles.adimSatir}>
            <Text style={[styles.adimNo, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
              {i + 1}
            </Text>
            <Text style={[styles.adimMetin, { color: colors.text }]} maxFontSizeMultiplier={2}>
              {satir}
            </Text>
          </View>
        ))}
      </Card>

      <RuleBox title="KURAL">
        Bu uygulamada şifre yoktur. Apple’ın döndürdüğü kimlik jetonunu sunucuda Supabase
        doğrular — istemcinin söylediğine güvenilmez. Uygulamanın tuttuğu tek sır
        Keychain’deki refresh token’dır. Oran kısıtlaması ve hatalı deneme sınırı sunucuda
        uygulanır.
      </RuleBox>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg, justifyContent: 'center' },
  basliklar: { gap: 2 },
  baslik: { ...FONTS.display, fontSize: 28 },
  altBaslik: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.caption },
  appleDugme: { height: HIT_SIZE + 6 },
  calisiyor: { opacity: 0.5 },
  ikincil: {
    minHeight: HIT_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ikincilMetin: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.body },
  hata: {
    ...FONTS.body,
    fontSize: TYPE_SCALE.label,
    lineHeight: 19,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  adimSatir: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  adimNo: { ...FONTS.mono, fontSize: TYPE_SCALE.caption, minWidth: 14 },
  adimMetin: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 19 },
});
