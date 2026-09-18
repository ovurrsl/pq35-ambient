# pq35-ambient

**2016 VW Scirocco (PQ35 / MIB2) için CAN tetiklemeli ambiyans aydınlatma sistemi.**

ESP32-S3 aracın CAN hatlarını **sadece dinler**; kapı, sinyal, far, kilit ve hız/RPM
olaylarını yakalayıp yedi bölgedeki adreslenebilir LED şeritlerini sürer. Renk ve parlaklık
iOS uygulamasından seçilir, araç olayları geçici olarak bunun üzerine yazar. İkinci bir CAN
kanalı aracın anlık değerlerini uygulamadaki canlı veri ekranına taşır.

> **Durum:** planlama / tasarım. Araçta henüz hiçbir fiziksel işlem yapılmadı.

---

## Mimari — "Yol A"

Projenin ilk fikri MIB2 ekranından seçilen rengi CAN'den okumaktı. Araştırma bunun
**PQ35'te çalışmadığını** gösterdi: VW renk seçimini düz bir RGB paketi olarak yayınlamıyor;
MIB2 → BCM arasında soyut bir BAP index'i gidiyor ve gerçek RGB ayrı bir **LIN** hattında —
üstelik bu mimari yalnızca MQB'de (Golf 7/7.5, A3, Leon) var.

Bunun yerine **Yol A** benimsendi:

| | |
|---|---|
| LED'leri süren | ESP32-S3'ün kendisi |
| Komfort-CAN'in rolü | **yalnızca tetikleyici** — kapı, kilit, far/gece, sinyal, hız `0x351`, RPM `0x353` |
| Antriebs-CAN'in rolü | **canlı veri** — devir ve gaz pedalı `0x280`; 2. fazda eklenir |
| GSM/GPS | **SIM808** — uzaktan konum, SMS, arama; 3. fazda eklenir |
| Bulut | **Supabase** (Postgres + Auth + Edge Functions) · **Vercel** admin paneli |
| Renk ve parlaklık | iOS uygulamasından |
| MIB2 senkronu | "Yol B" — ileride, kanıtlanmamış |

## Bölgeler

7 veri hattı, 7 bölge:

| | Ön | | Arka |
|---|---|---|---|
| `Z1` | Sol kapı (kulp + cep + şerit) | `Z5` | Arka sol yan panel (şerit + cep) |
| `Z2` | Sağ kapı (kulp + cep + şerit) | `Z6` | Arka sağ yan panel (şerit + cep) |
| `Z3` | Ön ayak altı | `Z7` | Arka ayak altı |
| `Z4` | Göğüs / konsol | | |

Scirocco 3 kapılı olduğu için **arka kapı yoktur**; Z5 ve Z6 arka koltukların yanındaki
yan döşeme panellerine gider. Arka hatlar ön konsoldaki aynı kontrolcüden çıkıp koltuk
altı / eşik trimi boyunca çekilir.

Her bölgenin davranışı firmware'de sabit değil, uygulamadan ayarlanır.

## CAN kanalları

Tek CAN kontrolcüsü iki baud rate'i çözemez, ESP32-S3'te de tek dahili TWAI var. Bu yüzden
iki kanal:

| Kanal | Hat | Kontrolcü | Faz |
|---|---|---|---|
| 1 | Komfort-CAN 100 kbps | ESP32-S3 dahili TWAI + SN65HVD230 | v1 |
| 2 | Antriebs-CAN 500 kbps | MCP2515 (SPI) + TJA1042 | 2. faz |

Antriebs motor kontrolüne en yakın hat olduğu için en sona bırakılır; komfort hattı ve
LED'ler stabil çalıştıktan sonra devreye alınır. Her iki kanal da Listen-Only, iki hattın da
TX'i bağlanmaz.

## Donanım

Arduino Nano ESP32 (ESP32-S3) · SN65HVD230 CAN transceiver (Listen-Only, TX bağlanmaz) ·
MCP2515 + **TJA1042** modülü (3,3 V versiyonu — TJA1050'li olan alınmaz) ·
2 × 74AHCT125 seviye kaydırıcı (7 veri hattı için 8 kanal) · 12 V adreslenebilir şerit
(~1,25 A/m, kendi sigortası — metraj ölçülünce boyutlandırılır) · buck + TVS ·
güç kesme MOSFET'i.

Araca **J533 gateway passthrough ara kablosu** ile girilir — hiçbir kablo kesilmez, ara kablo
çıkarılınca araç fabrika hâline döner.

## GSM/GPS ve bulut (3. faz)

SIM808 uzaktan konum takibi, SMS ve arama sağlar. Komfort hattı, LED'ler ve Antriebs kanalı
çalıştıktan sonra devreye alınır.

Bilinmesi gereken dört şey:

- **SIM808 2G-only.** Satın alma öncesi operatörden 2G kapanış takvimi teyit edilecek.
- **Kendi güç hattı şart.** İletimde 2 A'e varan anlık akım çeker; kendi 5 V / ≥2 A hattı ve
  ≥1000 µF bulk kondansatör olmadan modül şebekeye girerken tüm sistem resetlenir.
- **iPhone bu hattın ahizesi olamaz.** Ses araç içindeki mikrofon ve hoparlörden yürür;
  uygulama numara seçer, arar, kapatır, gelen aramayı gösterir.
- **SIM808'in TLS'i güvenilmez.** Bu yüzden payload cihazda AES-GCM ile şifrelenir ve
  imzalanır, Supabase Edge Function doğrular.

**Tek radyo kuralı:** SIM808'in kendi Bluetooth'u (3.0 klasik, BLE değil) kullanılmaz.
iOS üçüncü parti uygulamalara MFi olmadan klasik Bluetooth erişimi vermez, ikinci radyo
ikinci saldırı yüzeyi demektir. Telefonla tüm haberleşme ESP32-S3'ün BLE'si üzerinden yürür.

**Aynı anda birden çok telefon** bağlanabilir: her telefon ayrı bonding kaydı ve ayrı yetki
seviyesi (sahip / misafir) taşır, tek tek iptal edilebilir.

## Güvenlik

Kimlik doğrulama **Supabase JWT**'dir; **Face ID kimlik doğrulama değildir** — cihazda yerel
olarak Keychain'deki refresh token'ı açar. Üstüne TOTP MFA. Her tabloda RLS açık ve varsayılan
reddet. ESP32 **asla** service role anahtarı taşımaz; kendi device token'ı olur ve veri Edge
Function üzerinden yazılır.

Araçtaki ilk yazılım **sadece dinler**; log alınır, masada analiz edilir, LED kodu ondan sonra
yazılır. Splice öncesi kontrol listesi ve diğer sert kurallar `CLAUDE.md` §2 ve §6'da.

## Depo yapısı

| Yol | İçerik |
|---|---|
| `CLAUDE.md` | Proje bağlamı, mimari kararı, sert kurallar — **önce bunu oku** |
| `docs/` | Kaynak dökümler ve araştırma raporları |
| `design/` | Design kanvasının artboard kaynakları (`.dc.html` + `canvas.json`) |

`firmware/` (PlatformIO) ve `ios/` (SwiftUI) klasörleri gerçek kod yazılırken açılacak.

## Dokümanlar

| Dosya | Rol |
|---|---|
| [`docs/00-pq35-ambient-tam-proje-dokumu.md`](docs/00-pq35-ambient-tam-proje-dokumu.md) | **Kanonik.** Planlama sohbeti + DIY kodlama raporu + ambiyans feasibility raporu (planı değiştiren bulgu) |
| [`docs/01-gemini-arduino-canbus-sohbeti.md`](docs/01-gemini-arduino-canbus-sohbeti.md) | Erken donanım araştırması, örnek TWAI/FastLED kodu, güç kaynağı notları |
| [`docs/02-vw-scirocco-elektrik-semasi-rehberi.md`](docs/02-vw-scirocco-elektrik-semasi-rehberi.md) | Kablo renk kodları, J387 kapı pinout'u, güç/şase tap noktaları |

Bir çelişki varsa `docs/00` kazanır. Dördüncü bir sohbet dökümü daha vardı; `docs/00`'ın birebir
alt kümesi olduğu için eklenmedi.

## Tasarım kanvası

15 panoluk görsel plan — sistem mimarisi, bölge haritası, kablolama, davranış makinesi,
5 aşamalı yol haritası, malzeme ve risk listesi, DIY kodlama ve iOS uygulama ekranları:

**https://claude.ai/artifact/A9dAecdM4bQbLmXE1Bzchk**

> Kanvas varsayılan olarak özeldir; başkalarının açabilmesi için sayfadaki Share menüsünden
> paylaşman gerekir.
