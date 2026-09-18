import { ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { FONTS, SPACING } from '@/theme/tokens';

export default function Ekran() {
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: colors.bg }]}>
      <Text style={[styles.baslik, { color: colors.text }]}>arac</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: SPACING.lg, gap: SPACING.lg },
  baslik: { fontFamily: FONTS.display, fontSize: 28 },
});
