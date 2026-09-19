/**
 * PQ35-AMBIENT — Listen-Only CAN logger
 *
 * Bu, araca girecek İLK yazılımdır ve sert kural 6 gereği **yalnızca dinler**.
 * LED'e, röleye, hiçbir çıkışa dokunmaz. Amacı tek: §12'deki bilinmeyen CAN ID'lerini
 * bilinene çevirecek logu toplamak.
 *
 * NEDEN LISTEN-ONLY (sert kural 1)
 * Normal modda kontrolcü her çerçeveye ACK basmaya çalışır. Baud yanlışsa ya da
 * kablolama hatalıysa ACK basamaz, hata sayaçları şişer ve sonunda bus'ı bozar.
 * `TWAI_MODE_LISTEN_ONLY` bunu donanımda keser: ne ACK basar ne hata çerçevesi.
 * Üstüne transceiver'ın TX ucu fiziksel olarak bağlanmaz — iki bağımsız katman.
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
#include <driver/twai.h>

#include "yapilandirma.h"

#ifndef HAT_ADI
#define HAT_ADI "bilinmiyor"
#endif
#ifndef HAT_BITRATE
#error "HAT_BITRATE tanimli degil — platformio.ini'deki komfort veya antriebs ortamini kullan"
#endif

namespace {

uint32_t g_araliktakiFrame = 0;
uint32_t g_toplamFrame = 0;
uint32_t g_sonStatMs = 0;
uint32_t g_isaretSayisi = 0;
uint32_t g_sonKayip = 0;
String g_girdi;

int64_t simdiUs() { return esp_timer_get_time(); }

const char* durumAdi(twai_state_t durum) {
  switch (durum) {
    case TWAI_STATE_STOPPED:  return "durdu";
    case TWAI_STATE_RUNNING:  return "calisiyor";
    case TWAI_STATE_BUS_OFF:  return "bus-off";
    case TWAI_STATE_RECOVERING: return "toparliyor";
    default: return "?";
  }
}

/** Bit zamanlaması derleme zamanında sabit — yanlış hatta yanlış hızla bağlanma riski olmasın. */
twai_timing_config_t zamanlama() {
#if HAT_BITRATE == 100000
  return TWAI_TIMING_CONFIG_100KBITS();
#elif HAT_BITRATE == 500000
  return TWAI_TIMING_CONFIG_500KBITS();
#else
#error "Desteklenmeyen HAT_BITRATE"
#endif
}

void basligiYaz() {
  Serial.println();
  Serial.println("# pq35-can-logger v1");
  Serial.printf("# hat=%s bitrate=%d mod=listen-only\n", HAT_ADI, HAT_BITRATE);
  Serial.printf("# rx_pin=%d tx_pin=%d (TX BAGLANMAZ — surucu istedigi icin tanimli)\n",
                (int)CAN_RX_PIN, (int)CAN_TX_PIN);
  Serial.println("# t_us,id,ext,rtr,dlc,veri");
  Serial.println("# Enter = isaret koy · #stat · #sifirla");
}

void frameYaz(const twai_message_t& m) {
  char satir[96];
  int n = snprintf(satir, sizeof(satir), "%lld,%0*X,%d,%d,%d,",
                   (long long)simdiUs(),
                   m.extd ? 8 : 3,
                   (unsigned)m.identifier,
                   m.extd ? 1 : 0,
                   m.rtr ? 1 : 0,
                   (int)m.data_length_code);

  // RTR çerçevesinde veri yoktur; DLC dolu görünse bile baytlar anlamsızdır.
  if (!m.rtr) {
    for (int i = 0; i < m.data_length_code && n < (int)sizeof(satir) - 3; i++) {
      n += snprintf(satir + n, sizeof(satir) - n, "%02X", m.data[i]);
    }
  }
  Serial.println(satir);
}

void statYaz() {
  twai_status_info_t s{};
  if (twai_get_status_info(&s) != ESP_OK) return;

  const uint32_t gecen = millis() - g_sonStatMs;
  const uint32_t fps = gecen ? (uint32_t)((uint64_t)g_araliktakiFrame * 1000U / gecen) : 0;
  const uint32_t yeniKayip = s.rx_missed_count - g_sonKayip;

  Serial.printf("@%lld,fps=%u,toplam=%u,kayip=%u,rx_err=%u,durum=%s\n",
                (long long)simdiUs(), (unsigned)fps, (unsigned)g_toplamFrame,
                (unsigned)yeniKayip, (unsigned)s.rx_error_counter, durumAdi(s.state));

  // En sık iki arıza bu ikisi; sessizce geçmek yerine adını koyuyoruz.
  if (fps == 0 && s.rx_error_counter > 0) {
    Serial.println("# UYARI: cerceve yok ama hata sayaci artiyor -> baud yanlis veya CAN-H/L ters");
  } else if (fps == 0) {
    Serial.println("# UYARI: hic cerceve yok -> hat uykuda olabilir (kontak?) veya kablo kopuk");
  }
  if (yeniKayip > 0) {
    Serial.println("# UYARI: cerceve kaybedildi -> log eksik, bu araliga guvenme");
  }

  g_sonKayip = s.rx_missed_count;
  g_araliktakiFrame = 0;
  g_sonStatMs = millis();
}

void isaretKoy(const String& etiket) {
  g_isaretSayisi++;
  Serial.printf("!%lld,%s\n", (long long)simdiUs(),
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
      g_isaretSayisi = 0;
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

  twai_general_config_t genel =
      TWAI_GENERAL_CONFIG_DEFAULT(CAN_TX_PIN, CAN_RX_PIN, TWAI_MODE_LISTEN_ONLY);
  genel.rx_queue_len = RX_KUYRUK_UZUNLUGU;
  genel.tx_queue_len = 0;  // listen-only: gonderme kuyrugu hic ayrilmaz

  twai_timing_config_t zaman = zamanlama();
  // Kesif asamasindayiz: hicbir ID filtrelenmez, hepsini gormek istiyoruz.
  twai_filter_config_t filtre = TWAI_FILTER_CONFIG_ACCEPT_ALL();

  if (twai_driver_install(&genel, &zaman, &filtre) != ESP_OK) {
    Serial.println("# HATA: TWAI surucusu kurulamadi");
    return;
  }
  if (twai_start() != ESP_OK) {
    Serial.println("# HATA: TWAI baslatilamadi");
    return;
  }
  twai_reconfigure_alerts(TWAI_ALERT_RX_QUEUE_FULL | TWAI_ALERT_ERR_PASS |
                          TWAI_ALERT_BUS_ERROR, nullptr);

  g_sonStatMs = millis();
  Serial.println("# dinleniyor");
}

void loop() {
  twai_message_t mesaj;
  // Kuyrukta ne varsa bu turda boşalt; bekleme yok, STAT ve seri komut aç kalsın.
  while (twai_receive(&mesaj, 0) == ESP_OK) {
    frameYaz(mesaj);
    g_araliktakiFrame++;
    g_toplamFrame++;
  }

  uint32_t uyari = 0;
  if (twai_read_alerts(&uyari, 0) == ESP_OK && (uyari & TWAI_ALERT_RX_QUEUE_FULL)) {
    Serial.println("# UYARI: RX kuyrugu doldu -> cerceve kaybi var");
  }

  seriIsle();

  if (millis() - g_sonStatMs >= STAT_ARALIGI_MS) statYaz();
}
