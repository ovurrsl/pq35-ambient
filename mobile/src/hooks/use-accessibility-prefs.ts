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
   * `false` ise ya iOS 26 öncesi, ya şeffaflık azaltılmış, ya da modül bu yapıda yok —
   * her durumda opak zemin.
   */
  glassEnabled: boolean;
}

/**
 * Erişilebilirlik API'leri platforma göre eksik olabilir.
 *
 * `isReduceTransparencyEnabled` react-native-web'de **yok**; doğrudan çağırmak uygulamayı
 * web'de tamamen çökertiyordu. Her erişim varlık kontrolünden geçiyor; eksik API bir hata
 * değil, "bu bilgi yok" demektir ve varsayılana düşülür.
 */
async function sistemTercihi(
  ad: 'isReduceTransparencyEnabled' | 'isReduceMotionEnabled'
): Promise<boolean> {
  const fn = AccessibilityInfo[ad] as undefined | (() => Promise<boolean>);
  if (typeof fn !== 'function') return false;
  try {
    return await fn.call(AccessibilityInfo);
  } catch {
    return false;
  }
}

/** Olay aboneliği de her platformda yok; yoksa sessizce atlanır. */
function tercihiIzle(
  olay: 'reduceTransparencyChanged' | 'reduceMotionChanged',
  geriCagir: (v: boolean) => void
): () => void {
  try {
    const abone = AccessibilityInfo.addEventListener(olay, geriCagir);
    return () => abone.remove();
  } catch {
    return () => {};
  }
}

/**
 * Cam modülü bu yapıda var mı ve gerçek cam çizebiliyor mu?
 * Modülün yokluğu bir hata değil, opak zemine düşme sebebidir.
 */
function camVarMi(): boolean {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

/**
 * Erişilebilirlik tercihlerini dinler.
 *
 * Liquid Glass bir tercih değil, koşullu bir malzemedir: Şeffaflığı Azalt açıkken cam
 * kullanmak HIG ihlalidir ve okunabilirliği bozar.
 */
export function useAccessibilityPrefs(): AccessibilityPrefs {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;

    void sistemTercihi('isReduceTransparencyEnabled').then((v) => {
      if (alive) setReduceTransparency(v);
    });
    void sistemTercihi('isReduceMotionEnabled').then((v) => {
      if (alive) setReduceMotion(v);
    });

    const birakT = tercihiIzle('reduceTransparencyChanged', setReduceTransparency);
    const birakM = tercihiIzle('reduceMotionChanged', setReduceMotion);

    return () => {
      alive = false;
      birakT();
      birakM();
    };
  }, []);

  return {
    reduceTransparency,
    reduceMotion,
    glassEnabled: camVarMi() && !reduceTransparency,
  };
}
