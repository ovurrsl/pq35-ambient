import { useCallback, useEffect, useRef, useState } from 'react';
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

import { Card, SectionLabel } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { authHatasi } from '@/lib/hata-metni';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

const KOD_UZUNLUK = 6;

/**
 * İki adımlı doğrulama — TOTP.
 *
 * MFA yalnızca **buluta** girişi korur. Araçla BLE bağlantısı ayrı bir güven sınırıdır ve
 * bonding'e dayanır; araç yakındayken internet de MFA da gerekmez (CLAUDE.md §7.1).
 */
export default function DogrulamaEkrani() {
  const { colors } = useTheme();
  const { girisTamamlandi } = useAuth();

  const [kod, setKod] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const girdiRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => girdiRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const dogrula = useCallback(async () => {
    setCalisiyor(true);
    setHata(null);

    const { data: faktorler, error: listeHatasi } = await supabase.auth.mfa.listFactors();
    if (listeHatasi) {
      setCalisiyor(false);
      setHata(authHatasi(listeHatasi));
      return;
    }

    const totp = faktorler?.totp?.[0];
    if (!totp) {
      setCalisiyor(false);
      setHata('Hesapta kayıtlı bir TOTP faktörü bulunamadı.');
      return;
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: totp.id,
      code: kod,
    });

    if (error) {
      setCalisiyor(false);
      setKod('');
      setHata(authHatasi(error));
      return;
    }

    const { data } = await supabase.auth.getSession();
    setCalisiyor(false);
    if (data.session) {
      await girisTamamlandi(data.session);
    }
  }, [kod, girisTamamlandi]);

  const hazir = kod.length === KOD_UZUNLUK && !calisiyor;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.basliklar}>
          <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
            Doğrulama
          </Text>
          <Text style={[styles.altBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
            TOTP · {KOD_UZUNLUK} HANE
          </Text>
        </View>

        {/* Görsel kutular dekoratiftir; gerçek girdi tektir ve üstlerinde şeffaf durur. */}
        <Pressable
          accessibilityRole="none"
          onPress={() => girdiRef.current?.focus()}
          style={styles.kodAlani}>
          <View style={styles.kutular} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {Array.from({ length: KOD_UZUNLUK }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.kutu,
                  {
                    borderColor: i === kod.length ? colors.accent : colors.line,
                    backgroundColor: colors.glassFallback,
                  },
                ]}>
                <Text style={[styles.kutuMetin, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
                  {kod[i] ?? '·'}
                </Text>
              </View>
            ))}
          </View>
          <TextInput
            ref={girdiRef}
            accessibilityLabel={`${KOD_UZUNLUK} haneli doğrulama kodu`}
            value={kod}
            onChangeText={(t) => setKod(t.replace(/\D/g, '').slice(0, KOD_UZUNLUK))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={KOD_UZUNLUK}
            style={styles.gizliGirdi}
          />
        </Pressable>

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
          accessibilityLabel="Doğrula"
          disabled={!hazir}
          onPress={dogrula}
          style={({ pressed }) => [
            styles.birincil,
            { backgroundColor: colors.accent, opacity: hazir ? (pressed ? 0.7 : 1) : 0.4 },
          ]}>
          <Text style={[styles.birincilMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
            {calisiyor ? 'Doğrulanıyor…' : 'Doğrula'}
          </Text>
        </Pressable>

        <Card>
          <SectionLabel>KURTARMA KODLARI</SectionLabel>
          <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
            Kurtarma kodları bir kez gösterilir ve her biri tek kullanımlıktır. Çevrimdışı
            sakla; telefonunu kaybedersen hesaba yalnızca onlarla dönebilirsin.
          </Text>
        </Card>

        <View style={styles.sinirlar}>
          <Pill dotColor={colors.accent}>Bulut · JWT + TOTP</Pill>
          <Pill dotColor={colors.ok}>Araç · BLE bonding</Pill>
        </View>
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          MFA yalnızca buluta girişi korur. Araçla bağlantı ayrı bir güven sınırıdır.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg, justifyContent: 'center' },
  basliklar: { gap: 2 },
  baslik: { ...FONTS.display, fontSize: 28 },
  altBaslik: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.caption },
  kodAlani: { position: 'relative' },
  kutular: { flexDirection: 'row', gap: SPACING.sm },
  kutu: {
    flex: 1,
    height: 58,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuMetin: { ...FONTS.monoBold, fontSize: 22 },
  gizliGirdi: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, color: 'transparent' },
  hata: {
    ...FONTS.body,
    fontSize: TYPE_SCALE.label,
    lineHeight: 19,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  birincil: { height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  birincilMetin: { ...FONTS.bodySemiBold, fontSize: 16 },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
  sinirlar: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  not: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 17 },
});
