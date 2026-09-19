# PQ35-AMBIENT — Claude Code için proje bağlamı

**Araç:** 2016 VW Scirocco · PQ35 platformu · fabrika çıkışlı MIB2 · 3 kapılı
**Hedef:** CAN tetiklemeli ambiyans aydınlatma (7 bölge) + canlı araç verisi + GSM/GPS uzaktan takip + iOS BLE uygulaması + Supabase/Vercel admin paneli + DIY VAG kodlama aracı
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

Antriebs-CAN (500 kbps) 2. fazda **ikinci bir kanalla** dinlenir; amacı LED tetiklemek değil,
uygulamadaki **canlı araç verisi ekranını** beslemektir (bkz. §3.1).

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
| 1 | CAN erişimi **Listen-Only** — **her iki kanalda da**. Dahili TWAI'de `TWAI_MODE_LISTEN_ONLY`, MCP2515'te listen-only modu; **iki hattın da TX'i fiziksel olarak bağlanmaz**. | Normal modda kontrolcü ACK basmaya çalışır, okuyamayınca hata sayaçları şişer ve bus bozulur. |
| 2 | Araç kablosu **kesilmez**. J533 gateway'e **passthrough (soket-sokete) ara kablo** ile girilir. | Ara kablo çıkarılınca araç fabrika hâline döner, iz kalmaz. |
| 3 | CAN modülündeki **120 Ω sonlandırma sökülür**. | Araç hattı zaten iki uçtan sonlandırılmış; üçüncü direnç bus'ı bozar. |
| 4 | Araç tarafı bağlantılarda **crimp + ısı büzüşmeli**, lehim yok. | Titreşimde lehim çatlar. |
| 5 | Splice öncesi kontrol listesi **atlanmaz** (bkz. §6). | Yanlış CAN-H/L bağlantısı aracı kilitleyebilir. |
| 6 | Araçtaki **ilk yazılım sadece dinler** — LED'e dokunmaz. Log al → masada analiz et → sonra LED kodu yaz. | Canlı CAN hattında yazılım hatası ayıklanmaz. |
| 7 | **EPS / direksiyon modülüne asla** kodlama denemesi yapılmaz. | Yanlış değer direksiyon gücünü kaybettirebilir. |
| 8 | `pq-flasher` brute-force script'i **canlı araçta asla** çalıştırılmaz. | 3 yanlış security-access denemesi modülü 20 dk kilitler. |
| 9 | **MIB2 (5F) en sona** bırakılır ve mümkünse hiç dokunulmaz. | UDS tabanlı, gerçek VCDS/ODIS ile bile hata veriyor; bricking riski. |
| 10 | Şerit gücü **kendi sigortasından**, iç aydınlatma sigortasından değil. Sigorta, toplam metraj ölçüldükten sonra boyutlandırılır. | ~1,25 A/m; 3,5 m tam beyazda ≈4,4 A. 7 bölgeyle toplam metraj arttı: ~6 m'yi aşarsa 7,5 A yetmez, hatlar iki sigortaya bölünür veya sigorta büyütülür. |
| 11 | ESP32 **asla Supabase service role anahtarı taşımaz**. Cihazın kendi device token'ı olur; veri Edge Function'a gider, fonksiyon doğrulayıp service role ile yazar. | Anahtar sızarsa etki tek cihazla sınırlı kalır ve o cihaz iptal edilebilir. |
| 12 | SIM808 **kendi 5 V / ≥2 A hattından** beslenir, girişinde ≥1000 µF bulk kondansatör olur, GND ortak yapılır. ESP32'nin regülatöründen beslenmez. | İletimde 2 A'e varan anlık akım çeker; aksi hâlde modül şebekeye girerken tüm sistem resetlenir. |

---

## 3. Donanım

| Parça | Not |
|---|---|
| Arduino Nano ESP32 (ESP32-S3) | Dahili TWAI (donanımsal Listen-Only), RMT (LED zamanlaması), NimBLE |
| SN65HVD230 CAN transceiver | **Kanal 1 — Komfort 100k.** Native 3,3 V, seviye kaydırıcı gerekmez. TX bağlanmaz. |
| Arduino GIGA R1 WiFi | **Kontrolcü B** (§3.3): dahili FDCAN ile **Kanal 2 — Antriebs 500k**, hava süspansiyon çıkışları ve 9 analog giriş, Varex H-köprüsü, IMU + SD kart, SIM808. Yalnızca Kl.15. **MCP2515'i tamamen gereksiz kıldı.** |
| 6 eksenli MEMS IMU + SD kart | Sürüş kaydı ve g ölçümü (§3.4). Kontrolcü B'ye bağlanır. Opsiyonel pilli RTC zaman sorununu kaldırır. |
| 74AHCT125 × 2 | Seviye kaydırıcı: 3,3 V data → 12 V şerit IC eşiği (≈0,7 × VDD). Quad buffer, 7 hat için **iki paket** gerekir (8 kanal, 7'si kullanılır) |
| 12 V adreslenebilir şerit (ZBL) | 1,8 × 10 mm · 15 W/m · 12 V'ta **20 mm kesim boyu** · maks 5 m hat · ~1,25 A/m. Oluğa 10 mm derinlik gerekir. **600 LED ≠ 600 piksel.** |
| Güç | Kendi sigortası (başlangıç 7,5 A, **metraj ölçülünce yeniden boyutlandırılacak**) · buck konvertör · **TVS zorunlu** · şerit gücünü tamamen kesen MOSFET |
| v2 eki | Wake-on-bus transceiver: TLE9251V veya NCV7356 |

**Tek kontrolcü iki baud rate'i (500k + 100k) çözemez** — donanımsal kısıt, yazılımla aşılamaz.
ESP32-S3'te de yalnızca **bir** dahili TWAI vardır. İkinci hat bu yüzden ikinci bir
kontrolcüye düşer: **GIGA R1'in dahili FDCAN'i** (§3.3). Harici MCP2515'e gerek kalmadı.

Hız ve RPM gateway tarafından 100k konfor hattına yansıtıldığı için **LED tetikleri tek
kanalla** karşılanır. İkinci kanal LED için değil, **canlı veri ekranı** için eklenir.

---

## 3.1 İki CAN kanalı

| Kanal | Hat | Kontrolcü | Transceiver | Faz |
|---|---|---|---|---|
| 1 | Komfort-CAN 100 kbps | ESP32-S3 dahili TWAI | SN65HVD230 | v1 |
| 2 | Antriebs-CAN 500 kbps | **GIGA R1 dahili FDCAN** | kart üstü | 2. faz |

**Sıralama kararı:** Antriebs motor kontrolüne en yakın hattır, bu yüzden **en sona
bırakılır**. Komfort hattı ve LED'ler stabil çalıştıktan sonra devreye alınır.

### Bilinen ID'ler — bunların dışında ID yazma

| Hat | ID | İçerik | Kaynak |
|---|---|---|---|
| Antriebs 500k | `0x280` | byte 3/4 → devir · byte 6 → gaz pedalı % | İki bağımsız topluluk kaynağı |
| Komfort 100k | `0x351` | hız | topluluk |
| Komfort 100k | `0x353` | devir, `rpm = 0,25 × (256 × Byte2 + Byte1)` | topluluk |

`0x320` ve `0x1A0` powertrain hattındadır ama **içerikleri çözümlenmemiştir**.

Motor sıcaklığı, vites, gaz kelebeği, akü voltajı, yağ sıcaklığı, turbo basıncı — **hiçbirinin
ID'si bilinmiyor.** Bunlar uygulamada "log ile bulunacak" olarak gösterilir; **tahmini ID
yazmak yasaktır**.

---

## 3.2 GSM/GPS ve bulut (3. faz)

**Modül:** SIM808 — GSM/GPRS + GPS tek kartta. **Komfort hattı, LED'ler ve Antriebs kanalı
çalıştıktan sonra** devreye alınır.

### Dört sert gerçek

**1. SIM808 2G-only — ama takvim artık biliniyor.** BTK ile operatörler arasındaki
sözleşmelerde 2G/3G kapanışı için son tarih **30 Nisan 2029**; Turkcell ve Vodafone'un GSM
lisansları bu tarihe uzatıldı, Türk Telekom'unki 2026'da bitiyordu ve o da aynı tarihe
hizalandı. **Bu madde artık engelleyici değil, tarihli bir ömürdür** — sipariş önündeki engel
kalktı. Lisans bitişi kesin kapanış günü değildir (operatör erken kapatabilir), o yüzden
tarih yine "operatörden teyit edilecek" işaretiyle taşınır.

**Sonucu bir tasarım kuralıdır:** SIM808 firmware'de tek bir `modem` **soyutlama katmanının
ardında** durur; üst katman "konum gönder", "SMS gönder", "ara" der. Modül değişirse yalnızca
o katman değişir. Yerine geçecek sınıf hazır: **LTE Cat-1** (SIM7600 / A7670 ailesi) —
GNSS dahili, gerçek TLS, aynı UART.

**2. Güç, bu modülün bilinen ölüm sebebi.** Şebeke ararken ve iletimde **2 A'e varan anlık
akım** çeker → kendi 5 V / ≥2 A hattı, ≥1000 µF bulk kondansatör, ortak GND (sert kural 12).

**3. iPhone bu hattın ahizesi olamaz.** BLE gerçek zamanlı ses taşımaz, ESP32-S3'te LE Audio
yok, klasik Bluetooth'ta telefon daima audio gateway tarafındadır ve iOS üçüncü parti bir
cihaz için kulaklık rolüne geçmez. **Ses araç içindeki mikrofon ve hoparlörden yürür**;
uygulama numara seçer, arar, kapatır, gelen aramayı gösterir. Dokümanda, kodda ve arayüzde
**"telefondan konuşulur" yazma**.

**4. SIM808'in TLS'i güvenilmez.** Veri sayfası "HTTPS destekler" yazar; bu veri sayfası
doğrusudur, saha doğrusu değildir. Dahili SSL yığınında TLS sürümü ve şifre takımı firmware'e
göre değişir ve eskidir, Supabase modern TLS ister. Bu yüzden **taşımaya güvenilmez, veri
uygulama katmanında korunur**: cihaz payload'ı kendi ön paylaşımlı anahtarıyla **AES-GCM ile
şifreler ve imzalar**, Supabase **Edge Function** çözer ve doğrular. TLS kurulabilirse üstüne
biner (savunmada derinlik); kurulamazsa veri yine okunamaz ve taklit edilemez. **Güvenlik
TLS'in çalışmasına bağlı bırakılmaz.** Aynı tuzak **dahili MQTT AT komutları** için de
geçerlidir — ham TCP soketi açılıp MQTT paketleri kendimiz üretilir.

**5. Araca bağlanılamaz, araç bağlanır.** SIM kart operatör NAT'ının (CGNAT) arkasındadır;
aracın dışarıdan erişilebilir bir adresi **yoktur**. Her oturumu araç başlatır. Bu yüzden
uzaktan komut için üç yol vardır ve hiçbiri anlık değildir: **SMS** (saniyeler–onlarca
saniye, en güvenilir, araç uykudayken de ulaşır) · **MQTT** (kalıcı TCP, ~saniye, uygulama
açıkken) · **HTTP yoklama** (yoklama aralığı kadar). Uzaktan erişim **ön hazırlık içindir**,
sürüş sırasında canlı kontrol için değil — ve **v2 güç mimarisini** (Kl.30 + wake-on-bus)
gerektirir, çünkü v1'de araç parkta uykudadır.

**SIM kartı:** APN firmware'e gömülmez, yapılandırmada durur · SIM PIN kapatılır · bireysel
hat mı M2M/IoT hattı mı operatöre sorulur (yeni BTK M2M düzenlemeleri var) · roaming kapalı ·
ön ödemeli hatta hareketsizlikten kapanma kuralı sorulur.

### Bulut mimarisi

```
Araç (ESP32 + SIM808)  ──GPRS, AES-GCM payload──▶  Supabase Edge Function  ──▶  Postgres (RLS)
                                                            ▲                        │
iPhone (Face ID → Keychain → JWT) ──HTTPS──────────────────┘                        │
Vercel admin paneli (aynı Auth, aynı RLS) ──HTTPS───────────────────────────────────┘
```

**Face ID kimlik doğrulama DEĞİLDİR.** Face ID cihazda yereldir; sunucuya karşı kimlik
**Supabase JWT**'dir. Refresh token iOS **Keychain**'de `biometryCurrentSet` korumasıyla
saklanır, Face ID onu açar.

- Supabase Auth: e-posta + şifre + **TOTP MFA**
- **Her tabloda RLS açık ve varsayılan reddet**, politikalar `auth.uid()` üzerinden
- Konum geçmişi hassas veri: saklama süresi sınırlı, panelde maskeleme, dışa aktarım loglanır
- Vercel paneli aynı Auth'u ve aynı RLS politikalarını kullanır; admin ayrı `role` claim'i

### SIM808'in kendi Bluetooth'u KULLANILMAZ

SIM808 çipinde **Bluetooth 3.0 (klasik)** vardır — **BLE değil**. Üç sebeple kullanılmıyor:

1. **iOS engeli.** Klasik Bluetooth SPP'ye üçüncü parti bir iOS uygulaması erişemez; bunun
   için cihazın MFi sertifikalı olması gerekir. iPhone uygulaması bu radyoyla konuşamaz.
2. **Güvenlik yüzeyi.** İkinci bir radyo, ikinci bir saldırı yüzeyi ve ikinci bir eşleşme
   yönetimi demek. Klasik BT'nin eşleşme modeli BLE Secure Connections'tan zayıf.
3. **Tek doğruluk kaynağı.** Durum tek yerde (ESP32) tutulur; SIM808 UART üzerinden onun
   çevre birimidir.

**Kural: tek radyo.** Telefonla tüm haberleşme ESP32-S3'ün BLE'si üzerinden yürür. SIM808'e
yalnızca ESP32 AT komutlarıyla erişir. Kartın BT anteni bağlanmaz.

> Not: SIM808 breakout kartlarının bir kısmında BT anteni/desteği zaten yönlendirilmemiştir;
> satın alınan kartın veri sayfasıyla teyit edilecek (zaten kullanmıyoruz).

### Aynı anda birden çok telefon

ESP32-S3 + NimBLE **aynı anda birden çok merkezi cihaza** (telefona) bağlanabilir; bu
yapılandırmayla belirlenir. Bu **tasarlanmış bir özellik** olarak ele alınır, kazara değil:

- Her telefon **ayrı bonding kaydı** ve **ayrı yetki seviyesi** taşır (sahip / misafir)
- Misafir profili LED ve sahneleri kullanır; kilit, arama ve kodlama komutlarını kullanamaz
- Eşleşmiş cihazlar uygulamadan ve panelden listelenir, tek tek **iptal edilebilir**
- Eşzamanlı bağlantı sayısı firmware'de sınırlanır; sınır aşılırsa yeni bağlantı reddedilir

### BLE eklemeleri

Mevcut tasarım (§7) korunur, üstüne: **bağlantı başına oturum anahtarı** ve **komut tekrar
sayacı**.

**Face ID yalnızca uygulamayı açar** (araç sahibinin kararı). Her komutta tekrar sorulmaz;
uygulama kilidinin kendisi kapıdır. Bunun zorunlu karşılığı: **arka planda otomatik
kilitlenme kapatılamaz** — uygulama arkaya alınınca Keychain anahtarı kapanır.

---

## 3.3 İki kontrolcü — sistem tek kartı aştı

Varex egzoz, hava süspansiyon, sürüş kaydı ve ses eklenince pin bütçesi **~40 pin, 9'u
analog**'a çıktı. Nano ESP32 (Nano form faktörü, ~22 GPIO / 8 analog) bunu kaldıramaz.
Bu bir tercih değil, **sonuç**.

```
KONTROLCÜ A — AMBİYANS                KONTROLCÜ B — AKTÜATÖR VE VERİ
Nano ESP32 (S3)                       GIGA R1 WiFi  (76 GPIO, 14 analog)
  7 × RMT LED                           hava: 9 çıkış + 9 analog
  Komfort CAN (TWAI, 100k)              Antriebs CAN (FDCAN, 500k)
  BLE — telefonla tüm haberleşme        Varex H-köprüsü
  I2S ses + FFT                         sürtme sensörleri (I2C)
  Kl.30 + wake-on-bus, derin uyku       IMU + SD kart (sürüş kaydı)
                                        SIM808 (UART)
                                        yalnızca Kl.15 ile beslenir
        └──────── UART / özel CAN bağlantısı ────────┘
```

**Üç gerekçe:**

1. **Güvenlik ayrımı.** LED animasyon kodundaki bir hata süspansiyon kontrolcüsüne
   ulaşamamalı. Araçlarda ECU'ların ayrı olmasının sebebi de bu; eğlence ile güvenlik kritik
   aktüatör aynı işlemcide dönmez.
2. **Her kart güçlü olduğu işi yapıyor.** ESP32'nin RMT'si 7 LED kanalını zahmetsiz sürer ve
   NimBLE güvenlik modelimizi (bonding, IRK, directed advertising) olduğu gibi taşır. GIGA'nın
   76 pini ve 14 analog girişi hava süspansiyonunu rahatça kaldırır.
3. **MCP2515 tamamen çıkıyor.** GIGA'nın kendi FDCAN'i Antriebs hattını alır. Bir kart, bir
   transceiver ve bir tuzak (TJA1050) eksildi.

**Güç ayrımı buradan geliyor:** ESP32 **Kl.30**'da kalır ve derin uykuya iner (uzaktan erişim
ve welcome için gerekli). GIGA yalnızca **Kl.15** ile beslenir — süspansiyon, egzoz ve sürüş
kaydı zaten kontak kapalıyken çalışmamalı, üstelik STM32H7 düşük akımda beklemeye uygun değil.

**UNO Q bu iş için uygun değil:** UNO pinout'u yetersiz, araçta Linux çalıştırmak kontak
kesilince **eMMC bozulma riski** ve açılış süresi demek.

**Maliyeti dürüstçe:** iki firmware, aralarında bir protokol, daha çok kablo.

**Doğrulanmamış:** GIGA'nın FDCAN'i 100/500 kbps klasik CAN'i **Listen-Only** çalıştırıyor mu
masada doğrulanacak · iki kart arası bağlantı UART mı özel CAN mı gecikmeye göre seçilecek.


## 3.4 Sürüş kaydı ve performans ölçümü (3. faz ile birlikte)

Araç sahibi canlı veri ekranında daha fazla veri, **0–100 gibi performans ölçümleri** ve
**sürüş kaydı** istiyor: nereye gidildi, ortalama hız, nerede hızlanıldı, nerede yavaşlandı,
nerede duruldu — konumla birlikte.

### g verisi araçtan gelmiyor — IMU eklenir

Aracın ESP'si yanal ivmeyi hesaplar, ama PQ35'te o mesajın ID'si **bilinmiyor** ve tahmin
yazmak yasak (§12). **6 eksenli MEMS IMU** eklenir: ±8 g, ≥100 Hz, SPI/I2C, sıcaklık telafili
tercih edilir. **Asıl zorluk parça değil, montaj ve kalibrasyon:** IMU kendi yönelimini ölçer,
eğik monteyse fren ivmesi yanala sızar → montaj açısı öğrenilir, yer çekimi çıkarılır,
titreşim alçak geçiren filtreyle bastırılır, IMU sert monte edilir.

### 0–100 ölçülebilir, ama hangi hızla

İki dürüstlük maddesi, ikisi de arayüzde yazılı olacak:

1. **Bu gösterge hızıdır.** Gösterge gerçek hızın altını okumaz; sonuç **olduğundan iyi
   çıkar**. Her ölçümün yanında "gösterge hızı" etiketi durur.
2. **Çözünürlüğü `0x351` frame aralığı belirler.** Interpolasyon sayıyı yumuşatır ama bilgi
   yaratmaz. Frame aralığı **logdan ölçülecek**.

**Düzeltme yolu GPS:** sabit hızda CAN ↔ GPS karşılaştırılır, düzeltme katsayısı çıkarılır.
**Tetikleme otomatiktir** — duruyorken ilk hareket saati başlatır, hedef hızda durur;
**sürüş sırasında ekrana dokunulmaz**. **Rollout yok**, o yüzden sayılar dergi sayılarıyla
karşılaştırılmaz. Aynı mekanizma 0–200, 100–0 fren, 80–120 esneklik ve 400 m için çalışır.

### Kayıt Kontrolcü B'de yaşar

Antriebs CAN, GPS (SIM808) ve Kl.15 beslemesi zaten B'de (§3.3). IMU ve
**SD kart** da B'ye takılır; **ambiyans kontrolcüsüne dokunulmaz**.

- **İki örnekleme hızı:** sürekli 10 Hz sürüş kaydı, ölçüm koşusunda patlama 100 Hz
- **Zaman kaynağı GPS.** Pilli RTC yok; ilk sabitlemeye kadar zaman **göreli** tutulur,
  sabitleme gelince sürüş yeniden tarihlenir; hiç gelmezse öyle işaretlenir. Pilli bir RTC
  sorunu tamamen kaldırır — BOM'a opsiyonel girer.
- **Kart bozulması bilinen arızadır:** ekle-ve-bırak sabit boyutlu kayıt, her sürüş ayrı
  dosya, Kl.15 düşüşü erken yakalanır ve tutma kondansatörüyle dosya kapatılır.
- **Aktarım darboğazı BLE değil 2G:** tam log **BLE ile telefona** iner, buluta **yalnızca
  özet + Ramer–Douglas–Peucker ile seyreltilmiş rota** gider, SD kartı çıkarmak kaçış kapısıdır.
- **Olaylar kartta tespit edilir** (sert hızlanma/frenleme/viraj, duruş, rölanti, ölçüm
  koşusu) ve konum + zamanla loga yazılır. **Eşikler araçta belirlenecek, sayı yazılmaz.**
- **Ortalama hız iki ayrı sayıdır:** hareketteki ve toplam. Tek sayı yanıltır.

### Gizlilik — konum kaydından daha ağır

Sürüş geçmişi sadece nerede olunduğunu değil, **nasıl sürüldüğünü** de söyler.

- **Tam log varsayılan olarak yüklenmez** — kartta ve telefonda kalır, buluta özet gider.
  Bu hem gizlilik hem bant genişliği cevabıdır; ikisi aynı yere çıkıyor.
- **Misafir yetkisine tamamen kapalı**, saklama süresi sınırlı, dışa aktarım denetim kaydına
  yazılır, sürüş satırlarında VIN yok.
- Uygulamada tek dokunuşla **sürüş silme** ve **kaydı tümden kapatma** bulunur.

### Araç sekmesinin bilgi mimarisi

Segment üçte kalır: `Canlı · Sürüşler · Konum`. **Performans** `Canlı`ın içinden açılan bir
ekrandır, sekme başlığı değil. **İletişim segmentten çıkar**, başlık çubuğunda telefon
düğmesi olur — arama araç telemetrisi değil, bir eylemdir.

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

**Tap noktası:** Gateway **J533**, sürücü ayak boşluğu, orta konsol yanı. Aynı passthrough
ara kablodan **iki bükümlü çift** alınır:

| Faz | Hat | Pinler |
|---|---|---|
| v1 | Komfort CAN-H / CAN-L | **pin 5 (or/gn)** / **pin 15 (or/br)** — *VIN'e özel şemayla teyit edilecek* |
| 2. faz | Antriebs CAN-H / CAN-L | **kaynaklarda yok — VIN'e özel şemadan belirlenecek** |

Antriebs pin numaralarını tahmin etme; şema olmadan o çifte dokunulmaz.
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

## 7.1 iOS uygulamasının ekran seti (19 ekran)

Uygulama iki kümeden oluşur. Kanvasta 4. ve 5. gruplar bunlardır.

| Küme | Ekranlar |
|---|---|
| Kontrol (11) | Bölgeler · Bölge detayı · CAN olayları · Araç (canlı veri) · **Performans** · **Sürüşler** · **Sürüş detayı** · Konum · İletişim · Sahneler ve bağlantı · Gizli özellikler |
| Kimlik, güvenlik ve ayarlar (8) | Uygulama kilidi (Face ID) · Giriş · İki adımlı doğrulama (TOTP) · Araçla eşleştirme · Komut onayı · Ayarlar · Güvenlik ayarları · Cihazlar |

Alt sekme çubuğu **5 sekmedir** ve değişmez: `Bölgeler · Olaylar · Araç · Sahneler · Ayarlar`.
`Araç` sekmesinin segment kontrolü üçtür: `Canlı · Sürüşler · Konum`. **Performans**, `Canlı`ın
içinden açılan bir ekrandır; **Sürüş detayı**, `Sürüşler`den açılır. **İletişim segmentte
değildir** — başlık çubuğundaki telefon düğmesidir, çünkü arama telemetri değil eylemdir.
Güvenlik, Cihazlar ve Gizli özellikler `Ayarlar` sekmesinin alt ekranlarıdır.
Kilit, Giriş, Doğrulama ve Eşleştirme ekranlarında **sekme çubuğu yoktur** — uygulama henüz
açılmamıştır.

**Egzoz ve hava süspansiyon `Araç` sekmesinin alt ekranlarıdır** (`/arac/egzoz`, `/arac/hava`).
İkisi de Kontrolcü B sistemi (§3.3), ambiyans değil. Eskiden `Bölgeler` ekranındaki "ARAÇ
SİSTEMLERİ" kartından açılıyorlardı; kart Araç sekmesine taşındı.

### Sert kural: alt ekran sekmenin içinde yaşar

Her sekmenin **kendi `Stack`i** vardır ve alt ekranlar o `Stack`in altındadır — asla kök
`Stack`in altında değil. Kök `Stack`e itilen bir ekran gerçek `UITabBar`'ın üstünü kapatır.
HIG (`tab-bars.md › Best practices`):

> "Make sure the tab bar is visible when people navigate to different sections of your app.
>  If you hide the tab bar, people can forget which area of the app they're in. The exception
>  is when a modal view covers the tab bar, because a modal is temporary and self-contained."

Tek istisna **onay ekranıdır**: `formSheet` olarak sunulur, yani HIG'in kendi saydığı modal
istisnası. Dosya düzeni bunu zorunlu kılıyor:

```
app/(tabs)/bolgeler/{_layout,index,[id]}.tsx
app/(tabs)/arac/{_layout,index,konum,surusler,surus/[id],performans,iletisim,egzoz}.tsx
app/(tabs)/arac/hava/{index,hafiza,denge}.tsx      ← kendi _layout'u yok, Araç Stack'inde
app/(tabs)/ayarlar/{_layout,index,guvenlik,cihazlar}.tsx
app/(tabs)/{olaylar,sahneler}.tsx                  ← alt ekranı yok, düz dosya
app/onay.tsx                                        ← kökte, formSheet (tek istisna)
```

Rota ağacı tahminle değil ölçümle doğrulanır: `expo-router`'ın kendi `getRoutes`'u dosya
ağacından ağacı kurar (`tools/rota-agaci.js`), `typedRoutes` ise her `href`'i tipe çevirir —
taşınan bir ekrandan sonra `tsc` eski `href`'leri hata olarak verir.

### Kimlik zinciri — arayüzde bu şekilde anlatılır

```
Face ID (yerel)  →  Keychain'i açar (biometryCurrentSet)  →  refresh token  →  Supabase JWT
```

### Cihaz kilidi Face ID'den ibaret değil

Face ID olmayan cihazlarda **Touch ID** kullanılır; iPad'lerin çoğunda Touch ID vardır.
Arayüz butonu ve metni cihazda ne varsa ona göre adlandırılır
(`expo-local-authentication` → `supportedAuthenticationTypesAsync`).

**Sert gerçek:** `expo-secure-store`'un `requireAuthentication` seçeneği `.biometryCurrentSet`
kullanır — bu **yalnızca biyometridir, cihaz parolasına düşmez**. Kayıtlı biyometrisi olmayan
bir cihazda korumalı girdi hiç oluşturulamaz. O durumda oturum saklanmaz ve her açılışta
e-posta + şifre + TOTP gerekir; arayüz bunu açıkça söyler, sessizce geçmez.

**"Face ID ile giriş yapılır" ifadesi yasaktır.** Face ID cihazda yereldir ve sunucuya hiçbir
şey kanıtlamaz; sunucuya karşı kimlik JWT'dir. Kayıtlı yüz seti değişirse Keychain girdisi
geçersiz olur ve kullanıcı e-posta + şifre + TOTP ile baştan girer — bu bir arıza değil,
tasarımın kendisi.

**İki ayrı güven sınırı karıştırılmaz:** telefon ↔ araç **BLE bonding**'e dayanır ve araç
yakındayken internet gerekmez; telefon ↔ bulut **Supabase JWT**'ye dayanır ve konum geçmişi,
panel senkronu ve uzaktan erişim içindir.

**Face ID yalnızca uygulama açılışındadır, her komutta değil.** Uygulama kilidi tek kapıdır,
bu yüzden **arka planda otomatik kilitlenme kapatılamaz** — uygulama arkaya alınınca Keychain
anahtarı kapanır. Bu ayarı "kullanıcı isterse kapatabilir" diye gösterme.

**Kritik komutlar** (kilit, arama, kodlama) misafir yetkisinde tamamen kapalıdır; sahip
yetkisinde oturum anahtarıyla imzalanır ve tekrar sayacı taşır. Geri alınamayan komutlar
göndermeden önce bir **onay ekranı** gösterir — bu onay Face ID değil, düz bir doğrulamadır.

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
mobile/       iOS uygulaması — Expo (React Native) + Expo Router + TypeScript (§9.1)
supabase/     şema + RLS migration'ları + Edge Function
firmware/     Listen-Only CAN logger (PlatformIO, ESP32-S3) — araçtaki ilk yazılım
firmware-uno-r4/  aynı logger'ın UNO R4 ikizi — aynı çıktı biçimi, ikinci bir tanık
tools/        masaüstü araçları — can-analiz.py (log → aday CAN ID) · rota-agaci.js (rota
              ağacı denetimi) · pano-dogrula.mjs (pano ölçümü + render)
```

`design/` altındaki `.dc.html` dosyaları Claude Design kanvasının kaynağıdır. Bir board'u
değiştirirken hem buradaki dosyayı hem yayınlanmış artifact'i güncelle.

Kanvas **43 pano / 7 grup**: sistem ve araç (4) · kurulum ve davranış (4) · malzeme, risk ve
kodlama (4) · iOS kontrol ekranları (14) · iOS kimlik, güvenlik ve ayarlar (9) · bulut ve
güvenlik (6) · sürüş verisi ve performans (2). Pano ekler/çıkarırsan `design/project/canvas.json` ve `design/README.md`
sayılarını da güncelle.

**Pano doğrulaması iki adımdır, biri yetmez.** Ölçüm (içerik alt kenarı ≤ çerçeve) `overflow:
hidden` içindeki kırpılmayı yakalamaz — pano "sığıyor" der ama metin sekme çubuğunun altında
kesilir. Her değişen pano ayrıca **render edilip gözle kontrol edilir**.
İkisini birden `tools/pano-dogrula.mjs` yapar; tarayıcı indirmez, ortamdaki Chromium'u
kullanır ve `playwright` depo bağımlılığı değildir:

```
npm i --prefix /tmp/pw playwright
PQ35_PLAYWRIGHT=/tmp/pw node tools/pano-dogrula.mjs design/project/AppKurulum.dc.html out.png
```

**Henüz yok:** LED sürüş firmware'i. `firmware/` şu an yalnızca **Listen-Only logger**
içeriyor ve sert kural 6 gereği öyle kalacak — LED kodu, log alınıp masada çözümlendikten
sonra yazılır. `api/` hiç açılmadı ve açılmayacak: web panelinden vazgeçildiği için Vercel
yığından çıktı.

---

## 9.1 Uygulama yığını — karar değişti

**Eskiden `ios/` (SwiftUI) planlanıyordu. Artık Expo (React Native).** Araç sahibinin kararı.

| Katman | Seçim |
|---|---|
| Uygulama | **Expo SDK 57** · React Native 0.86 · **Expo Router** (dosya tabanlı) · TypeScript **strict**, `any` yok |
| Tasarım dili | **iOS 26 Liquid Glass** (`expo-glass-effect`) + Apple HIG · SF Symbols (`expo-symbols`) |
| Animasyon | `react-native-reanimated` — fizik tabanlı, web tarzı sert geçiş yok |
| Veri tabanı / kimlik | **Supabase** — Postgres + Auth + RLS |
| Oturum saklama | **`expo-secure-store`** (iOS Keychain) · `persistSession: true` |
| Uzak veri | **TanStack Query** — Supabase ve Vercel uçları |
| Sunucu | **Vercel** Edge/Serverless (`api/`), Supabase JWT ile korunur |
| BLE | `react-native-ble-plx` |

### Klasör adı neden `ios/` değil

Expo projesi `npx expo prebuild` ile **kendi `ios/` yerel klasörünü üretir**. Proje kökünü
`ios/` yapmak `ios/ios/` demek olurdu. Bu yüzden uygulama kökü **`mobile/`**.

### Bu yığının getirdiği sert gerçekler

**1. BLE Expo Go'da çalışmaz.** `react-native-ble-plx` yerel modüldür; **custom dev client**
(`expo-dev-client` + EAS build) şart. "Expo Go ile test ederiz" denmez.

**2. Uygulama BLE güvenliğini *uygulamaz*, *miras alır*.** iOS CoreBluetooth üçüncü parti
uygulamalara bonding/pairing kontrolü vermez; eşleşmeyi **periferik (ESP32/NimBLE) talep
eder**, iOS sistem diyaloğunu kendisi gösterir. §7'deki LE Secure Connections, IRK ve
directed advertising **firmware tarafının işidir**. Uygulama tarafında yazılacak olan:
challenge-response, oturum anahtarı ve komut tekrar sayacı (uygulama katmanı protokolü).

**3. Client anahtarı `EXPO_PUBLIC_` ile açığa çıkar.** `EXPO_PUBLIC_*` değişkenleri
**pakete gömülür ve okunabilir**. Oraya yalnızca Supabase **publishable (anon)** anahtarı ve
API URL'i konur. Service role anahtarı, SIM808 ön paylaşımlı anahtarı ve device token
**asla** uygulamaya girmez (sert kural 11). Güvenlik RLS'ten gelir, anahtarın gizliliğinden
değil.

**4. Liquid Glass koşulludur.** `expo-glass-effect` yalnızca iOS 26+'da gerçek cam verir.
`isLiquidGlassAvailable()` false ise ve **Reduce Transparency / Increase Contrast** açıksa
**opak arka plana düşülür** — bu bir yedek değil, erişilebilirlik gereğidir.

**5. Tasarım kanvası içerik spesifikasyonudur, Liquid Glass ise kabuk.** Panolardaki renk
token'ları, tipografi ve bilgi mimarisi korunur; cam malzeme sekme çubuğu, başlık çubukları
ve modal sheet'lerde kullanılır. Kanvas ile kod çelişirse **kanvas kazanır**.

---

## 10. Dokümanlar ve hangisi kanonik

| Dosya | Rol |
|---|---|
| `docs/00-pq35-ambient-tam-proje-dokumu.md` | **KANONİK.** Bölüm 1 planlama sohbeti · Bölüm 2 DIY kodlama raporu · **Bölüm 3 ambiyans feasibility raporu — planı değiştiren bulgu.** Çelişki varsa bu kazanır. |
| `docs/01-gemini-arduino-canbus-sohbeti.md` | Erken donanım araştırması, TWAI/FastLED örnek kodu, güç kaynağı notları. Kapsam dışı fikirler (GSM, HomeKit, Find My) içerir — hepsi "ileride". |
| `docs/02-vw-scirocco-elektrik-semasi-rehberi.md` | Kablo renk kodları, J387 kapı pinout'u, güç/şase tap noktaları. **MIB2 RGB yayını varsayımı geçersizdir** (dosya başında not var); pinout bilgisi geçerli. |

| `docs/03-apple-hig-kontrol-listesi.md` | **Apple HIG kontrol listesi.** Sayfalar JavaScript ile render edildiği için düz çekimle okunmaz; DocC JSON uçları ve ayrıştırma yöntemi burada. Uygulanan kurallar (cam içerik katmanında kullanılmaz, ince font ağırlığı yok, safe area zorunlu) birebir alıntılarla. Tasarım kararı HIG ile çelişirse **HIG kazanır**. |

Dördüncü bir sohbet dökümü daha vardı; `docs/00`'ın birebir alt kümesi olduğu için depoya eklenmedi.

---

## 11. "İleride" kovası

Apple HomeKit · Find My ağı · garaj kapısı RF klonlama · Siri Shortcuts / Watch /
Live Activity · uzaktan kilit/cam kontrolü (mesaj enjeksiyonu — yüksek risk).

**Yol B artık "ileride" değil, opsiyonel bir deney.** §1'deki eşiği ölçülebilir bir keşif
protokolüne çeviren bir pano var (yedek al → adaptasyon kanalı var mı → Listen-Only logger →
menüyü aç → renk değiştirirken logla → tekrarlanabilirlik → `index → RGB` tablosu). Bu bir
**faz değildir**: Faz 4'ten sonra herhangi bir zamanda denenebilir, başarısız olması Yol A'yı
etkilemez. Yol B çalışsa bile Arduino'nun okuyacağı şey **RGB değil bir index'tir**; firmware
bir `index → RGB` tablosu tutmak zorundadır.

**Kapsama alındı (3. faz):** SIM808 GSM/GPS, uzaktan konum takibi, Supabase veritabanı,
**sürüş kaydı ve performans ölçümü** (§3.3). **Tur kaydı da artık burada** — sürüş kaydının
bir alt kümesi hâline geldi.

**Kapsam içinde:** far / ışık sensörü durumundan otomatik gece kısması (Komfort-CAN'den zaten geliyor).

---

## 12. Doğrulanmamış değerler

Aşağıdakiler topluluk kaynaklıdır veya VIN'e bağlıdır; **araçta ölçülmeden kod yazma**:

- Hız `0x351`, RPM `0x353`, Antriebs `0x280` — byte offset ve ölçekleme model yılına göre kayabilir
- J533 Komfort CAN-H/L pin numaraları (5 / 15)
- J533 Antriebs CAN-H/L pin numaraları — **hiç bilinmiyor**, şemadan belirlenecek
- Motor sıcaklığı, vites, gaz kelebeği, akü voltajı, yağ sıcaklığı, turbo basıncı ID'leri — logdan bulunacak
- Kapı / sinyal / kilit / Kl.15 frame'leri — PQ35 konfor matrisi kamuya açık değil
- LED şerit uzunlukları, toplam metraj ve akım tahminleri — sigorta boyutu buna bağlı
- Arka eşik trimi rotasının gerçek uzunluğu ve gerilim düşümü
- **Operatörün 2G kapanış takvimi** — SIM808'in tüm veri/SMS/arama işlevi buna bağlı
- SIM808'in gerçek akım profili ve GPS sabitleme süresi — masada ölçülecek
- GSM/GPS anten yerleşimi: aktif GPS anteni gökyüzü görüşü ister, metal kutuya konmaz
- **`0x351` frame aralığı** — performans ölçümünün çözünürlüğü buna bağlı, logdan ölçülecek
- **Gösterge hızının gerçek hızdan sapması** — GPS ile ölçülecek, tahmin yazılmaz
- **IMU g eşikleri, filtre kesimi, örnekleme hızı, montaj açısı** — IMU takıldıktan sonra
- **Aracın 0–100 süresi** — hiçbir yerde sayı olarak yazılmaz, ekranlarda yer tutucu
- **Gerçek BLE ve GPRS aktarım hızları**, SD kart kapasitesi — masada ölçülecek
- **2G kapanışının gerçek günü** — 30 Nisan 2029 lisans son tarihidir, operatör erken kapatabilir
- **Turkcell APN değeri ve tarife tipi** (bireysel / M2M) — operatörden teyit edilecek

Dokümanda veya arayüzde bu değerler daima "araçta doğrulanacak" işaretiyle sunulur.
