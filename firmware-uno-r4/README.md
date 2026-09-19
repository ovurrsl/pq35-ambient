# firmware-uno-r4/ — Listen-Only CAN logger · Arduino UNO R4

`firmware/` (ESP32-S3) ile **aynı işi** yapan ikinci bir logger. Çıktı biçimi birebir aynı,
yani `tools/can-analiz.py` ikisinin logunu da okur ve iki kartla alınan kayıtlar
karşılaştırılabilir.

Sert kural 6 gereği yalnızca dinler: LED'e, röleye, hiçbir çıkışa dokunmaz.

## Neden ikinci bir kart

Aynı hattı iki bağımsız kontrolcüyle dinleyebilmek, "bu frame gerçekten var mı yoksa
kartımın uydurması mı" sorusunu ortadan kaldırır. R4'ün CAN denetleyicisi çipin
içindedir (RA4M1) — harici MCP2515 gerekmez, yalnızca transceiver.

## Bu kart Kontrolcü A ya da B DEĞİLDİR

| | Neden olmaz |
|---|---|
| Kontrolcü A (ambiyans) | 7 adreslenebilir LED kanalı ESP32'nin **RMT**'sini ister; RA4M1'de karşılığı yok. Ayrıca §7'deki BLE güvenlik modeli NimBLE'a dayanıyor. |
| Kontrolcü B (aktüatör) | Hava süspansiyon **~40 pin, 9 analog** istiyor (CLAUDE.md §3.3); R4'te 14 dijital / 6 analog var. |

R4'ün bu projedeki yeri **logger**'dır.

## Kablolama — pinler kartına göre DEĞİŞİR

Çekirdeğin kendi variant dosyalarından (tahmin değil):

| Kart | CAN TX | CAN RX | Kaynak |
|---|---|---|---|
| UNO R4 **WiFi** | **D10** | **D13** | `variants/UNOWIFIR4/pins_arduino.h` |
| UNO R4 **Minima** | D4 | D5 | `variants/MINIMA/pins_arduino.h` |

> İnternette yaygın olan "R4'te CAN D4/D5" bilgisi **Minima** içindir. WiFi'de yanlıştır ve
> kartın bozuk olduğunu sandırır.

Pinler `Arduino_CAN` tarafından sabitlenmiştir, seçilemez.

### WiFi'de üç ek kısıt

1. **D13 aynı zamanda dahili LED pinidir** (`#define PIN_LED (13u)`). Yani CAN RX hattı,
   kart üzerindeki "L" LED'inin devresiyle aynı nettedir. `LED_BUILTIN` bu firmware'de
   **kullanılamaz** — yazmak CAN RX'i sürmek olur. LED bus trafiğiyle titreşir ve hattı bir
   miktar yükler; etkisinin 100 kbps'te ölçülebilir olup olmadığı **masada ölçülecek**.
2. **D10 ve D13 varsayılan SPI'ın CS ve SCK'sidir.** CAN açıkken varsayılan SPI kullanılamaz;
   SD kart düşünülüyorsa ICSP başlığından gitmek gerekir.
3. **R4 5 V mantıkla çalışır.** ESP32 tarafındaki **SN65HVD230 burada uygun değildir**
   (3,3 V parça). 5 V bir transceiver kullan: MCP2551 · TJA1050 · MCP2562.

### Ortak kurallar

| | |
|---|---|
| Transceiver | **5 V** tip · TX ucu **bağlanmaz** (sert kural 1) |
| Hat | Komfort-CAN 100 kbps (v1) · Antriebs 500 kbps (2. faz) |
| Sonlandırma | **modüldeki 120 Ω sökülür** — araç hattı zaten iki uçtan sonlandırılmış |

## Listen-only — kütüphane bunu yapmıyor, biz yapıyoruz

`Arduino_CAN`'in tüm mod API'si iki loopback metodundan ibarettir; **listen-only karşılığı
yoktur** ve `_can_ctrl` private olduğu için `R_CAN_ModeTransition` dışarıdan çağrılamaz.

Bu yüzden `src/listen_only.h`, FSP sürücüsünün kendi kayıt dizisini birebir tekrarlıyor:
HALT moduna geç → `TCR = 3` yaz → NORMAL'e dön → **geri okuyup doğrula**.

`TCR = 3` çözümlemesi (`R7FA4M1AB.h`): TSTE=1 (test modu açık) + TSTM=01 (listen-only).
Çapraz kontrol: kütüphanenin kullandığı `CAN_TEST_MODE_LOOPBACK_EXTERNAL = 5` aynı
çözümlemeyle TSTM=10 (harici loopback) veriyor — tutarlı.

**Kurulamazsa firmware dinlemeye hiç başlamaz.** Normal modda kontrolcü her çerçeveye ACK
basmaya çalışır, TX bağlı olmadığı için kendi ACK'ini göremez, hata sayaçları şişer ve
bus-off olur. Sessizce devam etmek sert kural 1'i çiğnemek olurdu.

Her STAT satırı modu yeniden doğrular ve `TECR` (gönderme hata sayacı) 0'dan farklıysa
uyarı basar — listen-only'de o sayaç artamaz.

## 100 kbps — enum'da yok ama kurulabiliyor

`CanBitRate` yalnızca `BR_125k/250k/500k/1000k` sunar; Komfort hattı 100 kbps'tir.
`begin(uint32_t)` aşırı yüklemesi bit zamanlamasını hesaplar. Kütüphanenin algoritması
(`CanUtil.cpp`) 24 MHz CAN saatiyle çalıştırıldığında:

| Hat | TQ | BRP | TSEG1 | TSEG2 | Örnek noktası | Sapma |
|---|---|---|---|---|---|---|
| Komfort 100 kbps | 20 | 12 | 14 | 5 | %75 | %0,000 |
| Antriebs 500 kbps | 16 | 3 | 11 | 4 | %75 | %0,000 |

## ESP32 logger'ından iki farkı — gizlenmiyor

1. **`rtr` sütunu her zaman 0.** `CanMsg` RTR taşımıyor; ID'de bit 30 "ileride" diye
   ayrılmış (`ArduinoCore-API/api/CanMsg.h`). Kütüphane ayrıca tüm alma posta kutularını
   `CAN_FRAME_TYPE_DATA` kuruyor. Biçim aynı kalsın diye sütun var ama doldurulmuyor.
2. **`kayip` bir sayı değil, bayrak.** ESP32'nin TWAI sürücüsü `rx_missed_count` tutar;
   `Arduino_CAN`'in 32 çerçevelik halka tamponu tutmaz — dolunca çerçeveyi sessizce atar
   (`if (isFull()) return;`). Elimizde iki dolaylı işaret var: donanımın posta kutusu kayıp
   bayrağı (`STR.NMLST`) ve tamponun dolmaya yaklaşması. Sayı uydurmak yerine 1/0 basılıyor.

## Derleme

```bash
pio run -e wifi-komfort    -t upload -t monitor     # 100 kbps — önce bu
pio run -e wifi-antriebs   -t upload -t monitor     # 500 kbps — 2. faz
pio run -e minima-komfort  -t upload -t monitor     # Minima kartı için
```

Dört ortam da derlenip doğrulandı; kendi kodumuzda uyarı yok.

## Kullanım (araçta)

Seri terminalde bir şey yazıp Enter'a bas → o an işaretlenir. Boş Enter → etiketsiz
işaret. `#stat` → o anki sayaçlar. `#sifirla` → sayaçları sıfırla.

Yöntem: sakin bir taban al (hiçbir şey yapma), sonra **tek** bir şey yap ve işaretle.
Aynı eylemi birkaç kez tekrarla — tekrarlanmayan bir değişiklik kanıt değildir.
