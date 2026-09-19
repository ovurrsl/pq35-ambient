import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Uygulama güncellemesinin durumu.
 *
 * NEDEN VAR: uygulama kendini güncelliyordu ama bunu hiç söylemiyordu. Yapının gerçek
 * ayarları (yüklü .ipa'nın `Expo.plist`'inden okundu):
 *
 *   EXUpdatesEnabled        True
 *   EXUpdatesCheckOnLaunch  ALWAYS       → her soğuk açılışta sunucuya sorulur
 *   EXUpdatesLaunchWaitMs   0            → BEKLENMEZ
 *
 * `LaunchWaitMs = 0` olduğu için uygulama **önbellekteki paketle hemen açılır** ve yeni
 * paketi arka planda indirir; indirilen paket **bir sonraki açılışta** devreye girer.
 * Yani kullanıcı açısından bir açılışlık gecikme var ve hiçbir yerde yazmıyordu:
 * "güncelledim" denen bir değişikliği göremeyip uygulamayı tekrar tekrar kapatıp açmak
 * tam olarak bu boşluktan çıkıyor.
 *
 * Çözüm `fallbackToCacheTimeout` vermek DEĞİL: o, her soğuk açılışta açılış ekranında
 * ağ beklemek demek — kötü şebekede görünür bir takılma. Bunun yerine durum **arayüzde**
 * gösteriliyor ve hazır olan güncelleme tek dokunuşla uygulanıyor
 * (`feedback.md › Best practices`: geri bildirim uyarı penceresinde değil arayüzde durur).
 */
export function GuncellemeDurumu() {
  const { colors } = useTheme();
  const { currentlyRunning, isUpdatePending, isDownloading, isChecking } = Updates.useUpdates();
  const [uyguluyor, setUyguluyor] = useState(false);

  const uygula = useCallback(async () => {
    setUyguluyor(true);
    try {
      await Updates.reloadAsync();
    } catch {
      // Yeniden başlatma başarısızsa güncelleme yine bir sonraki açılışta devreye girer;
      // burada kullanıcıya verilecek ek bir eylem yok.
      setUyguluyor(false);
    }
  }, []);

  if (!Updates.isEnabled) {
    return (
      <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
        Bu yapıda canlı güncelleme yok (geliştirme derlemesi).
      </Text>
    );
  }

  /** Gömülü paketle mi yoksa indirilmiş bir güncellemeyle mi çalışıyoruz? */
  const kaynak = currentlyRunning.isEmbeddedLaunch
    ? 'Derlemeyle gelen sürüm'
    : `Güncelleme ${(currentlyRunning.updateId ?? '').slice(0, 8)}`;

  return (
    <View style={styles.kap}>
      <View style={styles.satir}>
        <Text style={[styles.etiket, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
          Çalışan sürüm
        </Text>
        <Text style={[styles.deger, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
          {kaynak}
        </Text>
      </View>

      {isChecking || isDownloading ? (
        <View style={styles.durumSatir}>
          <ActivityIndicator color={colors.muted} />
          <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
            {isDownloading ? 'Yeni sürüm indiriliyor…' : 'Güncelleme aranıyor…'}
          </Text>
        </View>
      ) : null}

      {isUpdatePending ? (
        <>
          <Text style={[styles.not, { color: colors.text }]} maxFontSizeMultiplier={2}>
            Yeni sürüm indirildi. Uygulamayı bir daha açtığında kendiliğinden devreye girer;
            beklemek istemezsen şimdi uygula.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Güncellemeyi uygula"
            accessibilityHint="Uygulamayı yeniden başlatır"
            disabled={uyguluyor}
            onPress={uygula}
            style={({ pressed }) => [
              styles.dugme,
              { backgroundColor: colors.accent, opacity: pressed || uyguluyor ? 0.7 : 1 },
            ]}>
            {uyguluyor ? <ActivityIndicator color={colors.bg} /> : null}
            <Text style={[styles.dugmeMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
              {uyguluyor ? 'Yeniden başlatılıyor…' : 'Güncellemeyi uygula'}
            </Text>
          </Pressable>
        </>
      ) : (
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Güncellemeler her açılışta arka planda indirilir ve bir sonraki açılışta devreye
          girer. Kapatıp açmak için uygulamayı görev değiştiriciden tamamen kapatman gerekir.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kap: { gap: SPACING.xs },
  satir: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm },
  etiket: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.label },
  deger: { ...FONTS.mono, fontSize: TYPE_SCALE.caption, textAlign: 'right' },
  durumSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  not: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 17 },
  dugme: {
    flexDirection: 'row',
    gap: SPACING.sm,
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  dugmeMetin: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.body },
});
