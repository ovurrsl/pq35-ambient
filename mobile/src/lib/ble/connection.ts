import { BleManager, State, type Device, type Subscription } from 'react-native-ble-plx';

import { SERVICE_UUID } from './protocol';

/**
 * BLE bağlantı yöneticisi.
 *
 * ÇALIŞTIRMA KISITI: `react-native-ble-plx` yerel bir modüldür; **Expo Go'da çalışmaz.**
 * Test için custom dev client gerekir (`expo-dev-client` + EAS build). Bu, yığının seçimiyle
 * gelen bir kısıttır, bir hata değil (CLAUDE.md §9.1).
 *
 * ADRES KISITI: iOS, BLE adresini ~15 dakikada bir değiştirir (RPA) ve CoreBluetooth
 * uygulamaya MAC adresi hiç vermez — `Device.id` iOS'ta cihaza özel, kalıcı olmayan bir
 * UUID'dir. Bu yüzden "bilinen cihazı adresinden tanıma" mümkün değildir; araç tarafı
 * bonding sırasında sakladığı IRK ile telefonu çözer (CLAUDE.md §7).
 */

export type BagliDurum =
  | { ad: 'kapali' }
  | { ad: 'yetki-yok' }
  | { ad: 'bluetooth-kapali' }
  | { ad: 'araniyor' }
  | { ad: 'baglaniyor'; cihazId: string }
  | { ad: 'bagli'; cihaz: Device }
  | { ad: 'hata'; mesaj: string };

export interface BulunanCihaz {
  /** iOS'ta kalıcı DEĞİLDİR — yalnızca bu oturum boyunca geçerli bir tanıtıcıdır. */
  id: string;
  ad: string | null;
  rssi: number | null;
}

export class BleBaglanti {
  private readonly manager = new BleManager();
  private taramaAcik = false;
  private durumAboneligi: Subscription | null = null;

  /** Bluetooth durumunu dinler. Kapalıyken taramaya başlamak sessizce başarısız olur. */
  durumuIzle(geriCagir: (durum: State) => void): () => void {
    this.durumAboneligi?.remove();
    this.durumAboneligi = this.manager.onStateChange(geriCagir, true);
    return () => {
      this.durumAboneligi?.remove();
      this.durumAboneligi = null;
    };
  }

  /**
   * Yalnızca kendi servisimizi yayınlayan cihazları tarar.
   * Servis filtresi olmadan tarama hem pil yakar hem de çevredeki tüm cihazları görür.
   */
  taramayaBasla(
    bulundu: (cihaz: BulunanCihaz) => void,
    hata: (mesaj: string) => void
  ): void {
    if (this.taramaAcik) return;
    this.taramaAcik = true;

    this.manager.startDeviceScan([SERVICE_UUID], { allowDuplicates: false }, (err, device) => {
      if (err) {
        this.taramaAcik = false;
        hata(err.message);
        return;
      }
      if (device) {
        bulundu({ id: device.id, ad: device.localName ?? device.name, rssi: device.rssi });
      }
    });
  }

  taramayiDurdur(): void {
    if (!this.taramaAcik) return;
    this.manager.stopDeviceScan();
    this.taramaAcik = false;
  }

  /**
   * Bağlanır ve servisleri keşfeder.
   *
   * Eşleşme (bonding) burada tetiklenmez: kart şifreli karakteristik talep ettiğinde iOS
   * eşleşme diyaloğunu **kendisi** gösterir. Uygulamanın eşleşmeyi başlatacak bir API'si yok.
   */
  async baglan(cihazId: string): Promise<Device> {
    this.taramayiDurdur();
    const cihaz = await this.manager.connectToDevice(cihazId, { timeout: 15_000 });
    await cihaz.discoverAllServicesAndCharacteristics();
    return cihaz;
  }

  async kes(cihazId: string): Promise<void> {
    if (await this.manager.isDeviceConnected(cihazId)) {
      await this.manager.cancelDeviceConnection(cihazId);
    }
  }

  /** Uygulama kapanırken veya sağlayıcı sökülürken çağrılır. */
  yokEt(): void {
    this.taramayiDurdur();
    this.durumAboneligi?.remove();
    this.manager.destroy();
  }
}
