import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, type GlassStyle } from 'expo-glass-effect';

import { useTheme } from '@/theme/theme-provider';
import { RADIUS } from '@/theme/tokens';

export interface GlassSurfaceProps {
  children?: ReactNode;
  /** `regular` kabuk için (sekme çubuğu, başlık), `clear` içerik üstünde yüzen kartlar için. */
  glass?: GlassStyle;
  /** Cam üzerine binen renk tonu — bölge rengiyle vurgulamak için. */
  tint?: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Liquid Glass yüzeyi — erişilebilirlik yedeği yerleşik.
 *
 * Gerçek cam yalnızca iOS 26+ üzerinde ve **Şeffaflığı Azalt kapalıyken** çizilir.
 * Aksi hâlde token'lardan gelen **opak** zemine düşer. Bu bir bozulma değil, HIG gereği:
 * şeffaflık azaltıldığında cam kullanmak okunabilirliği bozar.
 *
 * `expo-glass-effect` yalnızca iOS'ta gerçek etki verir; diğer platformlarda zaten yedek
 * yol çalışır.
 */
export function GlassSurface({
  children,
  glass = 'regular',
  tint,
  radius = RADIUS.lg,
  style,
}: GlassSurfaceProps) {
  const { colors, scheme, a11y } = useTheme();

  if (!a11y.glassEnabled) {
    return (
      <View
        style={[
          styles.base,
          {
            borderRadius: radius,
            backgroundColor: colors.glassFallback,
            borderColor: colors.line,
            borderWidth: StyleSheet.hairlineWidth,
          },
          style,
        ]}>
        {children}
      </View>
    );
  }

  return (
    <GlassView
      glassEffectStyle={glass}
      tintColor={tint}
      colorScheme={scheme}
      style={[styles.base, { borderRadius: radius }, style]}>
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
