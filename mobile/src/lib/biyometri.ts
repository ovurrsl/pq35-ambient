import * as LocalAuthentication from 'expo-local-authentication';

import { canStoreProtected } from './secure-keychain';

/**
 * Cihazın kilit yeteneği.
 *
 * NEDEN BU DOSYA VAR:
 * `expo-secure-store`, `requireAuthentication: true` verildiğinde girdiyi
 * `.biometryCurrentSet` ile korur — bu **yalnızca biyometri** demektir, parolaya
 * düşmez. Yani biyometrisi olmayan (veya kapatılmış) bir cihazda korumalı girdi
 * hiç oluşturulamaz; `canUseBiometricAuthentication()` false döner.
 *
 * Bunu sessizce geçmek yanlış olurdu: kullanıcı "oturum açık kalsın" beklerken
 * her açılışta baştan giriş yapmak zorunda kalır ve nedenini bilmez. Arayüz bu
 * durumu açıkça söyler.
 */

export type KilitTuru = 'face-id' | 'touch-id' | 'iris' | 'parola' | 'yok';

export interface KilitYetenegi {
  tur: KilitTuru;
  /** Kullanıcıya gösterilecek ad — cihazda ne varsa o yazar. */
  ad: string;
  /**
   * Korumalı Keychain girdisi oluşturulabilir mi?
   * `false` ise oturum saklanamaz; her açılışta e-posta + şifre + TOTP gerekir.
   */
  saklanabilir: boolean;
}

const ADLAR: Readonly<Record<KilitTuru, string>> = {
  'face-id': 'Face ID',
  'touch-id': 'Touch ID',
  iris: 'İris',
  parola: 'Cihaz parolası',
  yok: 'Kilit yok',
};

/**
 * Kilidin **SF Symbol** adı. `expo-symbols` gerçek sembol adı ister; uydurma bir ad
 * sessizce hiç çizilmez. Doğru adlar: `faceid` · `touchid` · `opticid` (iris için
 * `irisid` DEĞİL) · parola ve yoksa `lock.shield`.
 */
export function kilitSembolu(
  tur: KilitTuru
): 'faceid' | 'touchid' | 'opticid' | 'lock.shield' {
  switch (tur) {
    case 'face-id':
      return 'faceid';
    case 'touch-id':
      return 'touchid';
    case 'iris':
      return 'opticid';
    default:
      return 'lock.shield';
  }
}

/**
 * "X cihazda yereldir" cümlesinin öznesi.
 *
 * NEDEN AYRI BİR FONKSİYON: `ad`'ı doğrudan cümleye gömmek `yok` durumunda
 * "Kilit yok cihazda yereldir" gibi bozuk Türkçe üretiyor. Özne `tur`'dan türetiliyor.
 */
export function kilitOznesi(yetenek: KilitYetenegi): string {
  return yetenek.tur === 'yok' ? 'Cihaz kilidi' : yetenek.ad;
}

/**
 * "Kayıtlı yüz seti" yerine cihaza uygun ifade. Touch ID'de yüz seti yoktur.
 */
export function kilitKaydiIfadesi(tur: KilitTuru): string {
  return tur === 'face-id' ? 'kayıtlı yüz seti' : 'kayıtlı biyometri';
}

/**
 * Cihazda hangi kilit var? iPad'lerin çoğunda Touch ID, bazılarında Face ID bulunur;
 * hiçbiri yoksa yalnızca parola kalır.
 */
export async function kilitYetenegi(): Promise<KilitYetenegi> {
  const [donanim, kayitli, turler, saklanabilir] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
    canStoreProtected(),
  ]);

  if (!donanim || !kayitli) {
    // Biyometri yok ya da kurulmamış. Cihaz parolası uygulamayı korur ama
    // Keychain girdisini biyometriyle bağlayamayız.
    const tur: KilitTuru = donanim ? 'parola' : 'yok';
    return { tur, ad: ADLAR[tur], saklanabilir: false };
  }

  const tur: KilitTuru =
    turler.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ? 'face-id'
      : turler.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ? 'touch-id'
        : turler.includes(LocalAuthentication.AuthenticationType.IRIS)
          ? 'iris'
          : 'parola';

  return { tur, ad: ADLAR[tur], saklanabilir };
}
