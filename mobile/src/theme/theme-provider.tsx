import { createContext, use, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useAccessibilityPrefs, type AccessibilityPrefs } from '@/hooks/use-accessibility-prefs';
import { COLORS, type ColorSchemeName, type ThemeColors } from './tokens';

export interface Theme {
  scheme: ColorSchemeName;
  colors: ThemeColors;
  a11y: AccessibilityPrefs;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Koyu tema kanonik; sistem açık moddaysa türetilmiş palete geçilir.
  const scheme: ColorSchemeName = useColorScheme() === 'light' ? 'light' : 'dark';
  const a11y = useAccessibilityPrefs();

  const value = useMemo<Theme>(
    () => ({ scheme, colors: COLORS[scheme], a11y }),
    [scheme, a11y]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) {
    throw new Error('useTheme, ThemeProvider içinde çağrılmalı.');
  }
  return theme;
}
