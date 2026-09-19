import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { BleBaglanti, type BluetoothDurumu, type BulunanCihaz } from '@/lib/ble/connection';
import { KRITIK_KOMUTLAR, type Yetki } from '@/lib/ble/protocol';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, HIT_SIZE, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

type Adim = 'bul' | 'eslesk' | 'dogrula';

/**
 * Araçla eşleştirme.
 *
 * Bu ekranın yapamadığı şeyi bilmek önemli: **eşleşmeyi uygulama başlatmaz.** iOS,
 * CoreBluetooth üzerinden üçüncü parti uygulamalara bonding denetimi vermez. Kart şifreli
 * karakteristik talep ettiğinde iOS eşleşme diyaloğunu kendisi gösterir; buradaki adımlar
 * o akışı yönlendirir, yerine geçmez (CLAUDE.md §9.1).
 */
export default function EslestirmeEkrani() {
  const { colors } = useTheme();
  const router = useRouter();

  const baglantiRef = useRef<BleBaglanti | null>(null);
  const [adim, setAdim] = useState<Adim>('bul');
  const [btDurum, setBtDurum] = useState<BluetoothDurumu>('Unknown');
  const [cihazlar, setCihazlar] = useState<readonly BulunanCihaz[]>([]);
  const [secili, setSecili] = useState<string | null>(null);
  const [yetki, setYetki] = useState<Yetki>('sahip');
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  // Yönetici tek örnek; ekran kapanınca yerel kaynaklar bırakılır.
  useEffect(() => {
    const b = new BleBaglanti();
    baglantiRef.current = b;
    const birak = b.durumuIzle(setBtDurum);
    return () => {
      birak();
      b.yokEt();
      baglantiRef.current = null;
    };
  }, []);

  const tara = useCallback(() => {
    const b = baglantiRef.current;
    if (!b) return;
    setHata(null);
    setCihazlar([]);
    b.taramayaBasla(
      (cihaz) =>
        setCihazlar((onceki) =>
          onceki.some((c) => c.id === cihaz.id) ? onceki : [...onceki, cihaz]
        ),
      (mesaj) => setHata(mesaj)
    );
  }, []);

  useEffect(() => {
    if (btDurum === 'PoweredOn') tara();
    return () => baglantiRef.current?.taramayiDurdur();
  }, [btDurum, tara]);

  const baglan = useCallback(async () => {
    const b = baglantiRef.current;
    if (!b || !secili) return;
    setCalisiyor(true);
    setHata(null);
    try {
      await b.baglan(secili);
      setAdim('dogrula');
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bağlanılamadı.');
    } finally {
      setCalisiyor(false);
    }
  }, [secili]);

  // BLE'nin hiç olmaması ile Bluetooth'un kapalı olması farklı sorunlardır;
  // ikisine aynı mesajı vermek kullanıcıyı yanlış yere bakmaya gönderir.
  if (btDurum === 'Yok') {
    return (
      <View style={[styles.page, styles.merkez, { backgroundColor: colors.bg }]}>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Bu yapıda BLE yok
        </Text>
        <Text style={[styles.govde, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Araç bağlantısı yerel bir modül gerektiriyor; Expo Go bunu taşımaz. Diğer
          ekranlar çalışır, ama araçla konuşmak için development build almalısın.
        </Text>
        <Text style={[styles.kucukNot, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          eas build --profile development --platform ios
        </Text>
      </View>
    );
  }

  if (btDurum !== 'PoweredOn' && btDurum !== 'Unknown') {
    return (
      <View style={[styles.page, styles.merkez, { backgroundColor: colors.bg }]}>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Bluetooth kapalı
        </Text>
        <Text style={[styles.govde, { color: colors.muted }]} maxFontSizeMultiplier={2}>
          Araçla eşleşmek için Bluetooth açık olmalı. Ayarlar’dan aç ve bu ekrana dön.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.basliklar}>
        <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
          Araçla eşleştir
        </Text>
        <View style={styles.adimlar}>
          {(['bul', 'eslesk', 'dogrula'] as const).map((a, i) => {
            const etiket = a === 'bul' ? 'Bul' : a === 'eslesk' ? 'Eşleş' : 'Doğrula';
            const aktif = a === adim;
            return (
              <View key={a} style={styles.adimKutu}>
                <View
                  style={[
                    styles.adimNokta,
                    { backgroundColor: aktif ? colors.accent : colors.line },
                  ]}
                />
                <Text
                  style={[styles.adimMetin, { color: aktif ? colors.text : colors.dim }]}
                  maxFontSizeMultiplier={1.4}>
                  {i + 1} · {etiket}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Card>
        <SectionLabel>BULUNAN CİHAZLAR</SectionLabel>
        {cihazlar.length === 0 ? (
          <Text style={[styles.govde, { color: colors.dim }]} maxFontSizeMultiplier={2}>
            Aranıyor… Aracın kontağı açık ve denetleyici beslemede olmalı.
          </Text>
        ) : (
          cihazlar.map((c) => {
            const seciliMi = c.id === secili;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: seciliMi }}
                accessibilityLabel={`${c.ad ?? 'Adsız cihaz'} seç`}
                onPress={() => {
                  setSecili(c.id);
                  setAdim('eslesk');
                }}
                style={({ pressed }) => [
                  styles.cihazSatir,
                  {
                    borderColor: seciliMi ? colors.accent : colors.line,
                    backgroundColor: colors.surfaceRaised,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <View style={styles.cihazMetin}>
                  <Text style={[styles.cihazAd, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
                    {c.ad ?? 'Adsız cihaz'}
                  </Text>
                  <Text style={[styles.cihazAlt, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
                    RSSI {c.rssi ?? '··'} dBm
                  </Text>
                </View>
                {seciliMi ? <Pill dotColor={colors.accent}>seçili</Pill> : null}
              </Pressable>
            );
          })
        )}
        <Text style={[styles.kucukNot, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          MAC adresi listelenmiyor: iOS uygulamalara MAC vermez ve adresi ~15 dakikada bir
          değiştirir (RPA). Araç, eşleşmede sakladığı IRK ile telefonu çözer.
        </Text>
      </Card>

      <Card>
        <SectionLabel>BU TELEFONUN YETKİSİ</SectionLabel>
        <View style={styles.yetkiSatir}>
          <View style={styles.yetkiMetin}>
            <Text style={[styles.cihazAd, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
              Sahip
            </Text>
            <Text style={[styles.cihazAlt, { color: colors.dim }]} maxFontSizeMultiplier={1.6}>
              Kapalıyken misafir: {KRITIK_KOMUTLAR.join(' · ')} kullanılamaz
            </Text>
          </View>
          <Switch
            value={yetki === 'sahip'}
            onValueChange={(v) => setYetki(v ? 'sahip' : 'misafir')}
            accessibilityLabel="Sahip yetkisi"
            trackColor={{ true: colors.ok, false: colors.line }}
          />
        </View>
        <UnverifiedBadge>KART ONAYLAYACAK</UnverifiedBadge>
        <Text style={[styles.kucukNot, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Yetkiyi karta telefon dayatmaz; burada seçilen değer isteği temsil eder, son sözü
          araç söyler.
        </Text>
      </Card>

      {hata ? (
        <Text
          style={[styles.hata, { color: colors.danger, borderColor: colors.danger }]}
          accessibilityRole="alert"
          maxFontSizeMultiplier={2}>
          {hata}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Eşleşmeyi başlat"
        disabled={!secili || calisiyor}
        onPress={baglan}
        style={({ pressed }) => [
          styles.birincil,
          {
            backgroundColor: colors.accent,
            opacity: secili && !calisiyor ? (pressed ? 0.7 : 1) : 0.4,
          },
        ]}>
        <Text style={[styles.birincilMetin, { color: colors.bg }]} maxFontSizeMultiplier={1.4}>
          {calisiyor ? 'Bağlanıyor…' : 'Eşleşmeyi başlat'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Şimdilik atla"
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.ikincil,
          { borderColor: colors.line, opacity: pressed ? 0.6 : 1 },
        ]}>
        <Text style={[styles.ikincilMetin, { color: colors.muted }]} maxFontSizeMultiplier={1.4}>
          Şimdilik atla
        </Text>
      </Pressable>

      <RuleBox title="EŞLEŞMEYİ UYGULAMA YAPMAZ">
        Şifreleme, bonding ve adres çözümleme araç tarafındadır. Kart şifreli karakteristik
        istediğinde eşleşme diyaloğunu iOS gösterir. Uygulamanın yaptığı, o akışın üstündeki
        imzalı komut katmanıdır.
      </RuleBox>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  merkez: { justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  basliklar: { gap: SPACING.md },
  baslik: { ...FONTS.display, fontSize: 28 },
  adimlar: { flexDirection: 'row', gap: SPACING.lg, flexWrap: 'wrap' },
  adimKutu: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adimNokta: { width: 8, height: 8, borderRadius: RADIUS.pill },
  adimMetin: { ...FONTS.mono, fontSize: TYPE_SCALE.caption },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
  cihazSatir: {
    minHeight: HIT_SIZE + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  cihazMetin: { flex: 1, gap: 2 },
  cihazAd: { ...FONTS.bodyMedium, fontSize: TYPE_SCALE.body },
  cihazAlt: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  kucukNot: { ...FONTS.body, fontSize: TYPE_SCALE.caption, lineHeight: 17 },
  yetkiSatir: {
    minHeight: HIT_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  yetkiMetin: { flex: 1, gap: 2 },
  hata: {
    ...FONTS.body,
    fontSize: TYPE_SCALE.label,
    lineHeight: 19,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  birincil: { height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  birincilMetin: { ...FONTS.bodySemiBold, fontSize: 16 },
  ikincil: {
    minHeight: HIT_SIZE,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ikincilMetin: { ...FONTS.bodySemiBold, fontSize: 15 },
});
