/**
 * SDK hatalarını Türkçe ve **çıkış yolu gösteren** metne çevirir.
 *
 * NEDEN: altı çağrı yeri ham `error.message`'ı doğrudan ekrana basıyordu. Supabase ve
 * `react-native-ble-plx` İNGİLİZCE mesaj döndürür; Türkçe bir uygulamada kullanıcı
 * anlamadığı bir cümle görüyor ve ne yapacağını öğrenemiyordu. En kötüsü `kilit.tsx`'teki
 * cümle ortası yerleştirmeydi: "Kayıtlı anahtar geçersiz: <İngilizce cümle> Yeniden giriş
 * gerekiyor."
 *
 * HIG (`writing.md › Best practices`): hata metni "display it as close to the problem as
 * possible, avoid blame, and be clear about what someone can do to fix it" olmalı ve
 * "Avoid robotic error messages with no helpful information, like “Invalid name.”"
 *
 * KURAL: ham mesaj kullanıcıya **hiç** gösterilmez; yalnızca `__DEV__` konsoluna yazılır.
 *
 * NEDEN HİÇBİR SDK IMPORT'U YOK: bu modülü `lib/ble/connection.ts` de kullanıyor ve orada
 * `react-native-ble-plx` bilerek tembel yükleniyor — Expo Go'nun paketinde o yerel modül
 * yok, dosya başında normal bir `import` uygulamayı açılışta çökertirdi. Aynı sebeple
 * hata nesneleri `instanceof` ile değil **alanlarına bakarak** tanınıyor.
 */

/** Tanınmayan hata için: suçlamayan, yine de ne yapılacağını söyleyen tek cümle. */
const GENEL = 'İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.';

/**
 * Supabase Auth kodları.
 *
 * Adlar `@supabase/auth-js`'in `ErrorCode` birliğinden birebir alındı
 * (`node_modules/@supabase/auth-js/dist/module/lib/error-codes.d.ts`). O listede olmayan
 * bir kod buraya yazılmaz: eşleşmeyen bir dal sessizce hiç çalışmaz ve kullanıcı genel
 * metni görür — yani uydurma kod, düzeltmenin kendisini işlevsiz bırakır.
 */
const AUTH_METIN: Readonly<Record<string, string>> = {
  invalid_credentials: 'Kimlik doğrulanmadı. Apple ile yeniden giriş yap.',
  bad_jwt: 'Oturum bilgisi geçersiz. Yeniden giriş yap.',
  session_expired: 'Oturumun süresi doldu. Yeniden giriş yap.',
  session_not_found: 'Oturum bulunamadı. Yeniden giriş yap.',
  provider_disabled: 'Apple ile giriş bu projede kapalı. Supabase panelinden açılmalı.',
  mfa_verification_failed:
    'Kod doğrulanmadı. Authenticator uygulamasındaki güncel 6 haneli kodu gir.',
  mfa_challenge_expired: 'Kodun süresi doldu. Yeni kodu bekle ve tekrar dene.',
  mfa_verification_rejected: 'Doğrulama reddedildi. Yeni bir kodla tekrar dene.',
  mfa_factor_not_found: 'Kayıtlı bir doğrulayıcı yok. Önce iki adımlı doğrulamayı kur.',
  mfa_totp_verify_not_enabled: 'TOTP doğrulaması bu projede kapalı.',
  over_request_rate_limit: 'Çok fazla deneme oldu. Bir dakika bekleyip tekrar dene.',
  captcha_failed: 'Güvenlik kontrolü geçilemedi. Tekrar dene.',
};

/**
 * `react-native-ble-plx`'in `BleErrorCode` sayıları.
 *
 * `BleError.message` yerine sayısal `errorCode` ile eşleşiyoruz: mesaj metni sürümle
 * değişebilir, kod değişmez. Değerler `node_modules/react-native-ble-plx/src/BleError.js`
 * içinden alındı; enum'u import etmiyoruz ki modül Expo Go'da talep edilmesin
 * (`lib/ble/connection.ts` başındaki nota bakınız).
 */
const BLE_METIN: Readonly<Record<number, string>> = {
  2: 'İşlem iptal edildi.', //                       OperationCancelled
  3: 'Denetleyici yanıt vermedi. Tekrar dene.', //    OperationTimedOut
  100: 'Bu cihazda Bluetooth LE yok.', //             BluetoothUnsupported
  101: 'Uygulamaya Bluetooth izni verilmemiş. Ayarlar › PQ35 Ambient › Bluetooth.', // BluetoothUnauthorized
  102: 'Bluetooth kapalı. Denetim Merkezi’nden veya Ayarlar › Bluetooth’tan aç.', //   BluetoothPoweredOff
  201: 'Araçla bağlantı koptu. Menzile girince yeniden denenir.', //                   DeviceDisconnected
  204: 'Denetleyici bulunamadı. Aracın menzilde ve kontağın açık olduğundan emin ol.', // DeviceNotFound
  205: 'Araca bağlı değilsin. Önce eşleşmiş cihaza bağlan.', //                        DeviceNotConnected
  600: 'Tarama başlatılamadı. Bluetooth’u kapatıp açmayı dene.', //                    ScanStartFailed
};

function gelistiriciyeYaz(kaynak: string, hata: unknown): void {
  if (__DEV__) {
    // Ham metnin görülebileceği tek yer burası.
    console.warn(`[${kaynak}]`, hata);
  }
}

function kodAl(hata: unknown): string | null {
  if (typeof hata === 'object' && hata !== null && 'code' in hata) {
    const kod = (hata as { code?: unknown }).code;
    if (typeof kod === 'string') return kod;
  }
  return null;
}

function bleKoduAl(hata: unknown): number | null {
  if (typeof hata === 'object' && hata !== null && 'errorCode' in hata) {
    const kod = (hata as { errorCode?: unknown }).errorCode;
    if (typeof kod === 'number') return kod;
  }
  return null;
}

/** Supabase Auth hatası → Türkçe metin. */
export function authHatasi(hata: unknown): string {
  gelistiriciyeYaz('auth', hata);
  const kod = kodAl(hata);
  return (kod && AUTH_METIN[kod]) || GENEL;
}

/** BLE hatası → Türkçe metin. */
export function bleHatasi(hata: unknown): string {
  gelistiriciyeYaz('ble', hata);
  const kod = bleKoduAl(hata);
  if (kod !== null && kod in BLE_METIN) return BLE_METIN[kod];
  return 'Bluetooth işlemi tamamlanamadı. Bluetooth’un açık ve aracın menzilde olduğundan emin ol.';
}

/**
 * Apple ile giriş akışı.
 *
 * Kullanıcının vazgeçmesi (`ERR_REQUEST_CANCELED`) hata değildir ve buraya hiç gelmez;
 * çağıran onu sessizce yutar.
 */
export function appleHatasi(hata: unknown): string {
  gelistiriciyeYaz('apple', hata);
  return 'Apple ile giriş tamamlanamadı. Tekrar dene.';
}
