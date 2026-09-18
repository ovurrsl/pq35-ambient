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
