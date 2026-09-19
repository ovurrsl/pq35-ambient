import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { GlassSurface } from './glass-surface';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * İçerik kartı — Liquid Glass yüzeyi.
 *
 * Camı tek tek ekranlara değil buraya bağlıyoruz: `Card` 23 ekranın hepsinde
 * kullanılıyor, dolayısıyla malzeme tek yerden değişiyor ve hiçbir ekran geride
 * kalmıyor.
 *
 * Erişilebilirlik yedeği `GlassSurface` içinde: iOS 26 yoksa veya **Şeffaflığı
 * Azalt / Kontrastı Artır** açıksa opak zemine düşer. Bu bir bozulma değil, HIG
 * gereğidir.
 */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <GlassSurface glass="regular" radius={RADIUS.lg} style={[styles.card, style]}>
      {children}
    </GlassSurface>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[styles.sectionLabel, { color: colors.muted }]}
      maxFontSizeMultiplier={1.6}>
      {children}
    </Text>
  );
}

/**
 * KURAL kutusu — tam çerçeveli.
 * Sol şeritli kart kullanılmaz (kanvas tasarım kuralı).
 */
export function RuleBox({ title, children }: { title: string; children: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.rule, { borderColor: colors.danger, backgroundColor: 'rgba(255,90,90,0.08)' }]}>
      <Text style={[styles.ruleTitle, { color: colors.danger }]} maxFontSizeMultiplier={1.4}>
        {title}
      </Text>
      <Text style={[styles.ruleBody, { color: colors.text }]} maxFontSizeMultiplier={2}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionLabel: {
    ...FONTS.bodySemiBold,
    fontSize: TYPE_SCALE.caption,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  rule: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  ruleTitle: {
    ...FONTS.mono,
    fontSize: TYPE_SCALE.micro,
    letterSpacing: 1.3,
  },
  ruleBody: { ...FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 19 },
});
