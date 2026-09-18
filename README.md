# pq35-ambient

**2016 VW Scirocco (PQ35 / MIB2) için CAN tetiklemeli ambiyans aydınlatma sistemi.**

ESP32-S3 aracın Komfort-CAN hattını **sadece dinler**; kapı, sinyal, far, kilit ve hız/RPM
olaylarını yakalayıp dört bölgedeki adreslenebilir LED şeritlerini sürer. Renk ve parlaklık
iOS uygulamasından seçilir, araç olayları geçici olarak bunun üzerine yazar.

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
| Renk ve parlaklık | iOS uygulamasından |
| MIB2 senkronu | "Yol B" — ileride, kanıtlanmamış |

## Bölgeler

`Z1` Sol kapı (kulp + cep + şerit) · `Z2` Sağ kapı · `Z3` Ön ayak altı · `Z4` Göğüs / konsol

Dört veri hattı. Her bölgenin davranışı firmware'de sabit değil, uygulamadan ayarlanır.

## Donanım

Arduino Nano ESP32 (ESP32-S3) · SN65HVD230 CAN transceiver (Listen-Only, TX bağlanmaz) ·
74AHCT125 seviye kaydırıcı · 12 V adreslenebilir şerit (~1,25 A/m, kendi 7,5 A sigortası) ·
buck + TVS · güç kesme MOSFET'i.

Araca **J533 gateway passthrough ara kablosu** ile girilir — hiçbir kablo kesilmez, ara kablo
çıkarılınca araç fabrika hâline döner.

## Güvenlik kuralları

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
