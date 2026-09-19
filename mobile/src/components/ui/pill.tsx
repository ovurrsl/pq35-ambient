import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, TYPE_SCALE } from '@/theme/tokens';

export type PillTone = 'nötr' | 'ok' | 'uyari' | 'tehlike';

/**
 * Durum çipi.
 *
 * İKİ YAZI TİPİ, İÇERİĞE GÖRE:
 *
 * Bu çip eskiden **her şeyi** Menlo ile 11 pt'ta çiziyordu — CAN ID'lerini de,
 * "Oturum anahtarıyla imzalı" gibi tam cümleleri de. Menlo bu uygulamanın en güçlü kimlik
 * sinyali (ham bus değerlerini bildiren bir alet), tam bu yüzden onu cümlelere harcamak
 * sinyali zayıflatıyor; üstelik 10–11 pt tek aralıklı düzyazı okunması en zor birleşimdir.
 *
 * HIG (`branding.md › Best practices`): "It can work well to use a custom font for headlines
 * and subheadings while using a system font for body copy and captions, because the system
 * fonts are designed for optimal legibility at small sizes."
 *
 * KURAL: `veri` yalnızca dünyada da o şekilde yazılan **teknik simgeler** için —
 * `LISTEN-ONLY`, `ESP32-S3`, `Kl.15`, `0x351`, `10 Hz`, `2G`, `GPS`, `JWT`. Geri kalan her
 * şey (durum sözcükleri, cümleler) sistem yazı tipiyle ve **cümle düzeniyle** yazılır.
 */
export function Pill({
  children,
  tone = 'nötr',
  dotColor,
  veri = false,
}: {
  children: string;
  tone?: PillTone;
  dotColor?: string;
  /** İçerik teknik bir simge mi? Öyleyse Menlo, değilse sistem yazı tipi. */
  veri?: boolean;
}) {
  const { colors } = useTheme();
  const toneColor =
    tone === 'ok' ? colors.ok : tone === 'uyari' ? colors.warn : tone === 'tehlike' ? colors.danger : colors.text;

  return (
    <View style={[styles.pill, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text
        style={[veri ? styles.veriMetin : styles.metin, { color: toneColor }]}
        maxFontSizeMultiplier={1.5}>
        {children}
      </Text>
    </View>
  );
}

/**
 * Kesikli çerçeveli rozet — değerin henüz araçta ölçülmediğini gösterir.
 * Doğrulanmamış hiçbir değer bu rozet olmadan ekrana yazılmaz (CLAUDE.md §12).
 */
export function UnverifiedBadge({ children = 'ARAÇTA DOĞRULANACAK' }: { children?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.dashed, { borderColor: colors.warn }]}>
      <Text style={[styles.dashedText, { color: colors.warn }]} maxFontSizeMultiplier={1.4}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 7, height: 7, borderRadius: RADIUS.pill },
  metin: { ...FONTS.body, fontSize: TYPE_SCALE.micro },
  veriMetin: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  dashed: {
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 7,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  dashedText: { ...FONTS.monoBold, fontSize: TYPE_SCALE.micro },
});
