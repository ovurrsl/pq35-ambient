import { useCallback, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Card, SectionLabel } from '@/components/ui/card';
import { UnverifiedBadge } from '@/components/ui/pill';
import { NavRow } from '@/components/ui/row';
import { useTheme } from '@/theme/theme-provider';
import {
  BUS_COLORS,
  EVENT_COLORS,
  FONTS,
  HIT_SIZE,
  RADIUS,
  SPACING,
  TYPE_SCALE,
  ZONE_COLORS,
} from '@/theme/tokens';

/**
 * Araç · canlı veri.
 *
 * Ekrandaki hiçbir sayı gerçek değil: araçta henüz fiziksel işlem yapılmadı, bu yüzden
 * canlı alanlar `··` yer tutucusuyla çizilir. Yalnızca üç ID kaynaklarda doğrulanmıştır
 * (0x280 · 0x351 · 0x353) ve üçü de byte offset'i model yılına göre kayabildiği için
 * kesikli rozet taşır (CLAUDE.md §3.1 ve §12). Diğer değerlerin ID'si bilinmiyor.
 */

/** Canlı veri gelmediğini gösteren yer tutucu — sıfır yazmak yanlış okunurdu. */
const YOK = '··';

/** Kanvastan gelen gösterge aralığı; gerçek tavan ve redline eşiği araçta ölçülecek. */
const DEVIR_TAVANI = 7000;
const REDLINE_ORANI = 0.87;

type SegmentId = 'canli' | 'surusler' | 'konum';

interface SegmentTanimi {
  readonly id: SegmentId;
  readonly ad: string;
  /** Bu ekranın kendisi olan segmentte null; diğerleri kendi rotasına gider. */
  readonly rota: '/arac/konum' | '/arac/surusler' | null;
}

const SEGMENTLER: readonly SegmentTanimi[] = [
  { id: 'canli', ad: 'Canlı', rota: null },
  { id: 'surusler', ad: 'Sürüşler', rota: '/arac/surusler' },
  { id: 'konum', ad: 'Konum', rota: '/arac/konum' },
];

interface KesifSatiriTanimi {
  readonly ad: string;
  readonly not: string;
}

/** ID'si kaynaklarda olmayan değerler — hiçbiri için tahmini ID yazılmaz. */
const KESIF_LISTESI: readonly KesifSatiriTanimi[] = [
  { ad: 'Motor sıcaklığı', not: 'Antriebs' },
  { ad: 'Vites', not: 'Antriebs' },
  { ad: 'Gaz kelebeği', not: 'Antriebs' },
  { ad: 'Akü voltajı', not: 'Komfort' },
  { ad: 'Yağ sıcaklığı', not: 'Antriebs' },
  { ad: 'Turbo basıncı', not: 'Antriebs' },
];

interface HatTanimi {
  readonly ad: string;
  readonly renk: string;
  /** Antriebs 2. fazda devreye alınır (CLAUDE.md §3.1). */
  readonly ikinciFaz: boolean;
}

const HATLAR: readonly HatTanimi[] = [
  { ad: 'Komfort 100k', renk: BUS_COLORS.komfort, ikinciFaz: false },
  { ad: 'Antriebs 500k', renk: BUS_COLORS.antriebs, ikinciFaz: true },
];

export default function AracEkrani(): ReactElement {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.baslikSatir}>
        <View style={styles.baslikBlok}>
          <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
            Araç
          </Text>
          <Text style={[styles.altBaslik, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
            CANLI VERİ · SCIROCCO
          </Text>
        </View>
        <View style={styles.baslikSag}>
          <View style={[styles.bleCip, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
            <View style={[styles.nokta, { backgroundColor: colors.dim }]} />
            <Text style={[styles.bleMetin, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
              BLE bağlı değil
            </Text>
          </View>
          <Link href="/arac/iletisim" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="İletişim: ara ve mesaj"
              style={({ pressed }) => [
                styles.telefonDugmesi,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.line, opacity: pressed ? 0.6 : 1 },
              ]}>
              <SymbolView
                name="phone"
                size={18}
                tintColor={colors.text}
                fallback={
                  <Text style={{ color: colors.text }} maxFontSizeMultiplier={1.4}>
                    ☎
                  </Text>
                }
              />
            </Pressable>
          </Link>
        </View>
      </View>

      <SegmentKontrolu />

      <View style={styles.dinlemeSatir}>
        <View style={[styles.listenOnly, { borderColor: colors.ok }]}>
          <Text style={[styles.listenOnlyMetin, { color: colors.ok }]} maxFontSizeMultiplier={1.4}>
            LISTEN-ONLY
          </Text>
        </View>
        <Text style={[styles.dinlemeMetin, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Araca hiçbir şey yazılmıyor — iki hat da yalnızca dinleniyor.
        </Text>
      </View>

      <DevirKarti />

      <Card>
        <NavRow
          href="/arac/performans"
          baslik="Performans"
          altBaslik="0–100, fren, esneklik, canlı g"
        />
      </Card>

      <View style={styles.ikili}>
        <DegerKarti
          ad="Hız"
          deger={YOK}
          birim="km/s"
          kaynak="0x351 · Komfort"
          oran={null}
          cubukRengi={ZONE_COLORS.z1}
          ikinciFaz={false}
        />
        <DegerKarti
          ad="Gaz pedalı"
          deger={`%${YOK}`}
          birim={null}
          kaynak="0x280 b6 · Antriebs"
          oran={0}
          cubukRengi={ZONE_COLORS.z3}
          ikinciFaz
        />
      </View>

      <Card>
        <SectionLabel>HENÜZ ÇÖZÜLMEDİ</SectionLabel>
        <View>
          {KESIF_LISTESI.map((satir, i) => (
            <View
              key={satir.ad}
              style={[
                styles.kesifSatir,
                i < KESIF_LISTESI.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }
                  : null,
              ]}>
              <Text style={[styles.kesifAd, { color: colors.text }]} maxFontSizeMultiplier={2}>
                {satir.ad}
              </Text>
              <Text style={[styles.kesifHat, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
                {satir.not}
              </Text>
              <Text style={[styles.kesifDeger, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
                —
              </Text>
              <UnverifiedBadge>LOG İLE BULUNACAK</UnverifiedBadge>
            </View>
          ))}
        </View>
        <Text style={[styles.kesifNot, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Bu değerlerin ID’si kaynaklarda yok; araçta log alınıp çözülünce ekrana eklenecek.
        </Text>
      </Card>

      <HamBusKarti />
    </ScrollView>
  );
}

function SegmentKontrolu(): ReactElement {
  const { colors } = useTheme();
  const router = useRouter();

  const git = useCallback(
    (rota: SegmentTanimi['rota']): void => {
      if (rota === null) return;
      router.push(rota);
    },
    [router]
  );

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.segmentKap, { backgroundColor: colors.glassFallback, borderColor: colors.line }]}>
      {SEGMENTLER.map((segment) => {
        const aktif = segment.rota === null;
        return (
          <SegmentDugmesi key={segment.id} segment={segment} aktif={aktif} onGit={git} />
        );
      })}
    </View>
  );
}

interface SegmentDugmesiProps {
  segment: SegmentTanimi;
  aktif: boolean;
  onGit: (rota: SegmentTanimi['rota']) => void;
}

function SegmentDugmesi({ segment, aktif, onGit }: SegmentDugmesiProps): ReactElement {
  const { colors } = useTheme();
  const bas = useCallback((): void => {
    onGit(segment.rota);
  }, [onGit, segment.rota]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: aktif }}
      accessibilityLabel={segment.ad}
      disabled={aktif}
      onPress={bas}
      style={({ pressed }) => [
        styles.segment,
        aktif
          ? { backgroundColor: colors.surfaceRaised, borderColor: colors.line }
          : { backgroundColor: 'transparent', borderColor: 'transparent' },
        { opacity: pressed ? 0.6 : 1 },
      ]}>
      <Text
        style={[
          aktif ? styles.segmentAktifMetin : styles.segmentMetin,
          { color: aktif ? colors.text : colors.muted },
        ]}
        maxFontSizeMultiplier={1.4}>
        {segment.ad}
      </Text>
    </Pressable>
  );
}

/**
 * Devir göstergesi.
 *
 * `react-native-svg` projede yok, bu yüzden yay değil; büyük sayı + ince çubuk çizilir.
 * Veri gelmediği için çubukta dolgu yoktur, yalnızca ölçek ve redline bandı görünür.
 */
function DevirKarti(): ReactElement {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.devirBlok}>
        <Text style={[styles.devirSayi, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
          {YOK}
        </Text>
        <Text style={[styles.devirBirim, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
          d/dk
        </Text>
      </View>

      <View style={[styles.cubuk, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
        <View
          style={[
            styles.redlineBandi,
            { left: `${REDLINE_ORANI * 100}%`, backgroundColor: EVENT_COLORS.redline },
          ]}
        />
      </View>

      <View style={styles.olcekSatir}>
        <Text style={[styles.olcek, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          0
        </Text>
        <Text style={[styles.olcek, { color: EVENT_COLORS.redline }]} maxFontSizeMultiplier={1.4}>
          redline
        </Text>
        <Text style={[styles.olcek, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          {DEVIR_TAVANI}
        </Text>
      </View>

      <View style={styles.kaynakSatir}>
        <View style={styles.kaynakBlok}>
          <Text style={[styles.kaynakBirincil, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
            0x280 b3/b4 · Antriebs
          </Text>
          <Text style={[styles.kaynakIkincil, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
            Komfort yansıması: 0x353
          </Text>
        </View>
        <View style={styles.rozetBlok}>
          <FazCipi />
          <UnverifiedBadge />
        </View>
      </View>
    </Card>
  );
}

interface DegerKartiProps {
  ad: string;
  deger: string;
  birim: string | null;
  kaynak: string;
  /** 0–1 arası dolgu; veri yoksa çubuk hiç çizilmez. */
  oran: number | null;
  cubukRengi: string;
  ikinciFaz: boolean;
}

function DegerKarti({
  ad,
  deger,
  birim,
  kaynak,
  oran,
  cubukRengi,
  ikinciFaz,
}: DegerKartiProps): ReactElement {
  const { colors } = useTheme();

  return (
    <Card style={styles.degerKart}>
      <Text style={[styles.degerAd, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
        {ad}
      </Text>
      <View style={styles.degerSatir}>
        <Text style={[styles.degerSayi, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
          {deger}
        </Text>
        {birim === null ? null : (
          <Text style={[styles.degerBirim, { color: colors.muted }]} maxFontSizeMultiplier={1.6}>
            {birim}
          </Text>
        )}
      </View>

      {oran === null ? (
        <View style={styles.cubukBoslugu} />
      ) : (
        <View style={[styles.miniCubuk, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
          <View style={[styles.miniDolgu, { width: `${oran * 100}%`, backgroundColor: cubukRengi }]} />
        </View>
      )}

      <Text style={[styles.kaynakIkincil, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
        {kaynak}
      </Text>
      <View style={styles.rozetBlokAlt}>
        {ikinciFaz ? <FazCipi /> : null}
        <UnverifiedBadge />
      </View>
    </Card>
  );
}

function HamBusKarti(): ReactElement {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.hamBaslik}>
        <SectionLabel>HAM BUS</SectionLabel>
        <View style={[styles.listenOnly, { borderColor: colors.ok }]}>
          <Text style={[styles.listenOnlyMetin, { color: colors.ok }]} maxFontSizeMultiplier={1.4}>
            LISTEN-ONLY
          </Text>
        </View>
        <View style={styles.esnek} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Logu kaydet"
          accessibilityHint="Araç bağlantısı kurulduktan sonra etkinleşir"
          accessibilityState={{ disabled: true }}
          disabled
          style={[styles.logDugmesi, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
          <SymbolView
            name="square.and.arrow.down"
            size={14}
            tintColor={colors.dim}
            fallback={<View style={[styles.ikonYedek, { borderColor: colors.dim }]} />}
          />
          <Text style={[styles.logMetin, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
            Logu kaydet
          </Text>
        </Pressable>
      </View>

      <View>
        {HATLAR.map((hat, i) => (
          <View
            key={hat.ad}
            style={[
              styles.hatSatir,
              i < HATLAR.length - 1
                ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }
                : null,
            ]}>
            <View style={[styles.nokta, { backgroundColor: hat.renk }]} />
            <Text style={[styles.hatAd, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
              {hat.ad}
            </Text>
            {hat.ikinciFaz ? <FazCipi /> : null}
            <View style={styles.esnek} />
            <Text style={[styles.hatDeger, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
              {YOK} f/sn
            </Text>
            <Text style={[styles.hatDeger, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
              yük %{YOK}
            </Text>
            <Text style={[styles.hatDeger, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
              son —
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.kesifNot, { color: colors.dim }]} maxFontSizeMultiplier={2}>
        Kare sayacı ve son ID araca bağlanıldığında dolar. Antriebs kanalı Komfort hattı ve
        LED’ler stabil çalıştıktan sonra devreye alınır.
      </Text>
    </Card>
  );
}

/** Antriebs hattına ait her şeyi işaretler: bu kanal 2. fazda bağlanır. */
function FazCipi(): ReactElement {
  const { colors } = useTheme();
  return (
    <View style={[styles.fazCip, { backgroundColor: colors.surfaceRaised, borderColor: BUS_COLORS.antriebs }]}>
      <Text style={[styles.fazMetin, { color: BUS_COLORS.antriebs }]} maxFontSizeMultiplier={1.4}>
        2. faz
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },

  baslikSag: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  telefonDugmesi: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  baslikBlok: { flexShrink: 1, gap: 2 },
  baslik: { ...FONTS.display, fontSize: TYPE_SCALE.title },
  altBaslik: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.caption },
  bleCip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bleMetin: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  nokta: { width: 8, height: 8, borderRadius: RADIUS.pill },

  segmentKap: {
    flexDirection: 'row',
    gap: 3,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.sm + 1,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  segmentMetin: { ...FONTS.bodyMedium, fontSize: 14 },
  segmentAktifMetin: { ...FONTS.bodySemiBold, fontSize: 14 },

  dinlemeSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  listenOnly: { borderRadius: RADIUS.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  listenOnlyMetin: { ...FONTS.monoBold, fontSize: TYPE_SCALE.micro, letterSpacing: 0.6 },
  dinlemeMetin: { flex: 1, minWidth: 180, ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 16 },

  devirBlok: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: SPACING.sm },
  devirSayi: { ...FONTS.monoBold, fontSize: 48 },
  devirBirim: { ...FONTS.body, fontSize: TYPE_SCALE.caption },
  cubuk: {
    height: 10,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  redlineBandi: { position: 'absolute', top: 0, bottom: 0, right: 0 },
  olcekSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  olcek: { ...FONTS.mono, fontSize: 10 },

  kaynakSatir: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACING.sm },
  kaynakBlok: { flexShrink: 1, gap: 1 },
  kaynakBirincil: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  kaynakIkincil: { ...FONTS.mono, fontSize: 10 },
  rozetBlok: { alignItems: 'flex-end', gap: 4 },
  rozetBlokAlt: { alignItems: 'flex-start', gap: 4 },

  ikili: { flexDirection: 'row', gap: SPACING.sm },
  degerKart: { flex: 1, minWidth: 0, gap: 4 },
  degerAd: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.caption },
  degerSatir: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  degerSayi: { ...FONTS.monoBold, fontSize: 30 },
  degerBirim: { ...FONTS.body, fontSize: TYPE_SCALE.caption },
  cubukBoslugu: { height: 8 },
  miniCubuk: {
    height: 8,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  miniDolgu: { height: '100%' },

  kesifSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 32 },
  kesifAd: { flexShrink: 1, ...FONTS.body, fontSize: TYPE_SCALE.caption },
  kesifHat: { flex: 1, ...FONTS.mono, fontSize: 10 },
  kesifDeger: { ...FONTS.mono, fontSize: TYPE_SCALE.caption },
  kesifNot: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 16 },

  hamBaslik: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: HIT_SIZE },
  esnek: { flex: 1 },
  logDugmesi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
  },
  logMetin: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.caption },
  ikonYedek: { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5 },

  hatSatir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 34 },
  hatAd: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  hatDeger: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },

  fazCip: {
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  fazMetin: { ...FONTS.mono, fontSize: 10 },
});
