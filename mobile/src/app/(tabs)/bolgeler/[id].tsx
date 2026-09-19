import { useCallback, useState, type JSX } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Anahtar } from '@/components/ui/anahtar';
import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { ParlaklikKaydiraci } from '@/components/ui/slider';
import { useTheme } from '@/theme/theme-provider';
import { EVENT_COLORS, FONTS, HIT_SIZE, MARKA_ETIKET, RADIUS, SPACING, TYPE_SCALE, ZONE_COLORS, ZONE_IDS, ZONE_LABELS, type ZoneId } from '@/theme/tokens';

/**
 * Bölge detayı.
 *
 * Buradaki renk ve parlaklık aracın değil, **uygulamanın** kararıdır (Yol A). Araç yalnızca
 * tetik üretir; CAN her iki kanalda da Listen-Only dinlenir ve araca komut yazılmaz.
 */

/** Alt bölüm adları — kaynak: design/project/AppZonDetay.dc.html ve AppZonlar.dc.html. */
const ALT_BOLUMLER: Readonly<Record<ZoneId, readonly string[]>> = {
  z1: ['Kulp', 'Cep', 'Şerit'],
  z2: ['Kulp', 'Cep', 'Şerit'],
  z3: ['Sürücü', 'Yolcu'],
  z4: ['Torpido', 'Konsol'],
  z5: ['Yan döşeme', 'Şerit'],
  z6: ['Yan döşeme', 'Şerit'],
  z7: ['Sol', 'Sağ'],
};

/** Bölge renklerinin adları — CLAUDE.md §4 renk aileleri. */
const RENK_ADLARI: Readonly<Record<ZoneId, string>> = {
  z1: 'Buz mavisi',
  z2: 'Lavanta',
  z3: 'Nane',
  z4: 'Amber',
  z5: 'İndigo',
  z6: 'Pembe',
  z7: 'Turkuaz',
};

interface HazirRenk {
  deger: string;
  ad: string;
}

/**
 * Hazır palet. Gerçek renk çarkı ileride gelir; şimdilik bölge renkleri ve birkaç nötr.
 * Beyaz token'larda yok — şeridin tam beyaz çıkışı olduğu için tek literal değer budur.
 */
const HAZIR_RENKLER: readonly HazirRenk[] = [
  { deger: '#FFFFFF', ad: 'Beyaz' },
  ...ZONE_IDS.map((id): HazirRenk => ({ deger: ZONE_COLORS[id], ad: RENK_ADLARI[id] })),
  { deger: EVENT_COLORS.door, ad: 'Kırmızı' },
  { deger: EVENT_COLORS.turn, ad: 'Sarı' },
  { deger: EVENT_COLORS.reverse, ad: 'Gri mavi' },
];

interface OlayTanimi {
  anahtar: OlayAnahtari;
  ad: string;
  aciklama: string;
  renk: string;
}

type OlayAnahtari = 'kapi' | 'sinyal' | 'geri' | 'redline';

/** Açıklamalar CLAUDE.md §5'teki öncelik makinesinden; davranış uydurulmaz. */
const OLAYLAR: readonly OlayTanimi[] = [
  { anahtar: 'kapi', ad: 'Kapı', aciklama: 'Kapı açıkken düz kırmızı', renk: EVENT_COLORS.door },
  { anahtar: 'sinyal', ad: 'Sinyal', aciklama: 'Flaşör bitinin yükselen kenarında sweep', renk: EVENT_COLORS.turn },
  { anahtar: 'geri', ad: 'Geri vites', aciklama: 'Geri viteste devreye girer', renk: EVENT_COLORS.reverse },
  { anahtar: 'redline', ad: 'Redline', aciklama: 'Devir eşiğinde shift-light', renk: EVENT_COLORS.redline },
];

type DavranisModu = 'bagimsiz' | 'paylasimli';

function bolgeMu(deger: unknown): deger is ZoneId {
  return typeof deger === 'string' && (ZONE_IDS as readonly string[]).includes(deger);
}

export default function BolgeDetayRotasi(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ham: unknown = id;
  return bolgeMu(ham) ? <BolgeDetay id={ham} /> : <BolgeBulunamadi />;
}

function BolgeDetay({ id }: { id: ZoneId }): JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bolgeRengi = ZONE_COLORS[id];
  const sira = ZONE_IDS.indexOf(id) + 1;

  const [renk, setRenk] = useState<string>(bolgeRengi);
  const [parlaklik, setParlaklik] = useState<number>(72);
  const [mod, setMod] = useState<DavranisModu>('paylasimli');
  const [olaylaraTepki, setOlaylaraTepki] = useState<boolean>(true);
  const [olayDurumu, setOlayDurumu] = useState<Record<OlayAnahtari, boolean>>({
    kapi: true,
    sinyal: true,
    geri: true,
    redline: false,
  });

  const olayAnahtarla = useCallback((anahtar: OlayAnahtari, acik: boolean): void => {
    setOlayDurumu((onceki) => ({ ...onceki, [anahtar]: acik }));
  }, []);

  const secilenRenkAdi =
    HAZIR_RENKLER.find((secenek) => secenek.deger === renk)?.ad ?? RENK_ADLARI[id];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.page,
        { backgroundColor: colors.bg, paddingBottom: insets.bottom + SPACING.xxl },
      ]}>
      <Stack.Screen options={{ title: ZONE_LABELS[id] }} />

      <View style={styles.basliklar}>
        <View style={[styles.rozet, { backgroundColor: bolgeRengi }]}>
          <Text style={[styles.rozetMetin, { color: MARKA_ETIKET }]} maxFontSizeMultiplier={1.4}>
            {id.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          {ZONE_LABELS[id]}
        </Text>
        <Text style={[styles.siraMetin, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          Bölge {sira} / 7
        </Text>
      </View>

      <View style={styles.cipler}>
        <Pill dotColor={colors.ok}>Uygulama rengi</Pill>
        <Pill tone="uyari">LISTEN-ONLY</Pill>
      </View>

      <Card>
        <SectionLabel>SEÇİLİ RENK</SectionLabel>
        <View style={styles.renkOzet}>
          <View style={[styles.renkOnizleme, { backgroundColor: renk, borderColor: colors.line }]} />
          <View style={styles.renkMetin}>
            <Text style={[styles.renkKod, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
              {renk.toUpperCase()}
            </Text>
            <Text style={[styles.renkAd, { color: colors.muted }]} maxFontSizeMultiplier={2}>
              {secilenRenkAdi}
            </Text>
          </View>
        </View>

        <Text style={[styles.not, { color: colors.dim, borderColor: colors.line }]} maxFontSizeMultiplier={2}>
          Renk uygulamadan seçilir. CAN yalnız tetik.
        </Text>

        <View style={styles.palet}>
          {HAZIR_RENKLER.map((secenek) => (
            <RenkKaresi
              key={secenek.deger}
              secenek={secenek}
              secili={secenek.deger === renk}
              onSec={setRenk}
            />
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.parlaklikBasi}>
          <Text style={[styles.satirAd, { color: colors.text }]} maxFontSizeMultiplier={2}>
            Parlaklık
          </Text>
          <Text style={[styles.yuzde, { color: renk }]} maxFontSizeMultiplier={1.4}>
            %{parlaklik}
          </Text>
        </View>
        <ParlaklikKaydiraci
          deger={parlaklik}
          onDegisti={setParlaklik}
          renk={renk}
          etiket={`${ZONE_LABELS[id]} parlaklığı`}
        />
      </Card>

      <Card>
        <SectionLabel>DAVRANIŞ MODU</SectionLabel>
        <Text style={[styles.govde, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          {mod === 'paylasimli'
            ? 'Paylaşımlı: taban katmanı 7 bölgede ortak.'
            : 'Bağımsız: bu bölge kendi tabanını kullanır.'}
        </Text>
        <View style={[styles.segment, { backgroundColor: colors.glassFallback, borderColor: colors.line }]}>
          <ModSecenegi
            etiket="Bağımsız"
            deger="bagimsiz"
            secili={mod === 'bagimsiz'}
            onSec={setMod}
          />
          <ModSecenegi
            etiket="Paylaşımlı"
            deger="paylasimli"
            secili={mod === 'paylasimli'}
            onSec={setMod}
          />
        </View>
      </Card>

      <Card>
        <View style={styles.satir}>
          <View style={styles.satirMetin}>
            <Text style={[styles.satirAd, { color: colors.text }]} maxFontSizeMultiplier={2}>
              Araç olaylarına tepki ver
            </Text>
            <Text style={[styles.satirAlt, { color: colors.muted }]} maxFontSizeMultiplier={2}>
              Kapı · sinyal · geri vites · redline
            </Text>
          </View>
          <Anahtar
            erisimEtiketi="Bu bölge araç olaylarına tepki versin"
            deger={olaylaraTepki}
            onDegisim={setOlaylaraTepki}
          />
        </View>

        <View style={[styles.ayirac, { backgroundColor: colors.line }]} />

        {OLAYLAR.map((olay) => (
          <OlaySatiri
            key={olay.anahtar}
            olay={olay}
            acik={olayDurumu[olay.anahtar]}
            devreDisi={!olaylaraTepki}
            onAnahtar={olayAnahtarla}
          />
        ))}

        <Text style={[styles.govde, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Taban katmanı = uygulama rengi × gösterge dimmer × far durumu; olaylar bunun üstüne
          geçici olarak biner ve mesaj 2 saniye kesilirse tabana dönülür.
        </Text>
        <Text style={[styles.oncelik, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
          uygulama override › geri vites › kapı › sinyal › redline › taban
        </Text>
      </Card>

      <Card>
        <View style={styles.parlaklikBasi}>
          <SectionLabel>ALT BÖLÜMLER</SectionLabel>
          <UnverifiedBadge>MONTAJDA ÖLÇÜLECEK</UnverifiedBadge>
        </View>
        <Text style={[styles.govde, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Alt bölümler ayrı hat değildir; tek veri hattındaki piksel aralıklarıdır. Aralıklar
          şerit kesilip takıldıktan sonra sayılır — buraya tahmini piksel yazılmaz.
        </Text>
        {ALT_BOLUMLER[id].map((ad, i, hepsi) => (
          <View key={ad}>
            <View style={styles.satir}>
              <View style={[styles.altNokta, { backgroundColor: renk }]} />
              <View style={styles.satirMetin}>
                <Text style={[styles.satirAd, { color: colors.text }]} maxFontSizeMultiplier={2}>
                  {ad}
                </Text>
                <Text style={[styles.satirAlt, { color: colors.dim }]} maxFontSizeMultiplier={2}>
                  piksel aralığı ölçülmedi
                </Text>
              </View>
            </View>
            {i === hepsi.length - 1 ? null : (
              <View style={[styles.ayirac, { backgroundColor: colors.line }]} />
            )}
          </View>
        ))}
      </Card>

      <RuleBox title="ARACA HİÇBİR ŞEY YAZILMAZ">
        Bu ekrandaki seçimler BLE üzerinden ESP32-S3’e gider. CAN hattı yalnızca dinlenir;
        renk aracın ekranından okunmaz ve araca komut yazılmaz.
      </RuleBox>
    </ScrollView>
  );
}

function BolgeBulunamadi(): JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const listeyeDon = useCallback((): void => {
    router.replace('/(tabs)/bolgeler');
  }, [router]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.bosPage,
        { backgroundColor: colors.bg, paddingBottom: insets.bottom + SPACING.xxl },
      ]}>
      <SymbolView
        name="questionmark.circle"
        size={56}
        tintColor={colors.muted}
        fallback={<View style={[styles.bosIkon, { borderColor: colors.muted }]} />}
      />
      <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
        Bölge bulunamadı
      </Text>
      <Text style={[styles.govde, { color: colors.muted, textAlign: 'center' }]} maxFontSizeMultiplier={2}>
        Sistemde yedi bölge var: Z1–Z7. Aradığın adres bunlardan biri değil.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bölgeler listesine dön"
        onPress={listeyeDon}
        style={({ pressed }) => [
          styles.birincil,
          { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Text style={[styles.birincilMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
          Bölgelere dön
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function RenkKaresi({
  secenek,
  secili,
  onSec,
}: {
  secenek: HazirRenk;
  secili: boolean;
  onSec: (deger: string) => void;
}): JSX.Element {
  const { colors } = useTheme();
  const sec = useCallback((): void => onSec(secenek.deger), [onSec, secenek.deger]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`Hazır renk: ${secenek.ad}`}
      accessibilityState={{ selected: secili, checked: secili }}
      onPress={sec}
      style={({ pressed }) => [styles.renkKareDokunma, { opacity: pressed ? 0.6 : 1 }]}>
      <View
        style={[
          styles.renkKare,
          {
            backgroundColor: secenek.deger,
            borderColor: secili ? colors.text : colors.line,
            borderWidth: secili ? 3 : StyleSheet.hairlineWidth,
          },
        ]}
      />
    </Pressable>
  );
}

function ModSecenegi({
  etiket,
  deger,
  secili,
  onSec,
}: {
  etiket: string;
  deger: DavranisModu;
  secili: boolean;
  onSec: (deger: DavranisModu) => void;
}): JSX.Element {
  const { colors } = useTheme();
  const sec = useCallback((): void => onSec(deger), [deger, onSec]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={etiket}
      accessibilityState={{ selected: secili, checked: secili }}
      onPress={sec}
      style={({ pressed }) => [
        styles.segmentSecenek,
        {
          backgroundColor: secili ? colors.surfaceRaised : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text
        style={[styles.segmentMetin, { color: secili ? colors.text : colors.muted }]}
        maxFontSizeMultiplier={1.6}>
        {etiket}
      </Text>
    </Pressable>
  );
}

function OlaySatiri({
  olay,
  acik,
  devreDisi,
  onAnahtar,
}: {
  olay: OlayTanimi;
  acik: boolean;
  devreDisi: boolean;
  onAnahtar: (anahtar: OlayAnahtari, acik: boolean) => void;
}): JSX.Element {
  const { colors } = useTheme();
  const anahtarla = useCallback(
    (yeni: boolean): void => onAnahtar(olay.anahtar, yeni),
    [olay.anahtar, onAnahtar]
  );

  return (
    <View style={[styles.satir, { opacity: devreDisi ? 0.45 : 1 }]}>
      <View style={[styles.altNokta, { backgroundColor: olay.renk }]} />
      <View style={styles.satirMetin}>
        <Text style={[styles.satirAd, { color: colors.text }]} maxFontSizeMultiplier={2}>
          {olay.ad}
        </Text>
        <Text style={[styles.satirAlt, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          {olay.aciklama}
        </Text>
      </View>
      <Anahtar
        erisimEtiketi={`${olay.ad} olayına tepki ver`}
        deger={acik}
        kilitli={devreDisi}
        onDegisim={anahtarla}
        acikRengi={olay.renk}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: SPACING.lg, gap: SPACING.md },
  bosPage: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.md, alignItems: 'center', justifyContent: 'center' },
  bosIkon: { width: 56, height: 56, borderRadius: RADIUS.pill, borderWidth: 2 },

  basliklar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rozet: { width: 26, height: 26, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  rozetMetin: { ...FONTS.monoBold, fontSize: TYPE_SCALE.caption },
  baslik: { flex: 1, ...FONTS.display, fontSize: 24 },
  siraMetin: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  cipler: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  renkOzet: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  renkOnizleme: { width: 64, height: 64, borderRadius: RADIUS.xl, borderWidth: StyleSheet.hairlineWidth },
  renkMetin: { flex: 1, gap: 3 },
  renkKod: { ...FONTS.monoBold, fontSize: 22 },
  renkAd: { ...FONTS.body, fontSize: TYPE_SCALE.label },
  not: {
    ...FONTS.body,
    fontSize: TYPE_SCALE.micro,
    lineHeight: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  palet: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  renkKareDokunma: { width: HIT_SIZE, height: HIT_SIZE, alignItems: 'center', justifyContent: 'center' },
  renkKare: { width: 32, height: 32, borderRadius: RADIUS.pill },

  parlaklikBasi: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  yuzde: { ...FONTS.monoBold, fontSize: 14 },

  segment: { flexDirection: 'row', borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: 3, gap: 3 },
  segmentSecenek: { flex: 1, minHeight: 38, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  segmentMetin: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.label },

  satir: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: HIT_SIZE + 4 },
  satirMetin: { flex: 1, minWidth: 0, gap: 1 },
  satirAd: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.body },
  satirAlt: { ...FONTS.body, fontSize: TYPE_SCALE.micro },
  altNokta: { width: 10, height: 10, borderRadius: RADIUS.pill },
  ayirac: { height: StyleSheet.hairlineWidth },
  oncelik: { ...FONTS.mono, fontSize: 11, lineHeight: 16 },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 19 },


  birincil: { minHeight: 52, minWidth: 200, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  birincilMetin: { ...FONTS.bodySemiBold, fontSize: 16 },
});
