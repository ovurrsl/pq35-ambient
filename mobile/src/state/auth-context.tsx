import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { yapilandirildi } from '@/lib/env';
import {
  forget,
  hasStoredSession,
  lastEmail,
  lock,
  rememberSession,
  unlock,
  type UnlockResult,
} from '@/lib/session-vault';
import { supabase } from '@/lib/supabase';
import {
  cevrimdisiTercihi,
  cevrimdisiTercihiYaz,
  kilidiDogrula,
  kilitTercihi,
  type KilitSonucu,
} from '@/lib/uygulama-kilidi';

/**
 * Uygulamanın kimlik durumu.
 *
 * `kilitli` ile `cikis` arasındaki fark önemlidir:
 *   kilitli → Keychain'de korumalı bir oturum var, Face ID ile açılabilir
 *   cikis   → hiç oturum yok, e-posta + şifre + TOTP gerekir
 */
export type AuthDurum =
  | { ad: 'baslatiliyor' }
  /** Supabase yapılandırılmamış — giriş denemenin anlamı yok, kurulum anlatılır. */
  | { ad: 'yapilandirma-gerekli' }
  | { ad: 'kilitli'; maskeliEposta: string | null }
  | { ad: 'cikis' }
  /**
   * Hesapsız kullanım. Uygulama açıktır ama bulut yoktur.
   *
   * Gerekçesi mimari: telefon ↔ araç bağlantısı BLE bonding'e dayanır ve araç
   * yakındayken internet gerekmez (CLAUDE.md §7.1). Supabase yalnızca konum
   * geçmişi, sürüş kaydı senkronu ve uzaktan erişim içindir — hepsi 3. faz.
   * Dolayısıyla 1. fazda giriş duvarı, var olmayan bir özelliği korur.
   */
  | { ad: 'cevrimdisi' }
  /**
   * Hesapsız ama kilitli. Yerel uygulama kilidi açıkken açılışta ve arka plandan
   * dönüşte buraya düşülür; biyometri geçilmeden sekmelere girilemez.
   */
  | { ad: 'cevrimdisi-kilitli' }
  | { ad: 'acik'; session: Session };

interface AuthContextValue {
  durum: AuthDurum;
  /** Kilit ekranındaki birincil eylem. Face ID sorar. */
  kilidiAc: () => Promise<UnlockResult>;
  /** Girişten sonra çağrılır; oturumu korumalı girdiye yazar. */
  girisTamamlandi: (session: Session) => Promise<void>;
  /** Hesapsız devam. Sunucuya hiç gidilmez; yalnızca tercih işareti saklanır. */
  cevrimdisiDevamEt: () => void;
  /** Hesapsız kilidi biyometriyle açar. */
  cevrimdisiKilidiAc: () => Promise<KilitSonucu>;
  cikisYap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Arka plana alınınca kilitlenmeden önce tanınan süre.
 * Kısa tutulur: uygulama kilidi tek kapı olduğu için (CLAUDE.md §7.1) burası uzun olamaz.
 * Amaç yalnızca Face ID diyaloğu veya kamera izni gibi kısa sistem kesintilerinde
 * kullanıcıyı gereksiz yere tekrar kilitlememek.
 */
const LOCK_GRACE_MS = 15_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [durum, setDurum] = useState<AuthDurum>({ ad: 'baslatiliyor' });
  const backgroundedAt = useRef<number | null>(null);

  const kilide = useCallback(async () => {
    lock();
    const email = await lastEmail();
    setDurum({ ad: 'kilitli', maskeliEposta: email });
  }, []);

  // Açılış: korumalı girdi var mı? Bunu öğrenmek Face ID sormaz.
  useEffect(() => {
    let alive = true;
    void (async () => {
      // Yapılandırma yoksa Keychain'e hiç dokunulmaz: kullanıcıya boşuna Face ID
      // sorup arkasından "sunucuya ulaşılamadı" demek kötü bir sıralama olurdu.
      if (!yapilandirildi) {
        if (alive) setDurum({ ad: 'yapilandirma-gerekli' });
        return;
      }
      const varMi = await hasStoredSession();
      if (!alive) return;
      if (varMi) {
        await kilide();
        return;
      }
      // Oturum yok: kullanıcı daha önce "hesapsız devam" dediyse giriş ekranını
      // tekrar göstermeyiz. Kilit açıksa önce biyometri istenir.
      const hesapsiz = await cevrimdisiTercihi();
      if (!alive) return;
      if (!hesapsiz) {
        setDurum({ ad: 'cikis' });
        return;
      }
      const kilitli = await kilitTercihi();
      if (!alive) return;
      setDurum({ ad: kilitli ? 'cevrimdisi-kilitli' : 'cevrimdisi' });
    })();
    return () => {
      alive = false;
    };
  }, [kilide]);

  /**
   * Arka plandan dönüşte kilitleme. Bu davranış KAPATILAMAZ.
   * Face ID yalnızca açılışta sorulduğu için, açık kalan bir uygulama kapısız demektir.
   *
   * Çevrimdışı mod bunun dışındadır: Keychain'de oturum yoktur, kilitlenecek bir sır
   * da yoktur. Geçiş yalnızca 'acik' durumundan yapılır, aşağıdaki koşul bunu sağlar.
   */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAt.current ??= Date.now();
        return;
      }
      if (next === 'active') {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        if (since !== null && Date.now() - since > LOCK_GRACE_MS) {
          setDurum((d) => (d.ad === 'acik' ? { ad: 'kilitli', maskeliEposta: null } : d));
          lock();
          // Hesapsız kullanımda korunacak bir sır yok, ama uygulamayı açmak yine de
          // biyometriye bağlanabilir. Tercih her seferinde okunur: ayarlar ekranında
          // değiştirilmiş olabilir ve bayatlamış bir kopyaya güvenmek istemiyoruz.
          void (async () => {
            if (await kilitTercihi()) {
              setDurum((d) => (d.ad === 'cevrimdisi' ? { ad: 'cevrimdisi-kilitli' } : d));
            }
          })();
        }
      }
    });
    return () => sub.remove();
  }, []);

  const kilidiAc = useCallback(async (): Promise<UnlockResult> => {
    const sonuc = await unlock();
    if (sonuc.kind === 'ok') {
      setDurum({ ad: 'acik', session: sonuc.session });
    } else if (sonuc.kind === 'giris-gerekli' || sonuc.kind === 'yeniden-giris') {
      setDurum({ ad: 'cikis' });
    }
    return sonuc;
  }, []);

  const girisTamamlandi = useCallback(async (session: Session) => {
    await rememberSession(session, session.user.email ?? undefined);
    setDurum({ ad: 'acik', session });
  }, []);

  const cevrimdisiDevamEt = useCallback(() => {
    setDurum({ ad: 'cevrimdisi' });
    void cevrimdisiTercihiYaz(true);
  }, []);

  const cevrimdisiKilidiAc = useCallback(async (): Promise<KilitSonucu> => {
    const sonuc = await kilidiDogrula();
    // Cihazda kilit kalmadıysa (biyometri silindi, parola kaldırıldı) kullanıcıyı
    // dışarıda bırakmak yerine içeri alırız: bu kilit bir sırrı korumuyor.
    if (sonuc.kind === 'ok' || sonuc.kind === 'yetenek-yok') {
      setDurum({ ad: 'cevrimdisi' });
    }
    return sonuc;
  }, []);

  const cikisYap = useCallback(async () => {
    await supabase.auth.signOut();
    await forget();
    await cevrimdisiTercihiYaz(false);
    setDurum({ ad: 'cikis' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ durum, kilidiAc, girisTamamlandi, cevrimdisiDevamEt, cevrimdisiKilidiAc, cikisYap }),
    [durum, kilidiAc, girisTamamlandi, cevrimdisiDevamEt, cevrimdisiKilidiAc, cikisYap]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error('useAuth, AuthProvider içinde çağrılmalı.');
  }
  return ctx;
}
