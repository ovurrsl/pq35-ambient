import { useCallback, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';

import { Card, SectionLabel } from '@/components/ui/card';
import { UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { BUS_COLORS, COLORS, EVENT_COLORS, FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE, ZONE_COLORS, ZONE_IDS, ZONE_LABELS, markaMetin, type ZoneId } from '@/theme/tokens';

/**
 * Olaylar — Komfort-CAN tetikleyicisi → bölge eşlemesi.
 *
 * Kapı, sinyal, kilit ve far frame'lerinin ID'si kaynaklarda yok (CLAUDE.md §12); bu yüzden
 * satırlarda ID yazılmaz, yalnızca olay adı ve tetik kaynağı yazar. Doğrulanmış tek ID
 * kümesi hız (0x351) ve devirdir (0x353) — onlar da kesikli rozetle işaretlidir.
 */

type OlayId = 'kapi' | 'sinyal' | 'vites' | 'isik' | 'kilit' | 'hizRpm';

/** Olay başına 7 bölgenin açık/kapalı durumu. */
type BolgeSecimi = Readonly<Record<ZoneId, boolean>>;
type OlayEslemesi = Readonly<Record<OlayId, BolgeSecimi>>;

interface OlayTanimi {
  readonly id: OlayId;
  readonly ad: string;
  readonly davranis: string;
  readonly renk: string;
  /** Mono çip — tetiğin geldiği sinyal, ID değil. */
  readonly kaynak: string;
  readonly not: string;
  /** §5'teki yığındaki sıra. Taban katmanını değiştiren olaylarda null. */
  readonly oncelik: number | null;
  /** Yalnızca kaynaklarda doğrulanmış ID'ler. Boş dizi = frame henüz bilinmiyor. */
  readonly idler: readonly string[];
}

/**
 * Renkler token'lardan gelir. Kanvas far/gece için `BUS_COLORS.info`, kilit için
 * `ZONE_COLORS.z2` kullanır; bu ikisi öncelik yığınında yer almadığı için EVENT_COLORS
 * dışında kalır (CLAUDE.md §5 — dördü öncelikli, ikisi taban katmanını değiştirir).
 */
const OLAYLAR: readonly OlayTanimi[] = [
  {
    id: 'kapi',
    ad: 'Kapı açık',
    davranis: 'kırmızı sabit',
    renk: EVENT_COLORS.door,
    kaynak: 'kapı',
    not: 'Kapı açıkken düz kırmızı. Yanıp sönen kırmızı OEM davranışı değil, arka radarlı çıkış uyarısıdır.',
    oncelik: 2,
    idler: [],
  },
  {
    id: 'sinyal',
    ad: 'Sinyal',
    davranis: 'kayan sarı',
    renk: EVENT_COLORS.turn,
    kaynak: 'flaşör',
    not: 'Sweep kendi sayacıyla değil, flaşör bitinin yükselen kenarında başlar — tanım gereği senkron kalır.',
    oncelik: 3,
    idler: [],
  },
  {
    id: 'vites',
    ad: 'Geri vites',
    davranis: 'karartma',
    renk: EVENT_COLORS.reverse,
    kaynak: 'vites',
    not: 'Yığının en üstündeki olay: geri viteste kabin karartılır, diğer katmanlar bastırılır.',
    oncelik: 1,
    idler: [],
  },
  {
    id: 'isik',
    ad: 'Far / gece',
    davranis: 'parlaklık düşür',
    renk: BUS_COLORS.info,
    kaynak: 'ışık',
    not: 'Gece kısması aracın kendi ışık sensöründen Komfort-CAN ile gelir; telefon tarafında saat mantığına gerek yok.',
    oncelik: null,
    idler: [],
  },
  {
    id: 'kilit',
    ad: 'Kilit açma · welcome',
    davranis: 'karşılama',
    renk: ZONE_COLORS.z2,
    kaynak: 'kilit',
    not: 'v1 Kl.15 tetiklidir, karşılama kontak açılışında görülür. Gerçek "kilit aç → welcome" v2 wake-on-bus ile gelir.',
    oncelik: null,
    idler: [],
  },
  {
    id: 'hizRpm',
    ad: 'Hız / RPM',
    davranis: 'parlaklık · redline',
    renk: EVENT_COLORS.redline,
    kaynak: 'aynalı',
    not: 'Hız ve devir gateway tarafından konfor hattına yansıtılır; redline eşiği araçta ölçülecek.',
    oncelik: 4,
    idler: ['hız 0x351', 'RPM 0x353'],
  },
];

/** Yığın §5'teki sırayla okunur: en üstteki olay alttakileri bastırır. */
const ONCELIK_YIGINI: readonly { readonly sira: number; readonly ad: string; readonly renk: string }[] = [
  { sira: 1, ad: 'Geri vites', renk: EVENT_COLORS.reverse },
  { sira: 2, ad: 'Kapı', renk: EVENT_COLORS.door },
  { sira: 3, ad: 'Sinyal', renk: EVENT_COLORS.turn },
  { sira: 4, ad: 'Redline', renk: EVENT_COLORS.redline },
];

const secim = (acik: readonly ZoneId[]): BolgeSecimi => ({
  z1: acik.includes('z1'),
  z2: acik.includes('z2'),
  z3: acik.includes('z3'),
  z4: acik.includes('z4'),
  z5: acik.includes('z5'),
  z6: acik.includes('z6'),
  z7: acik.includes('z7'),
});

const VARSAYILAN_ESLEME: OlayEslemesi = {
  kapi: secim(['z1', 'z2']),
  sinyal: secim(['z1', 'z2', 'z5', 'z6']),
  vites: secim(ZONE_IDS),
  isik: secim(ZONE_IDS),
  kilit: secim(ZONE_IDS),
  hizRpm: secim(ZONE_IDS),
};

export default function OlaylarEkrani(): ReactElement {
  const { colors, scheme } = useTheme();
  const [esleme, setEsleme] = useState<OlayEslemesi>(VARSAYILAN_ESLEME);

  const degistir = useCallback((olay: OlayId, bolge: ZoneId): void => {
    void Haptics.selectionAsync();
    setEsleme((onceki: OlayEslemesi): OlayEslemesi => {
      const mevcut = onceki[olay];
      const guncel: BolgeSecimi = { ...mevcut, [bolge]: !mevcut[bolge] };
      return { ...onceki, [olay]: guncel };
    });
  }, []);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <Text style={[styles.altBaslik, { color: colors.muted }]} maxFontSizeMultiplier={2}>
        Komfort-CAN tetikleyicileri → bölgeler
      </Text>

      <View style={[styles.bilgi, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <SymbolView
          name="info.circle"
          size={16}
          tintColor={BUS_COLORS.komfort}
          fallback={<View style={[styles.ikonYedek, { borderColor: BUS_COLORS.komfort }]} />}
        />
        <Text style={[styles.bilgiMetin, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Yalnızca dinler —{' '}
          <Text style={[styles.bilgiMono, { color: markaMetin(BUS_COLORS.komfort, scheme) }]}>
            Komfort-CAN · LISTEN-ONLY · 100 kbps
          </Text>
          . ID’ler araçta log ile bulunacak.
        </Text>
      </View>

      <Card>
        <SectionLabel>ÖNCELİK SIRASI</SectionLabel>

        <View style={[styles.yiginUc, { borderColor: colors.accent }]}>
          <Text style={[styles.yiginUcMetin, { color: colors.accent }]} maxFontSizeMultiplier={1.4}>
            UYGULAMA OVERRIDE
          </Text>
          <Text style={[styles.yiginUcNot, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
            en üstte
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yiginSira}>
          {ONCELIK_YIGINI.map((katman, i) => (
            <View key={katman.ad} style={styles.yiginOge}>
              <View style={[styles.yiginCip, { backgroundColor: colors.surfaceRaised, borderColor: katman.renk }]}>
                <Text style={[styles.yiginNo, { color: markaMetin(katman.renk, scheme) }]} maxFontSizeMultiplier={1.4}>
                  {katman.sira}
                </Text>
                <Text style={[styles.yiginAd, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
                  {katman.ad}
                </Text>
              </View>
              {i < ONCELIK_YIGINI.length - 1 ? (
                <Text style={[styles.yiginOk, { color: colors.dim }]} accessibilityElementsHidden>
                  {'>'}
                </Text>
              ) : null}
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.yiginTaban, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Taban katmanı = uygulama rengi × gösterge dimmer × far durumu
        </Text>
      </Card>

      <Card style={styles.liste}>
        {OLAYLAR.map((olay, i) => (
          <View key={olay.id}>
            <OlaySatiri
              olay={olay}
              secili={esleme[olay.id]}
              onDegistir={degistir}
            />
            {i < OLAYLAR.length - 1 ? (
              <View style={[styles.ayirac, { backgroundColor: colors.line }]} />
            ) : null}
          </View>
        ))}
      </Card>

      <View style={[styles.kural, { borderColor: colors.warn }]}>
        <Text style={[styles.kuralEtiket, { color: colors.warn }]} maxFontSizeMultiplier={1.4}>
          KURAL
        </Text>
        <Text style={[styles.kuralMetin, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Mesaj 2 sn kesilirse taban renge dön
        </Text>
      </View>
    </ScrollView>
  );
}

interface OlaySatiriProps {
  olay: OlayTanimi;
  secili: BolgeSecimi;
  onDegistir: (olay: OlayId, bolge: ZoneId) => void;
}

function OlaySatiri({ olay, secili, onDegistir }: OlaySatiriProps): ReactElement {
  const { colors, scheme } = useTheme();

  return (
    <View style={styles.olay}>
      <View style={styles.olayUst}>
        <View style={styles.olayAdBlok}>
          {olay.oncelik === null ? (
            <View style={[styles.oncelikNo, { borderColor: colors.line }]}>
              <Text style={[styles.oncelikNoMetin, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
                ·
              </Text>
            </View>
          ) : (
            <View style={[styles.oncelikNo, { borderColor: olay.renk }]}>
              <Text style={[styles.oncelikNoMetin, { color: markaMetin(olay.renk, scheme) }]} maxFontSizeMultiplier={1.4}>
                {olay.oncelik}
              </Text>
            </View>
          )}
          <Text style={[styles.olayAd, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
            {olay.ad}
          </Text>
        </View>
        <View style={[styles.davranis, { borderColor: olay.renk }]}>
          <Text style={[styles.davranisMetin, { color: markaMetin(olay.renk, scheme) }]} maxFontSizeMultiplier={1.4}>
            {olay.davranis}
          </Text>
        </View>
      </View>

      <View style={styles.cipSatir}>
        <View style={[styles.kaynakCip, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
          <Text style={[styles.kaynakMetin, { color: markaMetin(BUS_COLORS.komfort, scheme) }]} maxFontSizeMultiplier={1.4}>
            {olay.kaynak}
          </Text>
        </View>

        {olay.idler.length === 0 ? (
          <Text style={[styles.idYok, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
            ID bilinmiyor
          </Text>
        ) : (
          <>
            {olay.idler.map((id) => (
              <View
                key={id}
                style={[styles.idCip, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
                <Text style={[styles.idMetin, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
                  {id}
                </Text>
              </View>
            ))}
            <UnverifiedBadge />
          </>
        )}
      </View>

      <Text style={[styles.olayNot, { color: colors.dim }]} maxFontSizeMultiplier={2}>
        {olay.not}
      </Text>

      <View style={styles.zonSatir}>
        {ZONE_IDS.map((bolge) => (
          <ZonAnahtari
            key={bolge}
            bolge={bolge}
            acik={secili[bolge]}
            olayId={olay.id}
            olayAdi={olay.ad}
            onDegistir={onDegistir}
          />
        ))}
      </View>
    </View>
  );
}

interface ZonAnahtariProps {
  bolge: ZoneId;
  acik: boolean;
  olayId: OlayId;
  olayAdi: string;
  onDegistir: (olay: OlayId, bolge: ZoneId) => void;
}

function ZonAnahtari({ bolge, acik, olayId, olayAdi, onDegistir }: ZonAnahtariProps): ReactElement {
  const { colors } = useTheme();
  const bas = useCallback((): void => {
    onDegistir(olayId, bolge);
  }, [onDegistir, olayId, bolge]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: acik }}
      accessibilityLabel={`${olayAdi} olayı ${ZONE_LABELS[bolge]} bölgesini sürsün`}
      onPress={bas}
      style={({ pressed }) => [styles.zonHedef, { opacity: pressed ? 0.6 : 1 }]}>
      <View
        style={[
          styles.zonDaire,
          acik
            ? { backgroundColor: ZONE_COLORS[bolge], borderColor: ZONE_COLORS[bolge] }
            : { backgroundColor: 'transparent', borderColor: colors.line },
        ]}>
        {/* Bölge renkleri iki temada da açık tonlu; üstlerine daima koyu metin gelir. */}
        <Text
          style={[styles.zonMetin, { color: acik ? COLORS.dark.bg : colors.dim }]}
          maxFontSizeMultiplier={1.4}>
          {bolge.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },
  altBaslik: { ...FONTS.body, fontSize: TYPE_SCALE.caption },

  bilgi: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  ikonYedek: { width: 16, height: 16, borderRadius: RADIUS.pill, borderWidth: 2 },
  bilgiMetin: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 18 },
  bilgiMono: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },

  yiginUc: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  yiginUcMetin: { ...FONTS.mono, fontSize: 11, letterSpacing: 1 },
  yiginUcNot: { ...FONTS.mono, fontSize: 11 },
  yiginSira: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: 2 },
  yiginOge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  yiginCip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  yiginNo: { ...FONTS.monoBold, fontSize: TYPE_SCALE.micro },
  yiginAd: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.micro },
  yiginOk: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  yiginTaban: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 16 },

  liste: { paddingVertical: 0, gap: 0 },
  ayirac: { height: StyleSheet.hairlineWidth },
  olay: { gap: 6, paddingVertical: SPACING.md },
  olayUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  olayAdBlok: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minWidth: 0 },
  oncelikNo: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oncelikNoMetin: { ...FONTS.monoBold, fontSize: TYPE_SCALE.micro },
  olayAd: { flexShrink: 1, ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.body },
  davranis: { borderRadius: RADIUS.pill, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  davranisMetin: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.micro },

  cipSatir: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  kaynakCip: { borderRadius: RADIUS.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, paddingVertical: 3 },
  kaynakMetin: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  idCip: { borderRadius: RADIUS.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, paddingVertical: 3 },
  idMetin: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  idYok: { ...FONTS.mono, fontSize: 11 },

  olayNot: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 16 },

  zonSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zonHedef: {
    flex: 1,
    minWidth: HIT_SIZE,
    minHeight: HIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonDaire: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonMetin: { ...FONTS.monoBold, fontSize: TYPE_SCALE.micro },

  kural: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  kuralEtiket: { ...FONTS.mono, fontSize: 11, letterSpacing: 1.2 },
  kuralMetin: { flex: 1, ...FONTS.body, fontSize: TYPE_SCALE.caption },
});
