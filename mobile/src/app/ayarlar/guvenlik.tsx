import { useCallback, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { useTheme } from '@/theme/theme-provider';
import { BUS_COLORS, FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

type IkonAdi = ComponentProps<typeof SymbolView>['name'];

/**
 * Güvenlik ayarları — iki güven sınırı burada ayrı ayrı gösterilir:
 * telefon ↔ araç **BLE bonding**, telefon ↔ bulut **Supabase JWT** (CLAUDE.md §7.1).
 *
 * Ekranın taşıdığı tek zorunlu kural: Face ID yalnızca uygulama açılışındadır, her komutta
 * değil. Bunun karşılığı arka planda otomatik kilitlenmenin **kapatılamaz** olmasıdır —
 * aksi hâlde kapısız bir uygulama açık kalır.
 */
export default function GuvenlikEkrani() {
  const { colors } = useTheme();

  // Anahtar durumları şimdilik yerel; gerçek etkileri (Keychain girdisinin yeniden
  // yazılması, onay akışının devreye girmesi) ilgili katmanlar yazılınca bağlanacak.
  const [uygulamaKilidi, setUygulamaKilidi] = useState(true);
  const [komutOnayi, setKomutOnayi] = useState(true);

  const kilidiDegistir = useCallback((v: boolean) => setUygulamaKilidi(v), []);
  const onayiDegistir = useCallback((v: boolean) => setKomutOnayi(v), []);

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}
      contentInsetAdjustmentBehavior="automatic">
      <Card style={styles.listeKart}>
        <AnahtarSatiri
          baslik="Uygulama kilidi (Face ID)"
          altBaslik="Açılışta Keychain anahtarını Face ID açar"
          deger={uygulamaKilidi}
          onChange={kilidiDegistir}
        />
        <Ayirac />
        <AnahtarSatiri
          ikon="lock.fill"
          baslik="Arka planda otomatik kilitlenme"
          altBaslik="Kapatılamaz — uygulama kilidi tek kapı olduğu için zorunlu."
          deger
          kilitli
        />
        <Ayirac />
        <AnahtarSatiri
          baslik="Geri alınamayan komutlarda onay sor"
          altBaslik="Kilit ve arama gönderilmeden önce onay ekranı"
          deger={komutOnayi}
          onChange={onayiDegistir}
        />
      </Card>

      <Card>
        <View style={styles.kartBaslik}>
          <SectionLabel>İKİ ADIMLI DOĞRULAMA</SectionLabel>
          <View style={styles.esnek} />
          <DoluRozet bg={colors.ok} fg={colors.bg}>
            TOTP açık
          </DoluRozet>
        </View>
        <Text style={[styles.aciklama, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Yalnızca <Text style={[styles.vurgu, { color: colors.text }]}>buluta</Text> girişi korur.
          Kurtarma kodları bir kez gösterilir, her kod tek kullanımlıktır.
        </Text>
        <View style={styles.dugmeSatir}>
          <BekleyenDugme
            etiket="Kurtarma kodlarını yenile"
            renk={colors.text}
            kenar={colors.line}
            genis
          />
          <BekleyenDugme etiket="MFA'yı kapat" renk={colors.danger} kenar={colors.danger} />
        </View>
      </Card>

      <Card style={styles.listeKart}>
        <View style={[styles.kartBaslik, styles.kartBaslikSatir]}>
          <SectionLabel>OTURUMLAR</SectionLabel>
          <View style={styles.esnek} />
          <BekleyenDugme etiket="Tüm oturumları kapat" renk={colors.danger} duz />
        </View>
        <Ayirac />
        <VeriSatiri baslik="Bu telefon" deger="iOS · BLE + JWT">
          <DoluRozet bg={colors.ok} fg={colors.bg}>
            Aktif
          </DoluRozet>
        </VeriSatiri>
        <Ayirac />
        <VeriSatiri baslik="Web paneli" deger="JWT · aynı RLS" ek="son erişim ··:··" />
      </Card>

      <Card>
        <View style={styles.kartBaslik}>
          <SectionLabel>ARAÇ BAĞLANTISI (BLE)</SectionLabel>
          <View style={styles.esnek} />
          <DoluRozet bg={BUS_COLORS.ble} fg={colors.bg}>
            BONDED
          </DoluRozet>
        </View>
        <View style={styles.bleListe}>
          <BleSatiri baslik="Eşleşme" deger="LE Secure Connections · IRK" />
          <BleSatiri baslik="Oturum anahtarı" deger="bağlantı başına · sayaç ··" />
          <BleSatiri baslik="Directed advertising" deger="yalnız eşleşmiş telefona" />
          <BleSatiri baslik="iOS adresi" deger="~15 dk'da bir değişir (RPA)" son />
        </View>
        <Text style={[styles.aciklama, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Araç yakındayken internet gerekmez; bu sınır bonding’e dayanır, buluta değil. Sabit MAC
          listesi imkânsızdır, adres IRK ile çözülür.
        </Text>
      </Card>

      <RuleBox title="FACE ID KİMLİK DOĞRULAMA DEĞİLDİR">
        Face ID, Keychain’deki refresh token’ı açar; sunucuya karşı kimlik Supabase JWT’dir. Yüz
        seti değişirse (biometryCurrentSet) anahtar geçersiz olur ve Apple ile
        yeniden giriş gerekir. Face ID yalnızca uygulama açılışındadır, her komutta değil.
      </RuleBox>
    </ScrollView>
  );
}

/** SF Symbol + yedek çerçeve. */
function Ikon({ name, color, size = 14 }: { name: IkonAdi; color: string; size?: number }) {
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

/**
 * Anahtar satırı. `kilitli` olan satır gerçekten `disabled`'dır ve sönük çizilir:
 * arka planda otomatik kilitlenme bir tercih değil, tasarımın zorunlu karşılığıdır.
 */
function AnahtarSatiri({
  ikon,
  baslik,
  altBaslik,
  deger,
  kilitli = false,
  onChange,
}: {
  ikon?: IkonAdi;
  baslik: string;
  altBaslik: string;
  deger: boolean;
  kilitli?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.anahtarSatir, kilitli ? styles.sonuk : null]}>
      <View style={styles.anahtarMetin}>
        <View style={styles.baslikSatir}>
          {ikon ? <Ikon name={ikon} color={colors.muted} /> : null}
          <Text style={[styles.satirBaslik, { color: colors.text }]} maxFontSizeMultiplier={2}>
            {baslik}
          </Text>
        </View>
        <Text style={[styles.satirAlt, { color: colors.muted }]} maxFontSizeMultiplier={1.8}>
          {altBaslik}
        </Text>
      </View>
      <Switch
        value={deger}
        onValueChange={onChange}
        disabled={kilitli}
        accessibilityRole="switch"
        accessibilityLabel={baslik}
        accessibilityHint={kilitli ? 'Bu ayar kapatılamaz' : altBaslik}
        accessibilityState={{ checked: deger, disabled: kilitli }}
        trackColor={{ false: colors.line, true: colors.ok }}
        ios_backgroundColor={colors.surfaceRaised}
      />
    </View>
  );
}

function VeriSatiri({
  baslik,
  deger,
  ek,
  children,
}: {
  baslik: string;
  deger: string;
  ek?: string;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.veriSatir}>
      <Text style={[styles.veriBaslik, { color: colors.text }]} maxFontSizeMultiplier={2}>
        {baslik}
      </Text>
      <Text style={[styles.mono, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
        {deger}
      </Text>
      <View style={styles.esnek} />
      {ek ? (
        <Text style={[styles.mono, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
          {ek}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function BleSatiri({ baslik, deger, son = false }: { baslik: string; deger: string; son?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bleSatir, son ? null : { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[styles.veriBaslik, { color: colors.text }]} maxFontSizeMultiplier={2}>
        {baslik}
      </Text>
      <View style={styles.esnek} />
      <Text style={[styles.mono, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
        {deger}
      </Text>
    </View>
  );
}

/**
 * Sunucu ucu gerektiren eylemler. Uçlar yazılmadan bu düğmeler **devre dışıdır**:
 * bir şey yapmayan düğme göstermek, arayüzün yalan söylemesidir.
 */
function BekleyenDugme({
  etiket,
  renk,
  kenar,
  genis = false,
  duz = false,
}: {
  etiket: string;
  renk: string;
  kenar?: string;
  genis?: boolean;
  duz?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiket}
      accessibilityHint="Bulut ucu yazılınca etkinleşir"
      accessibilityState={{ disabled: true }}
      disabled
      style={[
        duz ? styles.duzDugme : styles.dugme,
        genis ? styles.dugmeGenis : null,
        kenar ? { borderColor: kenar, borderWidth: 1 } : null,
        styles.sonuk,
      ]}>
      <Text style={[styles.dugmeMetin, { color: renk }]} maxFontSizeMultiplier={1.4}>
        {etiket}
      </Text>
      <Text style={[styles.mono, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
        yakında
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  listeKart: { paddingVertical: 0, paddingHorizontal: SPACING.md, gap: 0 },
  ayirac: { height: StyleSheet.hairlineWidth },
  esnek: { flex: 1 },
  sonuk: { opacity: 0.55 },
  mono: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },

  kartBaslik: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  kartBaslikSatir: { minHeight: HIT_SIZE + 4 },

  anahtarSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: HIT_SIZE + 8,
    paddingVertical: SPACING.sm,
  },
  anahtarMetin: { flex: 1, gap: 2 },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  satirBaslik: { ...FONTS.body, fontSize: TYPE_SCALE.body, flexShrink: 1 },
  satirAlt: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 15 },

  veriSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 36 },
  veriBaslik: { ...FONTS.body, fontSize: TYPE_SCALE.label },

  bleListe: { gap: 0 },
  bleSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 30 },

  dugmeSatir: { flexDirection: 'row', gap: SPACING.sm },
  dugme: {
    flex: 1,
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    gap: 1,
  },
  dugmeGenis: { flex: 1.8 },
  duzDugme: {
    minHeight: HIT_SIZE,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: SPACING.sm,
    gap: 1,
  },
  dugmeMetin: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.label },

  doluRozet: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
  doluRozetMetin: { ...FONTS.monoBold, fontSize: 10 },

  aciklama: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 18 },
  vurgu: { ...FONTS.bodySemiBold },

  ikonYedek: { borderRadius: 4, borderWidth: 1.5 },
});
