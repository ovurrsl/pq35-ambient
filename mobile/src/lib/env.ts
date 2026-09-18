/**
 * Ortam değişkenleri.
 *
 * DİKKAT: `EXPO_PUBLIC_*` değişkenleri derleme sırasında **pakete gömülür ve okunabilir**.
 * Buraya yalnızca herkese açık olması sorun olmayan değerler konur:
 * Supabase publishable (anon) anahtarı ve API URL'i.
 *
 * Buraya ASLA konmaz (CLAUDE.md sert kural 11):
 *   - Supabase service role anahtarı
 *   - SIM808 ön paylaşımlı AES-GCM anahtarı
 *   - Cihaz (ESP32) device token'ı
 *
 * Güvenlik anon anahtarın gizliliğinden değil, **her tabloda açık ve varsayılan reddet olan
 * RLS politikalarından** gelir.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Ortam değişkeni eksik: ${name}. mobile/.env.local dosyasını .env.example'a bakarak doldur.`
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ),
  /** Vercel Edge/Serverless tabanı. Ağır işler ve cihaz payload doğrulaması oradadır. */
  apiUrl: required('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
} as const;
