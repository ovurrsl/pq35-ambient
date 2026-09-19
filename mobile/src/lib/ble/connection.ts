import type { BleManager, Device, Subscription } from 'react-native-ble-plx';

import { expoGoIcinde } from '@/lib/env';
import { bleHatasi } from '@/lib/hata-metni';
import { SERVICE_UUID } from './protocol';

/**
 * BLE bağlantı yöneticisi.
 *
 * NEDEN MODÜL TEMBEL YÜKLENİYOR:
 * `react-native-ble-plx` yerel bir modüldür ve Expo Go'nun paketinde yoktur. Dosyanın
 * başında normal bir `import` olsaydı, Expo Go uygulamayı **açılışta** çökertirdi —
 * BLE'ye hiç dokunmayan ekranlara bakmak bile mümkün olmazdı. Bu yüzden gerçek modül
 * yalnızca ihtiyaç anında ve try/catch içinde yükleniyor. Tip importları `import type`
 * olduğu için derlemede silinir, çalışma zamanında bir şey talep etmez.
 *
 * Yani: Expo Go'da uygulama açılır ve gezilir, araç bağlantısı çalışmaz. Bu kısıtı
 * arayüz açıkça söyler; sessizce "bağlanamadı" demez.
 *
 * ADRES KISITI: iOS, BLE adresini ~15 dakikada bir değiştirir (RPA) ve CoreBluetooth
 * uygulamaya MAC adresi hiç vermez — `Device.id` iOS'ta cihaza özel, kalıcı olmayan bir
 * UUID'dir. "Bilinen cihazı adresinden tanıma" mümkün değildir; araç tarafı bonding
 * sırasında sakladığı IRK ile telefonu çözer (CLAUDE.md §7).
 */

/**
 * `react-native-ble-plx`'in `State` enum'ının değerleriyle aynı.
 * Kendi tipimizi tanımlıyoruz ki enum'u çalışma zamanında talep etmek zorunda kalmayalım.
 */
export type BluetoothDurumu =
  | 'Unknown'
  | 'Resetting'
  | 'Unsupported'
  | 'Unauthorized'
  | 'PoweredOff'
  | 'PoweredOn'
  /** Bu yapıda BLE yok (Expo Go veya modül yüklenemedi). */
  | 'Yok';

/**
 * **Araçla** bağlantı durumu — Bluetooth radyosunun durumu değil.
 *
 * İkisi ayrı sorulardır ve karıştırılması uygulamanın en büyük yalanıydı: beş ekran
 * "BLE bağlı" yazan yeşil bir çip çiziyordu, hiçbiri hiçbir yerden okumuyordu. Radyonun
 * açık olması araca bağlı olmak demek değildir.
 */
export type AracBaglantisi =
  /** Radyo durumu henüz okunmadı. Kısa sürer ama "bağlı değil" demek de bir iddiadır. */
  | 'bilinmiyor'
  /** Bu yapıda BLE yok (Expo Go veya modül yüklenemedi). */
  | 'yok'
  /** Radyo kapalı veya izin verilmemiş. */
  | 'kapali'
  /** Radyo hazır, araca bağlı değil. */
  | 'bagli-degil'
  | 'baglaniyor'
  | 'bagli';

export interface BulunanCihaz {
  /** iOS'ta kalıcı DEĞİLDİR — yalnızca bu oturum boyunca geçerli bir tanıtıcıdır. */
  id: string;
  ad: string | null;
  rssi: number | null;
}

/** BLE bu yapıda hiç kullanılabilir mi? Arayüz bunu sorup kullanıcıya doğrusunu söyler. */
export function bleKullanilabilirMi(): boolean {
  if (expoGoIcinde) return false;
  try {
    // Tembel yükleme kasıtlı: statik import Expo Go'da uygulamayı açılışta çökertir.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-ble-plx');
    return true;
  } catch {
    return false;
  }
}

export class BleBaglanti {
  private manager: BleManager | null = null;
  private taramaAcik = false;
  private durumAboneligi: Subscription | null = null;

  /** Bağlı cihaz tutuluyor; olmadan "bağlı mıyız" sorusunun cevabı yok. */
  private cihaz: Device | null = null;
  private kopmaAboneligi: Subscription | null = null;
  private btDurum: BluetoothDurumu = 'Unknown';
  private baglaniyor = false;
  private aracDinleyiciler = new Set<(durum: AracBaglantisi) => void>();

  /** Modül yoksa `null` döner; çağıranlar buna göre sessizce devre dışı kalır. */
  private yonetici(): BleManager | null {
    if (this.manager) return this.manager;
    if (expoGoIcinde) return null;
    try {
      // Tembel yükleme kasıtlı: statik import Expo Go'da uygulamayı açılışta çökertir.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const modul = require('react-native-ble-plx') as typeof import('react-native-ble-plx');
      this.manager = new modul.BleManager();
      return this.manager;
    } catch {
      return null;
    }
  }

  /**
   * Bluetooth durumunu dinler. BLE yoksa bir kez `'Yok'` bildirir ve biter —
   * çağıran taraf ayrı bir "destekleniyor mu" sorgusu yapmak zorunda kalmaz.
   */
  durumuIzle(geriCagir: (durum: BluetoothDurumu) => void): () => void {
    const m = this.yonetici();
    if (!m) {
      this.btDurum = 'Yok';
      geriCagir('Yok');
      this.aracDurumunuYayinla();
      return () => {};
    }
    this.durumAboneligi?.remove();
    this.durumAboneligi = m.onStateChange((d) => {
      this.btDurum = d as BluetoothDurumu;
      geriCagir(this.btDurum);
      this.aracDurumunuYayinla();
    }, true);
    return () => {
      this.durumAboneligi?.remove();
      this.durumAboneligi = null;
    };
  }

  /**
   * Yalnızca kendi servisimizi yayınlayan cihazları tarar.
   * Servis filtresi olmadan tarama hem pil yakar hem çevredeki tüm cihazları görür.
   */
  taramayaBasla(bulundu: (cihaz: BulunanCihaz) => void, hata: (mesaj: string) => void): void {
    const m = this.yonetici();
    if (!m) {
      hata('Bu yapıda BLE yok. Araç bağlantısı için development build gerekir.');
      return;
    }
    if (this.taramaAcik) return;
    this.taramaAcik = true;

    m.startDeviceScan([SERVICE_UUID], { allowDuplicates: false }, (err, device) => {
      if (err) {
        this.taramaAcik = false;
        hata(bleHatasi(err));
        return;
      }
      if (device) {
        bulundu({ id: device.id, ad: device.localName ?? device.name, rssi: device.rssi });
      }
    });
  }

  taramayiDurdur(): void {
    if (!this.taramaAcik) return;
    this.manager?.stopDeviceScan();
    this.taramaAcik = false;
  }

  /**
   * Bağlanır ve servisleri keşfeder.
   *
   * Eşleşme (bonding) burada tetiklenmez: kart şifreli karakteristik talep ettiğinde iOS
   * eşleşme diyaloğunu **kendisi** gösterir. Uygulamanın eşleşmeyi başlatacak bir API'si yok.
   */
  async baglan(cihazId: string): Promise<Device> {
    const m = this.yonetici();
    if (!m) throw new Error('Bu yapıda BLE yok.');
    this.taramayiDurdur();
    this.baglaniyor = true;
    this.aracDurumunuYayinla();
    try {
      const cihaz = await m.connectToDevice(cihazId, { timeout: 15_000 });
      await cihaz.discoverAllServicesAndCharacteristics();
      this.cihaz = cihaz;
      // Kopma kendiliğinden olur (menzil, araç uykuya geçti, kart resetlendi). Haber
      // vermeyen bir bağlantı, "bağlı" yazan bir çipi süresiz doğru gösterir.
      this.kopmaAboneligi?.remove();
      this.kopmaAboneligi = cihaz.onDisconnected(() => {
        this.cihaz = null;
        this.kopmaAboneligi?.remove();
        this.kopmaAboneligi = null;
        this.aracDurumunuYayinla();
      });
      return cihaz;
    } finally {
      this.baglaniyor = false;
      this.aracDurumunuYayinla();
    }
  }

  async kes(cihazId: string): Promise<void> {
    const m = this.manager;
    if (m && (await m.isDeviceConnected(cihazId))) {
      await m.cancelDeviceConnection(cihazId);
    }
    if (this.cihaz?.id === cihazId) {
      this.cihaz = null;
      this.kopmaAboneligi?.remove();
      this.kopmaAboneligi = null;
      this.aracDurumunuYayinla();
    }
  }

  /** Şu andaki araç bağlantısı durumu. */
  aracDurumu(): AracBaglantisi {
    if (this.btDurum === 'Yok' || this.btDurum === 'Unsupported') return 'yok';
    if (this.cihaz) return 'bagli';
    if (this.baglaniyor) return 'baglaniyor';
    if (this.btDurum === 'PoweredOn') return 'bagli-degil';
    if (this.btDurum === 'PoweredOff' || this.btDurum === 'Unauthorized') return 'kapali';
    // 'Unknown' ve 'Resetting': henüz bilmiyoruz. Bunu "kapalı" diye göstermek yanlış olur.
    return 'bilinmiyor';
  }

  /**
   * Araç bağlantısını dinler. İlk değeri hemen verir, sonra her değişimde bildirir.
   * Dönen fonksiyon aboneliği bırakır.
   */
  aracDurumunuIzle(geriCagir: (durum: AracBaglantisi) => void): () => void {
    this.aracDinleyiciler.add(geriCagir);
    geriCagir(this.aracDurumu());
    return () => {
      this.aracDinleyiciler.delete(geriCagir);
    };
  }

  private aracDurumunuYayinla(): void {
    const d = this.aracDurumu();
    for (const dinleyici of this.aracDinleyiciler) dinleyici(d);
  }

  /** Ekran kapanırken veya uygulama sonlanırken çağrılır. */
  yokEt(): void {
    this.taramayiDurdur();
    this.durumAboneligi?.remove();
    this.durumAboneligi = null;
    this.kopmaAboneligi?.remove();
    this.kopmaAboneligi = null;
    this.cihaz = null;
    this.manager?.destroy();
    this.manager = null;
    this.aracDurumunuYayinla();
  }
}
