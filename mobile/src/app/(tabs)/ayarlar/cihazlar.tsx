import { useCallback, useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Card, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { BUS_COLORS, FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE, ZONE_COLORS, markaMetin } from '@/theme/tokens';

type IkonAdi = ComponentProps<typeof SymbolView>['name'];

type Yetki = 'sahip' | 'misafir';

interface EslesmisTelefon {
  readonly id: string;
  readonly yetki: Yetki;
  readonly buCihaz: boolean;
  readonly durum: string;
}

/**
 * Eşleşmiş telefonlar. Cihaz adları **yer tutucudur** — gerçek adlar bonding kayıtları
 * araçtan okunduğunda gelir. Uydurma ad, MAC veya token yazılmaz; iOS zaten BLE adresini
 * ~15 dakikada bir değiştirir (RPA), sabit bir adres listesi mümkün değildir (CLAUDE.md §7).
 */
const TELEFONLAR: readonly EslesmisTelefon[] = [
  { id: 'bond-1', yetki: 'sahip', buCihaz: true, durum: 'Bağlı · bonding kaydı var' },
  { id: 'bond-2', yetki: 'sahip', buCihaz: false, durum: 'son bağlantı ··:··' },
  { id: 'bond-3', yetki: 'misafir', buCihaz: false, durum: 'son bağlantı ··:··' },
];

/**
 * Cihazlar — araç kartı ve eşleşmiş telefonlar.
 *
 * İki ayrı şey aynı ekranda durur ama karıştırılmaz: araç **device token** ile buluta
 * yazar (ESP32 asla service role anahtarı taşımaz, sert kural 11), telefonlar ise araca
 * **BLE bonding** ile bağlanır. Biri iptal edilince diğeri etkilenmez.
 */
export default function CihazlarEkrani() {
  const { colors, scheme } = useTheme();
  const router = useRouter();

  // İptal komutları araca BLE üzerinden gidecek; o katman henüz yazılmadı, bu yüzden
  // burada yalnızca kullanıcının niyeti yerel olarak işaretlenir.
  const [tokenIptalBekliyor, setTokenIptalBekliyor] = useState(false);
  const [iptalEdilenler, setIptalEdilenler] = useState<readonly string[]>([]);

  const tokenIptalEt = useCallback(() => {
    Alert.alert(
      'Cihaz anahtarını iptal et',
      'Aracın device token’ı geçersiz olur ve araç buluta yazamaz. Etkilenen tek şey bu cihazdır; hesabın ve diğer telefonlar etkilenmez.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'İptal et', style: 'destructive', onPress: () => setTokenIptalBekliyor(true) },
      ]
    );
  }, []);

  const telefonIptalEt = useCallback((telefon: EslesmisTelefon) => {
    Alert.alert(
      'Eşleşmeyi iptal et',
      telefon.buCihaz
        ? 'Bu telefonun bonding kaydı silinir. Araca yeniden bağlanmak için baştan eşleştirme gerekir.'
        : 'Bu telefonun bonding kaydı ve yetkisi silinir. Araca yeniden bağlanamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal et',
          style: 'destructive',
          onPress: () => setIptalEdilenler((onceki) => (onceki.includes(telefon.id) ? onceki : [...onceki, telefon.id])),
        },
      ]
    );
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}
      contentInsetAdjustmentBehavior="automatic">
      <Card>
        <View style={styles.aracBaslik}>
          <View style={[styles.aracIkon, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
            <Ikon name="cpu" color={colors.accent} size={18} />
          </View>
          <View style={styles.aracMetin}>
            <Text style={[styles.aracAd, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
              PQ35-AMBIENT
            </Text>
            <View style={styles.durumSatir}>
              <View style={[styles.nokta, { backgroundColor: colors.ok }]} />
              <Text style={[styles.satirAlt, { color: colors.muted }]} maxFontSizeMultiplier={1.8}>
                Çevrimiçi · BLE bağlı
              </Text>
            </View>
          </View>
          <View style={styles.esnek} />
          <Pill>ESP32-S3</Pill>
        </View>

        <View style={styles.veriListe}>
          <VeriSatiri baslik="Firmware" deger="·.·.·">
            <UnverifiedBadge>YER TUTUCU</UnverifiedBadge>
          </VeriSatiri>
          <VeriSatiri baslik="Son görülme" deger="··:··" />
          <VeriSatiri baslik="Device token" deger="········" son>
            {tokenIptalBekliyor ? (
              <DoluRozet bg={colors.warn} fg={colors.bg}>
                İptal bekliyor
              </DoluRozet>
            ) : (
              <DoluRozet bg={colors.ok} fg={colors.bg}>
                Geçerli
              </DoluRozet>
            )}
          </VeriSatiri>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cihaz anahtarını iptal et"
          accessibilityHint="Aracın device token’ı geçersiz olur"
          accessibilityState={{ disabled: tokenIptalBekliyor }}
          disabled={tokenIptalBekliyor}
          onPress={tokenIptalEt}
          style={({ pressed }) => [
            styles.tehlikeliDugme,
            { borderColor: colors.danger, opacity: tokenIptalBekliyor ? 0.5 : pressed ? 0.6 : 1 },
          ]}>
          <Ikon name="xmark" color={colors.danger} size={15} />
          <Text style={[styles.tehlikeliMetin, { color: colors.danger }]} maxFontSizeMultiplier={1.4}>
            {tokenIptalBekliyor ? 'İptal bekliyor' : 'Cihaz anahtarını iptal et'}
          </Text>
        </Pressable>
      </Card>

      <SectionLabel>EŞLEŞMİŞ TELEFONLAR</SectionLabel>

      <Card style={styles.listeKart}>
        {TELEFONLAR.map((telefon, i) => {
          const iptalli = iptalEdilenler.includes(telefon.id);
          const misafir = telefon.yetki === 'misafir';

          return (
            <View key={telefon.id}>
              {i > 0 ? <Ayirac /> : null}
              <View style={[styles.telefonSatir, iptalli ? styles.sonuk : null]}>
                <Ikon name="iphone" color={colors.muted} size={17} />
                <View style={styles.telefonMetin}>
                  <View style={styles.rozetSatir}>
                    <Text style={[styles.telefonAd, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
                      ·········
                    </Text>
                    <DoluRozet bg={misafir ? ZONE_COLORS.z4 : colors.accent} fg={colors.bg}>
                      {misafir ? 'Misafir' : 'Sahip'}
                    </DoluRozet>
                    {telefon.buCihaz ? <Pill>Bu cihaz</Pill> : null}
                  </View>
                  <Text
                    style={[telefon.buCihaz ? styles.satirAlt : styles.satirAltMono, { color: colors.muted }]}
                    maxFontSizeMultiplier={1.8}>
                    {iptalli ? 'İptal bekliyor · araca bağlanınca uygulanır' : telefon.durum}
                  </Text>
                </View>
                <View style={styles.esnek} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    misafir ? 'Misafir telefonun eşleşmesini iptal et' : 'Sahip telefonun eşleşmesini iptal et'
                  }
                  accessibilityState={{ disabled: iptalli }}
                  disabled={iptalli}
                  onPress={() => telefonIptalEt(telefon)}
                  style={({ pressed }) => [
                    styles.satirDugme,
                    { borderColor: colors.line, opacity: iptalli ? 0.5 : pressed ? 0.6 : 1 },
                  ]}>
                  <Text style={[styles.satirDugmeMetin, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
                    İptal et
                  </Text>
                </Pressable>
              </View>

              {misafir ? (
                <View style={[styles.misafirNot, { borderTopColor: colors.line }]}>
                  <Ikon name="lock.fill" color={ZONE_COLORS.z4} size={13} />
                  <Text style={[styles.notMetin, { color: colors.muted }]} maxFontSizeMultiplier={2}>
                    Misafirde kapalı komutlar:
                  </Text>
                  <Text style={[styles.mono, { color: markaMetin(ZONE_COLORS.z4, scheme) }]} maxFontSizeMultiplier={1.6}>
                    kilit · arama · kodlama
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Yeni telefon eşleştir"
        accessibilityHint="Araç tarama ve eşleştirme akışını açar"
        onPress={() => router.push('/(auth)/eslestirme')}
        style={({ pressed }) => [
          styles.birincilDugme,
          { backgroundColor: colors.accent, opacity: pressed ? 0.75 : 1 },
        ]}>
        <Ikon name="plus" color={colors.bg} size={16} />
        <Text style={[styles.birincilMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
          Yeni telefon eşleştir
        </Text>
      </Pressable>

      <Card>
        <NotSatiri>
          Aynı anda birden çok telefon bağlanabilir; her biri ayrı bonding kaydı ve ayrı yetki
          taşır, tek tek iptal edilebilir.
        </NotSatiri>
        <NotSatiri>
          ESP32 asla Supabase service role anahtarı taşımaz — cihazın kendi device token’ı vardır;
          iptal edilince yalnızca bu cihaz etkilenir.
        </NotSatiri>
      </Card>
    </ScrollView>
  );
}

/** SF Symbol + yedek çerçeve. */
function Ikon({ name, color, size = 16 }: { name: IkonAdi; color: string; size?: number }) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      fallback={<View style={[styles.ikonYedek, { width: size, height: size, borderColor: color }]} />}
    />
  );
}

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

function VeriSatiri({
  baslik,
  deger,
  son = false,
  children,
}: {
  baslik: string;
  deger: string;
  son?: boolean;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.veriSatir,
        son ? null : { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <Text style={[styles.veriBaslik, { color: colors.text }]} maxFontSizeMultiplier={2}>
        {baslik}
      </Text>
      <View style={styles.esnek} />
      <Text style={[styles.mono, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
        {deger}
      </Text>
      {children}
    </View>
  );
}

function NotSatiri({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.not}>
      <View style={styles.notIkon}>
        <Ikon name="checkmark" color={BUS_COLORS.ble} size={14} />
      </View>
      <Text style={[styles.notMetin, { color: colors.muted }]} maxFontSizeMultiplier={2}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  listeKart: { paddingVertical: 0, paddingHorizontal: SPACING.md, gap: 0 },
  ayirac: { height: StyleSheet.hairlineWidth },
  esnek: { flex: 1 },
  sonuk: { opacity: 0.55 },
  mono: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },

  aracBaslik: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aracIkon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aracMetin: { gap: 3, flexShrink: 1 },
  aracAd: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.heading - 4 },
  durumSatir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nokta: { width: 7, height: 7, borderRadius: RADIUS.pill },

  veriListe: { gap: 0 },
  veriSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 34 },
  veriBaslik: { ...FONTS.body, fontSize: TYPE_SCALE.label },

  tehlikeliDugme: {
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  tehlikeliMetin: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.body - 1 },

  telefonSatir: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 58 },
  telefonMetin: { gap: 3, flexShrink: 1 },
  telefonAd: { ...FONTS.mono, fontSize: TYPE_SCALE.label },
  rozetSatir: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  satirAlt: { ...FONTS.body, fontSize: TYPE_SCALE.micro },
  satirAltMono: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  satirDugme: {
    minHeight: HIT_SIZE,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  satirDugmeMetin: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.label },

  misafirNot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },

  birincilDugme: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  birincilMetin: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.body },

  doluRozet: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  doluRozetMetin: { ...FONTS.monoBold, fontSize: 11 },

  not: { flexDirection: 'row', gap: 9 },
  notIkon: { paddingTop: 2 },
  notMetin: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 18, flexShrink: 1 },

  ikonYedek: { borderRadius: 4, borderWidth: 1.5 },
});
