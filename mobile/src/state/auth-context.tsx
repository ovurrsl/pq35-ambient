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

/**
 * Uygulamanın kimlik durumu.
 *
 * `kilitli` ile `cikis` arasındaki fark önemlidir:
 *   kilitli → Keychain'de korumalı bir oturum var, Face ID ile açılabilir
 *   cikis   → hiç oturum yok, e-posta + şifre + TOTP gerekir
 */
export type AuthDurum =
  | { ad: 'baslatiliyor' }
  | { ad: 'kilitli'; maskeliEposta: string | null }
  | { ad: 'cikis' }
  | { ad: 'acik'; session: Session };

interface AuthContextValue {
  durum: AuthDurum;
  /** Kilit ekranındaki birincil eylem. Face ID sorar. */
  kilidiAc: () => Promise<UnlockResult>;
  /** Girişten sonra çağrılır; oturumu korumalı girdiye yazar. */
  girisTamamlandi: (session: Session) => Promise<void>;
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
      const varMi = await hasStoredSession();
      if (!alive) return;
      if (varMi) {
        await kilide();
      } else {
        setDurum({ ad: 'cikis' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [kilide]);

  /**
   * Arka plandan dönüşte kilitleme. Bu davranış KAPATILAMAZ.
   * Face ID yalnızca açılışta sorulduğu için, açık kalan bir uygulama kapısız demektir.
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

  const cikisYap = useCallback(async () => {
    await supabase.auth.signOut();
    await forget();
    setDurum({ ad: 'cikis' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ durum, kilidiAc, girisTamamlandi, cikisYap }),
    [durum, kilidiAc, girisTamamlandi, cikisYap]
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
