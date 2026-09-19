import { useCallback, useState, type JSX } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Anahtar } from '@/components/ui/anahtar';
import { BleCip } from '@/components/ui/ble-cip';
import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { ParlaklikKaydiraci } from '@/components/ui/slider';
import { bleCipMetni, useBle } from '@/state/ble-context';
import { useTheme } from '@/theme/theme-provider';
import { BUS_COLORS, FONTS, HIT_SIZE, MARKA_ETIKET, RADIUS, SPACING, TYPE_SCALE, ZONE_COLORS, ZONE_IDS, ZONE_LABELS, type ZoneId } from '@/theme/tokens';

/**
 * Bölgeler — ana ekran.
 *
 * Renk ve parlaklık **uygulamadan** seçilir (Yol A, CLAUDE.md §1). Araçtan okunan hiçbir
 * renk yoktur; CAN yalnızca tetik kaynağıdır ve **her iki kanalda da Listen-Only** dinlenir.
 * Bu yüzden ekrandaki hiçbir kontrol araca komut yazmaz — LED'i ESP32-S3 kendi sürer.
 *
 * Egzoz ve hava süspansiyon **buradan çıkarıldı**, Araç sekmesine taşındı: ikisi de
 * Kontrolcü B sistemi (CLAUDE.md §3.3), bu sekme ise ambiyansın kendisi. Kartın adı
 * zaten "ARAÇ SİSTEMLERİ"ydi ve uygulamada "Araç" diye bir sekme var. Geri ekleme.
 */

/** Satırın ikinci satırı — kaynak: design/project/AppZonlar.dc.html (kanvas kazanır). */
const ZONE_ICERIK: Readonly<Record<ZoneId, string>> = {
  z1: 'Kulp · Cep · Şerit',
  z2: 'Kulp · Cep · Şerit',
  z3: 'Sürücü · Yolcu',
  z4: 'Torpido · Konsol',
  z5: 'Yan döşeme · şerit',
  z6: 'Yan döşeme · şerit',
  z7: 'Sol · Sağ',
};

/**
 * Ön/arka ayrımı kablo rotasını yansıtır: Z5–Z7 kapı körüğünden değil, koltuk altı ve eşik
 * triminden çekilir (CLAUDE.md §4). Sıra ZONE_IDS'ten gelir ki token'larla ayrışmasın.
 */
const ON_BOLGELER: readonly ZoneId[] = ZONE_IDS.slice(0, 4);
const ARKA_BOLGELER: readonly ZoneId[] = ZONE_IDS.slice(4);

interface BolgeDurumu {
  acik: boolean;
  parlaklik: number;
}

const BASLANGIC: Readonly<Record<ZoneId, BolgeDurumu>> = {
  z1: { acik: true, parlaklik: 72 },
  z2: { acik: true, parlaklik: 72 },
  z3: { acik: true, parlaklik: 40 },
  z4: { acik: true, parlaklik: 55 },
  z5: { acik: true, parlaklik: 60 },
  z6: { acik: true, parlaklik: 60 },
  z7: { acik: true, parlaklik: 35 },
};

export default function BolgelerEkrani(): JSX.Element {
  const { colors } = useTheme();
  const { arac } = useBle();
  const router = useRouter();

  /**
   * Komut gerçekten gidebiliyor mu?
   *
   * Ana anahtar da yedi bölge anahtarı da girdi kabul ediyordu ama alacak bir şey yoktu:
   * araçta denetleyici henüz yok. Bir anahtarın dönüp hiçbir şey olmaması, kullanıcıya
   * arızayı kendi tarafında aratır. HIG (`feedback.md › Best practices`): "Show people
   * when a command can't be carried out and help them understand why." — sebep de
   * anahtarın yanında, satırın alt metninde yazılı.
   */
  const komutGider = arac === 'bagli';

  const [sistemAcik, setSistemAcik] = useState<boolean>(true);
  const [genelParlaklik, setGenelParlaklik] = useState<number>(72);
  const [bolgeler, setBolgeler] = useState<Record<ZoneId, BolgeDurumu>>(BASLANGIC);

  const bolgeyiAnahtarla = useCallback((id: ZoneId, acik: boolean): void => {
    setBolgeler((onceki) => ({ ...onceki, [id]: { ...onceki[id], acik } }));
  }, []);

  const detayaGit = useCallback(
    (id: ZoneId): void => {
      router.push({ pathname: '/bolgeler/[id]', params: { id } });
    },
    [router]
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <Text style={[styles.altBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
        PQ35-AMBIENT · SCIROCCO
      </Text>

      <View style={styles.cipler}>
        <BleCip />
        <Pill dotColor={BUS_COLORS.komfort} veri>Komfort 100k</Pill>
        <Pill tone="uyari" veri>LISTEN-ONLY</Pill>
      </View>

      <Card>
        <View style={styles.sistemSatir}>
          <View style={styles.sistemMetin}>
            <Text style={[styles.sistemAd, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
              Sistem
            </Text>
            <Text style={[styles.sistemAlt, { color: colors.muted }]} maxFontSizeMultiplier={2}>
              {komutGider
                ? 'Araç dinleniyor · telefon komutu öne geçer'
                : `${bleCipMetni(arac)} — anahtarlar araca komut göndermez`}
            </Text>
          </View>
          <Anahtar
            erisimEtiketi="Sistem ana anahtarı"
            deger={sistemAcik}
            kilitli={!komutGider}
            onDegisim={setSistemAcik}
          />
        </View>

        <View style={[styles.ayirac, { backgroundColor: colors.line }]} />

        <View style={styles.genelSatir}>
          <Text style={[styles.genelEtiket, { color: colors.text }]} maxFontSizeMultiplier={2}>
            Genel parlaklık
          </Text>
          <View style={styles.genelKaydirac}>
            <ParlaklikKaydiraci
              deger={genelParlaklik}
              onDegisti={setGenelParlaklik}
              renk={colors.accent}
              etiket="Genel parlaklık"
              devreDisi={!sistemAcik}
            />
          </View>
          <Text style={[styles.genelYuzde, { color: colors.accent }]} maxFontSizeMultiplier={1.4}>
            %{genelParlaklik}
          </Text>
        </View>
      </Card>

      <View style={styles.grupBaslik}>
        <SectionLabel>ÖN</SectionLabel>
        <Text style={[styles.grupNot, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          Z1–Z4 · renk uygulamadan
        </Text>
      </View>

      <Card style={styles.liste}>
        {ON_BOLGELER.map((id, i) => (
          <BolgeSatiri
            key={id}
            id={id}
            durum={bolgeler[id]}
            sonSatir={i === ON_BOLGELER.length - 1}
            sistemAcik={sistemAcik && komutGider}
            onAnahtar={bolgeyiAnahtarla}
            onAc={detayaGit}
          />
        ))}
      </Card>

      <View style={styles.grupBaslik}>
        <SectionLabel>ARKA</SectionLabel>
        <Text style={[styles.grupNot, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          Z5–Z7 · arka yan döşeme
        </Text>
      </View>

      <Card style={styles.liste}>
        {ARKA_BOLGELER.map((id, i) => (
          <BolgeSatiri
            key={id}
            id={id}
            durum={bolgeler[id]}
            sonSatir={i === ARKA_BOLGELER.length - 1}
            sistemAcik={sistemAcik && komutGider}
            onAnahtar={bolgeyiAnahtarla}
            onAc={detayaGit}
          />
        ))}
      </Card>

      <Card>
        <SectionLabel>ŞERİT METRAJI</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Toplam metraj, çekilen akım ve sigorta boyutu montajda ölçülecek. Buraya tahmini
          değer yazılmaz.
        </Text>
        <UnverifiedBadge />
      </Card>

      <Text style={[styles.dipnot, { color: colors.muted }]} maxFontSizeMultiplier={2}>
        Telefon komutunu iptal edersen sistem yeniden aracı dinler.
      </Text>

      <RuleBox title="ARACA HİÇBİR ŞEY YAZILMAZ">
        Komfort ve Antriebs kanalları yalnızca dinlenir; TX fiziksel olarak bağlı değildir.
        Bu ekrandaki renk ve parlaklık ESP32-S3’e BLE ile gider, araca değil. CAN tarafından
        gelen tek şey tetiklerdir: kapı, kilit, far, sinyal, hız ve devir.
      </RuleBox>
    </ScrollView>
  );
}

interface BolgeSatiriProps {
  id: ZoneId;
  durum: BolgeDurumu;
  sonSatir: boolean;
  sistemAcik: boolean;
  onAnahtar: (id: ZoneId, acik: boolean) => void;
  onAc: (id: ZoneId) => void;
}

function BolgeSatiri({
  id,
  durum,
  sonSatir,
  sistemAcik,
  onAnahtar,
  onAc,
}: BolgeSatiriProps): JSX.Element {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const bolgeRengi = ZONE_COLORS[id];
  const etkin = sistemAcik && durum.acik;

  /**
   * Erişilebilirlik puntolarında satır tek sıraya sığmıyor.
   *
   * 320 pt genişliğindeki bir iPhone SE'de kartın içinde ~264 pt var; rozet (24), yüzde
   * (~34), `Switch` (~51), chevron ve boşluklar çıkınca ada ~110 pt kalıyor. "Arka sol yan
   * panel" taban 15 pt'de zaten ~120 pt istiyor, izin verilen 2.0× katsayıda ~240 pt.
   * Eskiden bu `numberOfLines={1}` ile kırpılıyordu — yani satırın **birincil kimliği**
   * birkaç harfe düşüyor, alt satır da onunla birlikte kayboluyordu.
   *
   * HIG (`typography.md › Supporting Dynamic Type`): "Keep text truncation to a minimum as
   * font size increases. In general, aim to display as much useful text at the largest
   * accessibility font size as you do at the largest standard font size." ve "Consider
   * adjusting your layout at large font sizes."
   *
   * İki parça: kırpma kalktı (satırın `minHeight`i var, sabit yüksekliği yok) ve 1.4×
   * üstünde satır dikey akışa geçiyor.
   */
  const genisPunto = fontScale > 1.4;

  const anahtarla = useCallback((acik: boolean): void => onAnahtar(id, acik), [id, onAnahtar]);
  const ac = useCallback((): void => onAc(id), [id, onAc]);

  return (
    <View>
      <View style={[styles.satir, genisPunto && styles.satirDikey]}>
        <View style={styles.satirBas}>
          <View style={[styles.rozet, { backgroundColor: bolgeRengi }]}>
            <Text style={[styles.rozetMetin, { color: MARKA_ETIKET }]} maxFontSizeMultiplier={1.4}>
              {id.toUpperCase()}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${ZONE_LABELS[id]}, parlaklık yüzde ${durum.parlaklik}, ${
              durum.acik ? 'açık' : 'kapalı'
            }${sistemAcik ? '' : ', sistem kapalı'}`}
            accessibilityHint="Bölge ayrıntılarını açar"
            onPress={ac}
            style={({ pressed }) => [styles.satirDokunma, { opacity: pressed ? 0.6 : 1 }]}>
            <View style={styles.satirMetin}>
              <Text style={[styles.satirAd, { color: colors.text }]} maxFontSizeMultiplier={2}>
                {ZONE_LABELS[id]}
              </Text>
              <Text style={[styles.satirAlt, { color: colors.muted }]} maxFontSizeMultiplier={2}>
                {ZONE_ICERIK[id]}
              </Text>
            </View>
            <SymbolView
              name="chevron.right"
              size={13}
              tintColor={colors.dim}
              fallback={
                <Text
                  style={{ color: colors.dim }}
                  accessibilityElementsHidden
                  maxFontSizeMultiplier={1.4}>
                  ›
                </Text>
              }
            />
          </Pressable>
        </View>

        <View style={[styles.satirKuyruk, genisPunto && styles.satirKuyrukGenis]}>
          <Text
            style={[styles.satirYuzde, { color: etkin ? colors.muted : colors.dim }]}
            maxFontSizeMultiplier={1.4}>
            {etkin ? `%${durum.parlaklik}` : '—'}
          </Text>

          <Anahtar
            erisimEtiketi={`${ZONE_LABELS[id]} bölge gücü`}
            deger={durum.acik}
            kilitli={!sistemAcik}
            onDegisim={anahtarla}
          />
        </View>
      </View>
      {sonSatir ? null : <View style={[styles.ayirac, { backgroundColor: colors.line }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  altBaslik: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.caption },
  cipler: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  sistemSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: HIT_SIZE },
  sistemMetin: { flex: 1, gap: 2 },
  sistemAd: { ...FONTS.bodySemiBold, fontSize: 16 },
  sistemAlt: { ...FONTS.body, fontSize: TYPE_SCALE.micro },
  ayirac: { height: StyleSheet.hairlineWidth },
  genelSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: HIT_SIZE },
  genelEtiket: { ...FONTS.body, fontSize: TYPE_SCALE.label },
  genelKaydirac: { flex: 1, minWidth: 60 },
  genelYuzde: { ...FONTS.monoBold, fontSize: 14, minWidth: 44, textAlign: 'right' },

  grupBaslik: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACING.sm },
  grupNot: { ...FONTS.body, fontSize: TYPE_SCALE.micro },
  liste: { paddingVertical: 0, gap: 0 },

  satir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 56 },
  rozet: { width: 24, height: 24, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  rozetMetin: { ...FONTS.monoBold, fontSize: TYPE_SCALE.micro },
  satirDokunma: { flex: 1, minWidth: 0, minHeight: HIT_SIZE, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  satirMetin: { flex: 1, minWidth: 0, gap: 1 },
  satirAd: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.body },
  satirAlt: { ...FONTS.body, fontSize: TYPE_SCALE.micro },
  satirYuzde: { ...FONTS.mono, fontSize: TYPE_SCALE.micro, minWidth: 34, textAlign: 'right' },

  /** Normal puntoda satırın iki yarısı yan yana; 1.4× üstünde alt alta. */
  satirBas: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  satirKuyruk: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  satirDikey: { flexDirection: 'column', alignItems: 'stretch', paddingVertical: SPACING.xs },
  satirKuyrukGenis: { justifyContent: 'flex-end' },

  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 19 },
  dipnot: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 17 },
});
