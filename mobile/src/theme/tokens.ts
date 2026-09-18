/**
 * Tasarım token'ları — kaynak: Design kanvası (design/project/*.dc.html).
 *
 * Koyu tema KANONİKTİR; değerler panolardaki `<helmet><style>` bloğuyla birebir aynıdır.
 * Açık tema panolarda tanımlı DEĞİLDİR; HIG'in tam Dark Mode desteği gereği buradan
 * türetilmiştir. Kanvas ile bu dosya çelişirse kanvas kazanır (CLAUDE.md §9.1).
 */

/** Bölge kimlikleri — firmware ve uygulamada aynı sırayla kullanılır (CLAUDE.md §4). */
export const ZONE_IDS = ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7'] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

/** Bölge renkleri — sol mavi (z1/z5), sağ mor-pembe (z2/z6), ayak altı yeşil-turkuaz (z3/z7). */
export const ZONE_COLORS: Readonly<Record<ZoneId, string>> = {
  z1: '#4CC2FF',
  z2: '#B98BFF',
  z3: '#46D98A',
  z4: '#FF9F45',
  z5: '#5B8DEF',
  z6: '#FF7BB0',
  z7: '#3FD9C7',
};

/** Bölge adları. Scirocco 3 kapılıdır — "arka kapı" YOKTUR (CLAUDE.md §4). */
export const ZONE_LABELS: Readonly<Record<ZoneId, string>> = {
  z1: 'Sol kapı',
  z2: 'Sağ kapı',
  z3: 'Ön ayak altı',
  z4: 'Göğüs / konsol',
  z5: 'Arka sol yan panel',
  z6: 'Arka sağ yan panel',
  z7: 'Arka ayak altı',
};

/** Olay katmanı renkleri — öncelik makinesi (CLAUDE.md §5). */
export const EVENT_COLORS = {
  door: '#FF5A5A',
  turn: '#FFB300',
  reverse: '#8296AA',
  redline: '#FF4D7E',
} as const;

/** Hat ve altyapı renkleri. */
export const BUS_COLORS = {
  komfort: '#F4A261',
  antriebs: '#E5533D',
  info: '#7C8798',
  power: '#FF6A4D',
  ground: '#A98C6B',
  ble: '#B08CFF',
  v2: '#6FA0FF',
} as const;

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceRaised: string;
  line: string;
  text: string;
  muted: string;
  dim: string;
  accent: string;
  ok: string;
  warn: string;
  danger: string;
  /** Cam kullanılamadığında (Reduce Transparency / iOS 26 öncesi) kullanılan opak zemin. */
  glassFallback: string;
  /** Cam üzerine binen ince kenar. */
  glassBorder: string;
}

const dark: ThemeColors = {
  bg: '#0B0F14',
  surface: '#131A22',
  surfaceRaised: '#1B2430',
  line: '#2A3746',
  text: '#E8EEF4',
  muted: '#93A2B3',
  dim: '#6E7C8C',
  accent: ZONE_COLORS.z1,
  ok: '#3FD98A',
  warn: '#FFB020',
  danger: '#FF5A5A',
  glassFallback: '#0F1620',
  glassBorder: 'rgba(232,238,244,0.10)',
};

/** Koyu paletten türetilmiştir; kanvasta karşılığı yoktur. */
const light: ThemeColors = {
  bg: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceRaised: '#EDF2F7',
  line: '#D3DCE6',
  text: '#0B0F14',
  muted: '#4A5867',
  dim: '#6E7C8C',
  accent: '#0A7FB8',
  ok: '#1B8F57',
  warn: '#9A6400',
  danger: '#C0332F',
  glassFallback: '#FFFFFF',
  glassBorder: 'rgba(11,15,20,0.12)',
};

export const COLORS = { dark, light } as const;
export type ColorSchemeName = keyof typeof COLORS;

/**
 * Tipografi. Font aileleri kanvastan gelir; yüklenene kadar sistem yazı tipine düşer.
 * Boyutlar Dynamic Type ile ölçeklenir — sabit `fontSize` yerine `useScaledFont` kullan.
 */
export const FONTS = {
  display: 'SpaceGrotesk_600SemiBold',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodySemiBold: 'IBMPlexSans_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const TYPE_SCALE = {
  title: 26,
  heading: 20,
  body: 15,
  label: 13,
  caption: 12,
  micro: 11,
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 14, xl: 18, pill: 999 } as const;

/** Apple HIG asgari dokunma hedefi. */
export const HIT_SIZE = 44;
