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
| 1 · Sistem ve araç | Kapak ve özet · Araç ağları · Sistem mimarisi · LED bölge haritası (7 bölge) |
| 2 · Kurulum ve davranış | Kablolama ve pinout · Güvenli kurulum · Davranış makinesi · 5 aşamalı yol haritası |
| 3 · Malzeme, risk ve kodlama | Malzeme ve risk · DIY VAG kodlama |
| 4 · iOS uygulaması | Bölgeler · Bölge detayı · CAN olayları · **Araç · canlı veri** · Sahneler ve bağlantı · Gizli özellikler |

Poster panolar 1600×1000; kablolama, malzeme/risk ve DIY kodlama panoları 1600×1200;
telefon ekranları 390×844. Toplam 16 pano.

## Düzenleme kuralları

- Her `.dc.html` kendi kendine yeterlidir: `<script src="./support.js"></script>` satırı
  **birebir korunur**, kök `<div>` boyutu `canvas.json`'daki `w`/`h` ve `$preview` ile aynı olmalıdır.
- Metin düz markup olarak yazılır; `{{...}}` yer tutucusu kullanılmaz.
- Görseller satır içi `<svg>`'dir — harici resim dosyası yoktur.
- Renk ve tipografi token'ları her dosyanın `<helmet><style>` bloğunda tekrarlanır.
- Bir panoyu değiştirdikten sonra hem bu klasörü hem yayınlanmış kanvası güncelle.
- `canvas.json` yalnızca pano eklenir/çıkarılır/taşınır veya notlar değişirse gönderilir;
  `createdOnFiles` alanı olduğu gibi korunur.
