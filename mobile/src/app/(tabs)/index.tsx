import { useCallback, useState, type JSX } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { NavRow, RowDivider } from '@/components/ui/row';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { ParlaklikKaydiraci } from '@/components/ui/slider';
import { useTheme } from '@/theme/theme-provider';
import {
  BUS_COLORS,
  FONTS,
  HIT_SIZE,
  RADIUS,
  SPACING,
  TYPE_SCALE,
  ZONE_COLORS,
  ZONE_IDS,
  ZONE_LABELS,
  type ZoneId,
} from '@/theme/tokens';

/**
 * Bölgeler — ana ekran.
 *
 * Renk ve parlaklık **uygulamadan** seçilir (Yol A, CLAUDE.md §1). Araçtan okunan hiçbir
 * renk yoktur; CAN yalnızca tetik kaynağıdır ve **her iki kanalda da Listen-Only** dinlenir.
 * Bu yüzden ekrandaki hiçbir kontrol araca komut yazmaz — LED'i ESP32-S3 kendi sürer.
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
  const router = useRouter();

  const [sistemAcik, setSistemAcik] = useState<boolean>(true);
  const [genelParlaklik, setGenelParlaklik] = useState<number>(72);
  const [bolgeler, setBolgeler] = useState<Record<ZoneId, BolgeDurumu>>(BASLANGIC);

  const bolgeyiAnahtarla = useCallback((id: ZoneId, acik: boolean): void => {
    setBolgeler((onceki) => ({ ...onceki, [id]: { ...onceki[id], acik } }));
  }, []);

  const detayaGit = useCallback(
    (id: ZoneId): void => {
      router.push({ pathname: '/bolge/[id]', params: { id } });
    },
    [router]
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.basliklar}>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Ambiyans
        </Text>
        <Text style={[styles.altBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          PQ35-AMBIENT · SCIROCCO
        </Text>
      </View>

      <View style={styles.cipler}>
        <Pill dotColor={BUS_COLORS.ble}>BLE bağlı</Pill>
        <Pill dotColor={BUS_COLORS.komfort}>Komfort 100k</Pill>
        <Pill tone="uyari">LISTEN-ONLY</Pill>
      </View>

      <Card>
        <View style={styles.sistemSatir}>
          <View style={styles.sistemMetin}>
            <Text style={[styles.sistemAd, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
              Sistem
            </Text>
            <Text style={[styles.sistemAlt, { color: colors.muted }]} maxFontSizeMultiplier={2}>
              Araç dinleniyor · telefon komutu öne geçer
            </Text>
          </View>
          <Switch
            accessibilityLabel="Sistem ana anahtarı"
            value={sistemAcik}
            onValueChange={setSistemAcik}
            trackColor={{ false: colors.surfaceRaised, true: colors.ok }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.surfaceRaised}
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
            sistemAcik={sistemAcik}
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
            sistemAcik={sistemAcik}
            onAnahtar={bolgeyiAnahtarla}
            onAc={detayaGit}
          />
        ))}
      </Card>

      <View style={styles.grupBaslik}>
        <SectionLabel>ARAÇ SİSTEMLERİ</SectionLabel>
        <Text style={[styles.grupNot, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          Kontrolcü B · Kl.15
        </Text>
      </View>

      <Card style={styles.liste}>
        <NavRow
          href="/egzoz"
          baslik="Egzoz"
          altBaslik="Varex valfi · aç, kapat, otomatik mod"
        />
        <RowDivider />
        <NavRow
          href="/hava"
          baslik="Hava süspansiyon"
          altBaslik="4 köşe bağımsız · hafıza · denge"
        />
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
  const bolgeRengi = ZONE_COLORS[id];
  const etkin = sistemAcik && durum.acik;

  const anahtarla = useCallback((acik: boolean): void => onAnahtar(id, acik), [id, onAnahtar]);
  const ac = useCallback((): void => onAc(id), [id, onAc]);

  return (
    <View>
      <View style={styles.satir}>
        <View style={[styles.rozet, { backgroundColor: bolgeRengi }]}>
          <Text style={[styles.rozetMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
            {id.toUpperCase()}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${ZONE_LABELS[id]}, parlaklık yüzde ${durum.parlaklik}, ${durum.acik ? 'açık' : 'kapalı'}`}
          accessibilityHint="Bölge ayrıntılarını açar"
          onPress={ac}
          style={({ pressed }) => [styles.satirDokunma, { opacity: pressed ? 0.6 : 1 }]}>
          <View style={styles.satirMetin}>
            <Text
              style={[styles.satirAd, { color: colors.text }]}
              numberOfLines={1}
              maxFontSizeMultiplier={2}>
              {ZONE_LABELS[id]}
            </Text>
            <Text
              style={[styles.satirAlt, { color: colors.muted }]}
              numberOfLines={1}
              maxFontSizeMultiplier={2}>
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

        <View
          style={[styles.renkNoktasi, { backgroundColor: bolgeRengi, opacity: etkin ? 1 : 0.25 }]}
        />
        <Text style={[styles.satirYuzde, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
          %{durum.parlaklik}
        </Text>

        <Switch
          accessibilityLabel={`${ZONE_LABELS[id]} bölge gücü`}
          value={durum.acik}
          disabled={!sistemAcik}
          onValueChange={anahtarla}
          trackColor={{ false: colors.surfaceRaised, true: colors.ok }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.surfaceRaised}
        />
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
  basliklar: { gap: 3 },
  baslik: { ...FONTS.display, fontSize: 26 },
  altBaslik: { ...FONTS.mono, fontSize: TYPE_SCALE.micro, letterSpacing: 1.1 },
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
  renkNoktasi: { width: 12, height: 12, borderRadius: RADIUS.pill },
  satirYuzde: { ...FONTS.mono, fontSize: TYPE_SCALE.micro, minWidth: 34, textAlign: 'right' },


  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 19 },
  dipnot: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 17 },
});
