import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { BleBaglanti, type AracBaglantisi } from '@/lib/ble/connection';

/**
 * Tek `BleBaglanti` örneği ve araç bağlantısının tek doğruluk kaynağı.
 *
 * NEDEN CONTEXT: her ekran kendi `new BleBaglanti()`'sini kurarsa her biri kendi
 * `BleManager`'ını açar — iOS'ta bu, birden çok merkezi yönetici demektir ve durum
 * ekranlar arasında ayrışır. Bir ekran "bağlı" derken diğeri "değil" der.
 *
 * NEDEN GEREKTİ: beş ekran durum çipini sabit metinle çiziyordu — `BLE bağlı` yeşil
 * noktayla, hiçbir yerden okumadan. Yalnızca Araç ekranı doğruyu söylüyordu
 * (`BLE bağlı değil`). Araçta henüz hiçbir fiziksel iş yapılmadı; bağlanacak bir
 * denetleyici yok. Yani uygulama, bilinmeyen her **değeri** kesikli rozetle işaretlerken
 * bilinmeyen **bağlantıyı** olgu gibi sunuyordu.
 *
 * HIG (`feedback.md › Best practices`): "Show people when a command can't be carried out
 * and help them understand why."
 */

interface BleDurumu {
  readonly arac: AracBaglantisi;
  readonly baglanti: BleBaglanti;
}

const Ctx = createContext<BleDurumu | null>(null);

export function BleProvider({ children }: { children: ReactNode }) {
  // `useState`'in tembel başlatıcısı: örnek bir kez kurulur ve hiç değişmez. `useRef`
  // ile kurmak React Compiler'ın "render sırasında ref okunmaz" kuralını ihlal ediyor.
  const [baglanti] = useState(() => new BleBaglanti());
  const [arac, setArac] = useState<AracBaglantisi>('bilinmiyor');

  useEffect(() => {
    // Radyo durumunu dinlemek şart: araç bağlantısı onun üzerine kuruluyor ve
    // `durumuIzle` çağrılmadan `btDurum` 'Unknown' kalır.
    const birakRadyo = baglanti.durumuIzle(() => {});
    const birakArac = baglanti.aracDurumunuIzle(setArac);
    return () => {
      birakArac();
      birakRadyo();
    };
  }, [baglanti]);

  const deger = useMemo<BleDurumu>(() => ({ arac, baglanti }), [arac, baglanti]);
  return <Ctx.Provider value={deger}>{children}</Ctx.Provider>;
}

export function useBle(): BleDurumu {
  const d = useContext(Ctx);
  if (!d) throw new Error('useBle, BleProvider içinde çağrılmalı.');
  return d;
}

/** Durum çipinin metni ve tonu — tek yerde, beş ekranda aynı. */
export function bleCipMetni(arac: AracBaglantisi): string {
  switch (arac) {
    case 'bilinmiyor':
      return 'BLE ··';
    case 'bagli':
      return 'BLE bağlı';
    case 'baglaniyor':
      return 'BLE bağlanıyor';
    case 'kapali':
      return 'Bluetooth kapalı';
    case 'yok':
      return 'Bu yapıda BLE yok';
    case 'bagli-degil':
      return 'BLE bağlı değil';
  }
}
