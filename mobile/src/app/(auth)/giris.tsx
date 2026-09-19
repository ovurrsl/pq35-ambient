import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { Session } from '@supabase/supabase-js';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Giriş — Sign in with Apple (birincil) veya Supabase Auth e-posta + şifre (yedek).
 *
 * Apple akışında şifre diye bir şey yoktur: Apple imzalı bir `identityToken` döner,
 * Supabase onu `signInWithIdToken` ile doğrular. Token'ı Apple imzaladığı için
 * istemciye güvenmek gerekmez. Native akışta Supabase tarafında gizli anahtar da
 * gerekmez; sağlayıcıya yalnızca bundle identifier tanıtılır.
 *
 * Şifre uygulamada saklanmaz. Uygulamanın tuttuğu tek sır, Keychain'deki refresh token'dır.
 * Oran kısıtlaması ve hatalı deneme sınırı sunucuda uygulanır; istemci tarafı bir sayaç
 * güvenlik sağlamaz.
 */
export default function GirisEkrani() {
  const { colors, scheme } = useTheme();
  const { girisTamamlandi } = useAuth();
  const router = useRouter();

  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [appleVar, setAppleVar] = useState(false);

  // Sign in with Apple yalnızca iOS 13+ gerçek cihaz/simülatörde vardır; yoksa düğmeyi
  // hiç göstermeyiz, çalışmayan bir düğme göstermek yerine e-posta yolu açık kalır.
  useEffect(() => {
    let iptal = false;
    AppleAuthentication.isAvailableAsync()
      .then((v) => !iptal && setAppleVar(v))
      .catch(() => !iptal && setAppleVar(false));
    return () => {
      iptal = true;
    };
  }, []);

  /** Her iki giriş yolunun ortak sonu: MFA gerekiyor mu, gerekmiyorsa oturumu aç. */
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

  const gonder = useCallback(async () => {
    setCalisiyor(true);
    setHata(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: eposta.trim(),
      password: sifre,
    });

    setCalisiyor(false);

    if (error) {
      setHata(error.message);
      return;
    }

    await oturumuTamamla(data.session);
  }, [eposta, sifre, oturumuTamamla]);

  const gonderilebilir = eposta.trim().length > 3 && sifre.length > 0 && !calisiyor;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.basliklar}>
          <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
            Giriş
          </Text>
          <Text style={[styles.altBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
            SUPABASE AUTH
          </Text>
        </View>

        {appleVar ? (
          <View style={styles.appleBolum}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={
                scheme === 'dark'
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={RADIUS.md}
              style={styles.appleDugme}
              onPress={appleIleGir}
            />
            <View style={styles.ayirac}>
              <View style={[styles.ayiracCizgi, { backgroundColor: colors.line }]} />
              <Text
                style={[styles.ayiracMetin, { color: colors.dim }]}
                maxFontSizeMultiplier={1.4}>
                ya da e-posta ile
              </Text>
              <View style={[styles.ayiracCizgi, { backgroundColor: colors.line }]} />
            </View>
          </View>
        ) : null}

        <View style={styles.alanlar}>
          <View style={styles.alan}>
            <Text
              nativeID="giris-eposta-etiket"
              style={[styles.etiket, { color: colors.muted }]}
              maxFontSizeMultiplier={1.6}>
              E-posta
            </Text>
            <TextInput
              accessibilityLabelledBy="giris-eposta-etiket"
              accessibilityLabel="E-posta"
              value={eposta}
              onChangeText={setEposta}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
              placeholder="o···@···.com"
              placeholderTextColor={colors.dim}
              style={[styles.girdi, { color: colors.text, borderColor: colors.line, backgroundColor: colors.glassFallback }]}
            />
          </View>

          <View style={styles.alan}>
            <Text
              nativeID="giris-sifre-etiket"
              style={[styles.etiket, { color: colors.muted }]}
              maxFontSizeMultiplier={1.6}>
              Şifre
            </Text>
            <TextInput
              accessibilityLabelledBy="giris-sifre-etiket"
              accessibilityLabel="Şifre"
              value={sifre}
              onChangeText={setSifre}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              placeholder="············"
              placeholderTextColor={colors.dim}
              onSubmitEditing={gonderilebilir ? gonder : undefined}
              style={[styles.girdi, { color: colors.text, borderColor: colors.line, backgroundColor: colors.glassFallback }]}
            />
          </View>
        </View>

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
          accessibilityLabel="Devam et"
          disabled={!gonderilebilir}
          onPress={gonder}
          style={({ pressed }) => [
            styles.birincil,
            { backgroundColor: colors.accent, opacity: gonderilebilir ? (pressed ? 0.7 : 1) : 0.4 },
          ]}>
          <Text style={[styles.birincilMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
            {calisiyor ? 'Giriliyor…' : 'Devam et'}
          </Text>
        </Pressable>

        <Card>
          <SectionLabel>BUNDAN SONRA NE OLUR</SectionLabel>
          {[
            'Apple ile girersen şifre hiç oluşmaz; kimliği Apple imzalar.',
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
          Şifre uygulamada saklanmaz; Apple yolunda hiç oluşmaz. Uygulamanın tuttuğu tek
          sır Keychain’deki refresh token’dır. Apple’ın döndürdüğü kimlik jetonunu
          sunucuda Supabase doğrular — istemcinin söylediğine güvenilmez. Hatalı deneme
          sınırı ve oran kısıtlaması sunucuda uygulanır.
        </RuleBox>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg, justifyContent: 'center' },
  basliklar: { gap: 2 },
  baslik: { fontFamily: FONTS.display, fontSize: 28 },
  altBaslik: { fontFamily: FONTS.mono, fontSize: TYPE_SCALE.micro, letterSpacing: 1.4 },
  appleBolum: { gap: SPACING.lg },
  appleDugme: { height: HIT_SIZE + 6 },
  ayirac: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ayiracCizgi: { flex: 1, height: StyleSheet.hairlineWidth },
  ayiracMetin: { fontFamily: FONTS.body, fontSize: TYPE_SCALE.label },
  alanlar: { gap: SPACING.md },
  alan: { gap: 6 },
  etiket: { fontFamily: FONTS.bodyMedium, fontSize: TYPE_SCALE.label },
  girdi: {
    minHeight: HIT_SIZE + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: TYPE_SCALE.body,
  },
  hata: {
    fontFamily: FONTS.body,
    fontSize: TYPE_SCALE.label,
    lineHeight: 19,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  birincil: { height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  birincilMetin: { fontFamily: FONTS.bodySemiBold, fontSize: 16 },
  adimSatir: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  adimNo: { fontFamily: FONTS.mono, fontSize: TYPE_SCALE.caption, minWidth: 14 },
  adimMetin: { flex: 1, fontFamily: FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 19 },
});
