import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';

import { Anahtar } from './anahtar';
import { FONTS, SPACING, TYPE_SCALE } from '@/theme/tokens';

/** Dokunma hedefi 44 px'in altına inmez — bu değer bağlayıcıdır. */
const MIN_DOKUNMA = 44;

function Chevron() {
  const { colors } = useTheme();
  return (
    <View style={styles.chevron}>
      <View style={[styles.chevronUst, { borderColor: colors.dim }]} />
    </View>
  );
}

/** Başka bir ekrana giden satır. */
export function NavRow({
  href,
  baslik,
  altBaslik,
  sag,
  ikon,
}: {
  href: Href;
  baslik: string;
  altBaslik?: string;
  sag?: ReactNode;
  ikon?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={altBaslik ? `${baslik}. ${altBaslik}` : baslik}
        style={({ pressed }) => [styles.satir, pressed && { opacity: 0.6 }]}>
        {ikon ? <View style={styles.ikon}>{ikon}</View> : null}
        <View style={styles.metin}>
          <Text style={[styles.baslik, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
            {baslik}
          </Text>
          {altBaslik ? (
            <Text style={[styles.alt, { color: colors.dim }]} maxFontSizeMultiplier={1.8}>
              {altBaslik}
            </Text>
          ) : null}
        </View>
        {sag}
        <Chevron />
      </Pressable>
    </Link>
  );
}

/** Okunur değer satırı — ölçülmemiş değerler tire ile gösterilir. */
export function DataRow({ etiket, deger, sag }: { etiket: string; deger: string; sag?: ReactNode }) {
  const { colors } = useTheme();
  const olculmedi = deger === '—';
  return (
    <View style={styles.satir}>
      <Text style={[styles.baslik, styles.metin, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
        {etiket}
      </Text>
      <Text
        style={[styles.deger, { color: olculmedi ? colors.dim : colors.text }]}
        maxFontSizeMultiplier={1.6}>
        {deger}
      </Text>
      {sag}
    </View>
  );
}

/** Açma-kapama satırı. `kilitli` verildiğinde anahtar devre dışıdır. */
export function ToggleRow({
  baslik,
  altBaslik,
  deger,
  onDegisim,
  kilitli = false,
}: {
  baslik: string;
  altBaslik?: string;
  deger: boolean;
  onDegisim: (yeni: boolean) => void;
  kilitli?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.satir}>
      <View style={styles.metin}>
        <Text
          style={[styles.baslik, { color: kilitli ? colors.muted : colors.text }]}
          maxFontSizeMultiplier={1.8}>
          {baslik}
        </Text>
        {altBaslik ? (
          <Text style={[styles.alt, { color: colors.dim }]} maxFontSizeMultiplier={1.8}>
            {altBaslik}
          </Text>
        ) : null}
      </View>
      <Anahtar deger={deger} onDegisim={onDegisim} kilitli={kilitli} />
    </View>
  );
}

/** Satırları ayıran ince çizgi. */
export function RowDivider() {
  const { colors } = useTheme();
  return <View style={[styles.ayrac, { backgroundColor: colors.line }]} />;
}

const styles = StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: MIN_DOKUNMA,
    paddingVertical: 4,
  },
  metin: { flex: 1, minWidth: 0, gap: 1 },
  ikon: { width: 22, alignItems: 'center' },
  baslik: { ...FONTS.body, fontSize: TYPE_SCALE.body },
  alt: { ...FONTS.body, fontSize: TYPE_SCALE.micro, lineHeight: 15 },
  deger: { ...FONTS.mono, fontSize: TYPE_SCALE.body },
  ayrac: { height: StyleSheet.hairlineWidth, marginLeft: 0 },
  chevron: { width: 12, alignItems: 'center', justifyContent: 'center' },
  chevronUst: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
});
