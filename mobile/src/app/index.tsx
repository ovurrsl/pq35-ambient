import { Redirect } from 'expo-router';

/**
 * Kök rota — `/`.
 *
 * NEDEN VAR: sekmeler klasöre dönüştürülünce (`(tabs)/index.tsx` → `(tabs)/bolgeler/`)
 * uygulamanın **`/` rotası tamamen kayboldu.** Açılışta expo-router `/`'a gider, karşılığı
 * olmadığı için "Unmatched Route" ekranını çizer ve orada kalır: `AuthGate` yalnızca
 * kimlik akışındaki yollardan sekmelere yönlendiriyordu, `/` o listede değildi.
 *
 * Sonuç, uygulamanın hiç açılmamasıydı. Rota ağacı testi bunu görüyordu — yapraklar
 * listesinde `/` yoktu — ama o çıktıyı yalnızca sekme altındaki ekranlar için okumuştum.
 *
 * Bu dosya kalıcı çözümün yarısı: `/` artık gerçek bir rota. Diğer yarısı `_layout.tsx`
 * içindeki `AuthGate`, artık sekme dışındaki HER yoldan sekmelere döndürüyor.
 */
export default function Kok() {
  return <Redirect href="/(tabs)/bolgeler" />;
}
