import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, usePathname } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Eşleşmeyen yol — EMNİYET AĞI.
 *
 * NEDEN VAR: expo-router'ın varsayılan "Unmatched Route" ekranı bir **çıkmaz sokaktır**.
 * Açılışta oraya düşülürse "Go back" gidecek bir yer bulamaz ve uygulama orada kalır —
 * kullanıcı için bu, uygulamanın hiç açılmaması demektir. Tam olarak bu oldu: sekmeler
 * klasöre taşınınca `/` rotası kayboldu ve uygulama `pq35ambient:///` üzerinde kilitlendi.
 *
 * Kök rota `app/index.tsx` ile geri geldi. Bu dosya ise **bir daha kilitlenmemesi** için:
 * hangi sebeple olursa olsun (eski bir derin bağlantı, silinmiş bir ekran, yazım hatası)
 * eşleşmeyen her yol sessizce sekmelere dönüyor.
 *
 * Yol geliştirme sırasında görünür kalıyor, çünkü orada bilmek isteriz; kullanıcı
 * sürümünde yalnızca kısa bir geçiş ekranı görünür.
 */
export default function Bulunamadi() {
  const { colors } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    if (__DEV__) console.warn('[rota] eşleşmeyen yol:', pathname);
  }, [pathname]);

  return (
    <View style={[styles.kap, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.accent} />
      <Text style={[styles.metin, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
        Açılıyor…
      </Text>
      {__DEV__ ? (
        <Text style={[styles.yol, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
          eşleşmeyen yol: {pathname}
        </Text>
      ) : null}
      <Redirect href="/(tabs)/bolgeler" />
    </View>
  );
}

const styles = StyleSheet.create({
  kap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  metin: { ...FONTS.body, fontSize: TYPE_SCALE.label },
  yol: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
});
