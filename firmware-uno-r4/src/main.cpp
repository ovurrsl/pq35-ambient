/**
 * PQ35-AMBIENT — Listen-Only CAN logger · Arduino UNO R4 WiFi
 *
 * `firmware/` altındaki ESP32-S3 logger'ının ikizi. **Çıktı biçimi birebir aynı**, yani
 * `tools/can-analiz.py` ikisinin logunu da okur ve iki kartla alınan kayıtlar
 * karşılaştırılabilir.
 *
 * Sert kural 6 gereği yalnızca dinler: LED'e, röleye, hiçbir çıkışa dokunmaz.
 *
 * NEDEN İKİNCİ BİR KART
 * Aynı hattı iki bağımsız kontrolcüyle dinleyebilmek, "bu frame gerçekten var mı yoksa
 * benim kartımın uydurması mı" sorusunu ortadan kaldırır. R4'ün CAN denetleyicisi
 * çipin içindedir (RA4M1), yani harici MCP2515'e gerek yok — yalnızca transceiver.
 *
 * BU KART NE DEĞİLDİR (CLAUDE.md §3.3)
 * Kontrolcü A olamaz: 7 adreslenebilir LED kanalı ESP32'nin RMT'sini ister, RA4M1'de
 * karşılığı yok; ayrıca §7'deki BLE güvenlik modeli NimBLE'a dayanıyor.
 * Kontrolcü B olamaz: hava süspansiyon ~40 pin ve 9 analog istiyor, R4'te 14 dijital
 * ve 6 analog var. R4'ün bu projedeki yeri **logger**'dır.
 *
 * ÇIKTI BİÇİMİ — `tools/can-analiz.py` bunu okur
 *   # yorum / başlık
 *   1234567,351,0,0,8,1A2B3C4D5E6F7788      ← t_us, id, ext, rtr, dlc, veri
 *   !1250000,sol kapi acildi                 ← işaret (MARK)
 *   @1300000,fps=412,kayip=0,rx_err=0,durum=calisiyor
 *
 * KULLANIM (araçta)
 *   Seri terminalde bir şey yazıp Enter'a bas → o an işaretlenir.
 *   Boş Enter → etiketsiz hızlı işaret.
 *   `#stat`    → o anki sayaçlar
 *   `#sifirla` → sayaçları sıfırla
 *
 * Yöntem: sakin bir taban al (hiçbir şey yapma), sonra TEK bir şey yap ve işaretle.
 * Aynı eylemi birkaç kez tekrarla — tekrarlanmayan bir değişiklik kanıt değildir.
 */

#include <Arduino.h>
#include <Arduino_CAN.h>
#include <stdarg.h>

#include "yapilandirma.h"
#include "listen_only.h"

#ifndef HAT_ADI
#define HAT_ADI "bilinmiyor"
#endif
#ifndef HAT_BITRATE
#error "HAT_BITRATE tanimli degil — platformio.ini'deki komfort veya antriebs ortamini kullan"
#endif

namespace {

/**
 * `Serial.printf` BU ÇEKİRDEKTE YOK.
 *
 * ESP32'nin `HardwareSerial`'ı `printf` sunar; Renesas çekirdeğinin `UART` sınıfı sunmaz
 * (derleyici: "class UART has no member named printf"). Biçimlendirme bu yüzden
 * `vsnprintf` ile tampona yapılıp tek parça yazılıyor — hem taşınabilir hem de satırın
 * araya karışmasını önlüyor.
 */
void yaz(const char* bicim, ...) {
  char tampon[160];
  va_list ap;
  va_start(ap, bicim);
  vsnprintf(tampon, sizeof(tampon), bicim, ap);
  va_end(ap);
  Serial.print(tampon);
}


uint32_t g_araliktakiFrame = 0;
uint32_t g_toplamFrame = 0;
uint32_t g_sonStatMs = 0;
uint32_t g_dolulukUyarisi = 0;
bool g_listenOnly = false;
String g_girdi;

/**
 * Zaman damgası.
 *
 * ESP32 tarafı `esp_timer_get_time()` ile 64 bit mikrosaniye veriyor. R4'te `micros()`
 * 32 bittir ve **~71,6 dakikada bir sarar**. Sarmayı burada sayıp 64 bite genişletiyoruz;
 * yoksa uzun bir sürüş kaydının ortasında zaman geriye giderdi ve analiz aracı frame
 * aralıklarını yanlış hesaplardı.
 */
uint64_t simdiUs() {
  static uint32_t sonUs = 0;
  static uint64_t ustBitler = 0;
  const uint32_t simdi = micros();
  if (simdi < sonUs) ustBitler += 0x1'0000'0000ULL;
  sonUs = simdi;
  return ustBitler + simdi;
}

const char* durumAdi() {
  if (listenonly::busOff()) return "bus-off";
  if (!listenonly::acikMi()) return "listen-only-DEGIL";
  return "calisiyor";
}

void basligiYaz() {
  Serial.println();
  Serial.println("# pq35-can-logger v1");
  yaz("# kart=uno-r4 hat=%s bitrate=%d mod=listen-only\n", HAT_ADI, HAT_BITRATE);
#if defined(ARDUINO_UNOWIFIR4)
  yaz("# rx_pin=D%d tx_pin=D%d (TX BAGLANMAZ)\n", CAN_RX_PIN_WIFI, CAN_TX_PIN_WIFI);
  Serial.println("# NOT: D13 ayni zamanda dahili LED pini — LED_BUILTIN kullanilmaz");
#else
  yaz("# rx_pin=D%d tx_pin=D%d (TX BAGLANMAZ)\n", CAN_RX_PIN_MINIMA, CAN_TX_PIN_MINIMA);
#endif
  Serial.println("# t_us,id,ext,rtr,dlc,veri");
  Serial.println("# Enter = isaret koy · #stat · #sifirla");
}

/**
 * RTR SÜTUNU BU KARTTA HER ZAMAN 0 — ve bu bir eksiklik, gizlenmiyor.
 *
 * `Arduino_CAN`'in `CanMsg` yapısı RTR taşımıyor. ID alanının anlamı
 * (`ArduinoCore-API/api/CanMsg.h`) şöyle yazıyor:
 *     Bit 31 : frame format flag (0 = standard 11 bit, 1 = extended 29 bit)
 *     Bit 30 : reserved (**future** remote transmission request flag)
 * Yani RTR bayrağı "ileride" olarak ayrılmış, doldurulmuyor. Üstelik kütüphane tüm alma
 * posta kutularını `CAN_FRAME_TYPE_DATA` kuruyor, dolayısıyla RTR çerçevesi muhtemelen
 * hiç alınmıyor.
 *
 * ESP32 logger'ı RTR'yi gerçekten raporlar. Biçim aynı kalsın diye sütun burada da var
 * ama sabit 0 basılıyor; bir RTR çerçevesini bu kartla aradığın an bunu bil.
 */
void frameYaz(const CanMsg& m) {
  char satir[96];
  const bool ext = m.isExtendedId();
  const uint32_t id = ext ? m.getExtendedId() : m.getStandardId();

  int n = snprintf(satir, sizeof(satir), "%llu,%0*lX,%d,0,%d,",
                   (unsigned long long)simdiUs(),
                   ext ? 8 : 3,
                   (unsigned long)id,
                   ext ? 1 : 0,
                   (int)m.data_length);

  for (uint8_t i = 0; i < m.data_length && n < (int)sizeof(satir) - 3; i++) {
    n += snprintf(satir + n, sizeof(satir) - n, "%02X", m.data[i]);
  }
  Serial.println(satir);
}

void statYaz() {
  const uint32_t gecen = millis() - g_sonStatMs;
  const uint32_t fps = gecen ? (uint32_t)((uint64_t)g_araliktakiFrame * 1000U / gecen) : 0;
  const uint8_t rxErr = listenonly::rxHata();
  const uint8_t txErr = listenonly::txHata();

  /**
   * `kayip` burada ESP32'deki gibi bir SAYI DEĞİL, bir BAYRAKTIR.
   *
   * ESP32'nin TWAI sürücüsü `rx_missed_count` tutar. `Arduino_CAN`'in halka tamponu
   * tutmaz: dolduğunda çerçeveyi sessizce atar ve saymaz. Elimizde iki dolaylı işaret
   * var — donanımın posta kutusu kayıp bayrağı (STR.NMLST) ve tamponun dolmaya
   * yaklaşması. Sayı uydurmak yerine 1/0 basılıyor.
   */
  const bool kayip = listenonly::cerceveKaybi() || g_dolulukUyarisi > 0;

  yaz("@%llu,fps=%lu,toplam=%lu,kayip=%d,rx_err=%u,tx_err=%u,durum=%s\n",
                (unsigned long long)simdiUs(), (unsigned long)fps,
                (unsigned long)g_toplamFrame, kayip ? 1 : 0,
                (unsigned)rxErr, (unsigned)txErr, durumAdi());

  // En sık iki arıza bu ikisi; sessizce geçmek yerine adını koyuyoruz.
  if (fps == 0 && rxErr > 0) {
    Serial.println("# UYARI: cerceve yok ama hata sayaci artiyor -> baud yanlis veya CAN-H/L ters");
  } else if (fps == 0) {
    Serial.println("# UYARI: hic cerceve yok -> hat uykuda olabilir (kontak?) veya kablo kopuk");
  }
  if (kayip) {
    Serial.println("# UYARI: cerceve kaybedildi -> log eksik, bu araliga guvenme");
  }
  // Listen-only'de kontrolcü hatta hiçbir şey sürmez; TECR artıyorsa mod kurulmamıştır.
  if (txErr > 0) {
    Serial.println("# UYARI: TX hata sayaci artiyor -> LISTEN-ONLY GERCEKTEN KURULMAMIS, DURDUR");
  }
  if (!listenonly::acikMi()) {
    Serial.println("# UYARI: TCR listen-only degil -> sert kural 1 ihlali, kabloyu cek");
  }

  g_dolulukUyarisi = 0;
  g_araliktakiFrame = 0;
  g_sonStatMs = millis();
}

void isaretKoy(const String& etiket) {
  yaz("!%llu,%s\n", (unsigned long long)simdiUs(),
                etiket.length() ? etiket.c_str() : "isaret");
}

void seriIsle() {
  while (Serial.available()) {
    const char c = (char)Serial.read();
    if (c == '\r') continue;
    if (c != '\n') {
      if (g_girdi.length() < 80) g_girdi += c;
      continue;
    }

    g_girdi.trim();
    if (g_girdi == "#stat") {
      statYaz();
    } else if (g_girdi == "#sifirla") {
      g_toplamFrame = 0;
      g_araliktakiFrame = 0;
      g_dolulukUyarisi = 0;
      Serial.println("# sayaclar sifirlandi");
    } else {
      isaretKoy(g_girdi);
    }
    g_girdi = "";
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  // USB CDC'de bağlantı kurulmadan yazılanlar kaybolur; terminal açılana kadar bekle.
  const uint32_t basla = millis();
  while (!Serial && millis() - basla < 3000) delay(10);

  basligiYaz();

  /**
   * `CanBitRate` enum'ında 100k YOKTUR (yalnızca BR_125k/250k/500k/1000k). Komfort hattı
   * 100 kbps olduğu için `uint32_t` alan aşırı yükleme kullanılıyor; o, bit zamanlamasını
   * `util::calc_can_bit_timing` ile hesaplıyor.
   *
   * 24 MHz CAN saatiyle hesabın verdiği değerler (kütüphanenin algoritması birebir
   * çalıştırılarak masada doğrulandı):
   *   100 kbps → TQ=20, BRP=12, TSEG1=14, TSEG2=5, örnek noktası %75, sapma %0.000
   *   500 kbps → TQ=16, BRP=3,  TSEG1=11, TSEG2=4, örnek noktası %75, sapma %0.000
   */
  if (!CAN.begin((uint32_t)HAT_BITRATE)) {
    Serial.println("# HATA: CAN baslatilamadi (bitrate kurulamadi)");
    return;
  }

  /**
   * SERT KURAL 1 — BURADA KAPI KAPANIR.
   *
   * `Arduino_CAN` listen-only'yi hiç açmıyor; kayıt seviyesinde biz açıyoruz
   * (bkz. `listen_only.h`). Kurulamazsa **devam ETMİYORUZ**: normal modda kontrolcü
   * her çerçeveye ACK basmaya çalışır, transceiver'ın TX'i bağlı olmadığı için kendi
   * ACK'ini göremez, hata sayaçları şişer ve sonunda bus-off olur. O noktada logger
   * hem susar hem de araca bağlıyken hata üretmiş olur.
   */
  g_listenOnly = listenonly::zorla();
  if (!g_listenOnly) {
    CAN.end();
    Serial.println("# HATA: LISTEN-ONLY KURULAMADI — surucu durduruldu, dinlenmiyor.");
    Serial.println("# Sert kural 1 geregi bu modda devam edilmez. Karti araca BAGLAMA.");
    return;
  }

  Serial.println("# listen-only dogrulandi (TCR=3: TSTE=1, TSTM=01)");
  g_sonStatMs = millis();
  Serial.println("# dinleniyor");
}

void loop() {
  if (!g_listenOnly) {
    // Kurulum başarısızsa hiçbir şey yapma. Sessizce dönmek yerine ara ara sebebini yaz.
    delay(1000);
    Serial.println("# durduruldu: listen-only kurulamadi");
    return;
  }

  // Kuyrukta ne varsa bu turda boşalt; bekleme yok, STAT ve seri komut açık kalsın.
  size_t bekleyen = CAN.available();
  if (bekleyen >= DOLULUK_UYARI_ESIGI) g_dolulukUyarisi++;
  while (bekleyen--) {
    const CanMsg mesaj = CAN.read();
    frameYaz(mesaj);
    g_araliktakiFrame++;
    g_toplamFrame++;
  }

  // Kütüphanenin kendi hata bayrağı: posta kutusu taşması ve bus hataları buradan gelir.
  int hataKodu = 0;
  if (CAN.isError(hataKodu)) {
    yaz("# UYARI: CAN hata olayi (fsp kodu %d)\n", hataKodu);
    CAN.clearError();
  }

  seriIsle();

  if (millis() - g_sonStatMs >= STAT_ARALIGI_MS) statYaz();
}
