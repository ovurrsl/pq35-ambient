import type { TextStyle } from 'react-native';

/**
 * Tasarım token'ları — kaynak: Design kanvası (design/project/*.dc.html).
 *
 * Koyu tema KANONİKTİR; değerler panolardaki `<helmet><style>` bloğuyla birebir aynıdır.
 * Açık tema panolarda tanımlı DEĞİLDİR; HIG'in tam Dark Mode desteği gereği buradan
 * türetilmiştir. Kanvas ile bu dosya çelişirse kanvas kazanır (CLAUDE.md §9.1).
 */

/**
 * PALET KURALI — renk bilgi taşımıyorsa kullanılmaz.
 *
 * Araç sahibinin kararı: arayüz sade ve profesyonel olmalı, renk cümbüşü değil.
 *
 *   Bölge renkleri  → yalnızca küçük kimlik noktası / şeridi.
 *                      Metin rengi, çip zemini veya kenarlık olarak KULLANILMAZ.
 *   Hat renkleri    → yalnızca teknik diyagramlarda; uygulama arayüzünde değil.
 *   Etkileşim       → tek accent. İkinci bir vurgu rengi eklenmez.
 *   Durum           → yalnızca ok / warn / danger.
 *   Metin           → text / muted / dim üçlüsü. Başlıklar renkle değil,
 *                      AĞIRLIKLA ayrışır — iOS 26'nın kendi diline de bu yakın.
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
  dim: '#7F8B9A',
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
  dim: '#636F7E',
  accent: '#0975A9',
  ok: '#187E4D',
  warn: '#976200',
  danger: '#C0332F',
  glassFallback: '#FFFFFF',
  glassBorder: 'rgba(11,15,20,0.12)',
};

export const COLORS = { dark, light } as const;
export type ColorSchemeName = keyof typeof COLORS;

/**
 * Marka renklerinin **metin olarak** okunabilir türevleri.
 *
 * NEDEN GEREKLİ:
 * `ZONE_COLORS`, `EVENT_COLORS` ve `BUS_COLORS` koyu tuval için seçildi ve tek değerli.
 * Uygulama gerçekten tema değiştiriyor (`theme-provider` `useColorScheme()` okur), ve
 * açık temada bu renkler metin olarak çöküyordu: ölçülen en kötü oran `EVENT_COLORS.turn`
 * için beyaz üzerinde **1.59:1** — gerekenin üçte biri. `BUS_COLORS.antriebs` ise koyu
 * temada bile 4.20:1 ile kalıyordu.
 *
 * Buradaki değerler tonu ve doygunluğu koruyup yalnızca açıklığı kaydırarak hesaplandı;
 * her biri kendi temasının **en kötü** zeminine karşı ≥ 4.5:1 ölçüldü.
 *
 * KURAL: bir marka rengi `color` olarak veriliyorsa buradan alınır. Dolgu (`backgroundColor`)
 * olarak kullanılıyorsa ham `ZONE_COLORS`/`EVENT_COLORS` doğrudur — orada metin oranı değil,
 * üstüne binen etiketin oranı önemlidir (bkz. `MARKA_ETIKET`).
 */
export const MARKA_METIN = {
  dark: {
    ...ZONE_COLORS,
    ...EVENT_COLORS,
    ...BUS_COLORS,
    // Tek istisna: ham #E5533D koyu temada da 4.20:1 ile kalıyordu.
    antriebs: '#E75D48',
  },
  light: {
    z1: '#0074AF', z2: '#8839FF', z3: '#1A7E48', z4: '#AE5400',
    z5: '#2165E9', z6: '#D90057', z7: '#187B70',
    door: '#DF0000', turn: '#916600', reverse: '#607081', redline: '#DE0028',
    komfort: '#AD530C', antriebs: '#CE331C', ble: '#774BF7',
  },
} as const;

/**
 * Marka renginden bir **dolgunun üstündeki** etiketin rengi.
 *
 * Yedi bölge rengi de parlaktır; üzerlerine koyu etiket 5.95:1 – 10.95:1 arasında okunur,
 * açık etiket ise 1.63:1 – 3.00:1 ile hepsinde kalır. Bu yüzden tema ne olursa olsun
 * **koyu** kullanılır — `colors.bg` kullanmak açık temada rozeti okunamaz yapıyordu.
 */
export const MARKA_ETIKET = '#0B0F14';

/** Ham marka hex'inden anahtarına — veri yapıları rengi hex olarak taşıdığı için gerekli. */
const HAM_ANAHTAR: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries({ ...ZONE_COLORS, ...EVENT_COLORS, ...BUS_COLORS }).map(([k, v]) => [
    v.toUpperCase(),
    k,
  ])
);

/**
 * Bir marka rengini **metin olarak** kullanmadan önce buradan geçir.
 *
 * Bazı ekranlar rengi sabitten okur (`BUS_COLORS.komfort`), bazıları veri yapısından
 * ham hex olarak taşır (`olay.renk`). İkisini de tek yerden çözmek için anahtar değil
 * **değer** üzerinden eşleşiyoruz; tanınmayan bir renk olduğu gibi geri döner.
 */
export function markaMetin(ham: string, scheme: ColorSchemeName): string {
  const anahtar = HAM_ANAHTAR[ham.toUpperCase()];
  if (!anahtar) return ham;
  return (MARKA_METIN[scheme] as Readonly<Record<string, string>>)[anahtar] ?? ham;
}

/**
 * Tipografi — Apple sistem fontu (San Francisco).
 *
 * Eskiden burada SpaceGrotesk / IBMPlexSans / JetBrainsMono adları vardı ama bu
 * fontlar projeye hiç yüklenmiyordu: ne `useFonts` çağrısı, ne `assets/fonts`
 * klasörü. iOS tanımadığı font adını sessizce yok sayıp sisteme düşer, yani ekranda
 * zaten San Francisco görünüyordu — ama kazara ve ağırlıkları kaybederek.
 *
 * Artık kasıtlı: `System` iOS'ta SF Pro'dur, ağırlık `fontWeight` ile verilir.
 * Bunun yan faydası Dynamic Type ve optik boyutlandırmanın doğru çalışmasıdır;
 * üçüncü parti bir dosyada bunlar olmaz.
 *
 * Tek istisna tek aralıklı metin (CAN ID'leri, hex, UDID): SF Mono React Native'e
 * ad olarak açılmaz, iOS'ta sistemle gelen `Menlo` kullanılır.
 *
 * KULLANIM: stil nesnesine **yayarak** eklenir (`...FONTS.body`), `fontFamily`
 * alanına atanmaz — bunlar birer stil parçasıdır, tek bir ad değil.
 */
export const FONTS = {
  display: { fontFamily: 'System', fontWeight: '700' },
  body: { fontFamily: 'System', fontWeight: '400' },
  bodyMedium: { fontFamily: 'System', fontWeight: '500' },
  bodySemiBold: { fontFamily: 'System', fontWeight: '600' },
  mono: { fontFamily: 'Menlo', fontWeight: '400' },
  monoBold: { fontFamily: 'Menlo', fontWeight: '700' },
} as const satisfies Record<string, Pick<TextStyle, 'fontFamily' | 'fontWeight'>>;

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
