import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/**
 * İçerik kartı — standart yüzey, **Liquid Glass DEĞİL**.
 *
 * Bir süre camla denendi ve geri alındı. Apple'ın Human Interface Guidelines'ı
 * (Materials) bunu açıkça yasaklıyor:
 *
 *   "Don't use Liquid Glass in the content layer. ... including it in the content
 *    layer can result in unnecessary complexity and a confusing visual hierarchy.
 *    Instead, use [standard materials] for elements in the content layer."
 *
 *   "Use Liquid Glass effects sparingly. ... overusing this material in multiple
 *    custom controls can provide a subpar user experience by distracting from that
 *    content. Limit these effects to the most important functional elements."
 *
 * `Card` 23 ekranın hepsinde kullanılıyor; camı buraya koymak tam olarak "içerik
 * katmanında aşırı kullanım" demekti.
 *
 * Cam nerede: sekme çubuğu (`NativeTabs` → gerçek UITabBar), yığın başlıkları ve
 * modal sheet'ler. Üçünü de **sistem** kendisi uyguluyor, elle taklit edilmiyor —
 * `GlassSurface` yalnızca gerçekten gerekirse özel bir kabuk öğesi için durur.
 */
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
