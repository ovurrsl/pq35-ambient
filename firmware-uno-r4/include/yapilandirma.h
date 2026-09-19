#pragma once

#include <stdint.h>

/**
 * KABLOLAMA — bu değerler çekirdeğin kendi variant dosyasından geliyor, tahmin değil.
 *
 * `ArduinoCore-renesas/variants/UNOWIFIR4/pins_arduino.h`:
 *     #define PIN_CAN0_TX   (10)
 *     #define PIN_CAN0_RX   (13)
 *     #define PIN_CAN0_STBY (-1)
 *
 * UNO R4 **Minima**'da aynı değiller (`variants/MINIMA/pins_arduino.h`: TX=4, RX=5).
 * Yani internette gördüğün "CAN D4/D5" bilgisi Minima içindir; WiFi'de yanlıştır.
 *
 * Pinler `Arduino_CAN` tarafından sabitlenmiştir, seçilemez: kütüphane `CAN` nesnesini
 * `CAN(PIN_CAN0_TX, PIN_CAN0_RX)` ile kurar. Buradaki sabitler yalnızca log başlığında
 * doğruyu yazmak için var.
 */
constexpr int CAN_TX_PIN_WIFI = 10;
constexpr int CAN_RX_PIN_WIFI = 13;
constexpr int CAN_TX_PIN_MINIMA = 4;
constexpr int CAN_RX_PIN_MINIMA = 5;

/**
 * D13 AYNI ZAMANDA DAHİLİ LED'DİR (UNO R4 WiFi).
 *
 * Aynı variant dosyası: `#define PIN_LED (13u)`. Yani WiFi'de CAN RX hattı, kartın
 * üzerindeki "L" LED'inin devresiyle aynı nettedir. İki sonucu var:
 *   1. `LED_BUILTIN` bu firmware'de KULLANILAMAZ — yazmak CAN RX'i sürmek olur.
 *   2. LED bus trafiğiyle titreşir ve hattı bir miktar yükler.
 * Etkisinin 100 kbps'te ölçülebilir olup olmadığı **masada ölçülecek** (CLAUDE.md §12).
 *
 * D10 ve D13 ayrıca varsayılan SPI'ın CS ve SCK pinleridir: CAN açıkken varsayılan
 * SPI kullanılamaz. SD kart düşünülüyorsa ICSP başlığı üzerinden gitmek gerekir.
 */

/** STAT satırı bu aralıkla basılır (ms). */
constexpr uint32_t STAT_ARALIGI_MS = 1000;

/**
 * `Arduino_CAN`'in halka tamponu **32 çerçevedir** ve dolduğunda çerçeveyi
 * SESSİZCE ATAR (`ArduinoCore-API/api/CanMsgRingbuffer.cpp`: `if (isFull()) return;`).
 * Sayaç tutmaz. Bu yüzden kaç çerçeve kaybettiğimizi bilemeyiz — yalnızca kaybolduğunu
 * anlayabiliriz. Doluluk bu eşiğe değdiğinde uyarı basılır.
 */
constexpr size_t HALKA_TAMPON_BOYU = 32;
constexpr size_t DOLULUK_UYARI_ESIGI = 28;
