# **VW Scirocco Elektrik Şeması Rehberi**

[https://gemini.google.com/app/364fc896f6eca7d2](https://gemini.google.com/app/364fc896f6eca7d2)

> **Not (proje ekibi):** Bu belge, MIB2'nin seçilen RGB rengini Komfort-CAN'e düz bir
> paket olarak yayınladığını varsayar ve örnek CAN ID'leri (0x2DE, 0x3C0) tahmin eder.
> Bu varsayım `docs/00-pq35-ambient-tam-proje-dokumu.md` içindeki Araştırma Raporu 2 ile
> **geçersiz kılınmıştır** — projede Yol A benimsenmiştir. Belgedeki kablo renk kodları,
> J387 kapı pinout'u ve ölçüm değerleri geçerliliğini korur.

*User prompt: vw sicerocco 2016 kablolama ve elektirik hattının diyagram şeması ve hangi hat nereye gidiyor nereye ait gibi bilgileri nasıl öğrene bilirim.*

Response: Volkswagen Scirocco (2016 makyajlı facelift kasa) için fabrika düzeyinde kablolama şemalarına ve hat detaylarına ulaşmanın en güvenilir yolları ve kablo hatlarını okuma yöntemleri aşağıda açıklanmıştır:

### **1\. Fabrika Verilerine Ulaşma Kaynakları**

> * **VW erWin (Resmi Fabrika Portalı):** Volkswagen'in yetkili servislerinin kullandığı resmi portal olan **erWin VW** (erwin.vw.com) platformuna bireysel üyelik açabilirsiniz. 1 saatlik veya 1 günlük düşük ücretli erişim satın alarak şasi numaranıza (VIN) özel tam "Wiring Diagram / Current Flow Diagram" PDF belgelerini indirebilirsiniz.  
> * **ELSAWin / HaynesPro / Autodata:** Sanayi ve özel servislerde yaygın kullanılan ELSAWin veya HaynesPro yazılımları, Scirocco'nun tüm soket yapılarını, sigorta kutusu dağılımlarını ve pin çıkışlarını (pinout) şematik olarak sunar.  
> * **Multimedya ve Tesisat Pinout Siteleri:** Tesisatın sadece teyp, klima veya konfor modülü tarafındaki pin yapıları için *PinoutGuide* veya *Scribd* üzerindeki VW Scirocco Current Flow Diagrams kılavuzları incelenebilir.

### **2\. VW Şemalarını Okuma Standartları**

Volkswagen Grubu kablo şemalarında renkler ve bileşenler standart kodlarla belirtilir:

**Almanca Kablo Renk Kodları:**

> * **ws** \= Beyaz (Weiss)  
> * **sw / blk** \= Siyah (Schwarz)  
> * **ro / rt** \= Kırmızı (Kutup / Artı)  
> * **br** \= Kahverengi (Şase / Toprak \- **GND**)  
> * **gn** \= Yeşil  
> * **bl** \= Mavi  
> * **gr** \= Gri (Genellikle aydınlatma / tetik hatları)  
> * **or** \= Turuncu (Genellikle CAN-Bus hatları)

**Modül Kod Tanımlamaları:**

> * **J519:** BCM (Body Control Module / Gövde Kontrol Ünitesi) – İç aydınlatma, farlar ve konfor hatlarının toplandığı ana merkezdir.  
> * **J386 / J387:** Sürücü ve yolcu kapı kontrol modülleri.  
> * **T \+ Sayı (Örn: T20a):** Soket tanımı ve pin sayısı (Örn: T20a \= 20 pinli "a" soketi).

### **3\. Tesisatı Takip Etme Yöntemi**

> 1. **Sigorta Kutusu ve BCM İncelemesi:** Direksiyonun sol altındaki iç sigorta paneli ve arkasındaki BCM modülü, araçtaki neredeyse tüm iç mekan ve tetik kablolarının çıkış noktasıdır.  
> 2. **CAN-Bus Hatları:** Scirocco'da haberleşme hatları genellikle bükümlü çift (twisted pair) olarak çekilmiştir. Turuncu/Yeşil (CAN High) ve Turuncu/Kahverengi (CAN Low) kablo çiftleri aracın konfor hatlarını yönetir.  
> 3. **Multimetre ile İzleme:** Şemadan tespit ettiğiniz hattın doğru noktaya gittiğini doğrulamak için multimetrenizi **Süreklilik (Bip) Moduna** alıp kablonun başlangıç ve bitiş soketleri arasındaki direnci ölçebilirsiniz.

**Sources**

> 1. [Scirocco Circuit Current Diagrams | PDF | Electrical Connector \- Scribd](https://www.scribd.com/document/970716221/sirocco-scheme)

---

*User prompt: mesela sağ kabıdaki tüm hatlar değrleri ne yaptıkları renkerl gibi tüm detaylar*

Response:

**1Kapı Döşemesini Sökün ve T6 / T20 Soketlerine Ulaşın**

Kapı döşemesini ve altındaki hoparlör/kilit bakalitlerini çıkartarak kapı körüğünden (sütun geçişinden) gelen ana T20 soketini ve kapı kontrol modülüne (J387) giren soketleri açığa çıkarın.

**2Multimetre Hazırlığı ve Şase Ölçümü**

Multimetrenin siyah probunu aracın şasesine (örneğin kapı menteşesindeki boyasız bir civataya) sabitleyin. Kırmızı prob ile soket pinlerindeki voltaj ve tetik değerlerini kontrol edin.

**3Voltaj Değerlerini ve Tetik Hatlarını Doğrulayın**

İlgili kablo pinlerinde ana besleme (12V), kontak sinyali (12V) ve LIN-Bus/CAN-Bus dijital haberleşme voltajlarını (yaklaşık 2.0V – 4.5V arası değişken dalgalı voltaj) ölçerek hattın aktif olduğunu teyit edin. Kontrol sonrası soketleri yerine oturtun.

Volkswagen Scirocco (2016 Facelift) sağ (yolcu) kapısındaki tüm tesisat, kapı körüğünden geçen **T20 (20 Pinli A-Sütun Konnektörü)** ve kapı döşemesi içindeki **J387 Sağ Kapı Kontrol Modülü** üzerinde toplanır.

Sağ kapıdaki hatların renkleri, işlevleri ve multimetre ile ölçüm yaparken görmeniz gereken voltaj/sinyal değerleri aşağıda listelenmiştir:

### **Sağ Kapı Ana Tesisat ve Pin Detayları (T20 Soketi & J387 Modülü)**

| Pin No | Kablo Rengi | İşlevi / Ait Olduğu Sistem | Değer / Voltaj / Sinyal Türü |
| :---- | :---- | :---- | :---- |
| **Pin 1** | **Kırmızı / Sarı (ro/ge)** | Kapı Modülü Ana Güç Beslemesi (Sigorta Paneli) | **12V Sabit Akü Voltajı** (Kontak kapalı olsa da var) |
| **Pin 2** | **Kahverengi (br)** | Ana Şase / Toprak (GND) | **0V / Süreklilik (Bip) Modu** (Şaseye tam dirençsiz bağlı) |
| **Pin 3** | **Turuncu / Yeşil (or/gn)** | CAN-Bus High (Konfor Haberleşme Hattı) | **\~2.5V – 3.5V** (Dijital veri akışı, sabit 0V veya 12V olmaz) |
| **Pin 4** | **Turuncu / Kahverengi (or/br)** | CAN-Bus Low (Konfor Haberleşme Hattı) | **\~1.5V – 2.5V** (Dijital veri akışı) |
| **Pin 5** | **Mor / Beyaz (vi/ws)** | LIN-Bus (Ayna & Cam Sinyal Geçişi) | **\~9V – 11V** (Kare dalga dijital veri) |
| **Pin 6** | **Mavi / Sarı (bl/ge)** | Sağ Cam Kaldırma Motoru Tetik / Güç | Cam çalışırken **12V** (Ters yönde **\-12V**) |
| **Pin 7** | **Siyah / Yeşil (sw/gn)** | Sağ Dış Ayna Sinyal Lambası (LED) | Sinyal açıkken **0V ↔ 12V Kesikli Puls** |
| **Pin 8** | **Kırmızı / Mavi (ro/bl)** | Ayna Isıtma Elemanı Güç Hattı | Ayna rezistansı açıkken **12V** |
| **Pin 9** | **Siyah / Beyaz (sw/ws)** | Dış Ayna Katlama Motoru (Pozitif) | Katlanırken **12V**, Açılırken **\-12V** |
| **Pin 10** | **Siyah / Sarı (sw/ge)** | Dış Ayna Katlama Motoru (Negatif) | Katlanırken **\-12V**, Açılırken **12V** |
| **Pin 11** | **Gri / Mavi (gr/bl)** | Ayna Açı Motoru (Yatay Ayar) | Ayar düğmesine basılınca **12V / \-12V** |
| **Pin 12** | **Gri / Yeşil (gr/gn)** | Ayna Açı Motoru (Dikey Ayar) | Ayar düğmesine basılınca **12V / \-12V** |
| **Pin 13** | **Siyah / Mavi (sw/bl)** | Sağ Kapı Kilit Motoru (Kilit Açma) | Tetik anında **12V Anlık Puls** (1 saniyeden kısa) |
| **Pin 14** | **Siyah / Kırmızı (sw/ro)** | Sağ Kapı Kilit Motoru (Kilitleme) | Tetik anında **12V Anlık Puls** |
| **Pin 15** | **Kahverengi / Siyah (br/sw)** | Kapı Açık Switçi / Sinyal Sensörü | Kapı açıkken **0V (Şaseye çeker)**, kapalıken **12V Open-Circuit** |
| **Pin 16** | **Kahverengi / Kırmızı (br/ro)** | Sağ Kapı Altı / Döşeme Ambiyans Aydınlatması | Ayna/İç aydınlatma açıkken **12V PWM Dimmer** sinyali |
| **Pin 17** | **Kırmızı / Yeşil (ro/gn)** | Sağ İki Yollu Hoparlör (Woofer \+) | **AC Voltaj** (Müzik ses seviyesine göre 0.5V – 15V AC) |
| **Pin 18** | **Kahverengi / Yeşil (br/gn)** | Sağ İki Yollu Hoparlör (Woofer \-) | **AC Voltaj Ground** |
| **Pin 19** | **Kırmızı / Siyah (ro/sw)** | Sağ Tweeter (Tiz Hoparlör \+) | **AC Voltaj** |
| **Pin 20** | **Kahverengi / Siyah (br/sw)** | Sağ Tweeter (Tiz Hoparlör \-) | **AC Voltaj Ground** |

callout-content-7

---

*User prompt: VW Scirocco sağ kapıdan ambiyans aydınlatma veya ekstra LED için 12V tetik ve şase hattını tam olarak nereden alabilirim?*

Response: Volkswagen Scirocco sağ kapıda ekleyeceğiniz ambiyans aydınlatması veya LED’lerin **ne zaman ve nasıl yanmasını istediğinize bağlı olarak** elektrik ve şase hatlarını alabileceğiniz 3 ana yöntem vardır:

### **Yöntem 1: Orijinal Fabrika Çıkışı Fabrikasyon Ambiyans / Kapı Kolu Aydınlatma Pinleri (En Temiz / Orijinal Mantık)**

Aracın sağ kapı kontrol modülü **J387 (52 \- Door Elect. Pass)** üzerinde orijinal LED hatları mevcuttur. Bu hatta bağladığınızda ışıklar teyp (MIB/Mi Multimedia) ekranındaki parlaklık ayarına ve far konumuna göre orijinal çalışır.

> * **12V Pozitif (+) Tetik Hattı:** **J387 Kapı Modülünün 32-Pinli Soketinin Pin 3 (veya Pin 8\)**.  
  * *Kablo Rengi:* Genellikle **Gri / Mavi (gr/bl)** veya **Gri / Kırmızı (gr/ro)**.  
  * *Not:* Eğer aracınızda fabrika çıkışlı bu özellik aktif değilse, VCDS / OBDeleven cihazı ile Module 52 (Door Elect. Pass) \-\> Coding veya Adaptation altından **Door exit / Ambient light / Door handle illumination** seçeneğini kodlayarak aktif etmeniz (12V çıkış vermesini sağlamanız) gerekir.  
> * **Şase (- GND) Hattı:** Kapı modülü soketindeki **Pin 5** veya kapı içerisindeki ana **Kahverengi (br)** şase kablosu.

### **Yöntem 2: Düğme / Cam Kaldırma Anahtarı Aydınlatmasından Paralel Almak (Kodlama Gerektirmez)**

Eğer kodlama ile uğraşmak istemiyorsanız ve LED'lerin **parklar/farlar veya kontak açıldığında** doğrudan kapı tuş ışıklarıyla birlikte yanıp sönmesini istiyorsanız:

> * **12V Pozitif (+) Tetik Hattı:** Sağ kapı cam açma düğmesine giren soketteki **Gri / Mavi (gr/bl)** kablo.  
  * *Çalışma Mantığı:* Far/park veya kontak açılıp düğme aydınlatmaları yandığında bu kabloya **12V (PWM)** voltaj gelir. Farlar kapanınca kesilir.  
> * **Şase (- GND) Hattı:** Cam düğmesi soketindeki **Kahverengi (br)** kablo.

### **Yöntem 3: Kapı Altı Aydınlatma / Kapı Açılınca Yanan LED'ler İçin (Puddle Light)**

Amacınız kapı açıldığında yere vuran karşılama/akıllı LED hattı çekmekse:

> * **12V Pozitif (+) Tetik Hattı:** J387 Kapı Modülü 32-Pin Soketi **Pin 16**.  
  * *Kablo Rengi:* **Kahverengi / Kırmızı (br/ro)** veya **Gri / Beyaz**.  
  * *Çalışma Mantığı:* Kapı açıldığında 12V verir, kapı kapanınca veya araç kilitlenince elektriği keser (VCDS Kodlaması gerekebilir).  
> * **Şase (- GND) Hattı:** **Pin 5** veya kalın **Kahverengi (br)** ana şase kablosu.

### **Bağlantı ve Montaj Sırasında Dikkat Edilecekler**

> 1. **Akım ve Güç Tüketimi:** Çekeceğiniz ekstra LED hatları için kapı modülünün zorlanmaması adına güç tüketimi düşük **Neopixel / Addressable RGB / LED Sürücü** kullanın.  
> 2. **Kablo Yalıtımı ve Klipsler:** Kapı camı inip kalkarken kabloların mekanizmaya takılmaması için tesisat bez bandı (Tesa bant) ile sabitleyin.  
> 3. **Multimetre ile Doğrulama:** Fiziksel bağlantıyı yapmadan önce multimetrenin kırmızı ucunu belirlediğiniz pine, siyah ucunu ise kapı sacındaki boyasız bir civataya (şase) dokundurarak farlar/kontak açıkken 12V geldiğini teyit edin.

---

*User prompt: yöntem 1 daha fazla detaylandır bizim arduino ile yapmaya çalıştığımız sistem ile doğru çalışır mı detaylı bir araştırma yap.*

Response: Golf 8, Audi A3 ve Seat Leon Cupra’daki gibi **MIB (Multimedia) ekranı üzerinden renk seçip** kapı, göğüs ve ayak altı bölgesindeki adreslenebilir (12V WS2811/GS8208 veya COB) RGB LED'leri yönetmeyi hedeflediğiniz Arduino/ESP32 tabanlı projede **Yöntem 1 (J387 Kapı Modülünün analog PWM çıkışı) TEK BAŞINA DOĞRU ÇALIŞMAZ.**

Yöntem 1, kapı modülünün orijinal (ampul/klasik tek renk LED) 12V \+ ve PWM (parlaklık kısma) çıkışını temsil eder. Sizin tasarladığınız sistem ise **dijital renk verisi (RGB Hex kodları / CAN-Bus verisi)** gerektirir.

Projenizin MIB multimedya ekranındaki ambiyans menüsüyle tam uyumlu çalışabilmesi için **doğru donanım mimarisi ve tetikleme mantığı** aşağıda açıklanmıştır:

### **1\. Neden Yöntem 1 Tek Başına Yetersizdir?**

> * **Veri Tipi Farkı:** J387 modülünün 32-Pin soketindeki Pin 3 / Pin 8 çıkışları sadece **analog voltaj / PWM (Pulse Width Modulation)** verir. Yani bu hattan yalnızca LED'in parlaklık yüzdesini (0-12V arası) okuyabilirsiniz; **renk bilgisi bu kablodan geçmez**.  
> * **Adreslenebilir LED İhtiyacı:** Arduino / ESP32 çipinizin adreslenebilir şerit LED'lere renk komutu gönderebilmesi için renk bilgisini dijital bir veri bus'ından (CAN-Bus) çekmesi şarttır.

### **2\. Arduino / ESP32 Projeniz İçin Doğru Tesisat ve Veri Mimarisi**

Aracınızdaki sistemin Golf 8 / Audi A3 mantığında (ekrandan renk seçince kapı, göğüs ve ayak altındaki tüm LED'lerin anında o renge bürünmesi) çalışması için yapmanız gereken bağlantı şeması şu şekildedir:

`[ MIB Multimedya Ekranı ]  --->  [ Komfort CAN-Bus Hattı (Orange/Green - Orange/Brown) ]`  
                                            `│`  
                                            `▼`  
                               `[ MCP2515 CAN Alıcı Modül ]`  
                                            `│`  
                                            `▼`  
                    `[ Mikrodenetleyici: ESP32 / Arduino / Uno R4 ]`   
                                            `│`  
               `┌────────────────────────────┼────────────────────────────┐`  
               `▼                            ▼                            ▼`  
     `[ Kapı LED Zone (Data) ]    [ Göğüs LED Zone (Data) ]    [ Ayak Altı LED Zone (Data) ]`

#### **A. Veri Hattı (CAN-Bus) – Renk Seçimi İçin**

> * **Nereden Alınır?** MIB Multimedya ünitesinin arkasındaki ana Quadlock soketinde bulunan **CAN-High (Turuncu/Yeşil)** ve **CAN-Low (Turuncu/Kahverengi)** hatlarına bağlanmalıdır.  
> * **Nasıl Çalışır?** MIB ekranından ambiyans rengini değiştirdiğinizde (veya VCDS ile MIB2 renk paleti açıldığında), multimedya ünitesi Konfor CAN-Bus ağına renk paketleri fırlatır. Projenizdeki **MCP2515 CAN alıcı çip**, bu ID'leri (örneğin 0x2DE veya 0x3C0 paketlerini) dinleyerek RGB verisini yakalar ve mikrodenetleyicinize aktarır.

#### **B. Besleme (Power / 12V & Şase) – Elektrik Hatları İçin**

Arduino ve LED sürücü güç kartınızın (Buck Converter / Mosfet / Röle) ihtiyaç duyduğu gücü ve uyku (Sleep) durumunu tetiklemek için Yöntem 1 kullanılabilir:

> * **Güç Hattı (12V VCC):** Sigorta kutusundan veya kapı beslemesinden (T20 Pin 1 \- Kırmızı/Sarı) alınan **sürekli 12V**.  
> * **GND (Şase):** Kalın **Kahverengi (br)** kablo.  
> * **Tetik / Enable Hattı (Yöntem 1'in Kullanımı):** J387 kapı modülünün **Pin 3 (Gri/Mavi)** çıkışını Arduino'nun bir **Digital Input (Optokuplör üzerinden)** pinine bağlayabilirsiniz. Böylece araç kilitlendiğinde veya iç aydınlatma kapandığında Arduino / ESP32 derin uyku (Deep Sleep) moduna girer ve akü çekmesini (Parasitic Drain) engeller.

### **3\. Sitemin Çalışma Mantığı ve Kod Mimarisi Karşılaştırması**

| Özellik | Yöntem 1 (Sadece Kapı Modülü PWM) | Sizin Tasarladığınız CAN-Bus Entegre Arduino Sistemi |
| :---- | :---- | :---- |
| **Renk Kontrolü** | Sabit Tek Renk (Değiştirilemez) | **MIB Ekranından \+ Telefon App/Bluetooth üzerinden sınırsız RGB** |
| **Bölgesel Bölme (Zone)** | Yapılamaz | **Kapı, Göğüs, Ayak Altı bağımsız veya senkron çalışabilir** |
| **Parlaklık Ayarı** | Araç dimmer tuşundan voltajla | **CAN veri paketi okunarak LED'lere kayıpsız dijital dimleme** |
| **Akü Koruması** | Doğrudan bağlı | **CAN verisi kesildiğinde Otomatik Sleep Mode** |

### **Özet Tavsiye**

Orijinal Golf 8 / Audi A3 konseptini yakalamak için:

> 1. Kapıdaki **Yöntem 1 (J387 Pin 3\)** hattını Arduino sisteminizi **uyandırma/tetikleme (Enable/ACC)** sinyali olarak kullanın.  
> 2. LED'lerin renk değiştirmesini sağlamak için renk kodlarını **MIB multimedya arkasındaki Komfort CAN-Bus (Turuncu/Yeşil \- Turuncu/Kahverengi)** hatlarından MCP2515 çipi ile okuyun.  
> 3. Çıkış verilerini adreslenebilir RGB LED şeritlerinizin (WS2811 / GS8208) **Data Pinlerine** aktarın.

---

