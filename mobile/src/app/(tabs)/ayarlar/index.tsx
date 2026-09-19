import { useCallback, type ComponentProps, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter, type Href } from 'expo-router';

import { Card, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { maskEmail } from '@/lib/session-vault';
import { useAuth } from '@/state/auth-context';
import { BleCip } from '@/components/ui/ble-cip';
import { GuncellemeDurumu } from '@/components/ui/guncelleme-durumu';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

type IkonAdi = ComponentProps<typeof SymbolView>['name'];

/**
 * Ayarlar kökü — hesap, alt ekranlar ve iki güven sınırının özeti.
 *
 * Hesap kartı e-postayı **asla tam** göstermez: `maskEmail` ile maskelenir. Ekranda
 * görünen şey bir kimlik kanıtı değil, yalnızca hangi hesabın açık olduğunu hatırlatan
 * görsel ipucudur; sunucuya karşı kimlik Supabase JWT'dir (CLAUDE.md §7.1).
 */
export default function AyarlarEkrani() {
  const { colors } = useTheme();
  const { durum, cikisYap } = useAuth();
  const router = useRouter();

  const cevrimdisi = durum.ad === 'cevrimdisi';
  /** Buluta gerçekten bağlıyız: açık bir Supabase oturumu var. Çevrimdışıysa yok. */
  const bulutBagli = durum.ad === 'acik';
  const eposta = durum.ad === 'acik' ? durum.session.user.email : null;
  const maskeli = eposta ? maskEmail(eposta) : null;

  // Çıkış Keychain girdisini de siler; geri alınamaz, bu yüzden önce onay sorulur.
  const oturumuKapat = useCallback(() => {
    Alert.alert(
      'Oturumu kapat',
      'Keychain’deki saklanan anahtar silinir. Tekrar girmek için Apple ile giriş gerekir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Oturumu kapat', style: 'destructive', onPress: () => void cikisYap() },
      ]
    );
  }, [cikisYap]);

  const git = useCallback((hedef: Href) => router.push(hedef), [router]);

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}
      contentInsetAdjustmentBehavior="automatic">
      <Text style={[styles.altBaslik, { color: colors.muted }]} maxFontSizeMultiplier={2}>
        Hesap, güvenlik ve cihazlar
      </Text>

      <Card style={styles.listeKart}>
        <View style={styles.hesapSatir}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
            <Ikon name="person.crop.circle" color={colors.muted} size={20} />
          </View>
          <View style={styles.hesapMetin}>
            <Text style={[styles.hesapEposta, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
              {maskeli ?? 'Hesapsız kullanım'}
            </Text>
            <View style={styles.rozetSatir}>
              {cevrimdisi ? (
                <Pill>Bulut kapalı</Pill>
              ) : (
                <>
                  <DoluRozet bg={colors.accent} fg={colors.bg}>
                    Sahip
                  </DoluRozet>
                  {/* HIG (Sign in with Apple): "Indicate when people are currently signed
                      in ... by displaying a phrase like 'Using Sign in with Apple'." */}
                  <Pill>Sign in with Apple</Pill>
                  <Pill>JWT geçerli</Pill>
                </>
              )}
            </View>
          </View>
        </View>

        <Ayirac />

        {cevrimdisi ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Apple ile giriş yap"
            accessibilityHint="Konum geçmişi, sürüş kaydı senkronu ve uzaktan erişimi açar"
            onPress={() => git('/(auth)/giris')}
            style={({ pressed }) => [styles.satir, { opacity: pressed ? 0.6 : 1 }]}>
            <Ikon name="person.crop.circle.badge.plus" color={colors.accent} />
            <Text style={[styles.satirBaslik, { color: colors.accent }]} maxFontSizeMultiplier={2}>
              Apple ile giriş yap
            </Text>
            <View style={styles.esnek} />
            <Text style={[styles.satirNot, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
              Bulut özelliklerini açar
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Oturumu kapat"
            accessibilityHint="Keychain’de saklanan anahtar silinir"
            onPress={oturumuKapat}
            style={({ pressed }) => [styles.satir, { opacity: pressed ? 0.6 : 1 }]}>
            <Ikon name="rectangle.portrait.and.arrow.right" color={colors.danger} />
            <Text style={[styles.satirBaslik, { color: colors.danger }]} maxFontSizeMultiplier={2}>
              Oturumu kapat
            </Text>
            <View style={styles.esnek} />
            <Text style={[styles.satirNot, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
              Keychain anahtarı silinir
            </Text>
          </Pressable>
        )}
      </Card>

      {/*
        AYARLAR LİSTESİNİN RENGİ:
        Altı satır altı farklı ton taşıyordu — accent, BUS_COLORS.ble, warn, danger,
        ZONE_COLORS.z7, muted. "Araç bilgileri" turkuazdı, çünkü z7 arka ayak altının
        rengiydi; satırla hiçbir ilgisi yoktu. `tokens.ts` başındaki palet kuralı bunu
        zaten yasaklıyordu (bölge renkleri yalnızca kimlik noktası, hat renkleri yalnızca
        teknik diyagram) ve `color.md › Best practices` de aynı şeyi söylüyor: "Avoid using
        the same color to mean different things."

        Artık gezinme satırlarının tamamı accent taşıyor; renk yalnızca **uyarı** için
        ayrıldı: Gizli özellikler `danger`, çünkü orada gerçekten bir risk var.
      */}
      <SectionLabel>AYARLAR</SectionLabel>

      <Card style={styles.listeKart}>
        <ListeSatiri
          ikon="lock.shield"
          ikonRengi={colors.accent}
          baslik="Güvenlik"
          altBaslik="Uygulama kilidi · TOTP MFA · oturumlar"
          onPress={() => git('/ayarlar/guvenlik')}
        />
        <Ayirac />
        <ListeSatiri
          ikon="iphone"
          ikonRengi={colors.accent}
          baslik="Cihazlar ve telefonlar"
          altBaslik="Araç kartı · eşleşmiş telefonlar"
          onPress={() => git('/ayarlar/cihazlar')}
        />
      </Card>

      {/*
        AYRI KART, AYRI BAŞLIK:
        Altı satırın dördü hiçbir yere gitmiyordu — `onPress` yok, %45 saydamlık, chevron
        yerine "yakında". Tek listede olunca uygulamanın ana ayar listesi çoğunlukla
        kullanılamaz görünüyordu.

        Silmek de doğru değil: bu depo yazılmamış şeyleri gizlemiyor, gösteriyor
        (CLAUDE.md §12'nin ruhu) ve bu dört satır araç sahibinin bilerek ekrana koyduğu
        yol haritası. Bu yüzden ayrıldılar: yukarıdaki grup tamamen çalışır, aşağıdaki
        grup ne geleceğinin listesi.

        `design-principles.md › Simplicity`: "A well-designed experience removes the
        unnecessary, with every element earning its place." — burada eleman yerini
        koruyor, ama doğru grupta.
      */}
      <SectionLabel>HENÜZ YAZILMADI</SectionLabel>

      <Card style={styles.listeKart}>
        <ListeSatiri
          ikon="bell"
          ikonRengi={colors.accent}
          baslik="Bildirimler"
          altBaslik="Kapı açık · düşük akü · hat sessiz"
        />
        <Ayirac />
        <ListeSatiri
          ikon="chevron.left.forwardslash.chevron.right"
          ikonRengi={colors.danger}
          baslik="Gizli özellikler"
          altBaslik="VAG kodlama"
          rozet={
            <View style={[styles.cerceveliRozet, { borderColor: colors.danger }]}>
              <Text style={[styles.cerceveliRozetMetin, { color: colors.danger }]} maxFontSizeMultiplier={1.4}>
                Riskli
              </Text>
            </View>
          }
        />
        <Ayirac />
        <ListeSatiri
          ikon="car"
          ikonRengi={colors.accent}
          baslik="Araç bilgileri"
          altBaslik="VIN WVW··· · firmware"
          mono
          rozet={<UnverifiedBadge>YER TUTUCU</UnverifiedBadge>}
        />
        <Ayirac />
        <ListeSatiri
          ikon="info.circle"
          ikonRengi={colors.muted}
          baslik="Hakkında"
          altBaslik="Sürüm · lisanslar"
        />
      </Card>

      <Card>
        <View style={styles.durumSatir}>
          <BleCip />
          <Pill dotColor={bulutBagli ? colors.accent : colors.dim}>
            {bulutBagli ? 'Bulut senkron' : 'Bulut kapalı'}
          </Pill>
          <View style={styles.esnek} />
          <Text style={[styles.mono, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
            senkron ··:··
          </Text>
        </View>
        <Text style={[styles.aciklama, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Araç yakındayken internet gerekmez; bulut oturumu konum geçmişi ve panel senkronu
          içindir.
        </Text>
        <Ayirac />

        {/*
          Uygulama kendini güncelliyordu ama bunu hiç söylemiyordu; yeni sürümün bir
          sonraki açılışta devreye girdiği de hiçbir yerde yazmıyordu.
        */}
        <GuncellemeDurumu />

        <Ayirac />

        <Text style={[styles.aciklama, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Telefon ↔ Araç:{' '}
          <Text style={[styles.vurgu, { color: colors.text }]}>BLE bonding</Text> · Telefon ↔ Bulut:{' '}
          <Text style={[styles.vurgu, { color: colors.text }]}>Supabase JWT</Text>
        </Text>
      </Card>
    </ScrollView>
  );
}

/** SF Symbol + yedek çerçeve. Yedek, sembol bulunamayan sürümlerde boşluk bırakmamak için. */
function Ikon({ name, color, size = 18 }: { name: IkonAdi; color: string; size?: number }) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      fallback={<View style={[styles.ikonYedek, { width: size, height: size, borderColor: color }]} />}
    />
  );
}

/** Dolu rozet — rol ve durum etiketleri (kanvasta dolu, kontrastı yüksek). */
function DoluRozet({ children, bg, fg }: { children: string; bg: string; fg: string }) {
  return (
    <View style={[styles.doluRozet, { backgroundColor: bg }]}>
      <Text style={[styles.doluRozetMetin, { color: fg }]} maxFontSizeMultiplier={1.4}>
        {children}
      </Text>
    </View>
  );
}

function Ayirac() {
  const { colors } = useTheme();
  return <View style={[styles.ayirac, { backgroundColor: colors.line }]} />;
}

/**
 * Liste satırı. `onPress` verilmeyen satırların ekranı henüz yazılmadı; bu satırlar
 * **devre dışı** gösterilir — çalışmayan bir düğme, dürüst olmayan bir arayüzdür.
 */
function ListeSatiri({
  ikon,
  ikonRengi,
  baslik,
  altBaslik,
  mono = false,
  rozet,
  onPress,
}: {
  ikon: IkonAdi;
  ikonRengi: string;
  baslik: string;
  altBaslik: string;
  mono?: boolean;
  rozet?: ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const hazir = typeof onPress === 'function';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={baslik}
      accessibilityHint={hazir ? altBaslik : 'Bu ekran henüz yazılmadı'}
      accessibilityState={{ disabled: !hazir }}
      disabled={!hazir}
      onPress={onPress}
      style={({ pressed }) => [styles.satir, styles.listeSatir, { opacity: !hazir ? 0.45 : pressed ? 0.6 : 1 }]}>
      <Ikon name={ikon} color={ikonRengi} />
      <View style={styles.satirMetin}>
        <Text style={[styles.satirBaslik, { color: colors.text }]} maxFontSizeMultiplier={2}>
          {baslik}
        </Text>
        <Text
          style={[mono ? styles.satirAltMono : styles.satirAlt, { color: colors.muted }]}
          maxFontSizeMultiplier={1.8}>
          {altBaslik}
        </Text>
      </View>
      <View style={styles.esnek} />
      {rozet}
      {hazir ? (
        <Ikon name="chevron.right" color={colors.dim} size={15} />
      ) : (
        <Text style={[styles.mono, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          yakında
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  altBaslik: { ...FONTS.body, fontSize: TYPE_SCALE.caption },

  listeKart: { paddingVertical: 0, paddingHorizontal: SPACING.md, gap: 0 },
  ayirac: { height: StyleSheet.hairlineWidth },
  esnek: { flex: 1 },
  mono: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },

  hesapSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hesapMetin: { flex: 1, gap: 6 },
  hesapEposta: { ...FONTS.mono, fontSize: TYPE_SCALE.label + 1 },
  rozetSatir: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },

  satir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: HIT_SIZE + 6 },
  listeSatir: { minHeight: 62 },
  satirMetin: { gap: 2, flexShrink: 1 },
  satirBaslik: { ...FONTS.body, fontSize: TYPE_SCALE.body },
  satirAlt: { ...FONTS.body, fontSize: TYPE_SCALE.micro },
  satirAltMono: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  satirNot: { ...FONTS.body, fontSize: TYPE_SCALE.micro, flexShrink: 1, textAlign: 'right' },

  doluRozet: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  doluRozetMetin: { ...FONTS.monoBold, fontSize: 11 },
  cerceveliRozet: { borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  cerceveliRozetMetin: { ...FONTS.mono, fontSize: 11 },

  durumSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  aciklama: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 18 },
  vurgu: { ...FONTS.bodySemiBold },

  ikonYedek: { borderRadius: 4, borderWidth: 1.5 },
});
