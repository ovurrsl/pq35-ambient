import * as SecureStore from 'expo-secure-store';

/**
 * iOS Keychain sarmalayıcısı.
 *
 * NEDEN BU DOSYA VAR — doğrulanmış davranış:
 * `expo-secure-store`, `requireAuthentication: true` verildiğinde girdiyi
 * `SecAccessControlCreateWithFlags(..., .biometryCurrentSet, ...)` ile korur
 * (kaynak: expo-secure-store/ios/SecureStoreModule.swift). Bu tam olarak istediğimiz şey:
 * kayıtlı yüz/parmak seti değişirse girdi geçersiz olur.
 *
 * TUZAK: aynı modül, var olan bir girdiyi yazarken `SecItemUpdate` çağırır ve
 * `kSecUseOperationPrompt` geçirir — yani **her yazma Face ID sorar**. Supabase access
 * token'ı arka planda yenilediği için bu, kullanıcıya sürekli Face ID sorulması demek olurdu.
 *
 * ÇÖZÜM: korumalı girdiye yazarken **önce sil, sonra ekle**. Silme kimlik doğrulaması
 * istemez; `SecItemAdd` de yeni girdi eklerken istemez. Böylece Face ID **yalnızca okumada**
 * sorulur — yani uygulama açılışında (CLAUDE.md §7.1).
 */

const ACCESSIBLE = SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

/** Biyometri ile korunan girdiyi okur. Bu çağrı Face ID sorar ve JS iş parçacığını bloklar. */
export async function readProtected(key: string, prompt: string): Promise<string | null> {
  return SecureStore.getItemAsync(key, {
    requireAuthentication: true,
    authenticationPrompt: prompt,
    keychainAccessible: ACCESSIBLE,
  });
}

/**
 * Biyometri ile korunan girdiyi yazar — **sormadan**.
 * Sil-sonra-ekle sırası bilinçlidir; yukarıdaki tuzak notuna bak.
 */
export async function writeProtected(key: string, value: string): Promise<void> {
  await deleteKey(key);
  await SecureStore.setItemAsync(key, value, {
    requireAuthentication: true,
    keychainAccessible: ACCESSIBLE,
  });
}

/** Korumasız girdi — cihaz parolasıyla korunur, biyometri sormaz. */
export async function readPlain(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key, { keychainAccessible: ACCESSIBLE });
}

export async function writePlain(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, { keychainAccessible: ACCESSIBLE });
}

/** Silme her iki koruma düzeyi için de kimlik doğrulaması istemez. */
export async function deleteKey(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key, { requireAuthentication: true });
  await SecureStore.deleteItemAsync(key);
}

/**
 * Cihaz biyometrik koruma ile saklamayı destekliyor mu?
 * Desteklemiyorsa uygulama kilidi kurulamaz ve kullanıcıya bu açıkça söylenir.
 */
export async function canStoreProtected(): Promise<boolean> {
  return SecureStore.canUseBiometricAuthentication();
}

export const KEYS = {
  /** Biyometri korumalı: Supabase refresh token. Yalnızca açılışta okunur. */
  refreshToken: 'pq35.auth.refresh',
  /** Korumasız: son giriş yapılan e-posta, kilit ekranında maskeli göstermek için. */
  lastEmail: 'pq35.auth.email',
  /**
   * Korumasız işaret: korumalı bir oturum girdisi var mı?
   * Korumalı girdinin varlığını okuyarak öğrenemeyiz — okumak Face ID sorar. Bu işaret
   * sayesinde açılışta kilit ekranı mı yoksa giriş ekranı mı gösterileceğine
   * kullanıcıyı rahatsız etmeden karar verilir.
   */
  hasSession: 'pq35.auth.var',
} as const;
