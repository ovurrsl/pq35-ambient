import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, RuleBox, SectionLabel } from '@/components/ui/card';
import { DataRow, RowDivider, ToggleRow } from '@/components/ui/row';
import { Pill, UnverifiedBadge } from '@/components/ui/pill';
import { ParlaklikKaydiraci } from '@/components/ui/slider';
import { useTheme } from '@/theme/theme-provider';
import { FONTS, SPACING, TYPE_SCALE } from '@/theme/tokens';

import { KOSE_ADLARI, KOSE_IDS } from '@/lib/hava-kose';

/**
 * Denge ve kurulum.
 *
 * Buradaki her şey KURULUM tarafındadır ve araç dururken yapılır. Virajda gövde yatışı
 * saniyenin onda birlerinde gelişir; hava aktüasyonu saniyeler mertebesindedir, yani
 * tepkisel bir yatış düzeltmesi geç kalır ve kuvvet araç geri dönerken geldiği için
 * zararlı bile olabilir. Havanın sıkıştırılabilir olması onu iyi bir yay, aynı nedenle
 * kötü bir aktüatör yapar (HavaDenge panosu).
 *
 * Bu yüzden yatış açısı ÖLÇÜLÜR ve KAYDEDİLİR — anlık düzeltilmeye çalışılmaz.
 */
export default function HavaDengeEkrani() {
  const { colors } = useTheme();
  const [dagilim, setDagilim] = useState(50);
  const [yukDengeleme, setYukDengeleme] = useState(true);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <View style={styles.cipler}>
        <Pill dotColor={colors.ok}>Araç duruyor</Pill>
      </View>

      <RuleBox title="KURULUM YALNIZCA ARAÇ DURURKEN">
        Hareket hâlinde basınç dağılımını değiştirmek, virajın ortasında tutuş dağılımını
        değiştirmektir. Araç hareket etmeye başlayınca bu ekran salt okunur olur.
      </RuleBox>

      <Card>
        <SectionLabel>CANLI AÇI</SectionLabel>
        <DataRow etiket="Yatış" deger="—" />
        <RowDivider />
        <DataRow etiket="Boyuna eğim" deger="—" />
        <UnverifiedBadge>IMU TAKILINCA GELECEK</UnverifiedBadge>
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Açı ölçülür ve sürüş kaydına yazılır; anlık olarak düzeltilmeye çalışılmaz. Hava
          bir yay olarak iyidir, aktüatör olarak yavaştır.
        </Text>
      </Card>

      <Card>
        <SectionLabel>KÖŞE AĞIRLIĞI</SectionLabel>
        {KOSE_IDS.map((k, i) => (
          <View key={k}>
            {i > 0 ? <RowDivider /> : null}
            <DataRow etiket={KOSE_ADLARI[k]} deger="—" />
          </View>
        ))}
        <RowDivider />
        <DataRow etiket="Çapraz denge" deger="—" />
        <UnverifiedBadge>DÜZ ZEMİN · SÜRÜCÜ KOLTUKTA</UnverifiedBadge>
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Çapraz ağırlıkları eşitlemek gerçek, ölçülebilir bir yol tutuş kazancıdır — dört
          köşe bağımsız basınç kontrolünün asıl sebebi budur.
        </Text>
      </Card>

      <Card>
        <SectionLabel>ÖN / ARKA BASINÇ DAĞILIMI</SectionLabel>
        <ParlaklikKaydiraci
          etiket="Ön / arka basınç dağılımı"
          deger={dagilim}
          onDegisti={setDagilim}
          renk={colors.muted}
        />
        <View style={styles.uclar}>
          <Text style={[styles.uc, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
            ÖNE AĞIR
          </Text>
          <Text style={[styles.uc, { color: colors.dim }]} maxFontSizeMultiplier={1.4}>
            ARKAYA AĞIR
          </Text>
        </View>
        <Text style={[styles.not, { color: colors.dim }]} maxFontSizeMultiplier={2}>
          Denge karakterini kaydıran bir kurulum tercihidir, anlık bir düzeltme değil.
          Yönü ve miktarı araçta denenerek bulunur.
        </Text>
      </Card>

      <Card>
        <SectionLabel>OTOMATİK YÜK DENGELEME</SectionLabel>
        <ToggleRow
          baslik="Otomatik yük dengeleme"
          altBaslik="Yolcu ve bagajda araç seviyede kalır"
          deger={yukDengeleme}
          onDegisim={setYukDengeleme}
        />
      </Card>

      <RuleBox title="VİRAJDA VE FRENDE DONAR">
        Dengeleme, yanal ve boylamsal g eşiğinin üstünde durur. Yoksa döngü virajdaki
        geçici yük transferini kalıcı sanar, dış köşeyi şişirir ve virajdan çıkınca araç
        eğri kalır. Kriko veya lift algılanınca da durur: bir teker havadayken sistem o
        köşeyi sonuna kadar şişirmeye çalışır.
      </RuleBox>

      <Card>
        <SectionLabel>DEĞİŞİKLİK NASIL ÖLÇÜLÜR</SectionLabel>
        <Text style={[styles.govde, { color: colors.text }]} maxFontSizeMultiplier={2}>
          Kurulumu değiştir, aynı yolu sür, sürüş kaydındaki g–g diyagramını ve yatış tepe
          değerlerini karşılaştır. Sürüş kaydı için eklenen IMU, kurulum değişikliğinin işe
          yarayıp yaramadığını ölçen şeydir.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  cipler: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  uclar: { flexDirection: 'row', justifyContent: 'space-between' },
  uc: { ...FONTS.mono, fontSize: 11, letterSpacing: 0.6 },
  not: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 17 },
  govde: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 20 },
});
