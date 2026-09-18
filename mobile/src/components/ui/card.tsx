import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line },
        style,
      ]}>
      {children}
    </View>
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
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
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
    fontFamily: FONTS.mono,
    fontSize: TYPE_SCALE.micro,
    letterSpacing: 1.3,
  },
  ruleBody: { fontFamily: FONTS.body, fontSize: TYPE_SCALE.label, lineHeight: 19 },
});
