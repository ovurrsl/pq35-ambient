import { useCallback, useState } from 'react';
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

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Giriş — Supabase Auth (e-posta + şifre).
 *
 * Şifre uygulamada saklanmaz. Uygulamanın tuttuğu tek sır, Keychain'deki refresh token'dır.
 * Oran kısıtlaması ve hatalı deneme sınırı sunucuda uygulanır; istemci tarafı bir sayaç
 * güvenlik sağlamaz.
 */
export default function GirisEkrani() {
  const { colors } = useTheme();
  const { girisTamamlandi } = useAuth();
  const router = useRouter();

  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

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

    // MFA açıksa Supabase oturumu "aal1" seviyesinde döner; TOTP doğrulaması gerekir.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
      router.push('/(auth)/dogrulama');
      return;
    }

    if (data.session) {
      await girisTamamlandi(data.session);
    }
  }, [eposta, sifre, girisTamamlandi, router]);

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
          Şifre uygulamada saklanmaz. Uygulamanın tuttuğu tek sır Keychain’deki refresh
          token’dır. Hatalı deneme sınırı ve oran kısıtlaması sunucuda uygulanır.
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
