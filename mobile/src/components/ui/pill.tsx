import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, RADIUS, TYPE_SCALE } from '@/theme/tokens';

export type PillTone = 'nötr' | 'ok' | 'uyari' | 'tehlike';

/** Mono rozet — durum çipi. */
export function Pill({
  children,
  tone = 'nötr',
  dotColor,
}: {
  children: string;
  tone?: PillTone;
  dotColor?: string;
}) {
  const { colors } = useTheme();
  const toneColor =
    tone === 'ok' ? colors.ok : tone === 'uyari' ? colors.warn : tone === 'tehlike' ? colors.danger : colors.text;

  return (
    <View style={[styles.pill, { backgroundColor: colors.surfaceRaised, borderColor: colors.line }]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.text, { color: toneColor }]} maxFontSizeMultiplier={1.5}>
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
  text: { ...FONTS.mono, fontSize: TYPE_SCALE.micro },
  dashed: {
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 7,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  dashedText: { ...FONTS.mono, fontSize: 10, letterSpacing: 0.8 },
});
