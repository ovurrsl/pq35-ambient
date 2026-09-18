#pragma once

#include <driver/gpio.h>

/**
 * KABLOLAMA — bu iki değeri kendi bağlantına göre ayarla.
 *
 * Aşağıdaki numaralar bir varsayılandır, ölçülmüş değer DEĞİLDİR. Nano ESP32'de
 * silkscreen'deki D-numarası ile çipin GPIO numarası aynı değildir; kendi kartının
 * pinout'undan teyit et.
 */
constexpr gpio_num_t CAN_RX_PIN = GPIO_NUM_4;
constexpr gpio_num_t CAN_TX_PIN = GPIO_NUM_5;

/**
 * TX NEDEN BURADA YAZILI AMA BAĞLANMIYOR
 *
 * TWAI sürücüsü kurulum sırasında bir TX pini İSTER; parametre zorunludur.
 * Listen-Only modda kontrolcü o pini hiç sürmez — ne ACK basar ne hata çerçevesi.
 * Sert kural 1 gereği transceiver'ın TX ucu zaten **fiziksel olarak bağlanmaz**.
 *
 * Yani CAN_TX_PIN, hiçbir yere gitmeyen bir pin olmalı. Sürücüyü memnun etmek için
 * var; araca dokunmuyor. Kullanılmayan bir pin seç ve oraya kablo çekme.
 */

/** RX kuyruğu. Taşarsa kaybedilen çerçeve sayısı STAT satırında raporlanır. */
constexpr uint32_t RX_KUYRUK_UZUNLUGU = 128;

/** STAT satırı bu aralıkla basılır (ms). */
constexpr uint32_t STAT_ARALIGI_MS = 1000;
