#pragma once

#include <Arduino.h>
#include <stdint.h>

/**
 * RA4M1 CAN çevre birimini LISTEN-ONLY moda zorlar.
 *
 * ================================================================================
 * NEDEN ELLE YAPILIYOR — `Arduino_CAN` BUNU YAPMIYOR
 * ================================================================================
 *
 * Sert kural 1: CAN erişimi her iki kanalda da Listen-Only olmalı. ESP32 tarafında
 * bu tek satır (`TWAI_MODE_LISTEN_ONLY`). UNO R4'te değil.
 *
 * `Arduino_CAN`'in tüm genel API'si şudur: `begin`, `end`, filtreler, `write`, `read`,
 * `available`, `isError` ve **yalnızca loopback** için iki metot:
 *
 *     int enableInternalLoopback();    // R_CAN_ModeTransition(..., CAN_TEST_MODE_LOOPBACK_EXTERNAL)
 *     int disableInternalLoopback();   // R_CAN_ModeTransition(..., CAN_TEST_MODE_DISABLED)
 *
 * Listen-only için karşılığı YOK ve `_can_ctrl` özel (private) olduğu için
 * `R_CAN_ModeTransition`'ı dışarıdan çağıramıyoruz. Bu yüzden FSP sürücüsünün kendi
 * yaptığı kayıt dizisi burada birebir tekrarlanıyor.
 *
 * FSP kaynağı (`ra/fsp/src/r_can/r_can.c`, `r_can_mode_transition`):
 *
 *     r_can_switch_to_operation_mode(p_ctrl, CAN_OPERATION_MODE_HALT);
 *     // 'Write to TCR in CAN halt mode only.'
 *     p_reg->TCR = (uint8_t) test_mode;
 *
 * ve `r_can_switch_to_operation_mode`:
 *
 *     p_reg->CTLR_b.SLPM = CAN_SLEEP_AWAKEN;          // 0
 *     p_reg->CTLR_b.CANM = canm_mode_setting & 0x03;
 *     FSP_HARDWARE_REGISTER_WAIT((p_reg->STR & 0x0700), (canm << 8));
 *
 * ================================================================================
 * DEĞERLER NEREDEN GELİYOR — HİÇBİRİ TAHMİN DEĞİL
 * ================================================================================
 *
 * `ra/fsp/inc/api/r_can_api.h`:
 *     CAN_OPERATION_MODE_NORMAL = 0
 *     CAN_OPERATION_MODE_HALT   = 2
 *     CAN_TEST_MODE_DISABLED    = 0
 *     CAN_TEST_MODE_LISTEN      = 3
 *
 * `R7FA4M1AB.h` (CMSIS aygıt başlığı):
 *     TCR  : uint8 · TSTE [0..0] "CAN Test Mode Enable" · TSTM [2..1] "CAN Test Mode Select"
 *     CTLR : uint16 · CANM [9..8] "CAN Operating Mode Select" · SLPM [10..10]
 *     STR  : uint16 (salt okunur) · NMLST [4..4] "Normal Mailbox Message Lost Status Flag"
 *     RECR/TECR : uint8 (salt okunur) alma/gönderme hata sayaçları
 *     R_CAN0_CTLR_CANM_Pos = 8 · CAN_CHECK_MODE_MASK = 0x0700
 *
 * Yani `TCR = 3` demek TSTE=1 (test modu açık) + TSTM=0b01 (listen-only) demektir.
 * Çapraz kontrol: kütüphanenin kullandığı `CAN_TEST_MODE_LOOPBACK_EXTERNAL = 5`
 * aynı çözümlemeyle TSTE=1 + TSTM=0b10 (harici loopback) veriyor — tutarlı.
 *
 * ================================================================================
 * İKİ UYARI
 * ================================================================================
 *
 * 1. Bu yazımdan sonra FSP'nin kendi `p_ctrl->test_mode` defteri donanımla uyumsuz
 *    kalır. Yalnızca `R_CAN_ModeTransition` tekrar çağrılırsa önemlidir; bu firmware
 *    `enableInternalLoopback()`/`disableInternalLoopback()` çağırmaz.
 *
 * 2. FSP sonsuza kadar bekler (`FSP_HARDWARE_REGISTER_WAIT`). Burada zaman aşımı var:
 *    araçtaki bir logger sessizce kilitlenmemeli, hatayı söyleyip durmalı.
 */

namespace listenonly {

/** CAN_CHECK_MODE_MASK — STR içindeki çalışma modu alanı. */
constexpr uint16_t MOD_MASKESI = 0x0700;
constexpr uint8_t MOD_NORMAL = 0;
constexpr uint8_t MOD_HALT = 2;
/** CAN_TEST_MODE_LISTEN — TSTE=1, TSTM=01. */
constexpr uint8_t TCR_LISTEN_ONLY = 3;

inline bool modaGec(uint8_t canm, uint32_t zamanAsimiMs = 50) {
  R_CAN0->CTLR_b.SLPM = 0;  // CAN_SLEEP_AWAKEN
  R_CAN0->CTLR_b.CANM = (uint16_t)(canm & 0x03);

  const uint32_t basla = millis();
  while ((R_CAN0->STR & MOD_MASKESI) != (uint16_t)((uint16_t)canm << 8)) {
    if (millis() - basla > zamanAsimiMs) return false;
  }
  return true;
}

/**
 * Listen-only'yi aç ve **donanımdan geri okuyarak doğrula**.
 *
 * Dönüş `false` ise çağıran taraf ASLA devam etmemeli: doğrulanmamış bir modda
 * dinlemek, sert kural 1'i sessizce çiğnemek olur.
 */
inline bool zorla() {
  if (!modaGec(MOD_HALT)) return false;

  // TCR tek seferde yazılır. TSTE ve TSTM'i ayrı ayrı yazmak, aradaki anlık değerde
  // yanlış bir test modunu etkinleştirebilirdi; FSP de baytı tek yazar.
  R_CAN0->TCR = TCR_LISTEN_ONLY;

  if (!modaGec(MOD_NORMAL)) return false;

  // Geri okuma: ayarladığımızı varsaymıyoruz, ölçüyoruz.
  return (R_CAN0->TCR & 0x07) == TCR_LISTEN_ONLY;
}

/** Şu an gerçekten listen-only miyiz? STAT satırında her saniye doğrulanır. */
inline bool acikMi() { return (R_CAN0->TCR & 0x07) == TCR_LISTEN_ONLY; }

/** Alma hata sayacı (RECR). */
inline uint8_t rxHata() { return R_CAN0->RECR; }

/**
 * Gönderme hata sayacı (TECR).
 *
 * Listen-only'de bu sayaç **0 kalmalıdır**: kontrolcü hatta hiçbir şey sürmüyor demektir.
 * Artıyorsa mod gerçekten kurulmamıştır — STAT satırı bunu uyarı olarak basar.
 */
inline uint8_t txHata() { return R_CAN0->TECR; }

/** Donanım posta kutusunda çerçeve kaybı oldu mu? (STR.NMLST) */
inline bool cerceveKaybi() { return (R_CAN0->STR & (1u << 4)) != 0; }

/** Bus-off (STR.BOST, bit 12) — listen-only'de görülmemeli. */
inline bool busOff() { return (R_CAN0->STR & (1u << 12)) != 0; }

}  // namespace listenonly
