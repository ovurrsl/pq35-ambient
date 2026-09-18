# PQ35-AMBIENT — Claude Code için proje bağlamı

**Araç:** 2016 VW Scirocco · PQ35 platformu · fabrika çıkışlı MIB2 · 3 kapılı
**Hedef:** CAN tetiklemeli ambiyans aydınlatma (7 bölge) + iOS BLE uygulaması + DIY VAG kodlama aracı
**Durum:** Planlama / tasarım. **Araçta henüz hiçbir fiziksel işlem yapılmadı.**
**Dil:** Bu depoda tüm doküman, yorum ve arayüz metni **Türkçe**. Teknik terimler (CAN, Listen-Only, BLE, PWM, TWAI, UDS) İngilizce kalabilir.

---

## 1. Mimari kararı — "Yol A" (bu bölümü asla atlama)

Projenin ilk varsayımı şuydu: *MIB2 ekranından seçilen rengi Komfort-CAN'den oku, LED'e bas.*
**Bu varsayım yanlış çıktı** (`docs/00-…md`, Araştırma Raporu 2):

- VW'de renk seçimi Komfort-CAN'e **düz bir RGB paketi olarak yayınlanmaz.** MIB2, BCM'ye
  soyut bir **BAP index'i** gönderir; BCM kendi adaptasyon tablosundan rengi bulur ve
  fiziksel LED'leri **ayrı bir LIN hattı** üzerinden sürer.
- Bu RGB/LIN tablo mimarisi **yalnızca MQB'de** (Golf 7/7.5, A3 8V, Leon 5F) doğrulanmıştır ve
  **PQ35'e transfer olmaz.** Scirocco'da çalışan bir ekran-senkronlu retrofit örneği bulunamadı.

### Benimsenen model

> **Yol A — bağımsız kontrol.** ESP32-S3 LED'leri **kendi** sürer.
> Komfort-CAN (100 kbps) yalnızca **tetikleyici** kaynağıdır: kapı, kilit, far/gece, sinyal,
> hız (`0x351`), RPM (`0x353`).
> **Renk ve parlaklık iOS uygulamasından seçilir.**

**Yol B** (MIB2 menü emülasyonu) "ileride" kovasındadır: çok haftalık, sonucu garanti olmayan
bir tersine mühendislik işi. Kod, doküman veya arayüzde MIB2 senkronu **asla mevcut plan gibi
sunulmaz**; yalnızca "Yol B / ileride" etiketiyle geçer.

**Yol B'ye geçiş eşiği:** (a) kendi aracında kodlamanın MIB2 ambiyans menüsünü gerçekten
gösterdiği doğrulanırsa **ve** (b) renk değiştirince değişen, tekrarlanabilir bir Komfort-CAN
frame'i yakalanırsa. İkisi birden yoksa Yol A'da kal.

---

## 2. Sert kurallar (ihlal edilemez)

| # | Kural | Neden |
|---|---|---|
| 1 | CAN erişimi **Listen-Only**. `TWAI_MODE_LISTEN_ONLY` yazılımda, **TX pini fiziksel olarak bağlanmaz**. | Normal modda kontrolcü ACK basmaya çalışır, okuyamayınca hata sayaçları şişer ve bus bozulur. |
| 2 | Araç kablosu **kesilmez**. J533 gateway'e **passthrough (soket-sokete) ara kablo** ile girilir. | Ara kablo çıkarılınca araç fabrika hâline döner, iz kalmaz. |
| 3 | CAN modülündeki **120 Ω sonlandırma sökülür**. | Araç hattı zaten iki uçtan sonlandırılmış; üçüncü direnç bus'ı bozar. |
| 4 | Araç tarafı bağlantılarda **crimp + ısı büzüşmeli**, lehim yok. | Titreşimde lehim çatlar. |
| 5 | Splice öncesi kontrol listesi **atlanmaz** (bkz. §6). | Yanlış CAN-H/L bağlantısı aracı kilitleyebilir. |
| 6 | Araçtaki **ilk yazılım sadece dinler** — LED'e dokunmaz. Log al → masada analiz et → sonra LED kodu yaz. | Canlı CAN hattında yazılım hatası ayıklanmaz. |
| 7 | **EPS / direksiyon modülüne asla** kodlama denemesi yapılmaz. | Yanlış değer direksiyon gücünü kaybettirebilir. |
| 8 | `pq-flasher` brute-force script'i **canlı araçta asla** çalıştırılmaz. | 3 yanlış security-access denemesi modülü 20 dk kilitler. |
| 9 | **MIB2 (5F) en sona** bırakılır ve mümkünse hiç dokunulmaz. | UDS tabanlı, gerçek VCDS/ODIS ile bile hata veriyor; bricking riski. |
| 10 | Şerit gücü **kendi sigortasından**, iç aydınlatma sigortasından değil. Sigorta, toplam metraj ölçüldükten sonra boyutlandırılır. | ~1,25 A/m; 3,5 m tam beyazda ≈4,4 A. 7 bölgeyle toplam metraj arttı: ~6 m'yi aşarsa 7,5 A yetmez, hatlar iki sigortaya bölünür veya sigorta büyütülür. |

---

## 3. Donanım

| Parça | Not |
|---|---|
| Arduino Nano ESP32 (ESP32-S3) | Dahili TWAI (donanımsal Listen-Only), RMT (LED zamanlaması), NimBLE |
| SN65HVD230 CAN transceiver | Native 3,3 V, seviye kaydırıcı gerekmez. TX bağlanmaz. |
| 74AHCT125 × 2 | Seviye kaydırıcı: 3,3 V data → 12 V şerit IC eşiği (≈0,7 × VDD). Quad buffer, 7 hat için **iki paket** gerekir (8 kanal, 7'si kullanılır) |
| 12 V adreslenebilir şerit (ZBL) | 1,8 × 10 mm · 15 W/m · 12 V'ta **20 mm kesim boyu** · maks 5 m hat · ~1,25 A/m. Oluğa 10 mm derinlik gerekir. **600 LED ≠ 600 piksel.** |
| Güç | Kendi sigortası (başlangıç 7,5 A, **metraj ölçülünce yeniden boyutlandırılacak**) · buck konvertör · **TVS zorunlu** · şerit gücünü tamamen kesen MOSFET |
| v2 eki | Wake-on-bus transceiver: TLE9251V veya NCV7356 |

**Tek kontrolcü iki baud rate'i (500k + 100k) çözemez** — donanımsal kısıt, yazılımla aşılamaz.
Hız ve RPM gateway tarafından 100k konfor hattına yansıtıldığı için **tek transceiver yeterli**.

---

## 4. LED bölgeleri

**7 veri hattı, 7 bölge:**

| # | Bölge | İçerik | Renk | Kablo rotası |
|---|---|---|---|---|
| Z1 | Sol kapı | kulp + cep + şerit | `#4CC2FF` buz mavisi | kapı körüğü |
| Z2 | Sağ kapı | kulp + cep + şerit | `#B98BFF` lavanta | kapı körüğü |
| Z3 | Ön ayak altı | sürücü + yolcu | `#46D98A` nane | konsol altı |
| Z4 | Göğüs / konsol | göğüs çıtası | `#FF9F45` amber | konsol içi |
| Z5 | Arka sol yan panel | şerit + cep | `#5B8DEF` indigo | eşik trimi |
| Z6 | Arka sağ yan panel | şerit + cep | `#FF7BB0` pembe | eşik trimi |
| Z7 | Arka ayak altı | sol + sağ | `#3FD9C7` turkuaz | eşik trimi |

Bir hattaki LED'ler tek tek adreslenebilir; kulp/cep/şerit gibi alt bölümler **yazılımda
piksel aralığıyla** ayrılır. Ayrı hat kullanmanın sebebi kablolama basitliği ve arıza
izolasyonudur, kontrol değil. Her bölgenin davranışı (bağımsız / paylaşımlı, hangi olaya
tepki vereceği) **firmware'de sabit değil, uygulamadan ayarlanır**.

### Araç gerçeği — yanlış yazma

**Scirocco 3 kapılıdır, arka kapı yoktur** (2+2 coupé). Arkada, arka koltukların yanında
**yan döşeme panelleri** vardır; Z5 ve Z6 bunlara gider. Dokümanda, kodda ve arayüzde
**"arka kapı" terimini kullanma** — doğrusu "arka sol / sağ yan panel".

### Arka hatların rotası

Z5, Z6 ve Z7 **ön konsoldaki aynı ESP32'den** çıkar ve **koltuk altı / eşik (marşpiyel)
trimi** boyunca arkaya çekilir; kapı körüğünden geçmez. Tek kontrolcü, tek besleme noktası.
Hat uzadığı için: besleme kablosunda **daha kalın kesit**, veri hattında **GND ile bükümlü
çift**, gerekirse şerit girişinde **tek piksel repeater**.

### Renk aileleri

Bölge renkleri bilerek eşleşir: sol taraf mavi (Z1/Z5), sağ taraf mor-pembe (Z2/Z6),
ayak altları yeşil-turkuaz (Z3/Z7), göğüs tek başına amber. Bu eşleşme haritada ve
uygulamada okunabilirliği artırır.

---

## 5. Öncelik / durum makinesi

```
uygulama override          (en üstte)
  ↑ geri vites
  ↑ kapı
  ↑ sinyal
  ↑ redline / shift-light
taban katmanı = uygulama rengi × gösterge dimmer (58d) × far durumu
```

- Mesaj **2 saniye** kesilirse tabana dön.
- Sinyal sweep'i, kendi delay'ini ayarlayarak değil, **CAN flaşör bitinin yükselen kenarında**
  başlatılır — tanım gereği senkron olur.
- Karanlıkta/farlar yanınca otomatik kısma, aracın kendi ışık sensöründen Komfort-CAN üzerinden
  gelir; telefon tarafında Focus/saat mantığına gerek yok.
- Golf 8 gerçeği: kapı açıkken **düz kırmızı**; yanıp sönen kırmızı arka radarlı çıkış
  uyarısıdır. Strobo bir tercihtir, OEM emülasyonu değil.

**Güç mimarisi:** v1 **Kl.15** tetikli (akü riski sıfır, welcome kontak açılışında) →
v2 **Kl.30** + wake-on-bus transceiver + deep sleep (<10 µA), gerçek "kilit aç → welcome".
VW'de "ACC" yoktur; **Kl.15 / Kl.S** vardır.

---

## 6. Araca bağlanma

**Tap noktası:** Gateway **J533**, sürücü ayak boşluğu, orta konsol yanı.
**Komfort CAN-H → pin 5 (or/gn)**, **CAN-L → pin 15 (or/br)** — *VIN'e özel şemayla teyit edilecek.*
OBD portu yeterli **değildir**: gateway konfor yayınlarını filtreler ve PQ35 UDS konuşmaz
(TP2.0 + KWP2000 kullanır).

**Splice öncesi kontrol listesi — kısayol yok:**

1. Akü (−) sökülü
2. Pinler VIN'e özel şemadan teyit — tahminle bağlanmaz
3. Modüldeki 120 Ω sonlandırma sökülü
4. Multimetre ile bekleme voltajı ~2,5 V (her iki hat)
5. Bağlantı sonrası VCDS/OBD ile yeni DTC çıkmadığı kontrol edilir
6. İlk çalıştırma araç dururken, kontak kapalı — **asla sürüş sırasında**

---

## 7. BLE güvenliği

iOS, BLE adresini ~15 dakikada bir değiştirir (RPA) → **sabit MAC beyaz listesi imkânsız**.

- LE Secure Connections + **bonding** → **IRK** ile adres çözümleme + whitelist
- Yalnız eşleşmiş telefona görünen **directed advertising**
- Zaman damgası yerine **challenge-response**: kart nonce üretir, uygulama HMAC-SHA256 / AES-GCM
  ile imzalar (kartta senkron saat yok, replay koruması başka türlü kurulamaz)

---

## 8. DIY VAG kodlama (ayrı alt sistem)

PQ35 gövde modülleri **TP2.0 + KWP2000** konuşur (UDS değil). Kanal kurulumu `0x200`,
modül cevabı `0x200 + mantıksal adres` (modül 09 → `0x209`).

Security Access gerçek kriptografi değil: **`key = seed + login_code (mod 2^32)`**.
Topluluğun paylaştığı 5 haneli kodlar literal gönderilmez — **toplama sabitidir**.

| Modül | Ad | Kod | Durum |
|---|---|---|---|
| 09 | Central Electrics (J519) | 31347 | Kolay — Amerikan park, Coming/Leaving Home, konfor sinyal |
| 19 | CAN Gateway (J533) | 20103 | Kolay |
| 42 | Door Elect. Driver | 19249 | — |
| 5F | Info Elektronik (MIB2) | S12345 | **UDS, riskli, bricking — en son** |

`S` öneki modülü development/engineering diagnostic session'a sokar (KWP2000 session `0x86`).

**Referanslar:** `I-CAN-hack/pq-flasher` (Python, PQ35'e özel, TP2.0 + KWP2000 + seed-key) ·
`PyVCDS` (KWP2000 servis haritası; long-code write **TODO**) · `ecu_diagnostics` (Rust).
`KLineKWP1281Lib` **yanlış protokol** (K-Line/KWP1281, CAN değil) — kullanma.

---

## 9. Depo yapısı

```
CLAUDE.md     bu dosya
README.md     proje tanıtımı
docs/         kaynak dökümler (§10)
design/       Design kanvasının artboard kaynakları (.dc.html + canvas.json)
```

`design/` altındaki `.dc.html` dosyaları Claude Design kanvasının kaynağıdır. Bir board'u
değiştirirken hem buradaki dosyayı hem yayınlanmış artifact'i güncelle.

**Henüz yok, ileride açılacak:** `firmware/` (PlatformIO, ESP32-S3) · `ios/` (SwiftUI).
Bunları gerçekten kod yazılırken oluştur, şimdiden boş klasör açma.

---

## 10. Dokümanlar ve hangisi kanonik

| Dosya | Rol |
|---|---|
| `docs/00-pq35-ambient-tam-proje-dokumu.md` | **KANONİK.** Bölüm 1 planlama sohbeti · Bölüm 2 DIY kodlama raporu · **Bölüm 3 ambiyans feasibility raporu — planı değiştiren bulgu.** Çelişki varsa bu kazanır. |
| `docs/01-gemini-arduino-canbus-sohbeti.md` | Erken donanım araştırması, TWAI/FastLED örnek kodu, güç kaynağı notları. Kapsam dışı fikirler (GSM, HomeKit, Find My) içerir — hepsi "ileride". |
| `docs/02-vw-scirocco-elektrik-semasi-rehberi.md` | Kablo renk kodları, J387 kapı pinout'u, güç/şase tap noktaları. **MIB2 RGB yayını varsayımı geçersizdir** (dosya başında not var); pinout bilgisi geçerli. |

Dördüncü bir sohbet dökümü daha vardı; `docs/00`'ın birebir alt kümesi olduğu için depoya eklenmedi.

---

## 11. "İleride" kovası

MIB2 ekran senkronu (Yol B) · SIM808 GPS/GSM · Apple HomeKit · Find My ağı · garaj kapısı RF
klonlama · web dashboard + veritabanı · Siri Shortcuts / Watch / Live Activity · telemetri ve
tur kaydı · uzaktan kilit/cam kontrolü (mesaj enjeksiyonu — yüksek risk).

**Kapsam içinde:** far / ışık sensörü durumundan otomatik gece kısması (Komfort-CAN'den zaten geliyor).

---

## 12. Doğrulanmamış değerler

Aşağıdakiler topluluk kaynaklıdır veya VIN'e bağlıdır; **araçta ölçülmeden kod yazma**:

- Hız `0x351`, RPM `0x353` — byte offset ve ölçekleme model yılına göre kayabilir
- J533 Komfort CAN-H/L pin numaraları (5 / 15)
- Kapı / sinyal / kilit / Kl.15 frame'leri — PQ35 konfor matrisi kamuya açık değil
- LED şerit uzunlukları, toplam metraj ve akım tahminleri — sigorta boyutu buna bağlı
- Arka eşik trimi rotasının gerçek uzunluğu ve gerilim düşümü

Dokümanda veya arayüzde bu değerler daima "araçta doğrulanacak" işaretiyle sunulur.
