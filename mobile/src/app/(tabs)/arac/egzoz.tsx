import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { DataRow, RowDivider, ToggleRow } from '@/components/ui/row';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * Varex egzoz valfi.
 *
 * Aktüatör bir servo değil, iki uçlu ters çevrilebilir bir DC motordur: yön, gerilimin
 * yönüdür. Kontrolcü tarafında H-köprüsü vardır, "aç/kapat" ise köprünün yönü + hareket
 * süresidir.
 *
 * Konum geri beslemesinin bu ünitede olup olmadığı BİLİNMİYOR. Bu yüzden arayüz valfin
 * konumunu "bilinen son komut" olarak sunar — ölçülmüş konum gibi değil. Bu farkı
 * gizlemek, olmayan bir sensörün varmış gibi davranması olurdu.
 */

type ValfKomutu = 'acik' | 'kapali';

export default function EgzozEkrani() {
  const { colors } = useTheme();
  const [komut, setKomut] = useState<ValfKomutu>('kapali');
  const [otomatik, setOtomatik] = useState(true);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      {/*
        "Kontak açık" bir BLE durumu DEĞİL, Komfort hattından okunacak Kl.15 durumudur ve
        o hat henüz yok. Yeşil noktayla "açık" yazmak, olmayan bir ölçümü olgu gibi
        sunmaktı; CLAUDE.md §12'nin kuralı burada da geçerli.
      */}
      <View style={styles.cipler}>
        <Pill dotColor={colors.dim} veri>Kontak ··</Pill>
        <Pill veri>Kl.15</Pill>
        <UnverifiedBadge>KL.15 CAN’DAN OKUNACAK</UnverifiedBadge>
      </View>

      <Card>
        <SectionLabel>VALF</SectionLabel>
        <View style={styles.durumSatiri}>
          <View
            style={[
              styles.valfDaire,
              { borderColor: komut === 'acik' ? colors.ok : colors.line },
            ]}
            accessible
            accessibilityLabel={komut === 'acik' ? 'Valf açık' : 'Valf kapalı'}>
            <View
              style={[
                styles.valfCizgi,
                {
                  backgroundColor: komut === 'acik' ? colors.ok : colors.dim,
                  transform: [{ rotate: komut === 'acik' ? '0deg' : '90deg' }],
                },
              ]}
            />
          </View>
          <View style={styles.durumMetin}>
            <Text style={[styles.durumBaslik, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
              {komut === 'acik' ? 'Açık' : 'Kapalı'}
            </Text>
            <Text style={[styles.durumAlt, { color: colors.dim }]} maxFontSizeMultiplier={1.8}>
              bilinen son komut
            </Text>
          </View>
        </View>

        <View style={styles.dugmeler}>
          {(['acik', 'kapali'] as const).map((d) => {
            const secili = komut === d;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityState={{ selected: secili }}
                onPress={() => setKomut(d)}
                style={({ pressed }) => [
                  styles.dugme,
                  {
                    backgroundColor: secili ? colors.surfaceRaised : 'transparent',
                    borderColor: secili ? colors.text : colors.line,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}>
                <Text
                  style={[styles.dugmeMetin, { color: secili ? colors.text : colors.muted }]}
                  maxFontSizeMultiplier={1.6}>
                  {d === 'acik' ? 'Aç' : 'Kapat'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <RuleBox title="KONUM ÖLÇÜLMÜYOR">
        Bu ünitede konum geri beslemesi (potansiyometre) var mı, yoksa limit anahtarı mı
        henüz bilinmiyor. Geri besleme yoksa yarı açık konum mümkün değildir ve sistemin
        valfin nerede olduğunu bilmesinin tek yolu hareket süresidir.
      </RuleBox>

      <Card>
        <SectionLabel>OTOMATİK MOD</SectionLabel>
        <ToggleRow
          baslik="Otomatik mod"
          altBaslik="Devir ve hız eşiğine göre aç-kapat"
          deger={otomatik}
          onDegisim={setOtomatik}
        />
        <RowDivider />
        <DataRow etiket="Devir eşiği" deger="—" sag={<UnverifiedBadge>ARAÇTA BELİRLENECEK</UnverifiedBadge>} />
        <RowDivider />
        <DataRow etiket="Hız eşiği" deger="—" sag={<UnverifiedBadge>ARAÇTA BELİRLENECEK</UnverifiedBadge>} />
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Her eşiğin bir geri dönüş payı vardır; yoksa eşik civarında sürerken valf sürekli
          açılıp kapanır.
        </Text>
      </Card>

      <Card>
        <SectionLabel>TETİK KAYNAĞI</SectionLabel>
        <DataRow etiket="Devir" deger="0x280 · 0x353" />
        <RowDivider />
        <DataRow etiket="Hız" deger="0x351" />
      </Card>

      <Card>
        <SectionLabel>GÜRÜLTÜ</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Valf açıkken araç yüksek sesli olur. Egzoz gürültüsü muayeneye ve yerel kurallara
          tabidir; sistem bunu bilemez, kararı sürücü verir.
        </Text>
      </Card>

      <Text style={[styles.yetki, { color: colors.dim }]} maxFontSizeMultiplier={1.8}>
        Egzoz kontrolü misafir yetkisinde kapalıdır.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  durumSatiri: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  valfDaire: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valfCizgi: { width: 40, height: 5, borderRadius: RADIUS.pill },
  durumMetin: { flex: 1, minWidth: 0, gap: 2 },
  durumBaslik: { ...FONTS.display, fontSize: 22 },
  durumAlt: { ...FONTS.body, fontSize: TYPE_SCALE.micro },
  dugmeler: { flexDirection: 'row', gap: SPACING.sm },
  dugme: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dugmeMetin: { ...FONTS.bodySemiBold, fontSize: TYPE_SCALE.body },
  not: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 17 },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
  yetki: { ...FONTS.body, fontSize: TYPE_SCALE.micro, textAlign: 'center' },
});
