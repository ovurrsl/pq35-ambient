import { useCallback, type ComponentProps, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter, type Href } from 'expo-router';

import { Card, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { maskEmail } from '@/lib/session-vault';
import { useAuth } from '@/state/auth-context';
import { useTheme } from '@/theme/theme-provider';
import { BUS_COLORS, FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE, ZONE_COLORS } from '@/theme/tokens';

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

  const eposta = durum.ad === 'acik' ? durum.session.user.email : null;
  const maskeli = eposta ? maskEmail(eposta) : '·····@···.···';

  // Çıkış Keychain girdisini de siler; geri alınamaz, bu yüzden önce onay sorulur.
  const oturumuKapat = useCallback(() => {
    Alert.alert(
      'Oturumu kapat',
      'Keychain’deki saklanan anahtar silinir. Tekrar girmek için e-posta, şifre ve TOTP gerekir.',
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
      <View style={styles.baslikBlok}>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Ayarlar
        </Text>
        <Text style={[styles.altBaslik, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Hesap, güvenlik ve cihazlar
        </Text>
      </View>

      <Card style={styles.listeKart}>
        <View style={styles.hesapSatir}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
            <Ikon name="person.crop.circle" color={colors.muted} size={20} />
          </View>
          <View style={styles.hesapMetin}>
            <Text style={[styles.hesapEposta, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
              {maskeli}
            </Text>
            <View style={styles.rozetSatir}>
              <DoluRozet bg={colors.accent} fg={colors.bg}>
                Sahip
              </DoluRozet>
              <DoluRozet bg={colors.ok} fg={colors.bg}>
                MFA açık
              </DoluRozet>
              <Pill>JWT geçerli</Pill>
            </View>
          </View>
        </View>

        <Ayirac />

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
      </Card>

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
          ikonRengi={BUS_COLORS.ble}
          baslik="Cihazlar ve telefonlar"
          altBaslik="Araç kartı · eşleşmiş telefonlar"
          onPress={() => git('/ayarlar/cihazlar')}
        />
        <Ayirac />
        <ListeSatiri
          ikon="bell"
          ikonRengi={colors.warn}
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
          ikonRengi={ZONE_COLORS.z7}
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
          <Pill dotColor={colors.ok}>BLE bağlı</Pill>
          <Pill dotColor={colors.accent}>Bulut senkron</Pill>
          <View style={styles.esnek} />
          <Text style={[styles.mono, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
            senkron ··:··
          </Text>
        </View>
        <Text style={[styles.aciklama, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Araç yakındayken internet gerekmez; bulut oturumu konum geçmişi ve panel senkronu
          içindir.
        </Text>
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
  baslikBlok: { gap: SPACING.xs },
  baslik: { fontFamily: FONTS.display, fontSize: TYPE_SCALE.title },
  altBaslik: { fontFamily: FONTS.body, fontSize: TYPE_SCALE.caption },

  listeKart: { paddingVertical: 0, paddingHorizontal: SPACING.md, gap: 0 },
  ayirac: { height: StyleSheet.hairlineWidth },
  esnek: { flex: 1 },
  mono: { fontFamily: FONTS.mono, fontSize: TYPE_SCALE.micro },

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
  hesapEposta: { fontFamily: FONTS.mono, fontSize: TYPE_SCALE.label + 1 },
  rozetSatir: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },

  satir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: HIT_SIZE + 6 },
  listeSatir: { minHeight: 62 },
  satirMetin: { gap: 2, flexShrink: 1 },
  satirBaslik: { fontFamily: FONTS.body, fontSize: TYPE_SCALE.body },
  satirAlt: { fontFamily: FONTS.body, fontSize: TYPE_SCALE.micro },
  satirAltMono: { fontFamily: FONTS.mono, fontSize: TYPE_SCALE.micro },
  satirNot: { fontFamily: FONTS.body, fontSize: TYPE_SCALE.micro, flexShrink: 1, textAlign: 'right' },

  doluRozet: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  doluRozetMetin: { fontFamily: FONTS.monoBold, fontSize: 10 },
  cerceveliRozet: { borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  cerceveliRozetMetin: { fontFamily: FONTS.mono, fontSize: 10 },

  durumSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  aciklama: { fontFamily: FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 18 },
  vurgu: { fontFamily: FONTS.bodySemiBold },

  ikonYedek: { borderRadius: 4, borderWidth: 1.5 },
});
