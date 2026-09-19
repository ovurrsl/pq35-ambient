import * as LocalAuthentication from 'expo-local-authentication';

import { kilitYetenegi, type KilitYetenegi } from './biyometri';
import { deleteKey, KEYS, readPlain, writePlain } from './secure-keychain';

/**
 * Yerel uygulama kilidi — buluttan bağımsız.
 *
 * NEDEN AYRI BİR KİLİT VAR:
 * `session-vault` içindeki kilit, Keychain'deki Supabase refresh token'ını biyometriyle
 * korur. Ama hesapsız kullanımda (`cevrimdisi`) öyle bir token yoktur, dolayısıyla o
 * mekanizma hiç devreye girmez ve uygulama kilitsiz kalır. Araç sahibi uygulamayı
 * hesapsız kullanıyor; "Face ID çalışmalı" isteği tam olarak bu boşluğu işaret ediyordu.
 *
 * Buradaki kilit bir sır korumaz — koruyacak sır yoktur. Yaptığı şey **uygulamayı
 * açmayı** biyometriye bağlamaktır: telefonu eline alan başkası araç denetimlerine
 * ulaşamasın diye. Bu yüzden tercih korumasız (`readPlain`) saklanır: korumalı saklamak
 * tercihi okumak için bile Face ID sormak demek olurdu.
 *
 * HIG (Privacy): "To further protect access to apps that people keep logged in on their
 * device, use biometric identification like Face ID, Optic ID, or Touch ID."
 */

const ACIK = '1';

/** Kilit açık mı? Varsayılan **kapalı**: kullanıcı istemeden biyometri sorulmaz. */
export async function kilitTercihi(): Promise<boolean> {
  return (await readPlain(KEYS.uygulamaKilidi)) === ACIK;
}

export async function kilitTercihiYaz(acik: boolean): Promise<void> {
  if (acik) {
    await writePlain(KEYS.uygulamaKilidi, ACIK);
  } else {
    await deleteKey(KEYS.uygulamaKilidi);
  }
}

/**
 * Hesapsız kullanım seçildi mi?
 *
 * Saklanmasaydı her açılışta giriş ekranı çıkardı ve kullanıcı her seferinde aynı
 * düğmeye basmak zorunda kalırdı. HIG (Sign in with Apple): "Delay sign-in as long as
 * possible."
 */
export async function cevrimdisiTercihi(): Promise<boolean> {
  return (await readPlain(KEYS.cevrimdisi)) === ACIK;
}

export async function cevrimdisiTercihiYaz(secildi: boolean): Promise<void> {
  if (secildi) {
    await writePlain(KEYS.cevrimdisi, ACIK);
  } else {
    await deleteKey(KEYS.cevrimdisi);
  }
}

export type KilitSonucu =
  | { kind: 'ok' }
  /** Kullanıcı vazgeçti veya doğrulama başarısız. Hata değil, tekrar denenebilir. */
  | { kind: 'iptal' }
  /** Cihazda kullanılabilir bir kilit yok; kilit kendiliğinden kapatılır. */
  | { kind: 'yetenek-yok'; yetenek: KilitYetenegi };

/**
 * Biyometrik doğrulama.
 *
 * `disableDeviceFallback: false` bilerek: bu kilit bir Keychain girdisine bağlı olmadığı
 * için cihaz parolasına düşmek güvenli ve erişilebilirlik açısından gerekli. (Oturum
 * kilidinde bu mümkün değildir; orası `.biometryCurrentSet` ile bağlıdır.)
 */
export async function kilidiDogrula(): Promise<KilitSonucu> {
  const yetenek = await kilitYetenegi();
  if (yetenek.tur === 'yok') {
    return { kind: 'yetenek-yok', yetenek };
  }

  const sonuc = await LocalAuthentication.authenticateAsync({
    promptMessage: `${yetenek.ad} ile aç`,
    cancelLabel: 'Vazgeç',
    disableDeviceFallback: false,
  });

  return sonuc.success ? { kind: 'ok' } : { kind: 'iptal' };
}
