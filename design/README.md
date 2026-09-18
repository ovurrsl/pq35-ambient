# design/ — Tasarım kanvası kaynakları

Bu klasör, projenin görsel planını taşıyan **Claude Design kanvasının** kaynak dosyalarıdır.

**Yayınlanmış kanvas:** https://claude.ai/artifact/A9dAecdM4bQbLmXE1Bzchk

> Kanvas varsayılan olarak özeldir. Başkalarının açabilmesi için sayfadaki Share
> menüsünden paylaşılması gerekir.

## Yapı

```
design/project/canvas.json     kanvas indeksi — pano çerçeveleri (x, y, w, h), sıra, grup notları
design/project/*.dc.html       her pano tek başına çalışan bir HTML dosyası
```

Klasör düzeni artifact'teki yolları **birebir yansıtır**, böylece `design/` klasörü olduğu
gibi yeniden yayınlanabilir.

## Panolar

| Grup | Panolar |
|---|---|
| 1 · Sistem ve araç | Kapak ve özet · Araç ağları · Sistem mimarisi · LED bölge haritası |
| 2 · Kurulum ve davranış | Kablolama ve pinout · Güvenli kurulum · Davranış makinesi · Yol haritası |
| 3 · Malzeme, risk ve kodlama | Malzeme ve risk · DIY VAG kodlama · Yol B — MIB2 renk keşfi · **Ses donanımı — BTL tuzağı** |
| 4 · iOS — kontrol ekranları | Bölgeler · Bölge detayı · CAN olayları · Araç (canlı veri) · Konum · İletişim · Sahneler ve bağlantı · Gizli özellikler · **Renk stüdyosu · Animasyon · Ses tepkili** |
| 5 · iOS — kimlik, güvenlik ve ayarlar | **Kurulum** · Uygulama kilidi (Face ID) · Giriş · İki adımlı doğrulama (TOTP) · Araçla eşleştirme · Komut onayı · Ayarlar · Güvenlik ayarları · Cihazlar |
| 6 · Bulut ve güvenlik | Vercel admin paneli · Panel — konum · Panel — cihazlar · Güvenlik mimarisi · **Yığın mimarisi (Expo · Supabase · Vercel)** |

Poster panolar 1600×1000; kablolama, malzeme/risk, DIY kodlama, Yol B, davranış makinesi, ses
donanımı, güvenlik ve yığın mimarisi panoları 1600×1200; telefon ekranları 390×844.
Toplam **37 pano**, bunların **20'si iOS ekranı** (11 kontrol + 9 kimlik/ayarlar).

## Düzenleme kuralları

- Her `.dc.html` kendi kendine yeterlidir: `<script src="./support.js"></script>` satırı
  **birebir korunur**, kök `<div>` boyutu `canvas.json`'daki `w`/`h` ve `$preview` ile aynı olmalıdır.
- Metin düz markup olarak yazılır; `{{...}}` yer tutucusu kullanılmaz.
- Görseller satır içi `<svg>`'dir — harici resim dosyası yoktur.
- Renk ve tipografi token'ları her dosyanın `<helmet><style>` bloğunda tekrarlanır.
- Bir panoyu değiştirdikten sonra hem bu klasörü hem yayınlanmış kanvası güncelle.
- `canvas.json` yalnızca pano eklenir/çıkarılır/taşınır veya notlar değişirse gönderilir;
  `createdOnFiles` alanı olduğu gibi korunur.
