import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

export interface AccessibilityPrefs {
  /** Sistem ayarı: Ayarlar → Erişilebilirlik → Ekran ve Metin Boyutu → Şeffaflığı Azalt. */
  reduceTransparency: boolean;
  /** Sistem ayarı: Hareketi Azalt. Fizik tabanlı animasyonlar buna göre kısılır. */
  reduceMotion: boolean;
  /**
   * Gerçek Liquid Glass çizilebilir mi?
   * `false` ise ya iOS 26 öncesi ya da şeffaflık azaltılmış — her iki durumda da opak zemin.
   */
  glassEnabled: boolean;
}

/**
 * Erişilebilirlik tercihlerini dinler.
 *
 * Liquid Glass bir tercih değil, koşullu bir malzemedir: Şeffaflığı Azalt açıkken cam
 * kullanmak HIG ihlalidir ve okunabilirliği bozar. Bu yüzden `glassEnabled` her iki
 * koşulu birden kontrol eder.
 */
/**
 * Cam modülü bu yapıda var mı ve gerçek cam çizebiliyor mu?
 * try/catch var çünkü modül her yapıda bulunmayabilir (ör. Expo Go); yokluğu bir
 * hata değil, opak zemine düşme sebebidir.
 */
function camVarMi(): boolean {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

export function useAccessibilityPrefs(): AccessibilityPrefs {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;

    void AccessibilityInfo.isReduceTransparencyEnabled().then((v) => {
      if (alive) setReduceTransparency(v);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });

    const t = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    const m = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      alive = false;
      t.remove();
      m.remove();
    };
  }, []);

  return {
    reduceTransparency,
    reduceMotion,
    glassEnabled: camVarMi() && !reduceTransparency,
  };
}
