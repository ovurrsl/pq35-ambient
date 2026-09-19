import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Ortam değişkenleri.
 *
 * DİKKAT: `EXPO_PUBLIC_*` değişkenleri derleme sırasında **pakete gömülür ve okunabilir**.
 * Buraya yalnızca herkese açık olması sorun olmayan değerler konur: Supabase URL'i ve
 * publishable (anon) anahtarı.
 *
 * Buraya ASLA konmaz (CLAUDE.md sert kural 11): service role anahtarı, SIM808 ön
 * paylaşımlı AES-GCM anahtarı, cihaz device token'ı. Güvenlik anon anahtarın
 * gizliliğinden değil, **varsayılan reddet olan RLS politikalarından** gelir.
 *
 * NEDEN BURADA HATA FIRLATILMIYOR:
 * Eskiden eksik değişkende `throw` ediyordu. Bu, Supabase henüz kurulmamışken uygulamayı
 * açılışta çökertiyordu — geliştirirken ekranlara bakmayı imkânsız kılıyor. Artık eksik
 * yapılandırma bir **durum**; uygulama açılır ve kullanıcıya ne eksik olduğunu söyler.
 */

function oku(ad: string, deger: string | undefined): string | null {
  return deger && deger.length > 0 ? deger : null;
}

const supabaseUrl = oku('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = oku('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

/** Eksik olan değişkenlerin adları — kurulum ekranında listelenir. */
export const eksikDegiskenler: readonly string[] = [
  supabaseUrl ? null : 'EXPO_PUBLIC_SUPABASE_URL',
  supabaseAnonKey ? null : 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
].filter((d): d is string => d !== null);

export const yapilandirildi = eksikDegiskenler.length === 0;

export const env = {
  supabaseUrl,
  supabaseAnonKey,
} as const;

/**
 * Uygulama Expo Go içinde mi çalışıyor?
 *
 * Expo Go yalnızca Expo'nun kendi paketindeki yerel modülleri taşır. `react-native-ble-plx`
 * orada yok, dolayısıyla araç bağlantısı Expo Go'da **çalışmaz** — ekranlara bakmak için
 * yeterli, araçla konuşmak için değil. Bunu gizlemek yerine arayüzde söylüyoruz.
 */
export const expoGoIcinde =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
