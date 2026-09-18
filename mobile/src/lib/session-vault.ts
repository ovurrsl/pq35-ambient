import type { Session } from '@supabase/supabase-js';

import {
  KEYS,
  deleteKey,
  readPlain,
  readProtected,
  writePlain,
  writeProtected,
} from './secure-keychain';
import { sessionMemory, supabase } from './supabase';

/**
 * Oturum kasası — Face ID ile Keychain arasındaki köprü.
 *
 * Kimlik zinciri (CLAUDE.md §7.1):
 *   Face ID (yerel) → Keychain'i açar (biometryCurrentSet) → refresh token → Supabase JWT
 *
 * Face ID **kimlik doğrulama değildir**. Sunucuya karşı kimlik JWT'dir; Face ID yalnızca
 * saklanan anahtarı açar.
 */

export type UnlockResult =
  | { kind: 'ok'; session: Session }
  /** Korumalı girdi yok — kullanıcı hiç giriş yapmamış veya çıkış yapmış. */
  | { kind: 'giris-gerekli' }
  /** Kullanıcı Face ID'yi iptal etti veya doğrulama başarısız oldu. */
  | { kind: 'iptal' }
  /**
   * Girdi okundu ama sunucu reddetti: refresh token süresi dolmuş, iptal edilmiş
   * veya kayıtlı yüz seti değiştiği için (`biometryCurrentSet`) girdi geçersiz olmuş.
   */
  | { kind: 'yeniden-giris'; sebep: string };

const PROMPT = 'PQ35 Ambient uygulamasını aç';

/**
 * Girişten hemen sonra çağrılır. Korumalı girdiyi ilk kez yazar.
 * Yeni girdi eklemek Face ID sormaz (bkz. secure-keychain.ts).
 */
export async function rememberSession(session: Session, email: string | undefined): Promise<void> {
  await writeProtected(KEYS.refreshToken, session.refresh_token);
  await writePlain(KEYS.hasSession, '1');
  if (email) {
    await writePlain(KEYS.lastEmail, email);
  }
}

/**
 * Açılışta hangi ekranın gösterileceğine karar verir: kilit mi, giriş mi.
 * Korumalı girdiye dokunmaz, bu yüzden Face ID sormaz.
 */
export async function hasStoredSession(): Promise<boolean> {
  return (await readPlain(KEYS.hasSession)) === '1';
}

/**
 * Açılışta çağrılır. Face ID sorar, oturumu kurar.
 *
 * Başarılı yenilemeden sonra refresh token döndüğü için korumalı girdi **hemen** yeni
 * değerle yazılır; eskisi sunucuda artık geçersizdir.
 */
export async function unlock(): Promise<UnlockResult> {
  let stored: string | null;
  try {
    stored = await readProtected(KEYS.refreshToken, PROMPT);
  } catch {
    // Face ID iptal edildi, başarısız oldu veya girdi biyometri değişimiyle geçersizleşti.
    return { kind: 'iptal' };
  }

  if (!stored) {
    return { kind: 'giris-gerekli' };
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: stored });

  if (error || !data.session) {
    await forget();
    return { kind: 'yeniden-giris', sebep: error?.message ?? 'Oturum yenilenemedi.' };
  }

  await writeProtected(KEYS.refreshToken, data.session.refresh_token);
  return { kind: 'ok', session: data.session };
}

/**
 * Uygulama arka plana alınınca çağrılır.
 * Belleği siler; Keychain girdisi yerinde kalır, bir sonraki açılışta Face ID ile açılır.
 *
 * Bu davranış kapatılamaz: uygulama kilidi tek kapı olduğu için zorunludur (CLAUDE.md §7.1).
 */
export function lock(): void {
  sessionMemory.clear();
}

/** Çıkış. Korumalı girdi silinir; bir daha Face ID ile açılacak bir şey kalmaz. */
export async function forget(): Promise<void> {
  sessionMemory.clear();
  await deleteKey(KEYS.refreshToken);
  await deleteKey(KEYS.hasSession);
}

/** Kilit ekranında maskeli göstermek için — kimlik kanıtı değildir, yalnızca görsel ipucu. */
export async function lastEmail(): Promise<string | null> {
  return readPlain(KEYS.lastEmail);
}

/** `ovur@icloud.com` → `o···@···.com`. Kilit ekranı tam adresi asla göstermez. */
export function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  const tld = domain.includes('.') ? domain.slice(domain.lastIndexOf('.')) : '';
  return `${user.slice(0, 1)}···@···${tld}`;
}
