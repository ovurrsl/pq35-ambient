import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { HIT_SIZE, RADIUS } from '@/theme/tokens';

export interface ParlaklikKaydiraciProps {
  /** 0–100 arası yüzde. */
  deger: number;
  onDegisti: (deger: number) => void;
  /** Rayın dolu kısmının rengi — genelde bölge rengi. */
  renk: string;
  /** Ekran okuyucuya okunacak ad. */
  etiket: string;
  devreDisi?: boolean;
}

const ADIM = 5;

/**
 * Parlaklık kaydırıcısı.
 *
 * Projede slider paketi yok; RN yanıtlayıcı (responder) sistemi hem yetiyor hem de rayı
 * seçilen renge boyamaya izin veriyor. Sürükleme jesti ekran okuyucuya ulaşmadığı için
 * `adjustable` rolü ve artır/azalt eylemleri ayrıca tanımlanır — VoiceOver kullanıcısı
 * aksi hâlde değeri hiç değiştiremezdi.
 */
export function ParlaklikKaydiraci({
  deger,
  onDegisti,
  renk,
  etiket,
  devreDisi = false,
}: ParlaklikKaydiraciProps) {
  const { colors } = useTheme();
  const [genislik, setGenislik] = useState<number>(0);

  const olcumAl = useCallback((olay: LayoutChangeEvent): void => {
    setGenislik(olay.nativeEvent.layout.width);
  }, []);

  const dokunustanAyarla = useCallback(
    (olay: GestureResponderEvent): void => {
      if (devreDisi || genislik <= 0) return;
      const oran = Math.min(1, Math.max(0, olay.nativeEvent.locationX / genislik));
      onDegisti(Math.round(oran * 100));
    },
    [devreDisi, genislik, onDegisti]
  );

  const adimla = useCallback(
    (yon: number): void => {
      if (devreDisi) return;
      onDegisti(Math.min(100, Math.max(0, deger + yon * ADIM)));
    },
    [deger, devreDisi, onDegisti]
  );

  const erisilebilirlikEylemi = useCallback(
    (olay: AccessibilityActionEvent): void => {
      if (olay.nativeEvent.actionName === 'increment') adimla(1);
      else if (olay.nativeEvent.actionName === 'decrement') adimla(-1);
    },
    [adimla]
  );

  const yanit = useCallback((): boolean => !devreDisi, [devreDisi]);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiket}
      accessibilityState={{ disabled: devreDisi }}
      accessibilityValue={{ min: 0, max: 100, now: deger, text: `yüzde ${deger}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={erisilebilirlikEylemi}
      onLayout={olcumAl}
      onStartShouldSetResponder={yanit}
      onMoveShouldSetResponder={yanit}
      onResponderGrant={dokunustanAyarla}
      onResponderMove={dokunustanAyarla}
      style={styles.kaydirac}>
      <View style={[styles.ray, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]} />
      <View
        style={[
          styles.rayDolu,
          { backgroundColor: renk, width: `${deger}%`, opacity: devreDisi ? 0.3 : 1 },
        ]}
      />
      <View
        style={[
          styles.tutamak,
          {
            left: `${deger}%`,
            backgroundColor: colors.text,
            borderColor: colors.bg,
            opacity: devreDisi ? 0.4 : 1,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kaydirac: { height: HIT_SIZE, justifyContent: 'center' },
  ray: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rayDolu: { position: 'absolute', left: 0, height: 10, borderRadius: RADIUS.pill },
  tutamak: {
    position: 'absolute',
    width: 26,
    height: 26,
    marginLeft: -13,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
  },
});
