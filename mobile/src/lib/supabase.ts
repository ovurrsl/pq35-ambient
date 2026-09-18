import 'react-native-url-polyfill/auto';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';
import { env } from './env';

/**
 * Supabase istemcisi.
 *
 * OTURUM SAKLAMA KARARI — `secure-keychain.ts`'deki tuzak notunu da oku.
 * Supabase'e **bellek içi** bir depo verilir. Diskte kalıcı tutmuyoruz, çünkü Supabase
 * refresh token'ı her yenilemede döndürür (rotation) ve bunu korumalı Keychain girdisine
 * yazmak her seferinde Face ID sorardı.
 *
 * Kalıcılık ayrı yürür (`session-vault.ts`): refresh token, biyometri korumalı Keychain
 * girdisine **yalnızca girişte ve başarılı açılıştan sonra** yazılır. Uygulama açılışında
 * Face ID o girdiyi açar, oturum ondan kurulur.
 *
 * Sonuç: Face ID uygulamayı açarken sorulur, her komutta veya her token yenilemesinde değil.
 */
class MemoryStorage implements SupportedStorage {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  /** Uygulama arka plana alınıp kilitlenince çağrılır. */
  clear(): void {
    this.map.clear();
  }
}

export const sessionMemory = new MemoryStorage();

/**
 * Yapılandırma eksikken de bir istemci üretilir.
 *
 * Alternatif `null` döndürmekti; o zaman her çağrı yerinde `if (!supabase)` kontrolü
 * gerekirdi. Bunun yerine geçersiz adresli bir istemci kuruluyor: ağ çağrıları hata
 * veriyor ama uygulama açılıyor ve `yapilandirildi` bayrağı arayüzde durumu söylüyor.
 * Bu adrese gerçek bir istek gitmez — kimlik akışı `yapilandirildi` false iken kurulum
 * ekranını gösterir.
 */
const url = env.supabaseUrl ?? 'http://yapilandirilmadi.invalid';
const anonKey = env.supabaseAnonKey ?? 'yapilandirilmadi';

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: sessionMemory,
    persistSession: true,
    autoRefreshToken: true,
    // React Native'de URL üzerinden oturum dönüşü yok; derin bağlantı akışı kullanılmıyor.
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
