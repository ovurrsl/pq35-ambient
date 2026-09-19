import type { ZoneId } from '@/theme/tokens';

/**
 * Telefon ↔ araç BLE protokolü.
 *
 * DURUM: bu sözleşme **firmware ile birlikte kesinleşecek.** Aşağıdaki UUID'ler ve komut
 * adları tasarım önerisidir; ESP32 tarafı yazılırken ikisi birden güncellenir. Kaynaklardan
 * gelen bir değer değildir, uydurma bir standart da değildir — bizim tanımımızdır.
 *
 * GÜVENLİK SINIRI (CLAUDE.md §7, §9.1):
 * Bağlantının şifrelenmesi, bonding, IRK ile adres çözümleme ve directed advertising
 * **firmware tarafının işidir.** iOS, CoreBluetooth üzerinden üçüncü parti uygulamalara
 * eşleşme denetimi vermez: periferik şifreli karakteristik talep eder, iOS eşleşme
 * diyaloğunu kendisi gösterir. Uygulama bunu "uygulamaz", miras alır.
 *
 * Uygulamanın kendi sorumluluğu, bunun ÜSTÜNDEKİ katmandır:
 * challenge-response, bağlantı başına oturum anahtarı ve komut tekrar sayacı.
 */

/** 128-bit özel servis. Kesinleşene kadar firmware ile eşleştirilmeli. */
export const SERVICE_UUID = '6f4d5300-7a21-4f6a-9d2c-0f4b1e8a3c71';

export const CHAR_UUID = {
  /** Okuma: karttan gelen nonce. Her bağlantıda yenilenir. */
  nonce: '6f4d5301-7a21-4f6a-9d2c-0f4b1e8a3c71',
  /** Yazma: imzalı komut çerçevesi. */
  command: '6f4d5302-7a21-4f6a-9d2c-0f4b1e8a3c71',
  /** Bildirim: durum akışı (bölge durumları, bağlantı, canlı veri). */
  state: '6f4d5303-7a21-4f6a-9d2c-0f4b1e8a3c71',
} as const;

/** Yetki seviyesi karttan gelir; istemci kendi yetkisini belirleyemez. */
export type Yetki = 'sahip' | 'misafir';

/**
 * Misafir yetkisinde tamamen kapalı komutlar (CLAUDE.md §3.2).
 * Bu liste istemcide **kullanıcı deneyimi** içindir; gerçek kısıtlama karttadır.
 * İstemci tarafı bir kontrol asla tek başına güvenlik sayılmaz.
 */
export const KRITIK_KOMUTLAR = ['kilit', 'arama', 'kodlama'] as const;
export type KritikKomut = (typeof KRITIK_KOMUTLAR)[number];

export type Komut =
  | { tip: 'bolge-renk'; bolge: ZoneId; renk: string }
  | { tip: 'bolge-parlaklik'; bolge: ZoneId; deger: number }
  | { tip: 'bolge-ac-kapa'; bolge: ZoneId; acik: boolean }
  | { tip: 'sahne-uygula'; sahneId: string }
  | { tip: 'kilit'; kilitle: boolean }
  | { tip: 'arama'; numara: string }
  | { tip: 'kodlama'; islem: string };

export function kritikMi(komut: Komut): komut is Extract<Komut, { tip: KritikKomut }> {
  return (KRITIK_KOMUTLAR as readonly string[]).includes(komut.tip);
}

/**
 * Karta gidecek çerçeve.
 *
 * `sayac` tekrar (replay) korumasıdır: kart aynı sayacı ikinci kez kabul etmez.
 * Zaman damgası kullanılamaz çünkü kartta senkron saat yoktur (CLAUDE.md §7).
 */
export interface KomutCercevesi {
  komut: Komut;
  /** Bağlantı başına artan sayaç. */
  sayac: number;
  /** Karttan okunan nonce üzerinden hesaplanan imza. */
  imza: string;
}

/**
 * Komut imzalayıcı.
 *
 * Somut uygulama **bilerek buraya yazılmadı**: HMAC-SHA256 için kullanılacak kütüphane
 * firmware'in seçtiği şemayla birlikte kararlaştırılır (`expo-crypto` HMAC vermez;
 * `react-native-quick-crypto` veya saf JS bir uygulama gerekir). Yer tutucu bir imza
 * yazmak, çalışıyormuş gibi görünen ama hiçbir şey doğrulamayan bir güvenlik katmanı
 * üretirdi — o yüzden arayüz tanımlı, uygulaması açık bırakıldı.
 */
export interface KomutImzalayici {
  imzala(nonce: Uint8Array, sayac: number, komut: Komut): Promise<string>;
}
