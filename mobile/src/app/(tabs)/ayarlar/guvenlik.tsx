import { useCallback, useState, type ComponentProps, type ReactNode, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Anahtar } from '@/components/ui/anahtar';
import { Card, CardHeader, RuleBox } from '@/components/ui/card';
import { kilitKaydiIfadesi, kilitOznesi, kilitYetenegi, type KilitYetenegi } from '@/lib/biyometri';
import { kilidiDogrula, kilitTercihi, kilitTercihiYaz } from '@/lib/uygulama-kilidi';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

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

  // Komut onayı şimdilik yerel; gerçek etkisi onay akışı yazılınca bağlanacak.
  /**
   * Onay ekranı tercihi. Şimdilik **sabit açık** ve anahtarı kilitli: komut akışı
   * yazılmadan bu tercihin bir etkisi olamaz. Akış geldiğinde `kilitTercihi` gibi
   * kalıcı bir tercihe bağlanacak ve `setKomutOnayi` geri gelecek.
   */
  const komutOnayi = true;

  // Uygulama kilidi ARTIK GERÇEK: tercih saklanıyor ve açılışta/arka plandan dönüşte
  // uygulanıyor. Varsayılan kapalı — kullanıcı istemeden biyometri sorulmaz.
  const [uygulamaKilidi, setUygulamaKilidi] = useState(false);
  const [kilit, setKilit] = useState<KilitYetenegi | null>(null);
  const [kilitHatasi, setKilitHatasi] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([kilitTercihi(), kilitYetenegi()]).then(([acik, yetenek]) => {
      if (!alive) return;
      setUygulamaKilidi(acik);
      setKilit(yetenek);
    });
    return () => {
      alive = false;
    };
  }, []);

  const kilidiDegistir = useCallback(async (v: boolean) => {
    setKilitHatasi(null);
    // Açarken önce doğrula: çalışmayan bir biyometriyle kendini dışarıda bırakmak
    // kolay, geri almak zor. Kapatırken doğrulama istemiyoruz — kilit bir sır
    // korumuyor, sormak yalnızca sürtünme olurdu.
    if (v) {
      const sonuc = await kilidiDogrula();
      if (sonuc.kind === 'yetenek-yok') {
        setKilitHatasi('Bu cihazda kullanılabilir bir kilit yok. Ayarlar’dan biyometri veya cihaz parolası kur.');
        return;
      }
      if (sonuc.kind !== 'ok') {
        setKilitHatasi('Doğrulanmadı, kilit açılmadı.');
        return;
      }
    }
    setUygulamaKilidi(v);
    await kilitTercihiYaz(v);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}
      contentInsetAdjustmentBehavior="automatic">
      <Card style={styles.listeKart}>
        <AnahtarSatiri
          baslik={`Uygulama kilidi${kilit ? ` (${kilit.ad})` : ''}`}
          altBaslik="Açılışta ve arka plandan dönüşte uygulamayı biyometri açar"
          deger={uygulamaKilidi}
          onChange={(v) => void kilidiDegistir(v)}
        />
        {kilitHatasi ? (
          <Text style={[styles.kilitHatasi, { color: colors.danger }]} accessibilityRole="alert" maxFontSizeMultiplier={2}>
            {kilitHatasi}
          </Text>
        ) : null}
        <Ayirac />
        <AnahtarSatiri
          ikon="lock.fill"
          baslik="Arka planda otomatik kilitlenme"
          altBaslik="Kapatılamaz — uygulama kilidi tek kapı olduğu için zorunlu."
          deger
          kilitli
        />
        <Ayirac />
        {/*
          Bu anahtar canlı görünüyordu ama hiçbir şey yapmıyordu: `useState(true)` ile
          tutuluyordu, kaydedilmiyordu (ekran kapanınca seçim kayboluyordu) ve vaat ettiği
          `/onay` ekranına uygulamada hiçbir yerden gidilmiyordu. Yanı başındaki uygulama
          kilidi anahtarı ise gerçekten `kilitTercihi`'ni okuyup yazıyor — aynı ekranda iki
          farklı dürüstlük seviyesi.

          `feedback.md › Best practices`: "Show people when a command can't be carried out
          and help them understand why." Ekranın kendi icat ettiği çözüm uygulanıyor:
          `BekleyenDugme` gibi görünür biçimde kilitli ve sebebi alt başlıkta yazılı.
          Komut akışı yazıldığında `kilitTercihi` yanında kalıcı bir tercihe bağlanacak.
        */}
        <AnahtarSatiri
          baslik="Geri alınamayan komutlarda onay sor"
          altBaslik="Komut akışı yazılınca etkinleşir — kilit ve arama henüz gönderilemiyor"
          deger={komutOnayi}
          kilitli
        />
      </Card>

      <Card>
        <CardHeader
          sag={
            <DoluRozet bg={colors.ok} fg={colors.bg}>
              TOTP açık
            </DoluRozet>
          }>
          İKİ ADIMLI DOĞRULAMA
        </CardHeader>
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
          <BekleyenDugme etiket="MFA’yı kapat" renk={colors.danger} kenar={colors.danger} />
        </View>
      </Card>

      <Card style={styles.listeKart}>
        <View style={styles.kartBaslikSatir}>
          <CardHeader
            sag={<BekleyenDugme etiket="Tüm oturumları kapat" renk={colors.danger} duz />}>
            OTURUMLAR
          </CardHeader>
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
        {/* Rozet zemini hat rengi (BUS_COLORS.ble) taşıyordu; hat renkleri yalnızca teknik
            diyagramlarda kullanılır (tokens.ts palet kuralı). Durum rozeti `ok` taşır. */}
        <CardHeader
          sag={
            <DoluRozet bg={colors.ok} fg={colors.bg}>
              BONDED
            </DoluRozet>
          }>
          ARAÇ BAĞLANTISI (BLE)
        </CardHeader>
        <View style={styles.bleListe}>
          <BleSatiri baslik="Eşleşme" deger="LE Secure Connections · IRK" />
          <BleSatiri baslik="Oturum anahtarı" deger="bağlantı başına · sayaç ··" />
          <BleSatiri baslik="Directed advertising" deger="yalnız eşleşmiş telefona" />
          <BleSatiri baslik="iOS adresi" deger="~15 dk’da bir değişir (RPA)" son />
        </View>
        <Text style={[styles.aciklama, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Araç yakındayken internet gerekmez; bu sınır bonding’e dayanır, buluta değil. Sabit MAC
          listesi imkânsızdır, adres IRK ile çözülür.
        </Text>
      </Card>

      {/*
        Başlık ve gövde aynı kaynaktan: ekranın üstü `kilit.ad`'ı dinamik kullanırken burası
        "Face ID" yazıyordu. Touch ID'li bir iPad'de kullanıcı kendi cihazında olmayan bir
        özellik hakkında bir kural okuyordu.
      */}
      <RuleBox
        title={`${(kilit ? kilitOznesi(kilit) : 'CİHAZ KİLİDİ').toLocaleUpperCase('tr-TR')} KİMLİK DOĞRULAMA DEĞİLDİR`}>
        {`${kilit ? kilitOznesi(kilit) : 'Cihaz kilidi'}, Keychain’deki refresh token’ı açar; sunucuya karşı kimlik Supabase JWT’dir. ${
          kilit ? kilitKaydiIfadesi(kilit.tur) : 'Kayıtlı biyometri'
        } değişirse (biometryCurrentSet) anahtar geçersiz olur ve Apple ile yeniden giriş gerekir. Kilit yalnızca uygulama açılışındadır, her komutta değil.`}
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
      <Anahtar
        deger={deger}
        onDegisim={onChange}
        kilitli={kilitli}
        erisimEtiketi={baslik}
        erisimIpucu={kilitli ? 'Bu ayar kapatılamaz' : altBaslik}
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
  kilitHatasi: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 19 },
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  listeKart: { paddingVertical: 0, paddingHorizontal: SPACING.md, gap: 0 },
  ayirac: { height: StyleSheet.hairlineWidth },
  esnek: { flex: 1 },
  sonuk: { opacity: 0.55 },
  mono: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },

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
  doluRozetMetin: { ...FONTS.monoBold, fontSize: 11 },

  aciklama: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 18 },
  vurgu: { ...FONTS.bodySemiBold },

  ikonYedek: { borderRadius: 4, borderWidth: 1.5 },
});
