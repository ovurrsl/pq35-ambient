import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';
import { stackSecenekleri } from '@/theme/stack-secenekleri';

/** Sahneler sekmesinin `Stack`i — başlık sistemin (bkz. `olaylar/_layout.tsx`). */
export default function SahnelerLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={stackSecenekleri(colors, 'Sahneler')}>
      <Stack.Screen name="index" options={{ title: 'Sahneler' }} />
    </Stack>
  );
}
