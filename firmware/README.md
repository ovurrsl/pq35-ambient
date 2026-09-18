# firmware/ — Listen-Only CAN logger

Araca girecek **ilk yazılım**. Sert kural 6 gereği yalnızca dinler: LED'e, röleye,
hiçbir çıkışa dokunmaz. Tek işi, `CLAUDE.md` §12'deki bilinmeyen CAN ID'lerini
bilinene çevirecek logu toplamak.

> Kapı, kilit, sinyal, far, Kl.15 frame'leri · motor sıcaklığı, vites, akü voltajı ·
> `0x351`'in frame aralığı — hepsi tek bir şeyi bekliyor: araçtan alınmış bir log.

## Neden Listen-Only

Normal modda kontrolcü her çerçeveye ACK basmaya çalışır. Baud yanlışsa ya da CAN-H/L
tersse ACK basamaz, hata sayaçları şişer ve sonunda **bus'ı bozar**. `TWAI_MODE_LISTEN_ONLY`
bunu donanımda keser: ne ACK basar ne hata çerçevesi üretir.

Üstüne ikinci bir katman: transceiver'ın **TX ucu fiziksel olarak bağlanmaz** (sert kural 1).
Yazılım katmanı hata yapsa bile hatta tek bir bit çıkamaz.

> `yapilandirma.h`'de `CAN_TX_PIN` yine de tanımlı, çünkü TWAI sürücüsü kurulumda bir TX
> pini ister — parametre zorunludur. Hiçbir yere gitmeyen bir pin seç ve oraya kablo çekme.

## Kablolama

| | |
|---|---|
| Kart | Arduino Nano ESP32 (ESP32-S3), dahili TWAI |
| Transceiver | SN65HVD230 — native 3,3 V, seviye kaydırıcı gerekmez |
| Hat | Komfort-CAN 100 kbps (v1) · Antriebs 500 kbps (2. faz) |
| Sonlandırma | **modüldeki 120 Ω sökülür** — araç hattı zaten iki uçtan sonlandırılmış |

`include/yapilandirma.h` içindeki `CAN_RX_PIN` / `CAN_TX_PIN` bir **varsayılandır, ölçülmüş
değer değildir**. Nano ESP32'de silkscreen'deki D-numarası ile çipin GPIO numarası aynı
değildir; kendi kartının pinout'undan teyit et.

## Derleme

```bash
pio run -e komfort  -t upload -t monitor     # 100 kbps — önce bu
pio run -e antriebs -t upload -t monitor     # 500 kbps — 2. faz
```

Bit zamanlaması derleme zamanında sabittir. Çalışma anında baud değiştirmek gereksiz
karmaşıklık olurdu ve yanlış hatta yanlış hızla bağlanma riskini artırırdı.

## Masada ön kontrol

İkinci bir CAN düğümün (başka bir kart + transceiver, ya da USB-CAN arayüzü) yoksa
masada görebileceğin tek şey sürücünün kurulduğu ve hattın sessiz olduğudur — bu da
işe yarar: `# UYARI: hic cerceve yok` satırını görüyorsan yazılım ayakta demektir.

İkinci düğümün varsa ondan bilinen bir ID yayınla ve logda çıktığını doğrula. **Araca
gitmeden önce bunu yapmak, araçta "kablo mu yazılım mı" sorusunu ortadan kaldırır.**

## Araçta — §6 kontrol listesi atlanmaz

1. Akü (−) sökülü
2. Pinler VIN'e özel şemadan teyit — tahminle bağlanmaz
3. Modüldeki 120 Ω sonlandırma sökülü
4. Multimetre ile bekleme voltajı ~2,5 V (her iki hat)
5. Bağlantı sonrası VCDS/OBD ile yeni DTC çıkmadığı kontrol edilir
6. İlk çalıştırma **araç dururken, kontak kapalı** — asla sürüş sırasında

## Log toplama yöntemi

Terminalde bir şey yazıp **Enter**'a bastığında o an işaretlenir. Boş Enter etiketsiz
hızlı işaret koyar. `#stat` sayaçları basar, `#sifirla` sıfırlar.

Yöntem üç adımlı ve **üçüncüsü pazarlık konusu değil**:

1. **Sakin taban al.** 30–60 saniye hiçbir şey yapma. Araç kendi kendine ne yayınlıyorsa
   o taban olur.
2. **Tek bir şey yap ve işaretle.** Sol kapıyı aç → `sol kapi acildi` + Enter. Aynı anda
   iki şey yapma; hangisinin hangi ID'yi değiştirdiğini ayıramazsın.
3. **Aynı eylemi en az üç kez tekrarla, hep aynı etiketle.** Bir CAN hattında sürekli
   değişen onlarca ID vardır — sayaçlar, sağlama toplamları, sensörler. Tek denemede
   elinde onlarca aday kalır ve hepsi tesadüftür. Analiz aracı yalnızca **her tekrarda**
   değişen ID'leri öne çıkarır.

Logu dosyaya almak için `pio device monitor > log.txt` yeterli.

## Log biçimi

```
# pq35-can-logger v1
# hat=komfort bitrate=100000 mod=listen-only
# t_us,id,ext,rtr,dlc,veri
1234567,351,0,0,8,1A2B3C4D5E6F7788
!1250000,sol kapi acildi
@1300000,fps=412,toplam=5120,kayip=0,rx_err=0,durum=calisiyor
```

`#` yorum · `!` işaret · `@` sayaç · diğerleri çerçeve. Zaman damgası **mikrosaniye**,
`esp_timer_get_time()`'dan — `0x351`'in frame aralığını ölçmeye de bu yeter.

**Kayıp çerçeve sessizce geçilmez.** RX kuyruğu taşarsa STAT satırında `kayip=` artar ve
bir uyarı basılır: güvenilmeyecek bir log, güvenilir görünen bir logdan iyidir.

Metin çıktısı 100 kbps'de rahattır (~400 çerçeve/sn ≈ 16 kB/sn). 500 kbps Antriebs
hattında çerçeve hızı birkaç katına çıkar; orada kayıp sayacını ayrıca izle.

## Analiz

```bash
python3 ../tools/can-analiz.py ozet log.txt    # ID başına sayım, hız, değişen bit haritası
python3 ../tools/can-analiz.py olay log.txt    # işaretlerin çevresinde ne değişti
```

`olay` çıktısında **GÜÇLÜ ADAY** etiketi şu iki koşulun birlikte sağlandığı anlamına gelir:
ID her tekrarda tabanda görülmemiş bir yük üretti **ve** tabanda zaten gürültücü değil.

Bir aday bulduğunda **doğrulanmadan §12'den çıkarılmaz**: aynı eylemi yeniden logla ve
aynı bitlerin aynı yönde değiştiğini gör. Tek seferlik eşleşme kanıt değildir.
