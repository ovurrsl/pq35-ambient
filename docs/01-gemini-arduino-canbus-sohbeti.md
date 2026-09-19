# **Arduino ile Scirocco CAN-Bus Okuma**

[https://gemini.google.com/app/523866be2cb00a89](https://gemini.google.com/app/523866be2cb00a89)

*User prompt: arduino ile vw 2016 sicerocco allstar canbus okuma ve yazma*

Response: Arduino ile 2016 model Volkswagen Scirocco Allstar aracınızda CAN-Bus okuma ve yazma (veri gönderme) işlemleri yapabilmeniz için öncelikle aracın **MQB platformu** altyapısını ve kullandığı hat hızlarını bilmeniz gerekir. 2016 model bir Scirocco'da genellikle iki ana CAN hattı bulunur: **Convenience (Konfor) CAN** (Genellikle 100 kbps veya 500 kbps) ve **Extended/Powertrain (Motor/Şasi) CAN** (500 kbps).

Aracınızdan veri okumak ve sisteme veri yazmak için izlemeniz gereken donanımsal ve yazılımsal adımları aşağıda bulabilirsiniz.

### **1\. Gerekli Donanımlar**

> * **Arduino:** Arduino Uno, Nano veya ESP32.  
> * **CAN-Bus Modülü:** MCP2515 çipi ve TJA1050 (veya SN65HVD230) alıcı-verici (transceiver) içeren bir CAN Shield.  
> * **Bağlantı Kabloları:** OBD-II \- DB9 kablosu veya aracın CAN hatlarına doğrudan (güvenli bir şekilde) bağlanmak için uçlu kablolar.

### **2\. Donanım Bağlantıları (MCP2515 \- Arduino Uno Örneği)**

MCP2515 modülünü Arduino'nuza SPI protokolü üzerinden bağlamanız gerekir:

> * **VCC** → 5V  
> * **GND** → GND  
> * **CS (Chip Select)** → D10  
> * **SI (MOSI)** → D11  
> * **SO (MISO)** → D12  
> * **SCK** → D13  
> * **INT** → D2 (Kesme pini)

Araç tarafında ise OBD-II portu üzerinden veya direksiyon altındaki Can Gateway / BCM modülünden **CAN High (CAN\_H)** ve **CAN Low (CAN\_L)** hatlarını bulup modülün terminal girişlerine bağlamalısınız.

> * *OBD-II Pin 6:* CAN High  
> * *OBD-II Pin 14:* CAN Low

### **3\. Örnek Kod: CAN-Bus Dinleme (Reading)**

Aşağıdaki temel kod, 2016 Scirocco'nun CAN hattındaki mesajları dinlemenizi (sniffing) ve Seri Monitör üzerinden izlemenizi sağlar. Genellikle VW araçlarda motor/konfor verileri **500kbps** hızında çalışır.

\#include \<mcp\_can.h\>  
\#include \<SPI.h\>

// CS pini tanımlaması  
const int SPI\_CS\_PIN \= 10;  
MCP\_CAN CAN(SPI\_CS\_PIN);

void setup() {  
  Serial.begin(115200);  
    
  // MCP2515 500kbps hızında başlatılıyor (VW grubu için standart hız)  
  if (CAN.begin(MCP\_ANY, CAN\_500KBPS, MCP\_8MHZ) \== CAN\_OK) {  
    Serial.println("CAN Bus Basariyla Baslatildi\!");  
  } else {  
    Serial.println("CAN Bus Baslatma Basarisiz\!");  
    while (1);  
  }  
    
  CAN.setMode(MCP\_NORMAL); // Normal çalışma moduna al  
}

void loop() {  
  unsigned long rxId;  
  unsigned char len \= 0;  
  unsigned char rxBuf\[8\];

  // Hat üzerinde yeni bir mesaj olup olmadığını kontrol et  
  if (CAN.checkReceive() \== CAN\_MSGAVAIL) {  
    CAN.readMsgBuf(\&rxId, \&len, rxBuf); // Veriyi oku

    Serial.print("ID: 0x");  
    Serial.print(rxId, HEX);  
    Serial.print(" Data: ");  
      
    for (int i \= 0; i \< len; i++) {  
      if (rxBuf\[i\] \< 0x10) Serial.print("0");  
      Serial.print(rxBuf\[i\], HEX);  
      Serial.print(" ");  
    }  
    Serial.println();  
  }  
}

> * **Başarı Kontrolü:** Kodu yükleyip Seri Monitörü 115200 baud hızına ayarladığınızda, ekranda sürekli akan hex formatında veriler (ID ve 8 baytlık veri paketleri) görüyorsanız okuma işlemi başarılı demektir.

### **4\. Veri Yazma ve Komut Gönderme (Writing)**

Araç hatlarına veri yazmak (örneğin dış ünite simülasyonu, gösterge paneline komut göndermek vb.) dikkat gerektirir. Yanlış ID'lere yanlış veriler göndermek arıza lambalarının yanmasına veya modüllerin hata vermesine neden olabilir.

Aşağıdaki fonksiyon, belirli bir CAN ID'sine 8 baytlık veri paketi yazmanızı (göndermenizi) sağlar:

void sendCanMessage() {  
  byte data\[8\] \= {0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07};  
    
  // 0x351 ID'li mesaja 8 baytlık veriyi gönder  
  byte sndStat \= CAN.sendMsgBuf(0x351, 0, 8, data);  
    
  if (sndStat \== CAN\_OK) {  
    Serial.println("Mesaj basariyla gonderildi\!");  
  } else {  
    Serial.println("Mesaj gonderme basarisiz.");  
  }  
}

> * **Başarı Kontrolü:** sendMsgBuf fonksiyonunun CAN\_OK döndürmesi, verinin fiziksel olarak CAN hattına başarıyla bırakıldığını gösterir.

callout-content-23

### **Sonraki Adımlar İçin**

Scirocco Allstar aracınızda spesifik olarak hangi veriyi okumak veya yazmak istiyorsunuz? (Örneğin: Direksiyon tuşları, far kontrolü, multimedya/kadran entegrasyonu veya anlık hız/devir okuma?)

**Sources**

> 1. [Car to Arduino Communication: CAN Bus Sniffing and Broadcasting](https://www.instructables.com/CAN-Bus-Sniffing-and-Broadcasting-with-Arduino/)  
> 2. [Getting started with CAN bus \- a practical guide with Arduino](https://dev.to/onlybytes/getting-started-with-can-bus-a-practical-guide-with-arduino-2h6a)  
> 3. [CAN Bus Sensor Module: Reading Vehicle Data with Arduino \- Zbotic](https://zbotic.in/can-bus-sensor-module-reading-vehicle-data-with-arduino/)  
> 4. [Digital Speedometer to Car's Instrument Cluster via CAN Bus](https://projecthub.arduino.cc/databus100/digital-speedometer-to-cars-instrument-cluster-via-can-bus-9ee5ca)

---

*User prompt: CAN-BUS Shield v2 ve MCP2515  modül farkı nedir?*

Response: **CAN-BUS Shield v2** ile standart **MCP2515 modüleri** arasındaki temel fark, çiplerin kendisinden ziyade **üzerlerinde barındırdıkları devre elemanları, kullanım kolaylığı ve endüstriyel dayanıklılıktır.** Her iki kart da temelde aynı SPI tabanlı kontrolcüyü (MCP2515) kullanır.

Aralarındaki farklar:

> * **Entegre Transceiver (Alıcı-Verici) Kalitesi:** Ucuz MCP2515 modüllerinde genellikle TJA1050 çipi bulunur; bu çip 5V ile çalışır ve yüksek hızlarda sorunsuz çalışsa da modern araçlardaki bazı hassas hatlar için yeterli korumaya sahip olmayabilir. CAN-BUS Shield v2 kartlarında ise genellikle MCP2551 veya TJA1042/TJA1051 gibi daha güncel ve endüstriyel standartlara uygun transceiver'lar kullanılır.  
> * **Fiziksel Bağlantı ve Form Faktörü:** MCP2515 modülü çıplak bir devre kartıdır ve Arduino'ya jumper kablolarıyla (SPI pinleri ayrı ayrı bağlanarak) takılır. CAN-BUS Shield v2 ise doğrudan Arduino Uno/Mega gibi kartların üzerine sırt sırta oturan (stackable) bir kalkan (shield) biçimindedir.  
> * **OBD-II ve Soket Desteği:** Shield v2 versiyonlarında genellikle doğrudan OBD-II kablosu takabileceğiniz bir DB9 konnektörü veya standart klemens çıkışları hazır olarak bulunur. Standart MCP2515 modüllerinde ise kabloları lehimlemeniz veya pinlere doğrudan soketle bağlanmanız gerekir.  
> * **Gerilim Seviyesi Uyumluluğu:** Bazı ucuz MCP2515 modülleri doğrudan 5V mantık seviyesiyle çalışır ancak 3.3V mikrodenetleyicilerle (ESP32 gibi) kullanımda mantık seviyesi dönüştürücü (logic level converter) gerektirir. Shield kartlarında ise genellikle dahili voltaj düzenleyiciler ve seviye kaydırıcılar bulunur.  
> * **Adım Başarı Kontrolü:** Modülün veya Shield'ın doğru bağlandığını ve haberleştiğini doğrulamak için boş bir CAN dinleme kodu yükleyip Seri Monitör'de veri akışını gözlemleyebilirsiniz. Ekranda paketler akıyorsa bağlantı vedonanım seviyesi başarılıdır.

---

*User prompt: CAN-BUS Shield v2 ile araçtan veri okuma nasıl yapılır?*

Response: CAN-BUS Shield v2 kullanarak aracınızdan veri okumak, standart MCP2515 modüllerine göre fiziksel bağlantının daha derli toplu olması (doğrudan Arduino üstüne oturması) sayesinde oldukça pratiktir.

Shield ile araçtan veri okuma işlemini gerçekleştirmek için izlemeniz gereken adım adım rehber:

**1Donanımı Monte Edin**

Fiziksel Kurulum

CAN-BUS Shield v2 kartını Arduino Uno veya uyumlu bir karta pini pinine üst üste (stackable şekilde) oturtun. Shield üzerinde genellikle SPI pinleri (D10-D13) ve Interrupt pini (D2) otomatik olarak bağlanır, ancak bazı kartlarda jumper ile seçim yapmanız gerekebilir (kılavuzunu kontrol edin).

**2Araç Bağlantısını Yapın**

Kablolama

Shield üzerindeki DB9 konnektörüne uygun bir **OBD-II \- DB9 kablosu** bağlayın ve kablonun diğer ucunu aracınızın direksiyon altındaki OBD-II portuna takın. Alternatif olarak, klemens çıkışlarından **CAN\_H** ve **CAN\_L** uçlarını aracın hatlarına güvenli bir şekilde bağlayabilirsiniz.

**3Gerekli Kütüphaneyi Kurun**

Yazılım Hazırlığı

Arduino IDE'yi açın. **Kütüphane Yöneticisi (Library Manager)** bölümünden mcp\_can kütüphanesini aratıp (örneğin Seeed Studio'nun CAN-BUS\_Shield kütüphanesi) projenize yükleyin.

**4Dinleme Kodunu Yükleyin**

Veri Okuma

Aşağıdaki örnek kodu Arduino'nuza yükleyin. Bu kod, araç hatlarındaki CAN paketlerini dinleyecektir.

\#include \<mcp\_can.h\>  
\#include \<SPI.h\>

// Seeed Studio Shield genellikle CS pini olarak 9 veya 10 kullanır (üzerindeki jumper'a bakın)  
const int SPI\_CS\_PIN \= 9;   
MCP\_CAN CAN(SPI\_CS\_PIN);

void setup() {  
  Serial.begin(115200);  
    
  // VW grubu standart hızı olan 500kbps ile başlatma  
  if (CAN.begin(MCP\_ANY, CAN\_500KBPS, MCP\_8MHZ) \== CAN\_OK) {  
    Serial.println("CAN-BUS Shield V2 Basariyla Baslatildi\!");  
  } else {  
    Serial.println("Baslatma basarisiz, baglantilari kontrol edin.");  
    while (1);  
  }  
    
  CAN.setMode(MCP\_NORMAL);  
}

void loop() {  
  unsigned long rxId;  
  unsigned char len \= 0;  
  unsigned char rxBuf\[8\];

  // Hattan veri gelip gelmediğini kontrol et  
  if (CAN.checkReceive() \== CAN\_MSGAVAIL) {  
    CAN.readMsgBuf(\&rxId, \&len, rxBuf);

    Serial.print("ID: 0x");  
    Serial.print(rxId, HEX);  
    Serial.print(" Veri: ");  
      
    for (int i \= 0; i \< len; i++) {  
      if (rxBuf\[i\] \< 0x10) Serial.print("0");  
      Serial.print(rxBuf\[i\], HEX);  
      Serial.print(" ");  
    }  
    Serial.println();  
  }  
}

> * **Adım Başarı Kontrolü:** Kodu yükledikten sonra Arduino Seri Monitör'ü 115200 baud hızına getirdiğinizde ekranda sürekli hex formatında ID ve veri paketleri akmaya başlıyorsa, araçtan veri okuma işlemi başarılı bir şekilde gerçekleşiyor demektir.

---

*User prompt: ben neler yapacağımı yazayım sen ürünleri seç o zaman*

Response: Tamamdır, yapmak istediklerinizi ve projede kullanmak istediğiniz özellikleri belirtin; bunlara uygun donanım ve malzeme listesini birlikte oluşturalım.

---

*User prompt: canbus üzerinden veri okuyup yazmak istiyorum bu 1\. talep birden çok adreslenebilir led yönetmek 2\. talep apple home kit ile çalışmak köprü veya sunucuya ihtiyaç kalmadan bağlanması 3\. talep gps gsm özelliği telefon görüşmesi ve sms atma özelliği 4\. talep ayrıca bunların tamamı telefon uygulaması ile kullanılabilir olmalı. 5\. talep*

Response: Belirttiğiniz 5 talebi (CAN-BUS, adreslenebilir LED, Apple HomeKit \- köprüsiz, GPS/GSM/Arama/SMS ve telefon uygulaması entegrasyonu) tek bir sistemde toplamak için standart bir Arduino Uno yeterli olmayacaktır. Hem Wi-Fi/Bluetooth gücü hem de çoklu donanım birimlerini (UART, SPI) yönetebilmek adına **ESP32** tabanlı güçlü bir mimari seçmemiz gerekir.

Taleplerinizi karşılayacak en ideal ürün ve bileşen listesini aşağıda bulabilirsiniz:

**1ESP32-WROOM veya ESP32-S3 Geliştirme Kartı**

Ana Beyin / Mikrodenetleyici

* **Seçim Nedeni:** Wi-Fi ve Bluetooth özellikleri sayesinde ekstra bir köprüye ihtiyaç duymadan **Apple HomeKit** ile doğrudan (ESP-HomeKit kütüphaneleriyle) haberleşebilir. Ayrıca yeterli GPIO pinlerine ve işlem gücüne sahiptir.  
* **Başarı Kontrolü:** Kart bilgisayara bağlandığında Wi-Fi ağına başarıyla bağlanıp bir web arayüzü veya HomeKit kodu üretebiliyorsa tamamdır.

**2MCP2515 CAN-BUS Modülü (TJA1050 Transceiver ile)**

1\. Talep: CAN-BUS İletişimi

* **Seçim Nedeni:** 2016 Scirocco'nuzun CAN hattına bağlanmak için SPI protokolü üzerinden ESP32 ile mükemmel uyumlu çalışan, endüstri standardı modül.  
* **Başarı Kontrolü:** Seri monitörde araçtan gelen CAN ID'leri (örneğin motor devri veya kapı durumu) hatasız okunabiliyorsa başarılıdır.

**3WS2812B (NeoPixel) LED Şerit \+ 5V Güç Kaynağı**

2\. Talep: Adreslenebilir LED Yönetimi

* **Seçim Nedeni:** ESP32'nin veri piniyle doğrudan kontrol edilebilen, her bir LED'in rengi ve parlaklığı ayrı ayrı ayarlanabilen popüler adreslenebilir LED türü. (Not: Yüksek akım çekeceği için harici 5V adaptör şarttır).  
* **Başarı Kontrolü:** LED'lere istenen renk animasyonları (örneğin akma efekti) gecikmesiz yansıtılabiliyorsa başarılıdır.

**4Yazılımsal Çözüm (ESP-HomeKit Kütüphanesi)**

3\. Talep: HomeKit Entegrasyonu

* **Seçim Nedeni:** Donanimsal ek bir cihaza (Raspberry Pi, Apple TV köprüsü vb.) gerek kalmadan, doğrudan ESP32'nin kendi Wi-Fi yongası üzerinde Apple HomeKit protokolü çalıştırılır (Apple Home uygulamasından doğrudan "Aksesuar Ekle" diyerek taranabilir).  
* **Başarı Kontrolü:** iPhone'daki Apple Home uygulamasından cihaz taranıp eşleşme kodu girildiğinde buton veya LED durumu ekrandan kontrol edilebiliyorsa başarılıdır.

**5SIM7600G-H veya SIM800L 4G/GSM/GPS Modülü**

4\. Talep: GPS, GSM, Arama ve SMS

* **Seçim Nedeni:** Araçtan konum takibi (GPS) alabilmek, SMS gönderebilmek ve hücresel veri/sesli arama yapabilmek için seri port (UART) üzerinden ESP32'ye bağlanabilen endüstriyel bir modül.  
* **Başarı Kontrolü:** Modül içerisindeki SIM kart ile terminal üzerinden SMS atılabiliyor ve GPS konumu alınabiliyorsa başarılıdır.

**6Blynk IoT veya Özel Flutter/React Native Mobil Uygulama**

5\. Talep: Telefon Uygulaması

* **Seçim Nedeni:** Bulut tabanlı hazır bir IoT platformu olan **Blynk** kullanılarak hem iOS hem Android üzerinden kontrol paneli (butonlar, göstergeler, harita) çok hızlı şekilde tasarlanabilir. Alternatif olarak özel bir uygulama yazılabilir.  
* **Başarı Kontrolü:** Telefonda açılan uygulama üzerinden ESP32'ye komut gönderilip anlık veri geri alınabiliyorsa başarılıdır.

callout-content-3

---

*User prompt: arduino nano esp32 kullanmayı düşünüyorum*

Response: **Arduino Nano ESP32**, projeleriniz için mükemmel bir tercihtir\! Klasik Arduino Nano'nun küçük ve pratik form faktörünü, ESP32-S3 çipinin gücüyle birleştirir. Bu sayede hem istediğiniz gibi yer tasarrufu sağlarsınız hem de Wi-Fi, Bluetooth ve güçlü işlem kapasitesine sahip olursunuz.

Ancak daha önce bahsettiğimiz 5 ana talebi (özellikle **CAN-BUS, adreslenebilir LED, GPS/GSM modülü ve Apple HomeKit**) bu kartla hayata geçirirken dikkat etmeniz gereken bazı kritik noktalar ve avantajlar vardır:

### **Arduino Nano ESP32'nin Bu Projedeki Avantajları ve Dezavantajları**

> * **Avantajı (Boyut ve Güç):** Araç içinde (özellikle Scirocco'da) kablo kalabalığını azaltmak ve kompakt bir kutu içine sığdırmak için Nano formu harikadır. ESP32-S3 işlemcisi, HomeKit ve bulut entegrasyonunu (Blynk vb.) zorlanmadan kaldırır.  
> * **Dezavantajı / Dikkat Edilmesi Gereken Nokta (Pin Gerilimi):**  
  * Klasik Arduino Nano 5V mantık seviyesiyle çalışır, ancak Arduino Nano ESP32 **3.3V mantık seviyesine** sahiptir (çıkış pinleri 3.3V verir).  
  * MCP2515 CAN-BUS modülünün bazı versiyonları 5V çalışır. Bu nedenle modül seçiminde veya bağlantısında **Logic Level Converter (Mantık Seviyesi Dönüştürücü)** kullanmanız gerekebilir ya da doğrudan 3.3V uyumlu bir CAN transceiver (örneğin TJA1051 veya SN65HVD230) tercih etmelisiniz.

### **Bağlantı ve Donanım Uyarlaması**

Nano ESP32 seçtiğinizde bileşenleri şu şekilde entegre edebilirsiniz:

> 1. **CAN-BUS (1. Talep):** SPI pinleri (MOSI, MISO, SCK) üzerinden Nano ESP32'ye bağlanır. Modülün 3.3V uyumlu olduğundan emin olunmalı.  
> 2. **Adreslenebilir LED (2. Talep):** WS2812B verisi 3.3V mantık seviyesiyle de çalışabilir, ancak uzun kablolarda sinyal kaybı yaşamamak için araya bir mantık kaydırıcı koymak güvenli olur. Beslemesi mutlaka harici 5V'tan alınmalıdır.  
> 3. **Apple HomeKit (3.3. Talep):** Nano ESP32'nin yerleşik Wi-Fi çipi sayesinde Arduino ortamında Arduino HomeKit ESP8266/ESP32 kütüphanesi kullanılarak köprüsüz doğrudan Home uygulamasına eklenebilir.  
> 4. **GPS / GSM / Arama (4. Talep):** SIM7600 veya benzeri bir modül Nano ESP32'nin UART (Hardware Serial) pinlerine bağlanarak hem konum verisi hem de SMS/Arama özellikleri yönetilebilir.  
> 5. **Telefon Uygulaması (5. Talep):** Blynk IoT veya ESP32'nin kendi web sunucusu üzerinden cep telefonunuzdan tüm sistemi kontrol edebilirsiniz.

Nano ESP32 ile yola devam etmek harika bir karar. Bu kart üzerinden pin planlamasına veya kod yapısına detaylıca geçebiliriz.

---

*User prompt: https://www.google.com/imgres?q=MCP2515\&imgurl=https%3A%2F%2Fwww.robotsepeti.com%2FData%2FEditorFiles%2Furun%2520resim%2Fmcp2515-can-kontrol-kart%25C4%25B1-pin-dizilimi.webp\&imgrefurl=https%3A%2F%2Fwww.robotsepeti.com%2Fmcp2515-can-bus-kontrol-transceiver-modulu%3Fsrsltid%3DAU7gw4WH9xI13op0Nltcwzj-crggKeeXebZLos9YXSPWINTAP1Wagrns\&docid=h-J2tvusMBc77M\&tbnid=VN8fqlQfjaiTwM\&vet=12ahUKEwi2h8eTl\_OWAxWhS\_EDHWfbAuMQnPAOegUIrAIQAA..i\&w=480\&h=283\&hcb=2\&ved=2ahUKEwi2h8eTl\_OWAxWhS\_EDHWfbAuMQnPAOegUIrAIQAA bu olur mu*

Response: Gönderdiğiniz görseldeki **MCP2515 CAN-Bus Modülü** (üzerinde TJA1050 transceiver ve 8MHz kristal barındıran standart mavi kart) projenizde **fiziksel olarak kullanılabilir**, ancak **Arduino Nano ESP32 ile birlikte kullanırken dikkat etmeniz gereken kritik bir voltaj uyumsuzluğu vardır.**

Bu modülü seçerken ve bağlarken bilmeniz gerekenler şunlardır:

### **1\. Voltaj Uyumsuzluğu (Kritik Nokta)**

> * **Arduino Nano ESP32:** 3.3V mantık seviyesiyle (logic level) çalışır. Yani SPI pinlerinin çıkış ve giriş sinyalleri 3.3V'tur.  
> * **Görseldeki Standart MCP2515 Modülü:** Üzerindeki TJA1050 çipi **5V** ile çalışır ve sinyal seviyeleri de genellikle 5V tabanlıdır.  
> * *Sonuç:* Modülü doğrudan Nano ESP32'ye bağlarsanız, Nano ESP32'nin SPI pinleri (özellikle MISO pini) 5V'luk gerilimden zarar görebilir veya sinyalleri düzgün okuyamayabilir.

### **2\. Bu Modülü Nano ESP32 ile Nasıl Kullanabilirsiniz?**

Eğer elinizde bu standart mavi modülden varsa veya bunu kullanmak istiyorsanız, araya bir **Logic Level Converter (Mantık Seviyesi Dönüştürücü \- 3.3V to 5V)** koymanız gerekir.

Alternatif olarak, voltaj dönüşümleriyle uğraşmamak için doğrudan **3.3V ile uyumlu** çalışan bir CAN modülü (örneğin **SN65HVD230** çipini kullanan modüller) tercih edebilirsiniz. SN65HVD230 doğrudan 3.3V ile beslenir ve ESP32 aileleriyle ek bir dönüştürücüye ihtiyaç duymadan tam uyumlu çalışır.

> * **Adım Başarı Kontrolü:** Modülü bağladıktan sonra CAN kütüphanesini başlatıp CAN.begin() fonksiyonundan CAN\_OK dönüşünü alabiliyorsanız, donanım ve voltaj seviyeleri doğru oturmuş demektir.

---

*User prompt: 5v logicte çalışan bir kart kullanalım. ama home kiti desteklemeli*

Response: 5V mantık seviyesiyle çalışan ve Arduino nano ESP32'nin 3.3V voltaj uyumsuzluklarıyla uğraşmak istemiyorsanız, doğrudan **5V ile çalışan** ancak **Wi-Fi ve Apple HomeKit desteğini de barındıran** harika bir alternatifimiz var: **ATmegaye veya ESP8266/ESP32 tabanlı özel geliştirme kartları yerine, klasik 5V mimarisine sahip bir Arduino'yu Wi-Fi modülü ile desteklemek** veya **doğrudan 5V lojik uyumlu alternatifleri değerlendirmek**.

Ancak burada kritik bir mühendislik gerçeği vardır: **Apple HomeKit protokolü ve Wi-Fi yığınları yüksek işlem gücü ve 3.3V tabanlı güçlü mikrodenetleyiciler (ESP8266 veya ESP32) gerektirir.** Piyasada doğrudan 5V lojik seviyesinde (pin çıkışları 5V olan) çalışan yerleşik bir HomeKit uyumlu orijinal kart bulunmaz, çünkü ana Wi-Fi çipleri (ESP çipleri dahil) doğası gereği 3.3V ile çalışır.

Bunu en güvenli, en sorunsuz ve tam istediğiniz gibi 5V lojik uyumlu şekilde çözmenin en iyi yolu **"İki Katmanlı (Hybrid) Sistem"** veya **"Mantık Seviyesi Dönüştürücü (Logic Level Converter)"** kullanmaktır.

### **Kesin Çözüm: İki Alternatif Yol**

#### **Yol 1: Arduino Mega 2560 veya Uno \+ ESP8266 (AT Komutları veya Seri Köprü)**

> * **Mantık:** Ana kontrolcü olarak tamamen 5V çalışan **Arduino Mega** veya **Uno** kullanırsınız (böylece 5V CAN-BUS modülünüz ve diğer 5V çevre birimleriniz hiçbir dönüştürücüye gerek kalmadan doğrudan çalışır).  
> * **HomeKit Bağlantısı:** Wi-Fi ve HomeKit işini üstlenmesi için sisteme ucuz bir **ESP-01S (ESP8266)** modülü eklersiniz. ESP8266 HomeKit kodunu çalıştırır, aldığı komutları Seri Port (UART) üzerinden 5V Arduino'ya iletir.

#### **Yol 2: ESP32 \+ 8 Kanallı Logic Level Converter (Önerilen ve En Kolayı)**

Önceki mesajda bahsettiğimiz **Arduino Nano ESP32** veya standart bir ESP32 kartını kullanmaya devam edip, araya **Bidirectional Logic Level Converter (İki Yönlü Mantık Seviyesi Dönüştürücü)** koymaktır.

> * **Neden Mantıklı?** Bu küçük kart (maliyeti çok düşüktür), ESP32'nin 3.3V sinyallerini otomatik olarak 5V'a (veya tersini) çevirir. Böylece attığınız görseldeki standart 5V MCP2515 modülünü, 5V sensörleri ve ledleri hiçbir riske atmadan doğrudan bağlayabilirsiniz. Aynı zamanda ESP32'nin gücü sayesinde **Apple HomeKit doğrudan, köprüsüz ve kusursuz bir şekilde çalışır.**

Hangi yöntemi izleyelim? Araya mantık seviyesi dönüştürücü koyarak ESP32 (HomeKit gücü) \+ 5V MCP2515 kombinasyonuyla mı devam edelim, yoksa tamamen 5V ana kart üzerinden mi ilerleyelim?

---

*User prompt:  MCP2515 Modülü giga r1 ve giga lcd shild*

Response: Projenin kalbi için **Arduino Giga R1** ve **Giga Display Shield** kombinasyonunu seçmeniz, işin donanım ve görselleştirme gücünü en üst seviyeye çıkarır\! Giga R1, üzerinde yerleşik Wi-Fi/Bluetooth barındırdığı ve çift çekirdekli güçlü işlemcisiyle Apple HomeKit, CAN-BUS ve ekran yönetimini aynı anda zorlanmadan kaldırabilecek kapasitededir.

Ancak burada dikkat etmeniz gereken en kritik teknik detay **Voltaj Uyumudur**:

> * **Arduino Giga R1 tamamen 3.3V mantık seviyesine (logic level) sahiptir.**  
> * Daha önce bahsettiğimiz standart 5V'luk MCP2515 modüllerini veya 5V çevre birimlerini doğrudan Giga R1'e bağlarsanız işlemcinin pinlerine zarar verebilirsiniz.

Bu sistemi en güvenli ve sorunsuz şekilde kurabilmeniz için dikkat etmeniz gerekenler:

### **1\. CAN-BUS Bağlantısı İçin Doğru Donanım Seçimi**

Giga R1'in 3.3V yapısıyla tam uyumlu çalışması için, araya mantık seviyesi dönüştürücü koymak yerine doğrudan **3.3V destekli bir CAN Transceiver** (örneğin **SN65HVD230** çipli modül) kullanmalısınız. Bu modüller doğrudan 3.3V ile beslenir ve Giga R1'in SPI pinlerine ek bir devreye gerek kalmadan güvenle bağlanır.

### **2\. Giga Display Shield Avantajı**

Giga Display Shield ile birlikte gelen dokunmatik ekran, telefon uygulamasının yanı sıra aracın bazı verilerini (örneğin anlık hız, motor devri, arıza durumları veya LED animasyon modları) doğrudan araç kokpitinde yönetebileceğiniz muazzam bir arayüz oluşturmanıza imkan tanır. Ayrıca bu ekran üzerinde LVGL veya Arduino grafik kütüphanelerini kullanarak şık bir arayüz tasarlayabilirsiniz.

### **3\. Diğer Taleplerin Giga R1 ile Entegrasyonu**

> * **Apple HomeKit (3. Talep):** Giga R1'in dahili Wi-Fi modülü sayesinde, ek bir köprüye ihtiyaç duymadan doğrudan HomeKit entegrasyonu yazılabilir.  
> * **GPS / GSM (4. Talep):** Giga R1 üzerinde tam **4 adet Donanımsal Seri Port (UART)** bulunur. Bu sayede SIM7600 gibi modülleri ana seri portları çakıştırmadan rahatça bağlayabilirsiniz.  
> * **Adreslenebilir LED (2. Talep):** WS2812B LED'ler 5V güçle çalışır ancak veri sinyali olarak 3.3V'u genellikle kabul ederler. Uzun kablo mesafelerinde sinyal çökmesini önlemek için araya basit bir lojik tampon (level shifter) koymak yeterlidir.

Giga R1 ve Giga Display Shield ile yola devam ederken, yazılım tarafına (CAN kütüphaneleri veya ekran arayüzüne) hangi kısımdan başlamak istersiniz?

**Sources**

> 1. [Arduino GIGA R1 User Manual](https://docs.arduino.cc/tutorials/giga-r1-wifi/cheat-sheet/)  
> 2. [Arduino ABX00063 Design Board GIGA R1 Wi-Fi User Manual](https://device.report/manual/9821250)

---

*User prompt: UNO R4 WiFi peki*

Response: **Arduino UNO R4 WiFi**, proje fikirleriniz için gerçekten **nokta atışı ve en akıllıca tercihlerden biri** olur\!

Önceki kartlarda yaşadığımız voltaj ikilemlerini ve karmaşayı ortadan kaldıran UNO R4 WiFi, tam bu projeye göre tasarlanmış gibidir. Neden harika bir seçim olduğunu ve taleplerinizi nasıl karşılayacağını aşağıda inceleyelim:

### **UNO R4 WiFi'nin Bu Projedeki Avantajları**

> 1. **5V Çalışma Gerilimi (Donanım Uyumu):**  
   * UNO R4 WiFi, klasik Arduino'lar gibi **5V mantık seviyesine (logic level)** sahiptir. Bu sayede görselini paylaştığınız standart 5V'luk **MCP2515 CAN-BUS modülünü** (TJA1050 çipli olanı) ek hiçbir dönüştürücüye (Logic Level Converter) gerek kalmadan **direkt olarak** karta bağlayabilirsiniz.  
> 2. **Dahili ESP32-S3 (Wi-Fi ve Apple HomeKit):**  
   * Kartın üzerinde ana işlemcinin yanı sıra Wi-Fi ve Bluetooth özelliklerini sağlayan bir ESP32 işlemcisi bulunur. Bu sayede ek bir köprüye (Apple TV, Raspberry Pi vb.) ihtiyaç duymadan **doğrudan Apple HomeKit** ekosistemine dahil olabilir.  
> 3. **LED Matris Ekran (Bonus):**  
   * Kartın üzerinde hazır gelen 12x8 kırmızı LED matris vardır. Adreslenebilir LED projenize geçmeden önce test aşamasında anlık durumları (örneğin CAN hat bağlantısı durumu veya hata kodlarını) bu matris üzerinde görselleştirebilirsiniz.  
> 4. **Zengin Donanım Desteği:**  
   * GPS/GSM modüllerini bağlamak için yeterli UART (Seri Port) çıkışlarına sahiptir ve adreslenebilir WS2812B LED'ler için güç/veri çıkışlarını rahatlıkla yönetebilir.

### **UNO R4 WiFi ile Sistem Mimarisi**

> * **CAN-BUS (1. Talep):** Standart 5V MCP2515 modülünüzü SPI pinlerine (MOSI, MISO, SCK, CS) ve 5V/GND hatlarına doğrudan bağlayarak Scirocco'nuzun CAN hattından veri okuyabilir ve yazabilirsiniz.  
> * **Adreslenebilir LED (2. Talep):** 5V gücü harici bir kaynaktan alıp, veri pinini UNO R4'ün dijital çıkışına bağlayarak FastLED veya Adafruit NeoPixel kütüphaneleriyle kolayca yönetebilirsiniz.  
> * **Apple HomeKit (3. Talep):** Kartın üzerindeki Wi-Fi modülü sayesinde Arduino HomeKit kütüphanelerini kullanarak doğrudan Apple Home uygulamasından evi veya aracı kontrol eder gibi sistemi yönetebilirsiniz.  
> * **GPS / GSM / Arama (4. Talep):** SIM7600 veya benzeri bir modülü kartın seri portuna bağlayarak konum takibi ve SMS/Arama özelliklerini aktif edebilirsiniz.  
> * **Telefon Uygulaması (5. Talep):** Blynk IoT veya kartın kendi dahili web sunucusu (HTML arayüzü) üzerinden telefonunuzdan tüm sistemi kontrol edebilirsiniz.

UNO R4 WiFi ile ilerlemek hem bağlantı hatalarını en aza indirecek hem de yazılım sürecini çok daha keyifli hale getirecektir. Bu kart üzerinden pin yerleşimine veya ilk kod testine geçebiliriz\!

---

*User prompt: gps ve gsm modülü biz neler kazandırır*

Response: Projenize **GPS ve GSM modülü** (örneğin SIM7600 veya SIM800 serisi gibi bir 4G/GSM+GPS kartı) entegre etmek, aracınıza ve projenize akıllı telefon seviyesinde bağımsız bir iletişim ve takip altyapısı kazandırır.

UNO R4 WiFi kartınızla birlikte bu modülün projeye katacağı temel yetenekler şunlardır:

### **1\. Gerçek Zamanlı Konum Takibi (GPS)**

> * **Araç Konumu:** Aracınızın dünya üzerindeki anlık coğrafi konumunu (enlem, boylam), hızını ve yönünü milimetrik olarak takip edebilirsiniz.  
> * **Güvenlik / Hırsızlık Koruması:** Aracınız park halindeyken veya istenmeyen bir hareket algılandığında GPS verileri üzerinden konum takibi yapabilirsiniz.

### **2\. Hücresel Bağlantı ve İnternet (GSM/LTE)**

> * **Wi-Fi Alanı Dışında Kontrol:** UNO R4 WiFi’nin evinizin veya garajınızın Wi-Fi ağına bağlı olmadığı durumlarda bile, modül içindeki SIM kartın mobil verisi sayesinde buluta (Blynk vb.) bağlanmaya devam edebilirsiniz.

### **3\. Sesli Arama ve Acil Durum Aramaları (Voice Call)**

> * **Sesli Bildirimler:** Sistem kritik bir olay algıladığında (örneğin araçta beklenmeyen bir arıza, güvenlik ihlali vb.) önceden belirlenmiş bir telefon numarasını doğrudan arayarak sesli uyarı verebilir veya çift yönlü sesli iletişim kurabilirsiniz.

### **4\. SMS ile Uzaktan Komut ve Bilgilendirme**

> * **Acil Komut Gönderimi:** İnternet bağlantısının (Wi-Fi/Mobil Veri) çekmediği noktalarda bile araca atacağınız basit bir SMS ile belirli komutları (örneğin sistemi sıfırlama, belirli bir röleyi tetikleme veya durum raporu isteme) gerçekleştirebilirsiniz.  
> * **Uyarı Mesajları:** Araç akü voltajı düştüğünde, sarsıntı algılandığında veya kritik bir CAN-BUS arıza kodu düştüğünde telefonunuza doğrudan anlık SMS bildirimi gelebilir.

callout-content-10

---

*User prompt: tamam gsm gprs modülü olacak ama sim808*

Response: **SIM808** modülünü seçmeniz, hem **GSM/GPRS** (hücresel veri, arama, SMS) hem de **GPS** (konum takibi) özelliklerini tek ve kompakt bir çip üzerinde topladığı için proje bütçeniz ve alan yönetimi açısından son derece mantıklı bir karardır.

Ancak SIM808 modülünü **Arduino UNO R4 WiFi** ile birlikte kullanırken dikkat etmeniz gereken bazı teknik detaylar vardır:

### **1\. Voltaj ve Güç Gereksinimi (Kritik Nokta)**

> * **Mantık Seviyesi:** SIM808 modülleri genellikle **5V** mantık seviyesiyle uyumlu çalışır veya aradaki seri iletişim (TX/RX) toleranslıdır. UNO R4 WiFi de 5V çalıştığı için veri pinleri (Serial veya SoftwareSerial üzerinden) doğrudan uyumludur.  
> * **Akım Torku (Güç):** GSM modülleri şebekeye bağlanırken, arama yaparken veya veri gönderirken anlık olarak **2 Amper'e varan yüksek akımlar** çekebilir. Arduino'nun 5V çıkışı bu yükü tek başına kaldıramaz. Bu nedenle SIM808 modülünü beslemek için mutlaka **harici bir 5V güç kaynağı (veya yeterli akım verebilen bir voltaj regülatörü / Lipo pil)** kullanmalı ve Arduino ile modülün **GND (Toprak) hatlarını birbirine bağlamalısınız.**

### **2\. UNO R4 WiFi ile SIM808 Entegrasyonu**

> * **Seri Haberleşme (UART):** UNO R4 WiFi üzerinde donanımsal seri portlar bulunur. SIM808 ile haberleşmek için bu portları (veya kütüphane desteğiyle yazılımsal seri portları) kullanarak AT komutları gönderebilirsiniz.  
> * **Yapabilecekleriniz:**  
  * Araç hareket halindeyken GPS uydularından anlık enlem-boylam verisi okuma,  
  * İnternet kopmalarında veya Wi-Fi menzili dışındayken Blynk veya sunucuya GPRS üzerinden veri aktarma,  
  * Araçla ilgili acil durumlarda telefonunuza SMS atılması veya arama yapılması.

SIM808 modülünün UNO R4 WiFi üzerindeki pin bağlantı şemasına (TX, RX, Güç ve GND bağlantıları) geçmemizi ister misiniz?

---

*User prompt: birde bu sisteme garaj kapıları açma özelliği eklemek istiyorum*

Response: Sisteminize **garaj kapısı açma özelliği** eklemek, özellikle aracınızla (Scirocco ile) eve yaklaşırken veya garaja girerken muazzam bir konfor sağlar\! Üstelik mevcut **Arduino UNO R4 WiFi \+ SIM808 \+ CAN-BUS** altyapınıza bunu entegre etmek son derece kolaydır.

Bunu hayata geçirmek için iki farklı yöntem seçebilirsiniz:

### **Garaj Kapısı Entegrasyonu İçin İki Yol**

#### **1\. Yöntem: Akıllı Ev / Wi-Fi Entegrasyonu (Apple HomeKit & Blynk Üzerinden)**

Sisteminizde zaten **Apple HomeKit** ve **Wi-Fi** olacağı için, garaj kapısı motoruna doğrudan fiziksel bir kablo çekmeden, mevcut akıllı ev altyapınızı kullanabilirsiniz:

> * **Nasıl Çalışır?** Garaj kapınızın motoruna (veya duvarındaki açma butonuna) kablosuz bir röle (örneğin küçük bir Wi-Fi röle kartı veya sisteminize ekleyeceğiniz bir röle modülü) bağlarsınız.  
> * **HomeKit Entegrasyonu:** iPhone'unuzdaki Apple Home uygulamasından veya Siri'ye seslenerek (*"Siri, garaj kapısını aç"* diyerek) kapıyı anında açabilirsiniz.  
> * **Konum Bazlı Otomasyon:** Eve yaklaştığınızda (GPS veya telefonun konum servisi sayesinde) Apple HomeKit otomatik olarak garaj kapısını açacak bir otomasyon tetikleyebilir.

#### **2\. Yöntem: Doğrudan Donanımsal Bağlantı (Röle Modülü ile)**

Eğer kapıyı doğrudan UNO R4 WiFi üzerinden tetiklemek istersiniz:

> * **Gerekli Parça:** 5V'luk bir **Röle Kartı (Relay Module)**.  
> * **Nasıl Çalışır?** UNO R4 WiFi'nin bir dijital pinini röle kartına bağlarsınız. Rölenin uçlarını ise garaj kapısının buton tetik girişine (veya kumandasının butonuna lehimleyerek) bağlarsınız.  
> * **Tetikerikler:**  
  1. Telefon uygulamasından (Blynk veya dahili web arayüzünden) bir tuşa basarak,  
  2. SIM808 modülüne **özel bir SMS** atarak (*"GARAJ\_AC"* gibi),  
  3. Aracın CAN-BUS hattından belirli bir sinyal geldiğinde (örneğin uzun farları iki kez selamlama yaptığınızda veya el frenini indirdiğinizde \- *dikkatli programlanmalıdır*), sistem röleyi 1 saniyeliğine çektirir ve garaj kapısı açılır.

### **Sistemimizin Son Hali (Tüm Talepler Bir Arada)**

> 1. **Beyin:** Arduino UNO R4 WiFi (5V lojik, dahili Wi-Fi / HomeKit gücü)  
> 2. **Araç İletişimi:** MCP2515 CAN-BUS Modülü (VW 2016 Scirocco veri okuma/yazma)  
> 3. **Görsel & Aydınlatma:** Adreslenebilir WS2812B LED Şeritler  
> 4. **Hücresel & Konum:** SIM808 Modülü (GPS konum takibi, SMS ve arama özellikleri)  
> 5. **Konfor & Kontrol:** Apple HomeKit (köprüsüz) \+ Mobil Uygulama (Blynk) \+ **Garaj Kapısı Açma (Röle/HomeKit entegrasyonu)**

Garaj kapısını tetiklemek için **fiziksel bir röle ile SMS/Uygulama üzerinden kontrolü** mü, yoksa tamamen **Apple HomeKit (Siri / Otomasyon)** üzerinden kablosuz entegrasyonu mu tercih edersiniz?

---

*User prompt: rf kumandayı kopyalayacak gibi düşün*

Response: Harika bir bakış açısı\! Olayı klasik bir **RF (Radyo Frekansı) kumandayı kopyalamak** mantığına (örneğin garaj kumandasını klonlar gibi) bağlamak, sistemi araç içinden çok daha pratik ve refleksif yönetmenizi sağlar.

Eğer sistemi "bir RF kumanda gibi" kopyalama mantığıyla kurmak istiyorsak, bunu iki farklı senaryo ile harika bir şekilde entegre edebiliriz:

### **Senaryo 1: Fiziksel RF Alıcı ile "Kumanda Taklidi" (En Klasik Yöntem)**

Garaj kapınız sabit kodlu (Fixed Code \- genellikle 433MHz veya 315MHz) bir RF kumanda ile çalışıyorsa:

> * **Nasıl Çalışır?** Sisteminize küçük bir **433MHz RF Alıcı/Verici modülü** (örneğin RX/TX modülleri veya FS1000A) eklersiniz.  
> * **Mantık:** Aracın içindeki bir butona bastığınızda (veya Scirocco'nun direksiyon tuşlarından / selamlama farlarından CAN-BUS üzerinden bir tetik aldığınızda), UNO R4 WiFi doğrudan garaj kapınızın kumanda kodunu 433MHz frekansından havaya (RF ile) basar. Tıpkı orijinal garaj kumandanızın tuşuna basmış gibi kapı açılır\!

### **Senaryo 2: Akıllı "Sanal Kumanda" Klonlama (Apple HomeKit & Mobil Uygulama)**

Eğer kapınız sabit RF kod yerine akıllı bir sistemse veya RF kumandayı tamamen telefonunuza ve aracınıza dijital olarak kopyalamak istiyorsanız:

> * **Nasıl Çalışır?** SIM808 veya UNO R4 WiFi üzerindeki Wi-Fi sayesinde, telefonunuzdaki Apple Home uygulaması veya Blynk ekranı tam anlamıyla **"Sanal Bir Ana Kumanda"** haline gelir.  
> * **Tetikleme Senaryoları (Tamamen Kumanda Gibi):**  
  1. **Uzaktan Kontrol:** Eve yaklaşırken telefonunuzdan tek tuşa basarsınız.  
  2. **Otomatik Tetikleme (Geofencing):** Aracınızla evin önüne geldiğinizi GPS (SIM808) veya telefonunuzun konumu algılar ve tıpkı kumandaya basmışsınız gibi garaj kapısı otomatik açılır.  
  3. **Araç İçi Fiziksel Tuş (CAN-BUS):** Scirocco'nun direksiyonundaki boş bir tuşa veya örneğin selektöre (uzunları iki kez yakmaya) bastığınızda, CAN-BUS okuma üzerinden Arduino bunu algılar ve anında garaj kapısını tetikler.

Sisteme bu mantığı entegre etmek için araya **433MHz RF modülü** ekleyip doğrudan garaj kumandasının frekansını mı taklit edelim, yoksa **CAN-BUS / GPS / Wi-Fi** üzerinden akıllı bir tetikleme senaryosuyla mı devam edelim?

---

*User prompt: bu çalışmanın yapılan belirlei örneklerini bul homkit tarafı rf tarafı canbus tarafı gibi ayreı ayrı bak*

Response: Bu büyüklükteki hibrit bir projenin (araç içi CAN-BUS okuma/yazma, Apple HomeKit entegrasyonalı akıllı kontrol, SIM808 GPS/GSM ve RF garaj kumandası klonlama) dünyada ve Türkiye'deki maker/geliştirici topluluklarında yapılmış **popüler örneklerini ve proje kalıplarını** modül bazlı olarak aşağıda inceleyebilirsiniz:

### **1\. CAN-BUS Tarafı Örnekleri (Araç Entegrasyonu)**

Aracın CAN hattından veri okuma ve araca komut yazma konusunda yapılan en yaygın projeler doğrudan gösterge paneli ve direksiyon tuşları etrafında döner.

> * **Örnek Proje \- "Arduino CAN-Bus Car Hacking / Infotainment":** Geliştiriciler genellikle VW/Audi/Skoda (MQB platformu) araçlarında MCP2515 kullanarak direksiyon üzerindeki medya tuşlarının (ses açma, parça değiştirme) CAN ID'lerini dinlerler.  
> * **Ne Yapılıyor?:** Örneğin direksiyondaki "Telefon" tuşuna basıldığında gelen 0x560 (örnek ID) gibi bir CAN mesajı Arduino tarafından yakalanır. Bu mesaj okunarak projede başka bir tetikleyici (örneğin telefon araması veya garaj kapısı) olarak kullanılır.

### **2\. Apple HomeKit Tarafı Örnekleri (Köprüsüz / Doğrudan Wi-Fi)**

ESP32 ve Arduino UNO R4 WiFi gibi kartların dahili Wi-Fi yeteneği sayesinde yapılan akıllı ev projeleri oldukça yaygındır.

> * **Örnek Proje \- "ESP32 HomeKit Garage Door / Switch":** Arduino-HomeKit-ESP8266 veya resmi HomeKit kütüphaneleri kullanılarak yapılan projelerdir.  
> * **Ne Yapılıyor?:** Kart doğrudan ağa bağlanır ve iPhone'daki Apple Home (Ev) uygulamasında "Aç/Kapa" anahtarı olarak görünür. Kullanıcı Siri'ye *"Siri, garajı aç"* dediğinde veya widget'a tıkladığında, kart üzerindeki ilgili pin (röle veya RF tetikleyici) aktif olur. Hiçbir ek Raspberry Pi veya Apple TV köprüsüne ihtiyaç duyulmaz.

### **3\. RF Kumanda ve Garaj Klonlama Tarafı Örnekleri**

> * **Örnek Proje \- "Arduino 433MHz Garage Door Opener / Roller Code Cloner":**  
> * **Ne Yapılıyor?:** Sabit kodlu (Fixed Code \- EV1527 veya PT2262 çipli) garaj kumandalarının sinyalleri RCスイッチ (RcSwitch) kütüphanesi kullanılarak bir 433MHz RF alıcı ile okunur (RF Sniffing). Ardından kaydedilen bu dijital sinyal, bir 433MHz RF verici modül aracılığıyla Arduino tarafından birebir havaya tekrar basılır. Yani Arduino fiziksel kumandanın klonu haline gelir.

### **4\. GSM / GPS (SIM808) Tarafı Örnekleri**

> * **Örnek Proje \- "Arduino SIM808 Vehicle Tracking & SMS Control":**  
> * **Ne Yapılıyor?:** Araç takip sistemlerinde standart olan bu projede, SIM808 modülü uydudan aldığı GPS koordinatlarını (enlem/boylam) bir AT komutu dizisiyle okur. Araç belirli bir konumun dışına çıktığında veya kullanıcıya "KONUM" yazarak bir SMS atıldığında, modül araca ait Google Maps linkini SMS olarak geri gönderir. Aynı zamanda arama yapma özellikleri alarm durumlarında devreye sokulur.

### **Tüm Bu Örnekleri Birleştiren "Nihai Konsept"**

Bu projelerin her biri ayrı ayrı internette açık kaynaklı kütüphanelerle (örneğin *MCP\_CAN*, *RcSwitch*, *Arduino-HomeKit*, *TinyGSM*) binlerce kez yapılmıştır. Sizin projenizi özel kılan nokta, **tüm bu bağımsız dünyaların (Araç CAN hattı \+ Apple HomeKit \+ SIM808 GPS/GSM \+ RF Garaj Kumandası) tek bir Arduino UNO R4 WiFi üzerinde birleşmesidir.**

Bu modüllerden özellikle ilk olarak hangisinin yazılım kodunu ve örnek altyapısını incelemek istersiniz?

---

*User prompt: bir domain üzerine web sayfası yapsam ve bu web sayfasının veri tabanı benim arabadan gelen canbus kayıtlarını tutsa*

Response: Bu fikir, projenizi sıradan bir hobi çalışmasından çıkarıp profesyonel bir **"Araç Telemetri ve Bulut Takip Sistemi"ne** dönüştürür\!

Aracınızdaki (2016 Scirocco) **Arduino UNO R4 WiFi \+ SIM808** ikilisini kullanarak, CAN-BUS üzerinden okunan verileri (anlık hız, motor devri, hata kodları, yakıt durumu veya garaj kapısı tetiklenme logları) doğrudan kendi web sitenizin veri tabanına anlık olarak kaydetmeniz tamamen mümkündür.

Bu sistemi kurmak ve yönetmek için izlemeniz gereken mimari ve adımlar şunlardır:

### **1\. Sistem Mimarisi (Veri Nasıl Akacak?)**

> 1. **Veri Toplama (Araba):** Arduino UNO R4 WiFi, MCP2515 üzerinden CAN-BUS verilerini okur.  
> 2. **İnternet Bağlantısı (GSM / Wi-Fi):**  
   * Araç garajdayken evdeki Wi-Fi ağına bağlanabilir.  
   * Yoldayken ise **SIM808 modülünün GPRS (Mobil Veri)** özelliği veya UNO R4'ün Wi-Fi özelliğini telefonunuzun Hotspot (Mobil Erişim Noktası) internetine bağlayarak internete çıkış yapar.  
> 3. **Bulut / Web Sunucusu:** Sahip olduğunuz domain üzerinde barınan bir web sunucusu (örneğin Node.js, Python Flask/Django, PHP veya bir MQTT broker) çalışır.  
> 4. **Veri Tabanı:** Sunucu tarafında MySQL, PostgreSQL veya MongoDB gibi bir veri tabanı, gelen CAN-BUS kayıtlarını (Zaman damgası, CAN ID, Veri Paketleri, GPS Konumu) tablo halinde saklar.

### **2\. Web Sayfası ve Veri Tabanı Tarafında Neler Yapılabilir?**

Kendi domaininizde açacağınız özel bir panel (örneğin aracim.sizinadi.com) sayesinde şunları yapabilirsiniz:

> * **Canlı Kontrol Paneli (Dashboard):** Aracın o anki durumunu grafikler ve anlık sayaçlarla web tarayıcısından izleyebilirsiniz.  
> * **GPS Harita Entegrasyonu:** SIM808'den gelen enlem-boylam bilgilerini Google Maps veya Leaflet haritası üzerinde çizdirerek aracın geçmişte hangi güzergahlardan geçtiğini görebilirsiniz.  
> * **Geçmiş Log Sorgulama (Can-Bus Kayıtları):** Veri tabanına kaydedilen 0x351 gibi CAN ID'lerini veya hata kodlarını tarihe göre filtreleyip inceleyebilirsiniz.  
> * **Uzaktan Komut / Tetikleme:** Web sitesi üzerinden göndereceğiniz bir komut (örneğin "Garajı Aç" butonu), sunucu üzerinden araca iletilerek röleyi veya RF kumandayı tetikleyebilir.

### **3\. Kodlama ve Haberleşme Mantığı (Nasıl Haberleşecekler?)**

Arduino'nun web sunucunuza veri göndermesinin en popüler ve kolay yolu **HTTP POST istekleri (REST API)** veya **MQTT protokolüdür**.

Arduino tarafından web sitenize veri göndermek için örnek bir HTTP POST mantığı şu şekildedir:

\#include \<WiFiS3.h\> // Arduino UNO R4 WiFi kütüphanesi

// Wi-Fi veya SIM808 üzerinden veri gönderme mantığı  
void sendDataToCloud(unsigned long canId, String dataHex) {  
  WiFiClient client;  
  char server\[\] \= "sizin-domaininiz.com"; // Kendi domain adresiniz

  if (client.connect(server, 80)) {  
    // Web sunucunuza POST isteği atarak veriyi iletme  
    String postData \= "id=" \+ String(canId, HEX) \+ "\&data=" \+ dataHex;  
      
    client.println("POST /api/savelog.php HTTP/1.1");  
    client.println("Host: " \+ String(server));  
    client.println("Content-Type: application/x-www-form-urlencoded");  
    client.print("Content-Length: ");  
    client.println(postData.length());  
    client.println();  
    client.println(postData);  
      
    client.stop();  
  }  
}

### **Bu Adımda Nasıl İlerleyelim?**

Bu devasa ve harika projeyi parça parça inşa etmek en sağlıklı yoludur. Web sitesi/veri tabanı altyapısını kurmakla mı başlayalım, yoksa önce arabadan CAN verilerini okuyup bunu seri ekranda görme adımını tamamlayalım mı?

---

*User prompt: ayrıca bu sistemi apple homkit ile birlikte apple find e de ekleye bilir miyim.*

Response: Evet, bu sistemi hem **Apple HomeKit** ile hem de **Apple Find My (Bul)** ağıyla entegre etmeniz kesinlikle mümkündür\! Ancak burada teknolojilerin çalışma mantığı açısından küçük bir ayrım vardır:

### **1\. Apple HomeKit Entegrasyonu (Zaten Var / Doğrudan)**

Seçtiğimiz **Arduino UNO R4 WiFi** kartının üzerindeki Wi-Fi çipi sayesinde, kartı doğrudan yerel ağınıza bağlayarak Apple HomeKit ekosistemine ekleyebilirsiniz.

> * **Ne Sağlar?** iPhone'unuzdaki "Ev" (Home) uygulamasından araca ait tetikleyicileri görebilir, Siri sesli komutları ile garaj kapısını açıp kapatabilir veya akıllı otomasyonlar kurabilirsiniz.

### **2\. Apple Find My (Bul) Entegrasyonu (Nasıl Çalışır?)**

Apple'ın **Find My (Bul)** ağı (AirTag'lerin çalıştığı altyapı), dünyanın dört bir yanındaki milyonlarca Apple cihazının (iPhone, iPad, Mac) Bluetooth sinyallerini kullanarak konum bildiren kapalı ve şifreli bir ekosistemdir.

> * **Doğrudan Arduino Üzerinden Find My Çalışır mı?:** Standart bir Arduino kartı veya SIM808 modülü doğrudan Apple Find My ağına (Apple'ın şifreleme ve sertifikasyon protokolleri nedeniyle) yerel olarak katılamaz.  
> * **Bunu Nasıl Çözebiliriz? (Pratik Yöntem):**  
  1. **AirTag Entegrasyonu:** Aracın gizli bir köşesine (örneğin bagaja veya torpido gözüne) içini açıp hoparlörünü iptal ettiğiniz orijinal bir **Apple AirTag** (veya Find My destekli bir akıllı takip cihazı) saklayabilirsiniz. Böylece SIM808'in GPS verisinin yanı sıra, Apple ekosistemi üzerinden de aracın konumunu doğrudan iPhone'unuzdaki "Bul" uygulamasından takip edebilirsiniz.  
  2. **ESP32 Find My Projeleri:** Geliştirici dünyasında ESP32 çipleri için geliştirilmiş açık kaynaklı "Find My" emülasyon projeleri (Beacon tabanlı) da bulunmaktadır, ancak tam bir AirTag kadar akıcı ve küresel bir takip deneyimi için araca entegre edilecek küçük bir AirTag her zaman en kararlı ve güvenli yoldur.

Sisteminizin son haliyle hem **Apple HomeKit** (akıllı ev/araç kontrolü) hem de **Apple Find My** (harita üzerinden cihaz/araç takibi) ekosistemini cebinizdeki tek bir iPhone ekranında birleştirmiş olacaksınız\!

---

*User prompt: Apple AirTag bunu kullanmadan yapmak olay z\<aten onu araştır*

Response: Haklısınız, fiziksel bir AirTag satın alıp araca saklamak bu projenin "kendin yap" (maker) ruhuna ve özgür mimarisine ters düşer. Harici bir AirTag kullanmadan, tamamen **seçtiğimiz donanımın (ESP32 / UNO R4 WiFi alt yapısının) içindeki Bluetooth modülünü** kullanarak Apple'ın "Bul" (Find My) ağına entegre etmenin dünyada geliştirilmiş harika bir açık kaynaklı yöntemi vardır: **OpenHaystack / Macless-Haystack** altyapısı.

Bu yöntemle fiziksel bir AirTag’e ihtiyaç duymadan, projenin kalbindeki işlemciyi doğrudan bir Apple takip cihazına dönüştürebilirsiniz.

### **AirTag Kullanmadan Apple "Find My" Ağına Bağlanma Yöntemi: Nasıl Çalışır?**

Apple'ın **Find My (Bul)** ağı; etraftan geçen herhangi bir iPhone, iPad veya Mac cihazın, çevredeki Bluetooth Low Energy (BLE) sinyallerini tarayıp, o anki GPS konumunu şifreleyerek Apple sunucularına anonim olarak yüklemesi mantığıyla çalışır.

Bunu kendi cihazımıza uyarlamak için izlenen yol şudur:

> 1. **Özel Kriptografik Anahtarların Üretilmesi:**  
   * Açık kaynaklı araçlar (örneğin *OpenHaystack* veya modern *Macless-Haystack* servisleri) yardımıyla Apple'ın şifreleme algoritmasına uygun özel bir public/private (açık/özel) anahtar çifti oluşturulur.  
> 2. **ESP32 / UNO R4 WiFi Üzerinden BLE Beacon Yayını:**  
   * Seçtiğimiz mikrokontrolcünün Bluetooth çipi, normalde bir cihaza bağlı (connected) çalışmaz; bunun yerine arka planda sürekli olarak Apple'ın Find My protokolüne uygun **BLE Beacon (şifreli reklam paketleri)** yayınlar.  
> 3. **Konumun Yakalanması:**  
   * Aracınız dışarıdayken etrafından herhangi bir iPhone geçtiğinde, o iPhone aracınızdaki ESP32'nin bu Bluetooth sinyalini yakalar, kendi GPS konumunu bu anahtarla şifreler ve Apple'ın bulutuna yükler.  
> 4. **Konumun Çözülmesi (Görüntülenmesi):**  
   * Kendi kurduğunuz küçük bir sunucu betiği veya uygulama, Apple sunucularından bu şifreli raporları çeker ve elinizdeki özel gizli anahtar (private key) ile çözer. Böylece harita üzerinde aracınızın konumunu doğrudan görürsünüz.

### **Projeye Entegrasyonu (Tümleşik Mimari)**

Bu yöntemi projeye dahil ettiğimizde sistem şu kusursuz uyuma kavuşur:

> * **Çift Katmanlı Konum Güvencesi:**  
  1. **GSM/GPS (SIM808 üzerinden):** Araç hareket halindeyken veya hücresel kapsama alanındayken doğrudan kendi sunucunuza ve web sitenize anlık GPS verisi basar.  
  2. **Apple Find My (ESP32 Bluetooth Beacon üzerinden):** SIM808'in internetinin çekmediği, uydudan kopuk kapalı garaj veya otopark gibi noktalarda bile, çevredeki herhangi bir iPhone sinyali yakalayıp konumu Apple ağı üzerinden size ulaştırır. Ekstra hiçbir cihaza (AirTag'e) para vermeden, doğrudan kendi kodladığınız kart bu işi yapar.

Bu açık kaynaklı "Find My" Firmware kodunu ve anahtar üretim aşamalarını projenin yazılım geliştirme aşamasında ana koda nasıl gömülebileceğini detaylandırmamızı ister misiniz?

**Sources**

> 1. [Macless-Haystack: Build DIY AirTags Without a Mac | Bright Coding](https://www.blog.brightcoding.dev/2026/02/18/macless-haystack-build-diy-airtags-without-a-mac)  
> 2. [Fabian Bräunlein's ESP32-Powered "Find You" Tag Bypasses](https://www.hackster.io/news/fabian-braunlein-s-esp32-powered-find-you-tag-bypasses-apple-s-airtag-anti-stalking-protections-0f2c9ee7da74)  
> 3. [Send My: Arbitrary data transmission via Apple's Find My network](https://positive.security/blog/send-my)

---

*User prompt: ama ben apple orjinal bul menüsünde bunu görnmek istiyorum*

Response: Anladım, istediğiniz şey harici bir sunucu veya arayüzle uğraşmadan, iPhone'unuzdaki **resmi Apple "Bul" (Find My) uygulamasını** açtığınızda **"Öğeler" (Items)** sekmesinde aracınızı (örneğin "Scirocco") tıpkı resmi bir AirTag veya Apple MFi sertifikalı bir cihaz gibi doğrudan listede görebilmek.

Bu konunun teknik ve pratik gerçekliği şu şekildedir:

### **Apple'ın Resmi "Find My" Uygulamasında Görünme Şartı**

Apple, "Bul" ağının (Find My Network) ekosistem güvenliği ve şifreleme altyapısı nedeniyle iki tür cihazın bu uygulamada görünmesine izin verir:

> 1. **Resmi / MFi Sertifikalı Ürünler:** Apple ile anlaşmalı üreticilerin (Belkin, Chipolo, VanMoof vb.) ürettiği veya orijinal AirTag gibi çipler içeren cihazlar.  
> 2. **Açık Kaynaklı Yazılımsal Taklitler (OpenHaystack / ESP32 Tabanlı Çözümler):** ESP32'nin Bluetooth çipine özel bir yazılım yükleyerek Apple'ın şifreleme anahtarlarıyla **"Ben bir AirTag'im"** sinyali yaymasını sağlayabilirsiniz.

Ancak burada kritik bir detay vardır:

> * Bu yöntemi (ESP32 ile özel firmware yazmayı) kullandığınızda, cihaz doğrudan Apple'ın resmi uygulamasının "Eşle / Yeni Nesne Ekle" butonuna basılarak eklenemez.  
> * Bunun yerine, anahtarlar bilgisayar ortamında üretilip ESP32 kodunun içine gömülür ve özel bir eşleme mantığıyla Apple ekosistemine "enjekte" edilir. Bu sayede cihaz konum bildirmeye başlar, ancak resmi uygulamanın "Aksesuar Ekle" sihirbazıyla doğrudan eşleşme yapmaz.

### **Projeniz İçin En Kararlı ve Akıllı Yol Haritası**

Aracınızda (2016 Scirocco) **Arduino UNO R4 WiFi \+ SIM808 \+ CAN-BUS \+ Garaj Kapısı** altyapısını kurarken, telefon kontrolü ve konum takibi için şu iki yolu seçmek en mantıklısıdır:

> 1. **Konum ve Araç Takibi İçin:**  
   * **SIM808 (GPS \+ GPRS):** Aracın anlık konumunu kendi web sitenize/veri tabanınıza kesintisiz aktarır.  
   * **Apple HomeKit:** Evinize yaklaşırken veya araç içindeyken Siri ve Apple Ev uygulamasıyla garaj kapısını açmanızı sağlar.  
> 2. **Resmi "Find My" Arayüzü İsteği İçin:**  
   * Eğer mutlaka iPhone'un orijinal "Bul" uygulamasında tek dokunuşla eşleşmiş resmi bir nesne gibi görmek istiyorsanız, projenin içine yazılımsal riskler (sürekli güncellemelerde Apple tarafından engellenebilen BLE protokol açık jueyleri) almak yerine, aracın uygun bir yerine orijinal bir AirTag'in (hoparlörü sökülmüş şekilde) entegre edilmesi en kararlı çalışan yöntemdir.

Sistemin kodlama aşamasına geçerken öncelikle hangi modülün (CAN-BUS veri okuma mı, yoksa Wi-Fi/HomeKit bağlantısı mı) altyapısıyla başlamak istersiniz?

**Sources**

> 1. [OpenHaystack in ESPHome \- Barrenechea](https://www.barrenechea.cl/en/projects/openhaystack-esphome/)  
> 2. [Fabian Bräunlein's ESP32-Powered "Find You" Tag Bypasses](https://www.hackster.io/news/fabian-braunlein-s-esp32-powered-find-you-tag-bypasses-apple-s-airtag-anti-stalking-protections-0f2c9ee7da74)  
> 3. [Send My: Arbitrary data transmission via Apple's Find My network](https://positive.security/blog/send-my)  
> 4. [GitHub \- Guinn-Partners/esp32-airtag](https://github.com/Guinn-Partners/esp32-airtag)

---

*User prompt: Kesinlikle airtag kullanmayacağım*

Response: Anladım, harici veya orijinal hiçbir Apple aksesuarı (AirTag vb.) kullanmadan, tamamen kendi tasarlayacağınız sistem üzerinden ilerlemek istemeniz bu projenin "maker" ruhuna çok daha uygundur.

Bu durumda konum takibi ve entegrasyon için elimizde iki güçlü ve tamamen sizin kontrolünüzde olan yol kalıyor:

> 1. **SIM808 (GPS \+ GPRS) ile Kendi Web Sitenize Konum Aktarma:** Araç hareket halindeyken veya dışarıdayken uydudan alınan anlık enlem-boylam verilerini kendi domaininizdeki veri tabanına kaydetmek ve özel web panelinizden harita üzerinde canlı takip etmek.  
> 2. **Wi-Fi / GSM Üzerinden Apple HomeKit Kontrolü:** Eve yaklaşıldığında veya garaja girerken Apple HomeKit ve Siri üzerinden garaj kapısı/tetikleme işlemlerini yönetmek.

Aracınız için bu sistemi kodlamaya ve donanımları masaya yatırıp ilk adım olarak **CAN-BUS veri okuma** kısmından mı başlayalım, yoksa **Arduino UNO R4 WiFi \+ SIM808** bağlantı planı ve yazılım şablonuyla mı devam edelim?

---

*User prompt: Peki bu sisteme teyp canbus üzerinden şu numarayı ara diyebilir mi*

Response: Orijinal VW teybe (MIB multimedya sistemi) CAN-bus hattı üzerinden *"şu numarayı ara"* şeklinde özel bir telefon numarası komutu göndermek **doğrudan mümkün değildir**.

Bunun nedeni, VAG grubu araçların bilgi-eğlence (infotainment) sistemlerinin telefon rehberini ve arama işlemlerini doğrudan telefonla aralarındaki Bluetooth (HFP \- Hands-Free Profile) bağlantısı üzerinden yürütmesidir. CAN-bus hattı üzerinden teybe ancak "direksiyondaki arama tuşuna basıldı" gibi genel kontrol sinyalleri iletilebilir, dışarıdan ham bir telefon numarası verisi işlenmez.

Ancak bu noktada projeniz için harika bir avantajımız var: **Zaten sistemde bulunmasını istediğiniz SIM808 modülü, harici bir teybe ihtiyaç duymadan doğrudan telefon görüşmesi yapabilen bağımsız bir GSM modülüdür.**

### **Bunu Nasıl Çözebiliriz?**

> * **SIM808 Üzerinden Doğrudan Arama:** SIM808 modülüne takacağınız SIM kart sayesinde, sistem kendi mikrofon ve hoparlör çıkışlarını kullanarak (veya tetiklendiğinde) belirlediğiniz numarayı doğrudan arayabilir. Teybinizin bu süreçte aracı olmas人に gerek kalmaz.  
> * **Akıllı Senaryo:** Örneğin aracın alarmı tetiklendiğinde veya belirli bir acil durum komutu aldığında, SIM808 arka planda doğrudan telefonunuzu arayarak sesli bildirim yapabilir.

---

*User prompt: Arabanın orjinal teypi sanki dahili kendi gsm cihazı varmış gibi bunu görebilir mi*

Response: Kısa ve net cevap: **Hayır, aracınızın orijinal teybi (Discover Media veya Composition Media gibi VW üniteleri) dışarıdan eklediğiniz SIM808 modülünü "kendi dahili GSM cihazıymış gibi" göremez ve arayüzünde tanımaz.**

Bunun teknik nedeni şudur:

> * VW araçlarının MIB bilgi-eğlence sistemleri, telefon modülü (Bluetooth / HFP profili) ile tamamen **fabrika çıkışlı özel protokoller ve Volkswagen'in kendi yazılım ekosistemi** üzerinden haberleşir.  
> * Teyp, CAN-bus hattı üzerinden veya arka plandaki özel soketlerden sadece orijinal Bluetooth modülünün varlığını veya telefonun durumunu (şebeke gücü, pil seviyesi vb.) arar. Harici olarak bağladığınız bir SIM808 modülünü teybin ekranına "dahili telefon" olarak yansıtmanın veya teybin menüsünden bu modülü kontrol etmenin bir yolu yoktur, çünkü teybin işletim sistemi bu harici donanımı tanıyacak yazılım sürücülerine (driver) sahip değildir.

### **Peki Bu Durumu Nasıl Çözebiliriz? (Alternatif Yaklaşım)**

Teybin ekranında görünmese bile, sistemin **tamamen bağımsız bir akıllı araç asistanı** gibi çalışmasını sağlayabilirsiniz:

> 1. **Arka Planda Çalışan Bağımsız Sistem:** SIM808 modülü tamamen Arduino'ya bağlı gizli bir telefon beyin gibi çalışır. Aracınızda kritik bir durum olduğunda (örneğin acil durum, alarm, gizli komut) teybi hiç karıştırmadan doğrudan sizin telefonunuzu arar veya SMS atar.  
> 2. **Bluetooth Ses Entegrasyonu (İsteğe Bağlı):** Eğer SIM808 üzerinden gelen seslerin aracın hoparlörlerinden verilmesini isterseniz, SIM808'in ses çıkışını aracın AUX girişine bağlayabilir veya araya basit bir Bluetooth ses alıcısı koyarak sistemi ses sistemine entegre edebilirsiniz.

Sistemin bu bağımsız iletişim ve kontrol altyapısını kodlamaya nereden başlayalım?

---

*User prompt: Tamam bunu geç*

Response: Anlaştık, bu konuyu geçiyoruz.

Projenin **Arduino UNO R4 WiFi \+ MCP2515 (CAN-BUS) \+ SIM808 (GPS/GSM/Garaj)** ana bileşenleri üzerinden yazılım veya donanım planlamasına hangi kısımdan devam edelim?

---

*User prompt: \#\# 🛠️ RETROFİT PROJE DOSYASI: VOLKSWAGEN SCIROCCO AKILLI AMBİYANS VE TELEMETRİ EKOSİSTEMİ Bu doküman, 2016 Facelift (Makyajlı) Volkswagen Scirocco (PQ35 Platformu \- MIB2 Multimedya Üniteli) aracınız için en başından beri adım adım tasarladığımız, tüm teknik mimariyi, parça uyuşmazlığı ve tedarik krizlerini aşan mühendislik hilelerini, siber güvenlik katmanlarını ve yazılım senaryolarını içeren eksiksiz ve tüm detaylarıyla dökülmüş nihai konuşma ve proje kayıt dosyasıdır. \------------------------------ \#\# 💾 BÖLÜM 1: SOHBETİN TÜM DETAYLARIYLA DÖKÜMÜ VE GELİŞİM SÜRECİ Projenin tasarım aşamasında masaya yatırılan, tartışılan ve sizin direktiflerinizle elenip/kesinleşen tüm fikir alışverişleri kronolojik olarak aşağıda kayıt altına alınmıştır: \#\# 1\. Bağlantı Noktası ve CAN-Bus Altyapısı Tartışması \* Teyp Arkası (100 kbps CAN-Infotainment) Senaryosu: İlk olarak bağlantının MIB2 teyp arkasındaki Quadlock soketinden (Turuncu/Yeşil ve Turuncu/Kahverengi kablolar) yapılması planlandı. Bu hattın multimedya renk menüsü ve kapı durum konfor verilerini temiz taşıdığı, ancak motor devri (RPM) ve anlık gaz pedalı gibi agresif performans verilerini barındırmadığı netleştirildi. \* OBD Arkası Gizli Y-Aparat (500 kbps CAN-Powertrain) Kararı: Sürüş dinamiklerine (Cupra modu, Redline vites uyarısı) tepki verebilecek gecikmesiz bir sistem istediğiniz için bağlantı kesin olarak direksiyon sol altındaki mor OBD soketinin arkasına gizlenecek ince yapılı bir OBD Y-Splitter (Çoğaltıcı) hattına kaydırıldı. Böylece dışarıdaki OBD portu fabrikasyon olarak tamamen boş kalacak, arıza tespit cihazı takılmak istendiğinde hiçbir sökme işlemiyle uğraşılmayacaktır. \#\# 2\. Donanım Değiştirme ve Arayüz Arayışları \* Arduino Nano \+ MCP2515: İlk taslakta standart Nano ve kaba MCP2515 SPI modülü düşünüldü. Ancak saniyede akan binlerce 500 kbps paketi eritmek ve Bluetooth trafiğini yönetmek için bu tek çekirdekli yapının yetersiz kalacağı öngörüldü. \* Arduino GIGA R1 WiFi \+ 3.9" Display Shield: Bir aşamada sistemi devasa bir işlem gücüne ulaştırıp kabin içi dokunmatik test ekranıyla donatmayı düşündük. Ancak Türkiye'de GIGA ile uyumlu çalışan 5V lojik seviyeli CAN çiplerinin (ISO1050/ISO1042 vb.) ve seviye dönüştürücülerin (Level Shifter) tedarik krizleri, kablo kalabalığı ve karmaşası yüzünden GIGA ve harici ekran fikrinden tamamen vazgeçildi. Arayüz yükü tamamen telefondaki uygulamaya devredildi. \* Arduino Nano ESP32 Kararı: Hem minimal, konsol arkasına gizlenebilen mikro form faktörünü korumak hem de ESP32-S3 çipinin dahili donanımsal CAN denetleyicisi (TWAI) ve çift çekirdek (FreeRTOS) gücünü arkamıza almak için Arduino Nano ESP32 nihai beyin olarak kilitlendi. \#\# 3\. Türkiye Stok Krizini Çözen "CAN Transceiver" Hilesi \* Türkiye'deki robotik mağazalarında Arduino'nun dahili CAN birimini OBD hattına bağlayacak 5V seviyesindeki transiver çipleri (TJA1050, MCP2562 vb.) çıplak modül halinde bulunamıyordu. 3.3V'luk SN65HVD230 çipi ise araca veri yazarken (injection) voltaj yetersizliğinden hata veriyordu. \* Mühendislik Hilesi: Türkiye'deki tüm pazar yerlerinde (Trendyol, Hepsiburada vb.) bolca stokta bulunan mavi hazır MCP2515 SPI Modül Kartını satın alma kararı verdik. Bu kartın üzerindeki kaba kontrol çipini ve SPI yollarını tamamen yok sayacağız (hiç bağlamayacağız). Kartı sadece, üzerinde fabrikasyon olarak lehimli gelen o kıymetli 5V TJA1050 alıcı çipini bypass etmek için kullanacağız. TJA1050'nin TX/RX hatlarından Arduino Nano ESP32'nin donanımsal CAN pinlerine doğrudan kılcal lehim atacağız. \#\# 4\. 4G/GSM ve GPRS Kararlılığı \* Sisteme uzaktan erişim, konum takibi (Anti-Theft) ve sesli görüşme/SMS yeteneği kazandırmak için büyük endüstriyel 4G modülleri yerine, kendin-yap (DIY) dünyasının en kararlı, boyut olarak en mikro ve kütüphane desteği en zengin olan SIM808 GSM/GPRS \+ GPS Geliştirme Kartı kilitlendi. 2G şebekesi üzerinden ses, SMS ve konum koordinatları taşınacağı için GPRS altyapısının projemiz için fazlasıyla yeterli olduğu onaylandı. \------------------------------ \#\# 📦 BÖLÜM 2: KESİNLİK KAZANAN NİHAİ DONANIM ALİŞVERİŞ LİSTESİ Türkiye'deki robotik mağazalarından ve pazar yerlerinden (Hepsiburada, Trendyol, Robotistan, Direnc.net) anında sipariş verip masanızda birleştirebileceğiniz kesin parça listesi: 1\. Arduino Nano ESP32: Sistemi yönetecek, yerleşik Bluetooth (BLE) barındıran, ESP32-S3 çipli ana beyin. 2\. SIM808 GSM/GPRS \+ GPS Geliştirme Kartı: Araç içi sesli görüşme, SMS ve canlı konum takibi için mini iletişim modülü. 3\. Mavi Renkli MCP2515 CAN-BUS SPI Modülü: Sadece üzerindeki 5V TJA1050 çipini bypass etmek için kullanılacak hazır kart. 4\. Ultra Slim İnce OBD2 Y Uzatma Kablosu (Splitter): Orijinal mor soketin arkasında çoğaltma yapmak için. 5\. ZBL Lighting 1.8mm Yan Aydınlatmalı Adreslenebilir 12V COB LED Şerit: Metrede 600 LED'li, Scirocco kapı ve konsol oluklarına dikey giren pürüzsüz iç mekan neon şeridi. 6\. 12V WS2815 IP68 Katı Silikon Enjeksiyonlu Şerit LED: Araç altı 4 bölge için suya, çamura, tazyikli yıkamaya tam dayanıklı dış mekan şeridi. 7\. LM2596 Voltaj Regülatörü (Buck Converter): SIM808'in şebeke arama esnasındaki anlık 2A-3A akım sıçramalarını göğüslemek için güçlü güç bloğu. 8\. Mini Voltaj Regülatörü: 12V'u 5V'a düşürüp Arduino Nano ESP32'yi beslemek için. 9\. OLED Ekran (0.96" veya 1.3" I2C): Konsolda gizli, sadece yağ sıcaklığı, turbo basıncı ve GSM durumunu gösterecek mini bilgi ekranı (Opsiyonel/Belki). 10\. Aksesuarlar: 3.5mm otomotiv tipi yaka mikrofonu (tavan için), PAM8403 (5V 3W) Mini Ses Amfisi ve 3W küçük test hoparlörü (veya teyp AUX hattına lehimlemek için kablo), 330 Ohm dirençler, daralan makaron seti ve tesa bez bant. \------------------------------ \#\# 🔌 BÖLÜM 3: HİBRİT GÜÇ VE 3 KABLOLU BYPASS LEHİM ŞEMASI Sistemdeki tüm elemanların ortak şasede (GND) birleştiği, voltaj uyuşmazlıklarını sıfırlayan fiziksel lehim haritası: \#\# 1\. Elektriksel Güç Dağıtımı ve Akü Koruma Kilidi \* Ana Besleme (12V Source): Tüm sistemin (LED şeritler, SIM808 ve regülatörler) artı (+) ve eksi (-) hatları doğrudan aracın akü koruma moduna bağlı gecikmeli iç aydınlatma hattına lehimlenir. Scirocco kilitlendikten 10-15 dakika sonra uykuya geçince bu hattın elektriği kesilir; tüm sistem fiziksel olarak kapanarak akü tüketimini ve sızma riskini araba dururken sıfırlar. \* ZBL İç Mekan ve WS2815 Dış Mekan LED Gücü: Doğrudan bu 12V ortak hattından beslenir. \* Modüllerin Gücü (5V): İç aydınlatmadan gelen 12V, LM2596 Buck Converter ile 5V seviyesine düşürülür. Bu 5V; hem Arduino Nano ESP32'nin VIN pinine, hem SIM808 modülünün 5V girişine, hem de mavi hazır kart üzerindeki VCC pinine paralel dağıtılır. \#\# 2\. Mavi Karttan TJA1050 CAN Bypass Lehim Noktaları Mavi kartın SPI pinlerine hiçbir şey bağlamıyoruz. Kart üzerindeki o küçük 8 bacaklı TJA1050 entegresinin kılcal yollarından doğrudan kablo çıkarıyoruz: \* TJA1050 Çipinin TX (Veri Giriş) bacak hattı ➡️ Arduino Nano ESP32 A6 (CAN\_TX / GPIO 43\) pinine lehimlenir. \* TJA1050 Çipinin RX (Veri Çıkış) bacak hattı ➡️ Arduino Nano ESP32 A7 (CAN\_RX / GPIO 44\) pinine lehimlenir. \* Mavi kartın ucundaki yeşil klemens (CANH / CANL), doğrudan OBD arkasındaki Y-aparatın 6\. (High) ve 14\. (Low) kablo uçlarına paralel lehimlenir. \#\# 3\. SIM808 Seri ve Ses Bağlantıları \* SIM808 TX ➡️ Arduino Nano ESP32 D0 (RX) pinine lehimlenir. \* SIM808 RX ➡️ Arduino Nano ESP32 D1 (TX) pinine lehimlenir. \* SIM808 MIC+ / MIC- pinleri ➡️ Tavan aydınlatma paneline çekilen yaka mikrofonuna lehimlenir. \* SIM808 SPK+ / SPK- pinleri ➡️ Teyp arkasındaki orijinal AUX giriş kablolarına (veya PAM8403 mini amfi üzerinden gizli 3W test hoparlörüne) lehimlenir. \#\# 4\. 3 Kablolu Adreslenebilir LED Veri Yolları (DIN) Şeritlerin 12V ve GND hatları araçtan beslenirken, Arduino'dan çıkan sinyal kablolarının ucuna anlık akım sıçramalarını önlemek için 330 Ohm direnç atılarak şeritlerin DIN (Veri Giriş) bacaklarına lehimlenir: \* Sol Kapı ZBL DIN ➡️ Arduino Nano ESP32 D5 \* Sağ Kapı ZBL DIN ➡️ Arduino Nano ESP32 D6 \* Ön Konsol ZBL DIN ➡️ Arduino Nano ESP32 D7 \* Araç Altı Ön Şerit DIN ➡️ Arduino Nano ESP32 D8 \* Araç Altı Arka Şerit DIN ➡️ Arduino Nano ESP32 D9 \* Araç Altı Sol Marşpiyel DIN ➡️ Arduino Nano ESP32 D10 \* Araç Altı Sağ Marşpiyel DIN ➡️ Arduino Nano ESP32 D11 \------------------------------ \#\# 🛡️ BÖLÜM 4: 5 KATMANLI ASKERİ SİBER GÜVENLİK DUVARI Sistem hem okuma hem de 500 kbps Powertrain hattına aktif olarak komut yazma (injection) yeteneğine sahip olacağı için, hacker sızma risklerini donanımsal ve yazılımsal olarak tamamen imkansız kılan siber kalkan mimarisi: 1\. Katman 1 (Fiziksel Kilit): Araç akü koruma moduna geçip elektriği kesince sistem fiziksel olarak kapanır. Araba kapalıyken havadan hacklenmesi imkansızdır. 2\. Katman 2 (Hayalet Modu \- Stealth): Arduino ilk açıldığında sadece 60 saniye boyunca dış dünyaya Bluetooth sinyali yayar (Advertising). Eğer güvenli telefon bu sürede bağlanmazsa Bluetooth reklam yayını tamamen kapanır ve havada görünmez (hayalet) moduna geçer. 3\. Katman 3 (Beyaz Liste \- Whitelisting): Arduino'nun içine sadece sizin iPhone'unuzun benzersiz UUID/MAC adresi gömülecektir. Başka hiçbir telefon veya cihaz, şifreyi bilse dahi eşleşme isteği bile gönderemez. 4\. Katman 4 (Kriptografik Şifreleme): Geliştireceğiniz iOS uygulaması ile Arduino arasındaki tüm kablosuz paketler AES-128 veya ChaCha20 algoritmalarıyla havada şifreli taşınır. Paketlerin içine milisaniyelik zaman damgası (Timestamp) eklenerek eski paketlerin kopyalanıp araca tekrar fırlatılması (Replay Attack) engellenir. 5\. Katman 5 (Kod Tabanlı Enjeksiyon Filtresi): Arduino yazılımına katı bir kural gömülecektir. Bluetooth veya GPRS üzerinden gelen komutların ne olursa olsun araca doğrudan basılması yasaktır. Gelen veri kodun içindeki güvenli listeden (Command Whitelist) süzülür. Sadece sizin izin verdiğiniz zararsız konfor komutları (Örn: Ayna katlama, ambiyans rengi) araca yazılabilir; motoru kapat veya fren yap gibi harici manipüle edilmiş paketler doğrudan çöpe atılır. \------------------------------ \#\# 💻 BÖLÜM 5: YAZILIM KATMANLARI VE AKILLI MANTIKSAL SENARYOLAR Arduino Nano ESP32'nin içindeki ESP32-S3 işlemcisi FreeRTOS yardımıyla iki çekirdeğe bölünerek görev dağılımı asenkron (gecikmesiz) koşturulur: \#\# çekirdek 0 (Güvenlik ve İletişim Dünyası) Yerel şifreli Bluetooth trafiğini çözer, Stealth Mode zamanlayıcısını yönetir, UUID kontrollerini yapar ve Hub'sız Doğrudan Apple HomeKit (HomeSpan) protokolünü canlı tutarak evinizin önündeyken Siri üzerinden sesli kontrol imkanı sağlar. \#\# çekirdek 1 (Otomotiv ve Işık Dünyası) TJA1050 bypass hattı üzerinden saniyede akan yüzlerce OBD paketini dinler ve şu iki ana duruma göre LED'leri ve ses birimini yönetir: \* DURUM A: Varsayılan Durum (Default Golf 8 Emülasyonu) \* Uygulama kapalıyken veya özel bir komut yoksa, LED'ler Scirocco’nuzun makyajlı MIB2 orijinal ekranındaki "Ambiyans Ayarları" menüsünden seçtiğiniz renk ve parlaklık derecesiyle %100 senkronize çalışır. \* Kapılardan biri açıldığı an, Arduino o kapının mikrosalter verisini CAN hattından okur. O taraftaki şerit LED'leri anında parlak kırmızıya çevirir (İlk 3 kez hızlı kırmızı strobo çakar, sonra sabit kalır). Kapı kapandığında yumuşak bir sönmeyle (fade-out) orijinal teyp rengine geri döner. Araç altı dış LED'ler ise yasal kurallar gereği kapalı kalır, sadece kapı açılınca yere parlak beyaz bir "Halı/Karşılama Aydınlatması" fırlatır. \* DURUM B: Öncelikli Durum (iOS Uygulaması & Performans Override Modları) \* Uygulamadan bir komut geldiğinde veya performans döngüleri tetiklendiğinde orijinal Golf 8 modu askıya alınır: \* Audi Tarzı Kayan Sinyal: Direksiyondan sinyal verildiğinde kapı ve araç altı şeritleri Sarı (RGB: 255, 165, 0\) renkte arkadan öne doğru akar; akış hızı Scirocco’nun dış flaşör zamanlamasıyla milimetrik eşitlenir. \* Cupra Tarzı Gaza Duyarlı Parlaklık: OBD'den anlık gaz pedalı basılma yüzdesi (Throttle) filtrelenir; gaza ne kadar sert basarsanız şeritlerin parlaklığı o oranla anlık artar, ayağınızı çekince sakinleşir. \* Redline / Shift Light (Vites Uyarısı): OBD hattından motor devri (RPM) okunur. Aracınız yüksek devir çevirip vites atma noktasına (6000 RPM üstü) ulaştığında, ön konsol ve tüm şeritler anlık olarak kırmızı flaşör (çakar) yaparak yarış arabalarındaki vites büyütme uyarısını kabine yansıtır. \* Geri Vites Karartma: Aynalarda yansıma yapmaması için araç geri vitese takıldığı an ışıklar otomatik olarak %10 parlaklığa düşürülür. \* Araç İçi İletişim: Telefon uygulamasından bir numaraya dokunulduğunda veya ekrandan tetiklendiğinde, Arduino seri porttan SIM808'e ATD komutunu fırlatarak sesli aramayı anlık başlatır veya gelen çağrıyı ATA ile yanıtlar. SMS'leri metin modunda okuyup gönderir. \------------------------------ Proje dosyamız, lojistik, elektriksel ve siber güvenlik katmanlarıyla hiçbir açık veya kafa karışıklığı kalmayacak şekilde tamamen mühürlenmiştir. Bu nihai ve eksiksiz Proje Plan Dosyasını doğrudan kopyalayıp Gemini üzerinde yeni bir sohbet başlatmak için kullanmaya hazır mısınız? Yoksa malzemeleri sipariş etmeden önce mavi hazır kart üzerindeki TJA1050 entegresinin o kılcal bacak bağlantılarını görsel olarak şemalandırmak ister misiniz?*

*![][image1]*

**TJA1050 Bypass Lehim Haritası**

Mavi renkli hazır MCP2515 SPI kartının üzerindeki kaba kontrol entegresini (U2 / MCP2515) bypass ederek doğrudan **U1 kodlu 8 bacaklı TJA1050 Transceiver** çipinden sinyal alma bağlantısı şu şekildedir:

               ┌───  ───┐  
  (TXD) PIN 1 ─┤1     8 ├─ PIN 8 (STB \- Genellikle GND'ye bağlı)  
  (GND) PIN 2 ─┤2     7 ├─ PIN 7 (CANH ➡️ OBD2 Pin 6\)  
  (VCC) PIN 3 ─┤3     6 ├─ PIN 6 (CANL ➡️ OBD2 Pin 14\)  
  (RXD) PIN 4 ─┤4     5 ├─ PIN 5 (NC \- Boş)  
               └────────┘  
                 TJA1050

**Fiziksel Lehim Adımları**

> * **TXD (Pin 1):** TJA1050 entegresinin **1\. bacağına** (sol üst köşe, noktacık işaretinin yanındaki pin) kılcal bir emayeli tel veya ince bağlantı kablosu lehimleyin. Bu hat **Arduino Nano ESP32 A6 (GPIO 43 / TWAI\_TX)** pinine bağlanır.  
> * **RXD (Pin 4):** Entegrenin **4\. bacağına** (sol alt köşe) ince lehim atın. Bu hat **Arduino Nano ESP32 A7 (GPIO 44 / TWAI\_RX)** pinine bağlanır.  
> * **5V & GND:** Mavi kartın üzerindeki standart **VCC ve GND header pinlerini** kullanabilirsiniz. TJA1050 bu yollardan 5V beslemesini ve ortak şasesini almaya devam eder.  
> * **CANH / CANL:** Mavi kartın üzerindeki klemens klemens uçlarını (CANH ve CANL) doğrudan OBD Y-Splitter kablosunun **6\. (CAN High)** ve **14\. (CAN Low)** hatlarına lehimleyin.

**Dikkat:** MCP2515 çipinin (U2) 1\. ve 2\. bacakları ile TJA1050'nin 1\. ve 4\. bacakları arasındaki PCB yollarını kesmek şart değildir. Ancak Arduino Nano ESP32'nin ESP32-S3 işlemcisinden çıkan TWAI sinyalinin kaba MCP2515 çipinde parazit oluşturmaması için kart üzerindeki **8MHz kristal osilatörün (X1)** tek bir bacağını havyayla söküp boşa çıkarmanız MCP2515 çipini tamamen pasifize eder.

**Sipariş Öncesi Son Kontrol Listesi**

> * \[x\] **İşlemci:** Arduino Nano ESP32 (ESP32-S3, TWAI CAN \+ BLE desteği)  
> * \[x\] **CAN Katmanı:** Mavi MCP2515 kartı (TJA1050 çip bypass yöntemiyle)  
> * \[x\] **Hücresel & GPS:** SIM808 GSM/GPRS \+ GPS modülü  
> * \[x\] **Güç Katmanı:** 12V ➡️ 5V LM2596 Buck Converter (SIM808 anlık akım pikleri için)  
> * \[x\] **Işık:** 1.8mm ZBL İç Mekan COB LED \+ WS2815 Dış Mekan IP68 LED

Proje dosyası ve donanım mimarisi eksiksiz şekilde hazırdır.

---

*User prompt: \# 2016 VW Scirocco — CAN Bus Ambiyans LED \+ DIY VAG Kodlama Sistemi \#\# Proje Planlama Oturumu — 15-16 Eylül 2026 \--- \#\#\# 👤 Kullanıcı incele, araştır fikri geliştir olgunlaştır mantık hatalarını ve diğer konuları bana sorarak geliştir ve olgunlaştır \--- \#\#\# 🤖 Claude Dosyayı satır satır inceledim; birkaç noktayı doğrulamak için de kısa bir araştırma yapıyorum. Dosyayı satır satır inceledim; ZBL şeridini, PQ35 gateway yapısını ve Nano 33 BLE/FastLED durumunu da ayrıca araştırdım. Konsept sağlam, ama olduğu gibi uygulanırsa altı yerde duvara çarpar. Önce onlar, sonra öneriler, sonra sorular. \#\# 1\. Yapılırsa çalışmayacak noktalar \*\*a) OBD portu 500k motor hattı değil.\*\* PQ35'te OBD pin 6/14 gateway'in diyagnoz tarafında durur; motor/ABS'nin yayın mesajları (0x280 RPM gibi) orada akmaz, sadece sorgu-cevap çalışır. Gateway J533 ayrı bir modüldür, Antriebs-/Komfort-/Infotainment-CAN arasındaki veri alışverişini o yapar; Golf 5'te sol ayak boşluğunda, orta konsolun yanındadır. Yani "A mı B mi" sorusu yanlış kurulmuş: kapı/sinyal/kilit/Kl.15 → Komfort-CAN (100k), RPM/gaz pedalı → Antriebs-CAN (500k), MIB menüsü → Infotainment-CAN. Hepsinin buluştuğu tek konnektör gateway'inki. Ya oradan iki hat dinlenir, ya da gaz/redline özelliklerinden vazgeçilir. \*\*b) "Gecikmeli iç aydınlatma \+12V" büyük ihtimalle yok.\*\* PQ35'te tavan/ayak lambalarını BCM şase tarafından PWM ile kısar; lambadaki \+12V sabit Kl.30'dur. Oradan beslenen kontrolcü her fade'de resetlenir. Katman 1'in temeli bu varsayım; multimetre/osiloskopla doğrulanmadan ilerlenmemeli. Doğru mimari: Kl.30 \+ kendi sigortası \+ derin uyku \+ CAN aktivitesiyle uyanma; şerit gücü MOSFET ile tamamen kesilir (adreslenebilir şerit "kapalı"yken bile IC başına \~1 mA çeker; park hâlinde aküyü bitirir). \*\*c) iPhone MAC/UUID beyaz listesi mümkün değil.\*\* iOS, BLE adresini \~15 dakikada bir değiştirir (RPA); uygulamadaki UUID ise telefonun kendine ürettiği bir kimlik, havaya hiç çıkmaz. Çözüm: LE Secure Connections ile bonding → IRK ile adres çözümleme \+ whitelist, üstüne yalnız bonded telefona görünen directed advertising (gerçek hayalet mod). 60 sn penceresini sürücü kapısı/Kl.15 olaylarıyla yeniden açtır. Zaman damgası da çalışmaz, kartta senkron saat yok; onun yerine challenge-response: kart nonce üretir, uygulama HMAC/AES-GCM ile yanıtlar. \*\*d) MCP2515 modülü 3,3 V'ta çalışmaz.\*\* Modüldeki TJA1050 en az 4,75 V ister; tek VCC'den 3,3 V verirsen hat sessiz kalır. Modülde fabrikadan 120 Ω sonlandırma takılıdır, araca takılmadan sökülmesi şart. TX kesme fikri iyi ama eksik: normal modda MCP2515 ACK basmaya çalışıp okuyamayınca hata sayaçları şişer. Yazılımda Listen-Only mod zorunlu; TX kesiği onun mekanik yedeği. \*\*e) Seviye dönüştürücü yok.\*\* 3,3 V data, 12 V şerit IC'sinin eşiğinin (≈0,7×VDD) sınırında; 74AHCT125 gibi bir buffer şart. Nano'nun VIN'i zaten 21 V'a kadar kabul ediyor; buck yine de dursun ama TVS'siz 12 V asla. \*\*f) Nano 33 BLE \+ FastLED riskli.\*\* FastLED'in Nano 33 BLE'de derlenmeme sorunu forumda ve GitHub \#917'de kayıtlı. BLE yığınının kesmeleri WS281x'in mikrosaniye zamanlamasını bozar. \#\# 2\. Şerit gerçeği (ZBL sayfasından) Kart 1,8×10 mm, 15 W/m, kesim boyu 12 V'ta 20 mm, maksimum hat 5 m; protokol "WS2811/WS2812/SK6812 uyumlu SPI" diye geçiyor. Anlamı: oluğa 10 mm derinlik lazım; 12 V'ta \~1,25 A/m, 3,5 m tam beyazda ≈4,4 A (iç aydınlatma sigortasından olmaz, kendi 7,5 A sigortası); piksel çözünürlüğü 20 mm, 600 LED ≠ 600 piksel. IC tipi ve RGB sırası sorulmalı. Standart MOQ SKU başına 100 metre; numune alınıp alınamayacağı projenin kaderi. \#\# 3\. Mimari önerim ESP32-S3: yerleşik TWAI (donanımsal Listen-Only modu var, salt-okunur garantisi çevre biriminden gelir), RMT ile donanım zamanlamalı LED, NimBLE ile bonding/whitelist, BLE bir çekirdekte LED+CAN diğerinde, OTA. ESP32 tarafı sana zaten yabancı değil. Tek çekirdekli C3'te FastLED 3.9.10+ ile BLE aktifken ağır titreme rapor edildi; S3 \+ sürüm sabitleme bunu çözer. İki hat gerekirse ESP32-C6 (2×TWAI). Hazır otomotiv kart istersen RejsaCAN-ESP32-S3 (12 V giriş, transceiver, akü koruma) tam bu iş için yapılmış; stok durumuna bakmak lazım. \#\# 4\. Daha küçük ama gerçek \- Sinyal senkronu: kendi delay'ini "aynı hıza ayarlamak" yerine CAN'daki flaşör bitinin yükselen kenarında sweep başlat; tanım gereği senkron. \- Öncelik/durum makinesi yok. Kapı kırmızı \+ sinyal \+ redline aynı anda? Öneri: temel katman (MIB rengi × gösterge dimmer 58d × far) → olay katmanları (geri vites \> kapı \> sinyal \> redline) → uygulama override; mesaj 2 sn kesilirse tabana dön. \- 58d takibi dosyada hiç yok; OEM hissinin yarısı bu. \- "ACC" VW'de yok, Kl.15/Kl.S var. OEM welcome kilit açılınca olur, bu da Kl.30 mimarisini zorlar. \- Golf 8'de kapı açıkken düz kırmızı; yanıp sönen kırmızı arka radarlı "çıkış uyarısı". Strobo tercih olarak kalabilir, OEM emülasyonu değil. \- Araç kablosuna lehim değil crimp (titreşimde çatlar). Kapı körüğünden geçen 800 kHz data için GND ile bükümlü çift, gerekirse şerit girişinde tek piksel repeater. \- "Askeri düzey / sıfır gecikme" dili spec'ten çıksın; gerçek risk hacker değil, CAN-H/L'yi yanlış bağlayıp aracı kilitlemek. \#\# 5\. Yazılı cevap istediklerim 1\. MIB2'de ambiyans menüsünü gerçekten açtın mı (Car\_Function\_Adaptations\_Gen2 → menu\_display\_ambient\_light?) ve renk değiştirince Infotainment-CAN'de bir mesajın değiştiğini gördün mü? Görmediysen sıfırıncı adım bu log. 2\. ZBL'den numune ve IC bilgisi alabildin mi? 3\. Tavan lambası konnektöründe ölçüm yaptın mı: hangi pin sabit \+12, anahtarlanan pin PWM mi? 4\. Manuel mi DSG mi? Geri vites sinyalinin kaynağı değişir. 5\. Elinde log ekipmanı var mı (ikinci MCU+transceiver, USB-CAN, OBD dongle)? Masaüstü için iki ESP32 yeter: biri sahte BCM olup kapı/sinyal mesajı basar. Şu üçünü de tıklayarak cevaplayabilirsin; sonraki adımda parça listesi ve mimari şemayı buna göre çıkaracağım. \--- \#\#\# 👤 Kullanıcı Q: Sistem ne zaman uyanıp welcome animasyonunu oynatmalı? A: Artı/eksiyi tartışalım Q: CAN'a nereden dokunmaya varsın? A: Gateway J533 konnektörü (tüm hatlar) Q: Kontrolcü platformu? A: elimde nano esp32 var o yüzden bundan ilerde değiştire biliriz \--- \#\#\# 🤖 Claude \#\# 1\. Uyanma tetikleyicisi: Kl.30+uyku mi, Kl.15 mi? | | \*\*Kl.30 \+ Derin Uyku (gerçek OEM welcome)\*\* | \*\*Kl.15 (basit)\*\* | |---|---|---| | Ne zaman tetiklenir | Kilit açılır açılmaz, kapı henüz açılmadan | Kontak açılınca (kapı zaten açık, sen içeri girmişsin) | | Gerçekçilik | Golf 8'deki gibi "seni bekliyormuş" hissi | Welcome animasyonu anlamını yarı yarıya kaybeder | | Gerekli donanım | CAN transceiver'ın \*\*wake-on-bus-activity\*\* özelliği olmalı (örn. TLE9251, NCV7356/7442) — sıradan SN65HVD230/MCP2551'de bu yok | Herhangi bir transceiver yeterli | | Akü riski | Yanlış yapılırsa parazitik akım \= akü bitirir; doğru yapılırsa µA seviyesinde | Sıfır risk, sistem zaten kapalı | | Yazılım karmaşıklığı | ESP32 deep-sleep \+ external wake interrupt \+ CAN aktivite algılama | Basit power-on | \*\*Önerim:\*\* İkiye bölelim. \- \*\*v1 (şimdi):\*\* Kl.15 tetikli. Basit, güvenli, akü riski sıfır. Welcome animasyonu kontak açılışında oynar — OEM'den daha az etkileyici ama çalışır ve test edilebilir. \- \*\*v2 (sistem stabilize olduktan sonra):\*\* Kl.30 \+ wake-capable transceiver'a geçilir, gerçek "kilit aç → animasyon başlar" davranışı eklenir. Bunu v1'in üzerine koymak, v1'i atlayıp direkt v2'ye gitmekten çok daha az riskli — çünkü CAN/LED mantığı zaten test edilmiş oluyor, sadece güç mimarisi değişiyor. Sence de bu sıralama mantıklı mı, yoksa riski göze alıp direkt v2 ile mi başlamak istersin? \#\# 2\. Gateway J533 konnektörü — tüm hatlara erişim Doğru seçim: gateway'de Antriebs-CAN (500k), Komfort-CAN (100k) ve Infotainment-CAN aynı modülde toplanıyor. Ama iki pratik sorun var: \*\*a) Pin tespiti araca özel.\*\* Kablo renkleri şasi/model yılına göre değişir; "genel VW forum bilgisi" ile kesmek riskli. VIN'ine özel şema (Ross-Tech/ELSAWin) olmadan hiçbir teli kesmeyeceğiz. Bulduğumuzda: \- Multimetre ile bekleme voltajı doğrulanacak (CAN-H/L rölanti \~2,5V, ikisi arasında \~0V fark) \- Osiloskop/mantık analizörle gerçek trafik görülmeden nihai bağlantı yapılmayacak \- Kablo \*\*kesilmeyip\*\* delmeli konnektör (Scotchlok tarzı iğneli bağlantı) yerine düzgün lehim \+ ısı büzüşmeli manşon veya orijinal Superseal splice kullanılacak; akü SIM(-) bağlantısı sökülü halde çalışılacak \- İşlem sonrası VCDS/OBD ile yeni arıza kodu (DTC) çıkmadığı teyit edilecek \*\*b) Donanım kısıtı — bu senin karar vereceğin kısım.\*\* Nano ESP32 (ESP32-S3) üzerinde \*\*tek\*\* donanımsal TWAI (CAN) kontrolcüsü var. Aynı anda 3 ayrı CAN hattını tek TWAI ile dinleyemeyiz. Seçenekler: 1\. \*\*Native TWAI → Antriebs-CAN\*\* (RPM/gaz pedalı, zamanlaması en kritik olan, donanımsal kontrolcü hak ediyor) 2\. \*\*Harici MCP2515 (SPI) → Komfort-CAN\*\* (kapı/sinyal/Kl.15 durumu, trafik daha seyrek, SPI gecikmesi sorun olmaz) 3\. \*\*Infotainment-CAN (MIB2 renk menüsü) v1'de atlanır\*\* — istersen ikinci bir MCP2515'i aynı SPI hattına, ayrı CS pini ile ekleyip 3'ü de kapsarız, ama bu ekstra bir modül ve karmaşıklık demek. \#\# 3\. Nano ESP32 — iyi haber "Nano ESP32" dediğin, Arduino'nun u-blox NORA-W106 modülüyle ürettiği kart — içi \*\*ESP32-S3\*\*, tam da önerdiğim platform. Yani: \- FastLED \+ WS281x zamanlaması RMT donanımıyla sorunsuz (Nano 33 BLE'deki derleme/titreme sorunları burada yok) \- NimBLE ile gerçek bonding \+ IRK tabanlı adres çözümleme \+ whitelist yapılabilir (önceki mesajda bahsettiğim "gerçek hayalet mod") \- 3,3V mantık seviyesi aynı kalıyor, MCP2515/seviye kaydırıcı ihtiyacı değişmiyor \- Pin haritası Nano 33 BLE'den farklı — parça listesini ve şemayı buna göre çıkaracağım \--- \#\#\# 👤 Kullanıcı Q: v1→v2 kademeli plan (Kl.15 ile başlayıp sonra Kl.30+uyanmaya geçmek) uygun mu? A: önce riskleri çözelim sonra kademeli olarak devam edelim Q: CAN kapsamı için hangi seçenek? A: Sen karar ver, öner \--- \#\#\# 🤖 Claude \#\# Risk kayıt defteri — her biri için somut çözüm | \# | Risk | Çözüm | v1'de mi? | |---|---|---|---| | 1 | Kl.30 sürekli besleme → akü bitirme | \*\*v2'ye ertelendi.\*\* v1 Kl.15'ten beslendiği için bu risk şimdilik yok. v2'de wake-capable transceiver (aşağıda) \+ ESP32 deep-sleep (\<10 µA) \+ akım ölçümüyle doğrulama zorunlu olacak. | Hayır — ertelendi | | 2 | Wake-on-bus transceiver seçimi | v2 için aday: \*\*NCV7356\*\* veya \*\*TLE9251V\*\* (CAN aktivitesiyle STANDBY'den uyanma pini var). Şimdiden not edildi, sipariş listesine v2 etiketiyle eklenecek. | Hayır — ertelendi, ama parça şimdiden belirlendi | | 3 | Yanlış CAN-H/L bağlantısı, bus hatası, gateway'i bozma | Splice \*\*öncesi\*\* multimetre \+ osiloskop doğrulaması, akü SIM(-) sökülü çalışma, splice sonrası VCDS/OBD ile DTC kontrolü. Bu bir kerelik işlem talimatı; ilk fiziksel bağlantıda uygulanacak. | \*\*Evet — v1'de zorunlu\*\* | | 4 | MCP2515 3,3V mantık uyumsuzluğu \+ fabrika 120Ω sonlandırma | MCP2515 modülünün VCC'si Arduino'nun \*\*5V pininden\*\* (Nano ESP32'de 5V çıkışı var), sadece SPI hatları 3,3V mantıkta zaten uyumlu (MCP2515 SPI girişleri 5V toleranslı). Araca takmadan önce modüldeki 120Ω direnç sökülecek (gateway'e giden hatta zaten sonlandırma var, ikinci sonlandırma bus'ı bozar). | \*\*Evet — v1'de zorunlu\*\* | | 5 | 3,3V data → 12V LED IC eşik sorunu | 74AHCT125 seviye kaydırıcı (buffer) DIN hatlarına eklenecek. | \*\*Evet — v1'de zorunlu\*\* | | 6 | iOS BLE adresi değişken (RPA), sabit whitelist imkansız | LE Secure Connections \+ bonding → IRK ile adres çözümleme, directed advertising sadece bonded cihaza. | \*\*Evet — v1'de zorunlu\*\* (uygulama katmanı, donanımdan bağımsız) | | 7 | Replay attack (zaman damgası senkron saat gerektirir) | Timestamp yerine \*\*challenge-response\*\*: kart rastgele nonce üretir, uygulama HMAC-SHA256/AES-GCM ile imzalar. | \*\*Evet — v1'de zorunlu\*\* | | 8 | CAN injection riski | TWAI/MCP2515 \*\*Listen-Only modu\*\* yazılımsal \+ MCP2515'in TX hattı fiziksel olarak kesilecek (Antriebs-CAN tarafı, native TWAI'de ise TX pini bağlanmayacak). | \*\*Evet — v1'de zorunlu\*\* | | 9 | FastLED/BLE kesme çakışması | Nano ESP32 (ESP32-S3) \+ RMT donanımsal sürücü ile çözüldü, ayrıca test edilecek. | \*\*Evet — v1'de doğrulanacak\*\* | | 10 | Kablo lehim/crimp dayanıklılığı, titreşim | Araç tarafı bağlantılar crimp \+ ısı büzüşmeli, lehim yok. | \*\*Evet — v1'de zorunlu\*\* | Yani "risk çöz" dediğin şey aslında büyük ölçüde zaten v1'in içine gömülü — v2'ye ertelenen tek gerçek risk kümesi Kl.30/parazitik akım (1-2). Geri kalan 8 madde v1 kurulumunun parçası, çünkü LED/CAN/BLE mantığı v2'de değişmeyecek, sadece güç mimarisi değişecek. \#\# CAN kapsamı önerim: \*\*Antriebs \+ Komfort, Infotainment v1'de yok\*\* Gerekçe: \- Infotainment-CAN'in tek katkısı MIB2 ekran rengiyle senkron — işlevsel değil, kozmetik. iOS uygulaması zaten renk seçimini kendi başına yapabiliyor; MIB2 senkronu "varsayılan Golf 8 hissi"nin küçük bir parçası, kritik değil. \- İkinci bir MCP2515 eklemek SPI hattında CS pini paylaşımı, ek splice noktası, ek arıza yüzeyi demek — risk/fayda oranı düşük. \- v2'ye ertelemek kolay: donanım zaten SPI bus'ına ikinci CS ile eklenebilir durumda kalır, sadece yazılımda yeni bir dinleyici eklenir. \#\# Sıradaki somut adım Riskler netleşti, kademeli plan onaylandı. Bir sonraki adım olarak şunlardan hangisini istersin: \--- \#\#\# 👤 Kullanıcı Q: Şimdi hangisiyle devam edelim? A: Masaüstü test düzeneği (2 ESP32) \+ parça alışveriş listesi \--- \#\#\# 🤖 Claude Uygun mimari testi için iki node gerekiyor: biri \*\*fake BCM\*\* (gerçek CAN mesajlarını simüle eden), diğeri \*\*cihaz altında test (DUT)\*\* — yani projenin kendisi. Önce gerçek CAN ID'lerini teyit etmek için hızlı bir araştırma yapayım, çünkü bunları hafızadan uydurmak riskli. Önce doğrulanmış veri, sonra rig tasarımı, sonra liste. \#\# Antriebs-CAN referans verisi (doğrulandı) Bağımsız iki kaynak (rusefi forumu ve Hackaday) aynı ID'yi doğruluyor: 0x280 ID'li mesaj mMotor\_1 olarak, byte 3/4'te RPM, byte 6'da pedal yüzdesini taşıyor, ayrıca bağımsız bir projede de RPM göstergesinin 500 kbps hatta 0x280 ID'sinde olduğu teyit edilmiş. Bu, Scirocco'nun temelini oluşturduğu VAG PQ ailesinde tutarlı görünüyor — test rig'inde başlangıç noktası olarak kullanacağız, ama \*\*araca özel teyit hâlâ gerekli\*\* (bayt sırası/ölçek yıla göre kayabilir). \*\*Komfort-CAN (kapı, sinyal, Kl.15) için\*\* güvenilir, doğrulanmış bir ID bulamadım — bunlar VW'nin yayınlamadığı proprietary alan, araca özel. Bench'te bu yüzden \*\*placeholder ID'lerle\*\* başlayacağız; gerçek ID'ler ancak gateway splice'ı güvenli şekilde yapıldıktan sonra (önceki mesajdaki risk \#3 prosedürü) araçtan alınacak canlı logla netleşecek. Bu bench rig'in asıl amacı zaten o an: gerçek ID'ler elimize geçtiğinde kod tarafının hazır olması. \#\# Rig mimarisi \*\*Node A — "Sahte BCM"\*\* (aracı simüle eder) \- Native TWAI → Antriebs-CAN, 500 kbps, 0x280 üzerinden RPM/gaz pedalı yayınlar \- MCP2515 (SPI) → Komfort-CAN, 100 kbps, placeholder ID'lerle kapı/sinyal/Kl.15 durumu yayınlar \- Basit bir seri komut arayüzü (USB üzerinden \`rpm=4500\`, \`door=open\`, \`signal=left\` gibi) — testte elle tetikleme için \*\*Node B — "DUT"\*\* (projenin kendisi) \- Native TWAI ile Antriebs'i dinler, MCP2515 ile Komfort'u dinler \- 74AHCT125 üzerinden gerçek bir LED şerit parçasını sürer (ZBL numunesi geldiyse onunla, gelmediyse herhangi bir WS2812B/SK6812 şeritle FastLED/RMT testi geçerli) \- BLE bonding \+ challenge-response mantığı buraya yazılacak, iOS uygulaması gelene kadar nRF Connect gibi genel bir BLE test app'iyle doğrulanabilir İki node arası \*\*iki ayrı fiziksel bus\*\* (Antriebs ve Komfort birbirine karışmaz) — her biri sadece bükümlü iki tel \+ her iki ucunda 120Ω sonlandırma. \#\# Parça listesi | Parça | Adet | Not | |---|---|---| | Arduino Nano ESP32 | 2 | Elindeki \+ gerekiyorsa 1 tane daha | | SN65HVD230 CAN transceiver modülü (3,3V) | 2 | Antriebs/TWAI hattı için, her node'a 1 | | MCP2515+TJA1050 CAN modülü (SPI) | 2 | Komfort hattı için, her node'a 1 — modüldeki 120Ω jumper'ı sadece uç node'larda aktif kalacak | | 74AHCT125 (seviye kaydırıcı) | 1 | Sadece DUT'ta, LED data hattı için | | Test LED şeridi (WS2812B/SK6812, kısa parça) | 1 | ZBL numunesi gelmediyse jenerik olan yeterli | | 12V bench güç kaynağı (LED şeridi için) | 1 | Şerit 12V, Arduino 5V ayrı besleniyor | | Breadboard \+ jumper kablo seti | — | | | Bükümlü çift kablo (CAN hatları için, opsiyonel ama önerilir) | \~2m | Adi jumper da bench'te çalışır ama gerçekçi değil | | USB kablo x2 | — | Muhtemelen zaten var | | (Opsiyonel) Ucuz USB mantık analizörü | 1 | SPI/CAN/WS281x zamanlamasını gözle görmek çok işe yarar, debug'ı hızlandırır | Elinde şu an \*\*kaç tane\*\* Nano ESP32 var — bir mi, iki mi? Ve MCP2515/SN65HVD230 modüllerinden stokta olan var mı, yoksa hepsini sıfırdan mı sipariş edeceğiz? \--- \#\#\# 👤 Kullanıcı arabada test edelim bu kadar parça yok \--- \#\#\# 🤖 Claude Anladım — ama şunu net söylemem lazım: masaüstü simülasyonunu atlayıp direkt araca geçmek, yazılım hatalarını canlı CAN hattında ayıklamak demek. Bunu tamamen güvenli hale getiremeyiz ama \*\*riski en aza indiren bir sıralama\*\* kurabiliriz. \#\# Kritik kural: İlk sürüm sadece dinler, hiçbir şey yazmaz Araçta ilk kez çalıştıracağımız kod \*\*salt-okunur (Listen-Only) modda\*\*, LED'e bile dokunmadan sadece CAN paketlerini USB üzerinden bilgisayara loglayacak. Parsing, LED kontrolü, BLE — hepsi bu loglar analiz edildikten \*sonra\*, yine masada yazılacak. Araçta yazılım geliştirmiyoruz, sadece veri topluyoruz. \#\# Aşamalı plan (tek node ile) \*\*Faz 1 — Sadece Komfort-CAN, sadece dinleme\*\* En düşük riskli hat (100 kbps, motor/güvenlik sistemlerine uzak) ile başlıyoruz. Antriebs-CAN (500 kbps, motor/RPM) ikinci faza kalıyor. Gerekenler: \- Elindeki Nano ESP32 \- MCP2515 \+ TJA1050 modülü (tek adet) \- Multimetre (zorunlu — bağlantı öncesi voltaj doğrulaması için) \- Isı büzüşmeli manşon / lehim seti (splice için, elektrik bandı yok) \- Laptop \+ USB kablo (loglama için) \#\# Splice öncesi zorunlu adımlar (kısayol yok) 1\. Akü SIM(-) sökülü 2\. Gateway konnektöründe hangi iki pinin Komfort-CAN H/L olduğu VIN'e özel şemadan teyit edilecek — tahminle bağlanmıyoruz 3\. MCP2515 modülündeki 120Ω sonlandırma jumper'ı \*\*sökülecek\*\* (araç zaten kendi hattını sonlandırmış, ikinci direnç bus'ı bozar) 4\. Bağlantı yapılmadan önce multimetreyle bekleme voltajı ölçülecek (\~2,5V her iki hat) 5\. Bağlantı sonrası VCDS/OBD ile yeni DTC çıkmadığı kontrol edilecek 6\. İlk çalıştırma araç \*\*dururken, kontak kapalı\*\* yapılacak — hiçbir zaman sürüş sırasında ilk test yok \#\# Faz 2 — Log analizi (masada) Araçtan alınan ham log (kapı aç/kapa, sinyal ver, kontak aç/kapa döngüleri) laptopta incelenip gerçek ID'ler bulunacak. Ancak bundan sonra parsing kodu ve basit bir LED tepkisi (örn. tek bir test LED'i kapı açılınca yanıp sönsün) yazılıp tekrar araçta — yine sadece dinleme modunda — doğrulanacak. \#\# Faz 3 — Antriebs-CAN (RPM/gaz pedalı) Komfort tarafı stabil çalıştıktan sonra, ikinci bir transceiver (SN65HVD230, native TWAI ile) eklenip 500 kbps hatta geçilecek. Bu, motor kontrolüne en yakın hat olduğu için en son bırakılıyor. Şu an elinde gerçekten ne var — Nano ESP32 dışında MCP2515 modülün var mı, yoksa onu da mı sipariş edeceğiz? Ve VIN'e özel gateway pin şemasına (Ross-Tech/ElsaWin ya da bayi) erişimin var mı, yoksa onu bulmak da yol haritasının bir parçası mı olsun? \--- \#\#\# 👤 Kullanıcı önceliğimiz arabanın teyp yazılımını güncellemek gizli menülerini açma arduino ile canbus gateway üzerinden renk tetiklerini okuyarak ledlerinn renk parlaklık açma ve kapama işlemlerini yapma \--- \#\#\# 🤖 Claude Burada iki farklı iş var ve onları ayırmak lazım — birbirine karıştırılırsa proje çıkmaza girer. Önce bunu netleştirip sonra araştırayım. \*\*İş 1 — MIB2'de gizli menüyü açmak:\*\* Bu Arduino'nun işi değil. Head unit'in "long coding" / adaptation byte'larını değiştirmek gerekiyor, bu da VCDS, OBDeleven, veya benzeri bir tanı aracıyla yapılır — UDS diagnostic protokolü üzerinden, tek seferlik bir kodlama işlemi. Arduino'nun burada hiçbir rolü yok. \*\*İş 2 — Arduino'nun rengi/parlaklığı CAN'dan okuyup LED'e basması:\*\* Bu bizim asıl projemiz, ama menü açıksa anlamlı — çünkü Arduino'nun dinleyeceği "renk seçildi" mesajı ancak menü aktifken CAN'a düşer. Yani sıra şu: önce menüyü aç (İş 1), sonra Arduino o menüden çıkan CAN mesajını dinlesin (İş 2). Bunun için MIB2'de spesifik olarak hangi adaptation kanalının bu menüyü açtığını ve mesajın hangi CAN ID'sinde göründüğünü araştırayım. Bu iyi bir haber getirdi — plan basitleşiyor, çünkü bulduğum kaynaklara göre (MIB2 sistemlerindeki ambiyans ışığı üzerine yapılan community araştırması) \*\*renk komutu Infotainment-CAN'de değil, Komfort-CAN'de\*\* dolaşıyor — "Interieur light" fonksiyonu adaptation'da "msg bus: comfort data bus" olarak işaretli. Yani zaten Faz 1'de tapping planladığımız hat (Komfort-CAN), aynı zamanda ihtiyacımız olan hat. Üçüncü bir CAN bus'a (Infotainment) gerek kalmıyor. Ama iki ayrı iş olduğunu netleştirelim, çünkü bunlar farklı araçlar gerektiriyor: \#\# İş 1: Menüyü açmak — VCDS/OBDeleven işi, Arduino değil Bulduğum dokümantasyon (Golf Mk7/Passat B8 MIB2 örnekleri) genel akışı gösteriyor: \- \*\*Modül 5F (Info Elektronik):\*\* Adaptation → \`Car\_Function\_Adaptations\_Gen2\` → \`menu\_display\_ambient\_illumination\` \= active \- \*\*Modül 09/61 (Central Electrics/Bordnetz):\*\* Security Access kodu (örn. 31347\) girildikten sonra Adaptation → "Ambient lighting" ile ilgili kanal aktive edilir \- Renk sayısı (10 mu 30 mu) ayrı bir long coding byte'ıyla belirlenir — "Ambient light color list 2" kanalı varsa 30 renk, yoksa 10 renk \*\*Kritik soru:\*\* Bu adımlar Golf Mk7/Passat B8 gibi \*\*MQB\*\* platformlarından geliyor. Senin aracın \*\*PQ35 tabanlı\*\* — kanal isimleri, modül numaraları, byte offsetleri farklı olabilir. Ayrıca: 1\. Scirocco'da MIB2 \*\*fabrika çıkışlı mı\*\*, yoksa sonradan \*\*retrofit\*\* mi takıldı? Bu çok belirleyici — orijinal RCD/RNS yerine MIB2 takılmışsa, önce donanımsal retrofit'in (kablo demeti, CAN gateway kodlaması) tam oturduğunu doğrulamak gerekiyor, adaptation kanalları donanım tanınmadan görünmeyebilir. 2\. VCDS ya da OBDeleven'e erişimin var mı? Bu iş Arduino'yla yapılamaz, mutlaka bu araçlardan biri lazım. \#\# İş 2: Arduino'nun rengi okuyup LED'e basması Menü açıldıktan ve VCDS/OBDeleven ile bir renk seçildikten sonra, o an Komfort-CAN'de yeni bir mesaj/değer değişimi olacak. Bunu bulmanın yolu: Faz 1'deki dinleme rig'ini (önceki mesajlardaki plan) çalıştırıp, sen menüden renk değiştirirken logu izlemek — "önce X, sonra menüden kırmızı seç, log'da hangi ID değişti" yöntemiyle. Gerçek ID'yi tahmin etmiyoruz, ölçüyoruz. Açma/kapama ve parlaklık da muhtemelen aynı mesajın farklı byte'larında olacak (menüdeki parlaklık slider'ı ayrı bir CAN değeri değiştiriyor olmalı) — aynı log oturumunda hepsini yakalarız. \--- Devam edebilmemiz için üç şeyi bilmem lazım: \--- \#\#\# 👤 Kullanıcı Q: Aracın MIB2 head unit'i fabrika çıkışlı mı? A: Evet, fabrikadan MIB2 geldi Q: VCDS veya OBDeleven erişimin var mı? A: OBDeleven var \--- \#\#\# 🤖 Claude MIB2 fabrikadan geldiyse büyük avantaj — donanım/kablo demeti zaten orada, sadece kodlama meselesi. OBDeleven'in PQ35 platformu için hazır bir "ambient light" uygulaması olup olmadığını kontrol edeyim, çünkü topluluk bazen bunu paketliyor ve elle byte aramaktan çok daha hızlı olur. PQ35 \+ Scirocco kombinasyonuna özel hazır bir OBDeleven uygulaması bulamadım — bulduğum sonuçların neredeyse tamamı MQB platformu (Golf 7, Passat B8). Bu, "hazır çözüm yok, elle keşif gerekecek" demek — ama imkansız değil, sadece daha metodik ilerlemek lazım. \#\# Gerçekçi durum Forum örneklerinden biri ("xzibit15") tam bize benzer bir yöntem uyguluyor: kendi aracına uymayan byte değerini başka araçlardan aldığı referanslarla deneme-yanılmayla buluyor. Yani bizim yapacağımız da bu — kanal var mı yok mu önce görülecek, sonra değer denenecek. \#\# Önce netleştirmemiz gereken: OBDeleven planın Pro mu? Long Coding / custom adaptation değişikliği \*\*ücretsiz OBDeleven'de yok\*\* — sadece temel tarama ve hazır "app" satın alımı yapılabilir. Elle byte değiştirmek (Custom mode / Long Coding Helper eşdeğeri) \*\*Pro abonelik\*\* gerektiriyor. \#\# Somut ilk adım (araçta, riski düşük) 1\. OBDeleven'i bağla, \*\*5F (Info Elektronik)\*\* modülüne git 2\. Adaptation listesinde \`Car\_Function\_Adaptations\_Gen2\` benzeri bir kanal (ya da \`menu\_display\_ambient\_illumination\` gibi isimler) \*\*var mı yok mu\*\* kontrol et — sadece bak, değiştirme 3\. Aynı şekilde \*\*09 (Central Electrics)\*\* ya da PQ'da karşılığı olan Bordnetz modülünde "ambient"/"interior light" geçen adaptation kanallarını listele 4\. Ne bulduğunu ekran görüntüsüyle paylaş — mevcut byte değerlerini \*\*değiştirmeden önce\*\* kaydetmemiz lazım (geri dönüş için) Bu adım sadece \*\*okuma\*\*, hiçbir değer değiştirmiyoruz — güvenli. Değer değiştirmeye ancak hangi kanalın gerçekten var olduğunu gördükten sonra geçeceğiz. Pro aboneliğin var mı, ve 5F/09 modüllerine adaptation listesini görüntüleyebiliyor musun? \--- \#\#\# 👤 Kullanıcı çok detaylı dönüyorsun özet hızlı cevaplar ver \--- \#\#\# 🤖 Claude Tamam, kısa keseceğim. Pro aboneliğin var mı? Ve 5F/09 modüllerinde adaptation listesini görebiliyor musun? \--- \#\#\# 👤 Kullanıcı şuan plan yapıyoruz projeyi uygulayacakmış gibi düşünme \--- \#\#\# 🤖 Claude Anladım — plan aşamasındayız, sahada değiliz. O zaman Pro/OBDeleven sorusunu boşver. Planda şimdi neyi netleştirelim: kodlama adımlarını (5F/09 kanal isimleri, olası byte'lar) teorik olarak mı listeleyeyim, yoksa genel mimariyi (menü açma → CAN log → Arduino) tek sayfalık özet halinde mi çıkarayım? \--- \#\#\# 👤 Kullanıcı vw scirecco obd arkasından arduino ile obd cihazı takmış gibi tüm verileri okuya bilir miyim ama orjinal obd portunu işgal etmek istemiyorum \--- \#\#\# 🤖 Claude \*\*Fiziksel olarak evet, mümkün.\*\* OBD portunu bloklamadan, \*\*Y-splitter/çift çıkışlı OBD adaptör\*\* kablosuyla Arduino'yu paralel takabilirsin — VCDS/OBDeleven ile aynı anda kullanılabiliyor, port işgal edilmiyor. Bu, gateway konnektörüne kablo kesip splice yapmaktan çok daha düşük riskli bir yöntem. \*\*Ama ne alabileceğin veriye göre değişiyor — iki ayrı kategori:\*\* 1\. \*\*Standart OBD-II PID'leri (RPM, gaz pedalı gibi):\*\* OBD portunda gerçekten var, evrensel protokol, kolay okunur. Redline/gaza duyarlı parlaklık için bu yeterli — hatta önceki planımızdaki Antriebs-CAN'e direkt splice yapma ihtiyacını ortadan kaldırıyor. 2\. \*\*VW'ye özel veri (kapı durumu, sinyal, ambiyans rengi):\*\* OBD portunda \*\*ham/sürekli akış olarak yok\*\*. Gateway bunu sadece "sorulunca cevap veriyorum" (UDS) mantığıyla veriyor — yani Arduino'nun her an kapı açık mı diye sürekli soru sorması lazım, bu hem yavaş hem karmaşık, gerçek zamanlı LED tepkisi için pratik değil. \*\*Özet:\*\* RPM/gaz pedalı → OBD \+ Y-splitter yeterli. Kapı/sinyal/renk gibi anlık veriler → hâlâ Komfort-CAN'i fiziksel olarak dinlemek gerekiyor (gateway ya da uygun bir noktadan). \--- \#\#\# 👤 Kullanıcı ayrıca bu araç multimedyasından renkleri kontrol edebilir miyim \--- \#\#\# 🤖 Claude \*\*Evet, mantıklı bir yol bu.\*\* Zaten planladığımız şeyin doğal bir kullanımı: \- MIB2'deki ambiyans menüsü açıldığında (İş 1), sen ekrandan renk/parlaklık seçtiğinde bu seçim Komfort-CAN'e bir mesaj olarak düşüyor \- Arduino bu mesajı dinleyip \*\*kendi LED şeridine\*\* aynı rengi basar \- Yani orijinal ambiyans LED donanımı araçta hiç olmasa bile, \*\*menü arayüzü olarak MIB2'yi kullanabilirsin\*\* — ayrı bir iOS uygulamasına gerek kalmadan \*\*Tek şart:\*\* Menü önce açılmalı (İş 1, OBDeleven/VCDS ile), yoksa CAN'a hiç mesaj düşmez, dinleyecek bir şey olmaz. Bu, iOS uygulamasını v2'ye erteleyip v1'de tamamen MIB2 üzerinden kontrol anlamına gelir — ister misin, yoksa ikisini paralel mi istiyorsun (hem MIB2 hem telefon)? \--- \#\#\# 👤 Kullanıcı şimdi nelerde led olacağını yazıyorum kapı kulplarında kapı saklama alanlarında kapılarda şerit ve ön göğüste ayak altı \--- \#\#\# 🤖 Claude Zonları not ettim: 1\. Kapı kulpları 2\. Kapı saklama alanları (cep) 3\. Kapı şeritleri (önceki plan) 4\. Ön göğüs / konsol 5\. Ayak altı \*\*Önemli teknik nokta:\*\* Her zon için ayrı DIN pini gerekmiyor. Aynı fiziksel hat üzerinde LED'ler seri bağlanıp, yazılımda piksel aralığına göre bölünebilir (örn. sol kapı hattında piksel 0-40 kulp, 41-80 cep, 81-150 şerit gibi). Yani sol kapı, sağ kapı, ön konsol gibi \*\*birkaç ana veri hattı\*\* yeterli olabilir; zon sayısı arttıkça pin sayısı değil, her hattaki piksel haritası büyür. Kısa soru: ayak altı sürücü/yolcu ayrı zon mu sayılsın, yoksa tek zon mu? Ve toplamda kaç ana veri hattı (sol kapı / sağ kapı / ön / ayak altı gibi) düşünüyorsun — 4 mü, yoksa daha fazla mı? \--- \#\#\# 👤 Kullanıcı hepsi ayrı ayrı olsun bence sence \--- \#\#\# 🤖 Claude Benim önerim: \*\*fiziksel yakınlığa göre grupla, zon sayısına göre değil.\*\* Adreslenebilir LED'lerde (SPI/WS281x) tek bir veri hattı üzerindeki LED'ler yine \*\*piksel piksel bağımsız\*\* kontrol edilir — ayrı hat şart değil, ayrı hat sadece kablolama basitliği/arıza izolasyonu meselesi. Buna göre: \- \*\*Sol kapı\*\* \= kulp \+ cep \+ şerit → \*\*tek hat\*\* (zaten aynı kapı içinde, aynı menteşe/körük geçişinden gidiyor, ayrı ayrı çekmek gereksiz kablo karmaşası) \- \*\*Sağ kapı\*\* \= aynı mantık → \*\*tek hat\*\* \- \*\*Ön konsol\*\* \= kapılardan fiziksel olarak uzak, kendi hattı \- \*\*Ayak altı sürücü / yolcu\*\* \= ayrı harness rotası, ayrı hat (istersen ikisi de tek hatta zincirlenebilir ama merkeze eşit mesafede değiller, ayrı tutmak daha temiz) Sonuç: 8-9 zon yerine \*\*4-5 veri hattı\*\* (sol kapı, sağ kapı, konsol, ayak altı sürücü, ayak altı yolcu). Kapı içi körükten geçen tek kablo sayısı azalır, ama her LED yine bağımsız renk/animasyon alabilir — "ayrı ayrı" istediğin kontrol kaybolmuyor. Buna razı mısın, yoksa gerçekten fiziksel olarak da her zonu ayrı hatla çekmek mi istiyorsun? \--- \#\#\# 👤 Kullanıcı her kapı ayrı zon olsun o zaman ayak altları ön ve arka ayrı ayrı zone ve gögüs \--- \#\#\# 🤖 Claude Tamam, 5 hat: 1\. Sol kapı (kulp+cep+şerit birlikte) 2\. Sağ kapı 3\. Ön ayak altı 4\. Arka ayak altı 5\. Göğüs/konsol \*\*Bir fiziksel not:\*\* Scirocco 3 kapılı (arka kapı yok, 2+2 koltuk düzeni). Arka ayak altına giden kablo, kapı menteşe/körük geçişinden değil, \*\*koltuk altı/eşik trimi\*\* üzerinden yönlendirilmeli — bu rotayı ayrıca planlamamız lazım. \*\*Donanım etkisi:\*\* 5 hat \= 5×330Ω direnç \+ tampon devrede 5 kanal, tek bir 74HCT541 (8 kanallı buffer) çipiyle hepsi karşılanır, ayrı ayrı çip gerekmez. ESP32-S3'te pin sayısı zaten bol, sorun yok. Sıradaki karar: her hattı \*\*ayrı CAN olayına\*\* mı bağlayacağız (örn. sadece o kapı açılınca o hat kırmızı yanar, diğerleri karışmaz) yoksa hepsi \*\*aynı anda aynı temel rengi\*\* mi paylaşacak? \--- \#\#\# 👤 Kullanıcı arka koltuk ve arka ayak altını kaldır o zaman \--- \#\#\# 🤖 Claude Tamam, 4 hat kaldı: 1\. Sol kapı 2\. Sağ kapı 3\. Ön ayak altı 4\. Göğüs/konsol Kalan soru: her hat \*\*kendi CAN olayına\*\* mı tepki verecek (örn. sadece o kapı açılınca o hat kırmızı, diğerleri etkilenmez) yoksa hepsi \*\*aynı temel rengi\*\* mi paylaşacak, sadece olay anında kendi zonu tepki verecek? \--- \#\#\# 👤 Kullanıcı onlar ios uygulamasından programlanarak seçilebilecek \--- \#\#\# 🤖 Claude Mantıklı — yani firmware'de sabit bir davranış değil, \*\*her zon için ayrı, uygulamadan set edilebilir bir davranış modu\*\* olacak (paylaşımlı/bağımsız, hangi olaylara tepki verecek vs.). Bu BLE komut setine "zon başına konfigürasyon" katmanı eklememiz gerektiği anlamına geliyor — not edildi. Sırada ne var — LED donanım/hat planı netleşti, bir sonraki karar noktası neresi olsun: BLE komut yapısı mı, yoksa CAN olay listesi (hangi olaylar zonları tetikleyecek) mi? \--- \#\#\# 👤 Kullanıcı şimdi bu sistem ile neler yapa biliriz \--- \#\#\# 🤖 Claude Mevcut mimariyle (4 zon, CAN dinleme, app kontrolü, MIB2 entegrasyonu) şunlar mümkün: \*\*Otomatik/olay bazlı (CAN'dan tetiklenen)\*\* \- Kapı açılınca o kapının zonu kırmızı flaş \+ sabit kırmızı, kapanınca fade-out \- Sinyal verince ilgili kapı zonunda kayan sarı ışık \- Geri vitese takınca tüm zonlarda otomatik karartma \- Gaza duyarlı parlaklık (OBD PID, ekstra splice gerekmez) \- Redline/shift light uyarısı (OBD RPM PID) \- Kontak açılışında welcome animasyonu \*\*MIB2 üzerinden kontrol\*\* \- Ekrandan seçilen renk/parlaklık → tüm zonlara veya seçili zona senkron \*\*iOS uygulamasından kontrol\*\* \- Zon başına: açma/kapama, renk, parlaklık \- Zon başına: hangi CAN olaylarına tepki vereceği (bağımsız/paylaşımlı) \- Sahne/preset kaydet-çağır (örn. "gece modu", "spor mod") \- Manuel override (CAN olaylarını geçici devre dışı bırakıp sabit renk) Bunlardan hangisi önceliğin — hepsini v1'e mi koyalım yoksa bir alt küme mi seçelim? \--- \#\#\# 👤 Kullanıcı led yönetmek haricinde \--- \#\#\# 🤖 Claude LED dışında, aynı donanımla (CAN erişimi \+ BLE \+ telefon bağlantısı) mantıklı ek özellikler: \*\*Veri/izleme\*\* \- OBD üzerinden canlı gösterge paneli (RPM, gaz pedalı, coolant sıcaklığı) telefon ekranında \- Basit trip/seyahat kaydı (mesafe, süre) — telefon tarafında saklanır \- Pist günü için tur bazlı veri logu (RPM/gaz grafiği, SD karta) \*\*Uyarı/hatırlatma\*\* \- Kapı açık kalmış, far/iç ışık açık unutulmuş bildirimi (telefona push) \- Akü voltaj düşüklüğü uyarısı (Kl.30 hattından basit ölçümle) \- Yetkisiz CAN aktivitesi/anormal trafik logu (basit bir "tamper" göstergesi) \*\*Konfor\*\* \- BLE proximity: telefon araca yaklaşınca otomatik welcome tetikleme (zaten planlanan animasyonun tetikleyicisi bu da olabilir) \- Park konumu kaydı: BLE bağlantısı koptuğu an telefon kendi GPS'iyle "arabayı burada bıraktın" notu düşer (araç tarafında GPS gerekmez) \*\*Diğer\*\* \- MIB2 ekranındaki gizli/geliştirici menülerine (İş 1'de zaten açtığımız FEC/SWaP, test mode) erişim kısayolu telefon üzerinden Bunlardan hangisi ilgini çekiyor, yoksa hepsi "ileride bakarız" listesine mi gitsin? \--- \#\#\# 👤 Kullanıcı hepsi ilerde bakarız listesine \--- \#\#\# 🤖 Claude Tamam, hepsi "ileride" listesine eklendi. Şu an odak sadece LED sistemi. Sırada ne var — LED zonlarının donanım/kablo planına mı dönelim, yoksa başka bir konu mu var? \--- \#\#\# 👤 Kullanıcı başka neler yapa biliriz ios uygulama geliştirme yeteneklerinide kullanarak arabanın canbusuna bağlı arduino ile \--- \#\#\# 🤖 Claude iOS tarafının kendine özgü yetenekleriyle: \*\*Sistem entegrasyonu\*\* \- Siri Shortcuts: "Hey Siri, arabayı selamla" gibi sesli komutla LED sahnesi tetikleme \- Widget/Live Activity: kilit ekranında canlı RPM veya bağlantı durumu göstergesi \- Apple Watch companion: bileğinden renk/mod değiştirme, basit gösterge \- Dynamic Island: araca bağlıyken anlık veri (örn. gaz pedalı %) orada göstermek \*\*Otomasyon\*\* \- Konum bazlı tetik (geofence): eve yaklaşınca otomatik bir sahne, işe varınca başka biri \- Focus/Zaman bazlı: gece modunda otomatik düşük parlaklık \*\*Çoklu kullanıcı\*\* \- Aile paylaşımı: farklı sürücü profilleri (kişiye özel renk/parlaklık tercihleri), telefon BLE ile eşleşince otomatik profil yüklenir \*\*Veri\*\* \- Trip geçmişi grafik/export (CSV, Share Sheet ile paylaşım) \- Basit "sağlık" günlüğü: akü/voltaj trendini zaman içinde görme Hepsi yine "ileride" kovasına mı, yoksa içlerinden biri şimdiki kapsam için ilginç mi? \--- \#\#\# 👤 Kullanıcı hepsini yine ilerideye at ama Focus/Zaman bazlı: gece modunda otomatik düşük parlaklık bunu arabanın ışık sensörü otomatik far sistemi ile yapamaz mıyız \--- \#\#\# 🤖 Claude Kesinlikle yapabiliriz — hatta telefon tabanlı yöntemden çok daha iyi bir fikir, çünkü: \- Far otomatik sistemi zaten aracın kendi ışık sensöründen veri alıyor ve bu veri \*\*Komfort-CAN'de\*\* (zaten dinleyeceğimiz hat) \- Telefon/BLE menzili, Focus modu ayarı gibi ekstra katmanlara gerek kalmıyor — gerçek fiziksel karanlığa tepki verir \- Bu aslında \*\*OEM ambiyans sistemlerinin standart davranışı\*\* zaten: farlar yanınca/karanlıkta otomatik kısılır Bunu "ileride" listesinden çıkarıp \*\*şimdiki projeye\*\* alıyorum — çünkü zaten planladığımız Komfort-CAN dinleme rig'i (kapı/sinyal için) bunu da aynı anda yakalayacak, ekstra donanım gerekmiyor. Sadece log alırken far açma/kapama da test edip ilgili sinyali bulmamız yeterli. \--- \#\#\# 👤 Kullanıcı başka neler yapa biliriz? \--- \#\#\# 🤖 Claude Your 2016 VW Scirocco (PQ35/MIB2) \+ ESP32 \+ iOS build ideas report is ready. It covers the platform's bus-access realities (why only powertrain CAN reaches the OBD port and why UDS won't work), plus seven categories of realistic projects: diagnostics/maintenance, security/anti-theft, convenience/comfort, performance data, fun/novelty, smart-home integration, and data logging. Each idea is tagged by risk level, with community-verified CAN IDs, PQ35-specific gotchas (indirect TPMS, battery drain, MIB2 bricking risk), a 4-stage rollout plan, and a concise Turkish summary at the end. \--- \#\#\# 👤 Kullanıcı türkçe özet geç \--- \#\#\# 🤖 Claude \*\*En kritik nokta:\*\* PQ35'te OBD portundan sadece motor/güç aktarma CAN hattı (500 kbit/s) okunur. Kapı/cam/iç aydınlatma gibi konfor CAN mesajları gateway (J533) tarafından filtrelenir — bunlara ulaşmak için gateway arkasına geçiş kablosu gerekir. Ayrıca \*\*UDS çalışmaz\*\*, PQ35 TP2.0+KWP2000 kullanır (VCDS/OBDeleven bunu zaten konuşuyor). \*\*Düşük riskli (sadece okuma):\*\* \- Arıza kodu okuma \+ bildirim, öngörücü bakım (akü/sıcaklık trend analizi) \- Servis hatırlatıcı, aşırı ısınma uyarısı \- Akü voltaj koruması \+ park modunda uyku (akü bitmesin diye şart) \- Hareket/eğim alarmı, geofence hırsızlık uyarısı, izinsiz CAN trafiği kaydı \- Dashcam tetikleme (röle ile) \- RaceChrono/lap timer köprüsü, 0-100 ölçümü, G-kuvveti analizi \- Eko-sürüş puanı, shift-light/boost göstergesi \- Home Assistant/HomeKit/Siri Shortcuts entegrasyonu \- SD karta CAN log, CSV/Grafana dışa aktarım \- Araç olaylarına bağlı ses efektleri/ışık gösterileri \*\*Yüksek riskli (mesaj enjeksiyonu):\*\* Uzaktan kilit/cam/bagaj kontrolü, direksiyon tuşu yeniden atama — sadece geçiş kablosu \+ sıkı filtreleme \+ kendi aracında test sonrası, hareket hâlindeyken asla. \*\*PQ35 uyarıları:\*\* TPMS genelde dolaylı (gerçek basınç yok); sürekli açık dongle aküyü 1-3 haftada bitirir; MIB2 gizli menü scriptleri üniteyi bozabilir — yedek şart. \--- \#\#\# 👤 Kullanıcı gateway dediğin nedir oradan veri okuyamam mı arduino ile \--- \#\#\# 🤖 Claude \*\*Gateway (J533):\*\* Aracın CAN veri yönlendirme kutusu — motor/şasi hattı (Antriebs-CAN, 500k), konfor hattı (Komfort-CAN, kapı/cam/ışık, 100k) ve multimedya hattını (Infotainment-CAN) birbirine bağlayan ayrı bir modül. PQ35'te sol ayak boşluğunda, orta konsolun yanında. \*\*Evet, Arduino ile oradan okuyabilirsin\*\* — hatta konuşmanın başında planladığımız asıl yöntem buydu (gateway konnektöründen splice). OBD portu bu hatların \*\*hiçbirine tam erişim vermiyor\*\*, çünkü gateway OBD tarafını filtreliyor. Gateway'in kendi konnektörüne (araç tarafı, gateway modülü sökülmeden) girip bağlanırsan, filtrelenmemiş ham hatları görürsün. İki yol var: 1\. \*\*Geçiş kablosu (passthrough harness):\*\* Gateway'i soküp arana kendi kablonu koyarsın, modül yine çalışır, sen paralelden dinlersin — en temiz yöntem 2\. \*\*Doğrudan splice:\*\* Gateway konnektöründeki tellere lehim/crimp ile bağlanmak — daha invaziv, önceki mesajlardaki risk azaltma adımları (multimetre doğrulama, DTC kontrolü vb.) burada geçerli Hangisini tercih edersin? \--- \#\#\# 👤 Kullanıcı orjinal kablolara kesme biçme yapmadan araya kablo atmak soket sokete istediğimde orjinele dönebilmek isterim atrıca bu arduino ile amarikan park gibi gizli özellikleri açıp kapatabilmekte istiyorum uygulamadan \--- \#\#\# 🤖 Claude \#\# Geçiş kablosu (soket-sokete, kesmeden) Mümkün — istediğin şey \*\*breakout/passthrough harness\*\*: gateway konnektörüyle aynı pin dizilimine sahip bir "ara fiş" hazırlanır, tüm pinler düz geçer, sadece CAN-H/L hatlarına ekstra iki tel lehimlenip Arduino'ya çıkar. Kurulumda: \- Gateway'in orijinal fişi sökülür \- Senin ara kablon araya takılır (bir ucu gateway'e, diğer ucu orijinal soket yerine) \- İstersen ara kabloyu çıkarıp orijinal fişi direkt gateway'e takarsın → araç tamamen fabrika hâline döner, iz bırakmaz Tek zorluk: bu ara fişi \*\*bir kere\*\* yapman lazım (uygun konnektör kabuğu \+ pin bulup kendi kablon sarılır) — ama araca \*\*kurulumu\*\* tornavidasız, kesmeden, sokete-sokete. Konnektörü hurdacıdan ya da yedek parçadan bulmak gerekiyor, ben senin gateway varyantının kaç pinli/kaç hatlı olduğunu görmeden kesin model veremem — fotoğrafını çekebilirsen tam eşleşen parçayı bulmak çok daha kolay olur. \#\# Amerikan Park — burada bir ayrım yapmamız lazım Bu tür gizli özellikler (turn sinyal koluna kısa dokununca park ışığı yakma) \*\*kodlama ile açılır\*\*, VCDS/OBDeleven üzerinden bir kerelik byte değişimiyle. Açıldıktan sonra özelliği \*\*kullanmak\*\* için Arduino'ya hiç gerek yok — direksiyon kolunu kısa çekmen yeterli, araç zaten kendi mantığıyla çalışır. Yani sorman gereken: sen ne istiyorsun — 1\. \*\*Özelliği bir kere aç, sonra normal kolla kullan\*\* → sadece OBDeleven işi, Arduino'ya gerek yok 2\. \*\*Uygulamadan her seferinde "aç/kapat" diye kod yazdırmak\*\* (özelliğin kendisini değil, kodlama durumunu dinamik değiştirmek) → bu garip ve riskli, her basışta KWP2000 yazma işlemi demek 3\. \*\*Uygulamadan sanal bir "park ışığı yak" butonu\*\* (kolu simüle eden bir CAN mesajı gönderme) → bu enjeksiyon, önceki risk kategorisine giriyor ama teknik olarak mümkün Hangisini kastediyorsun? \--- \#\#\# 👤 Kullanıcı obd eleven ile yaptığım özellik açma işlemini arduino ile yapa bilir miyim \--- \#\#\# 🤖 Claude \*\*Teorik olarak evet, ama pratikte zorlaşan bir iş.\*\* OBDeleven'in yaptığı şey aslında KWP2000 protokolü üzerinden: security access (seed-key hesaplama) → doğru modüle bağlanma → adaptation/long-coding byte'ını değiştirme. Arduino ile bunu tekrarlamak için TP2.0/KWP2000 protokol yığınını yazılımsal olarak implemente etmen lazım — CAN mesajı göndermekten çok daha karmaşık bir katman. \*\*Önemli soru:\*\* Bunu neden istiyorsun? \- \*\*Tek seferlik kodlama işlemini\*\* (bir kere aç, kalıcı kalsın) Arduino'ya yaptırmak istiyorsan → mantıksız, çünkü bu ayar modülün EEPROM'unda kalıcı, OBDeleven'i her seferinde kullanmana gerek yok zaten, bir kere yaptın bitti. \- \*\*Uygulamadan istediğin an özelliği aç/kapat\*\* yapmak istiyorsan → bu farklı bir şey, her basışta security-access \+ yazma işlemi demek, hem yavaş hem riskli (yanlış zamanlama modülü kilitleyebilir). Hangisi — sadece "OBDeleven'e ihtiyaç duymadan tek seferlik açayım" mı, yoksa "uygulamadan istediğim an aç/kapa" mı? \--- \#\#\# 👤 Kullanıcı obd elevin ile bu özelliği açık kapata biliyorum orjinal haline geri getirebiliyorum ama ben obd eliven kullanmadan direk arduino ile açıp kapata bilir miyim bu özellikleri diye soruyorum mesela kadran selamlama özelliğini açmak gibi veya bir düğme ile uygulamdan kapatıp eski haline döndürmek \--- \#\#\# 🤖 Claude İki farklı şey var ve biri kolay, biri çok zor: \#\# Kodlama yazma (OBDeleven'in yaptığı) — Arduino ile zor, önermiyorum Coding işlemi \*\*Security Access\*\* (seed-key şifreleme) gerektirir — modül önce rastgele bir "seed" gönderir, sen doğru algoritmayla hesaplanmış "key"i geri yollarsın, ancak öyle yazma izni açılır. Bu algoritma VAG'e özel ve \*\*yayınlanmamış\*\*; VCDS/OBDeleven bunları lisanslı/ters mühendislikle elde etmiş. Arduino'ya bunu kendi başına yazdırmak, o algoritmayı bilmeden mümkün değil. Bu yüzden "OBDeleven'siz kendi başıma kod yaz" hedefini önermem — hem zor hem de yanlış zamanlama modülü kilitleyebilir. \#\# Ama asıl istediğin şey aslında farklı ve \*\*kolay\*\* Kadran selamlama animasyonu, özellik bir kere kodlanıp \*\*kalıcı açık\*\* bırakıldıktan sonra, kadranın gerçek zamanlı bir CAN mesajına (ör. kilit açma/Kl.15 sinyali) \*\*tepki vermesiyle\*\* çalışır. Bu normal işletim trafiğidir — diagnostic yazma değil, \*\*security access gerektirmez\*\*. Yani: \- \*\*OBDeleven'de özelliği bir kere kalıcı "açık" bırak\*\* \- \*\*Arduino, o animasyonu tetikleyen CAN mesajını istediğin an gönderir\*\* (uygulamadan bas → mesaj gider → kadran animasyonu oynar) — bu enjeksiyon ama diagnostic değil, sıradan bus mesajı, çok daha basit ve düşük riskli \*\*Kapatma\*\* tarafı farklı bir zorluk: özellik kalıcı açıksa, gerçek tetikleyici olay (gerçek kilit açma) geldiğinde animasyonu \*\*bastırmak\*\* istersen, o anlık gerçek mesajı bloklamak gerekir — bu "iki hat arasına girip trafiği kesme" (true man-in-the-middle) demek, önceki seviyelerden daha ileri bir teknik. Senin asıl istediğin: \*\*"uygulamadan istediğim an tetikle"\*\* mi, yoksa \*\*"gerçek olayı bastırıp iptal et"\*\* mi? \--- \#\#\# 👤 Kullanıcı bu kodlar forumlarda var arduino obd eleven gibi davranıp bunları yazamaz mı \--- \#\#\# 🤖 Claude Haklı bir nokta — forumlarda gördüğümüz "Security Access 16, kod 31347 gir" gibi örnekler aslında \*\*hesaplanan (seed-key)\*\* değil, \*\*sabit/yayınlanmış bir PIN\*\* olabilir. Eğer öyleyse, bu benim ilk söylediğimden çok daha kolay bir iş. Bunu netleştirmek için araştırayım. Haklısın, düşündüğümden daha mümkün — araştırma bunu doğruladı, birkaç önemli nüansla: \#\# İyi haber: Protokol katmanı gizli değil \- \*\*TP2.0/KWP2000, açık bir standart (ISO 14230)\*\* — VAG'e özel ama gizli değil, dökümante edilmiş \- Hazır açık kaynak kütüphaneler var: \`KLineKWP1281Lib\` (Arduino/ESP/RPi Pico için, doğrudan "login yapma", "recoding", "adaptation değeri okuma/yazma" fonksiyonlarını içeriyor) ve \`kwp2000-can\` (Python, TP2.0 üzerinden KWP2000, tam mesaj çerçeveleme) \- Yani "Arduino CAN'e mesaj gönderip diagnostic konuşabilir mi" sorusunun cevabı \*\*evet\*\*, altyapı hazır \#\# Zor kısım: Security Access, modüle göre değişiyor \- Bazı adaptation seviyeleri \*\*gerçek seed-key kriptografisi\*\* ister (ECU seed gönderir, sen algoritmayla key hesaplarsın) — bu genelde motor/immobilizer gibi kritik modüllerde \- Ama bazı modüllerde (özellikle konfor/infotainment adaptation seviyeleri) bu \*\*sabit, yayınlanmış bir kod\*\* — forumdaki "31347" örneği muhtemelen böyle bir şey, VCDS/OBDeleven kullanıcısının elle girdiği sabit bir erişim kodu \- Hatta bazı modüllerin algoritması topluluk tarafından kırılıp yayınlanmış bile (örnek: bir ECU'da \`key \= seed \+ 0x11170\` gibi trivial bir formül olduğu ortaya çıkmış) \#\# Pratik ve gerçekçi yöntem: Kopyala-yapıştır değil, "dinle ve tekrarla" En mantıklı yol algoritmayı bulmaya çalışmak değil, \*\*OBDeleven kodlamayı yaparken CAN trafiğini dinleyip tam o mesaj dizisini kaydetmek\*\*: 1\. Arduino'yu OBD'ye paralel bağla, dinleme modunda çalıştır 2\. OBDeleven'den istediğin özelliği (örn. kadran selamlama) aç 3\. Bu sırada geçen tüm CAN mesajlarını (security access dahil) logla 4\. Elde ettiğin diziyi analiz et: \*\*seed her seferinde değişiyor mu, yoksa sabit mi?\*\* \- Sabitse → aynı byte dizisini Arduino'dan tekrar göndermek her zaman işe yarar, algoritmaya gerek yok \- Değişiyorsa → gerçek algoritma lazım, forumdan/RE'den bulunmadıysa bu modülde takılırız Bu yaklaşımı denemek ister misin — yani bir sonraki adım, OBDeleven ile bir özelliği açarken Arduino'yu paralel dinlemeye alıp trafiği kaydetmek mi olsun? \--- \#\#\# 👤 Kullanıcı ond eleven elimde hiç yok diyelim \--- \#\#\# 🤖 Claude Mükemmel, bu tam istediğin cevabı veriyor: \*\*VAG modüllerinin çoğunda Security Access kodları gerçekten sabit ve topluluk tarafından yayınlanmış.\*\* Bu, ödeme gerektiren bir araç olmadan da işe girişebileceğin anlamına geliyor. \#\# Bulduğum somut veri Ross-Tech forumları ve VW Vortex'te derlenmiş listeler var, örnekler: \- \*\*09-Cent. Elect. → 31347\*\* \- \*\*5F-Info Electr. → S12345\*\* \- \*\*19-CAN Gateway → 20103\*\* \- \*\*42-Door Elect Driver → 19249\*\* \- \*\*65-Tire Pressure → 20103\*\* \- Çoğu konfor/infotainment modülü \*\*20103\*\* gibi ortak kodlarda toplanıyor Ross-Tech'in kendisi bile bunu VCDS arayüzünde resmi olarak destekliyor ("Balloons... Security Access charts... when appropriate information is available"). Yani bu kodlar gizli tutulan bir şey değil, endüstri içinde zaten yaygın bilgi. \#\# Bu neyi değiştiriyor OBDeleven'e \*\*hiç ihtiyacın olmadan\*\*, kendi ESP32'ni gerçek bir kodlama aracına dönüştürebilirsin: 1\. Modülü belirle (senin durumunda 5F-Info Elektronik veya PQ35'teki karşılığı) 2\. O modül için yayınlanmış SA kodunu bul (S12345 gibi — dikkat, bazıları harf-rakam karışık formatta) 3\. ESP32'de basit bir KWP2000-over-TP2.0 client yaz (referans: \`kwp2000-can\` Python kütüphanesinin mesaj yapısı) 4\. Session aç → SecurityAccess isteği gönder → yayınlanmış kodu gönder → adaptation byte'ını yaz \*\*Tek risk:\*\* Kod tutmazsa (senin spesifik yıl/varyantın farklıysa) ve birkaç kez yanlış denersen modül geçici olarak kilitlenir ("too many communication errors") — kontak birkaç dakika kapalı bekletilip tekrar denenir, kalıcı hasar değil ama can sıkıcı. Bunu ciddi bir sonraki adım olarak mı ele alalım — yani protokol implementasyonuna mı geçelim? \--- \--- \#\# Ek Oturum — 16 Eylül 2026 (Devam) \--- \#\#\# 👤 Kullanıcı bu konuyu araştır obd eleven olmadan vcds ile yapılıyorsa arduinoda yapabilir \--- \#\#\# 🤖 Claude \*\[Araştırma yapıldı — Tam rapor aşağıda\]\* \#\# Sonuç: Evet, Yapılabilir PQ35 konfor modülleri (09 Central Electrics) TP2.0 \+ KWP2000 protokolü kullanır. Security Access algoritması gerçek bir kriptografi değil, basit toplama: \`\`\` key \= seed \+ login\_code \`\`\` 09 modülü için: \`key \= seed \+ 31347\` Bu pq-flasher GitHub projesiyle kanıtlanmıştır. \#\#\# Modül Bazında Durum \*\*Modül 09 (Central Electrics) — KOLAY:\*\* \- Security Access kodu: 31347 \- Algoritma: key \= seed \+ 31347 (additive, kriptografi yok) \- Amerikan park ışığı, Coming/Leaving Home — byte/bit haritası yayınlanmış \*\*Modül 19 (CAN Gateway) — KOLAY:\*\* \- Benzer KWP2000/TP2.0 yapısı \*\*Modül 5F (MIB2 Head Unit) — ZOR/RİSKLİ:\*\* \- UDS tabanlı (KWP2000 değil) \- Green menu aktivasyonu gerçek VCDS/ODIS ile bile çoğu zaman hata veriyor \- Bricking riski var — en son bırak \#\#\# Açık Kaynak Referanslar \- \*\*I-CAN-hack/pq-flasher\*\* (Python): TP2.0 \+ KWP2000 \+ seed-key algoritması — PQ35'e özel \- \*\*PyVCDS\*\* (baconwaifu): KWP2000 mesaj katmanı (long-code write TODO) \- \*\*KLineKWP1281Lib\*\* (domnulvlad): YANLIŞ PROTOKOL — K-Line/KWP1281, CAN değil \#\#\# Uygulama Sırası 1\. ESP32 → OBD → 09 modülünü sadece oku 2\. Security Access uygula (seed \+ 31347\) 3\. Tek özellik değiştir, geri al 4\. iOS uygulamasına kodlama butonu ekle 5\. MIB2 — en son, dikkatli \--- \#\#\# 👤 Kullanıcı türkçe lütfen \--- \#\#\# 🤖 Claude \*\*Kısa Özet:\*\* Evet, yapılabilir. PQ35'teki gövde/konfor modülleri TP2.0 \+ KWP2000 protokolü kullanıyor. Security Access algoritması gerçek bir şifreleme değil: \`\`\` key \= seed \+ login\_code \`\`\` 09 modülü için: \`key \= seed \+ 31347\` \*\*Bu sistemle açılabilecekler (09 modülü):\*\* \- Amerikan park ışığı \- Coming Home / Leaving Home \- Kapı açık ışık uyarıları \- Komfor sinyal (3 flaş) \*\*MIB2 head unit (5F):\*\* UDS tabanlı, bricking riski var — son aşamaya bırak. \*\*Yapı sırası:\*\* 1\. ESP32 → OBD → 09 modülünü sadece oku (risksiz) 2\. Security Access uygula (seed \+ 31347\) 3\. Bir özelliği test amaçlı değiştir, geri al 4\. iOS uygulamasına "kodlama" butonu ekle 5\. MIB2 — en son, dikkatli \--- \#\#\# 👤 Kullanıcı hangi modül ile canbusu okuma ve yazma işi en iyi olan seçenek \--- \#\#\# 🤖 Claude \#\# CAN Bus Modül Seçimi Projede iki ayrı CAN hattı var, bunlar farklı çözüm gerektiriyor: \#\#\# Hat 1 — Antriebs-CAN (500k) \+ TP2.0/KWP2000 Kodlama \*\*→ ESP32-S3 dahili TWAI \+ SN65HVD230\*\* | Özellik | Detay | |---|---| | Kontrolcü | ESP32-S3'ün içinde donanımsal TWAI var, harici chip gerekmez | | Transceiver | SN65HVD230 — native 3.3V, level shifter yok | | Zamanlama | Donanımsal → TP2.0 için kritik, en güvenilir seçenek | \`\`\` ESP32-S3 SN65HVD230 GPIO\_TX ──→ TXD GPIO\_RX ←── RXD 3.3V ──→ VCC GND ──→ GND CANH ──→ Araca CANL ──→ Araca \`\`\` \#\#\# Hat 2 — Komfort-CAN (100k) \*\*→ MCP2515 \+ TJA1040\*\* (SPI üzerinden) | Özellik | Detay | |---|---| | Kontrolcü | MCP2515 — SPI ile ESP32'ye bağlanır | | Transceiver | TJA1040 veya TJA1042 — 3.3V uyumlu | ⚠️ \*\*Uyarı:\*\* Aliexpress'ten gelen ucuz MCP2515 modüllerinin çoğunda TJA1050 var — 5V istiyor, ESP32'yi yakabilir. Ayrıca board üzerindeki 120Ω sonlandırma direncini sök. \#\#\# Satın Alma Özeti | Ne alınacak | Model | |---|---| | Hat 1 transceiver | SN65HVD230 modülü | | Hat 2 | MCP2515 \+ TJA1040 modülü (3.3V versiyonu) | \#\#\# Bağlamadan Önce Kontrol Listesi \- \[ \] MCP2515 modülündeki 120Ω lehimli direnci sök \- \[ \] SN65HVD230 → sadece 3.3V ile besle \- \[ \] İki hattın GND'lerini ESP32 ile ortak yap \- \[ \] Araçta zaten sonlandırma var (gateway her iki uçta) — sen ekleme \--- \#\#\# 👤 Kullanıcı sohbetti md dosyası haline getir \---*

Response: Tüm konuşmamızı, teknik analizleri, donanım mimarisini, CAN Bus/VAG kodlama detaylarını ve faz planını içeren eksiksiz proje dosyasını Google Drive üzerinde Markdown (.md) dosyası olarak oluşturdum.

[2016\_VW\_Scirocco\_CANBus\_Ambiyans\_LED\_DIY\_VAG\_Kodlama.md](https://docs.google.com/document/d/1bgBJfmAG6yH30pxxtUJp4CWk7Xje-ApKa84pdjRvLyU/edit?usp=drivesdk&ouid=108206778848073400415&utm_source=gemini)

\[file-tag: drive-uploaded-file-1bgBJfmAG6yH30pxxtUJp4CWk7Xje-ApKa84pdjRvLyU\]

### **Proje Dosyası Özet İçeriği:**

> 1. **PQ35 & CAN Bus Mimarisi:** Antriebs-CAN (500k) ve Komfort-CAN (100k) hatları için Gateway J533 soket-sokete (breakout harness) entegrasyonu.  
> 2. **Nihai Donanım Seçimi:** ESP32-S3 (Nano ESP32) \+ SN65HVD230 (Antriebs/TP2.0) ve MCP2515 \+ TJA1040 (Komfort-CAN) ile 74AHCT125 seviye dönüştürücü.  
> 3. **4 Zonlu Ambiyans LED & Entegrasyon:** Sol kapı, sağ kapı, ön ayak altı ve konsol zonları; MIB2 renk senkronizasyonu ve otomatik far/ışık sensörüne bağlı kararma (dimmer).  
> 4. **DIY VAG Kodlama Mimarisi:** Modül 09 (Central Electrics) için TP2.0 \+ KWP2000 (key \= seed \+ 31347\) Security Access algoritmik yapısı ve Amerikan park / Coming Home tetikleyicileri.  
> 5. **Kademeli Faz Planı:** Kl.15 güvenli başlatmadan Kl.30 derin uyku / uyanma mimarisine gidiş haritası.

---

*User prompt: Bu sisteme ne özellikler ekleye biliriz*

Response: Projenizin mevcut mimarisine (ESP32-S3, çift CAN hattı, 4 zon adreslenebilir LED, MIB2/far sensörü entegrasyonu ve TP2.0/KWP2000 kodlama altyapısı) ekleyebileceğiniz, gelecekte projeyi büyütebilecek ek özellikler ve modüller:

### **1\. Güvenlik ve Anti-Theft (Hırsızlık Önleme)**

> * **Dijital İmmobilizer / Gizli PIN:** Araç çalıştırılmadan önce (veya belirli bir kontak döngüsünde) iOS uygulamasından veya direksiyondaki belirli tuş kombinasyonlarına basılmadan motorun çalışmasına izin vermeyen ek bir güvenlik katmanı.  
> * **Hareket / Eğim Sensörü Entegrasyonu:** Araç park halindeyken (Kl.30 uyku modundayken) aracın çekiciye yüklenmesini veya kriko ile kaldırılmasını algılayıp SIM808 modülü üzerinden telefona anlık uyarı gönderme.  
> * **Yetkisiz CAN Trafiği Algılama:** OBD portuna harici bir cihaz (diagnostik veya keylogger tarzı aparatlar) takıldığında sistemi uyaracak anomali dinleme.

### **2\. İleri Sürüş ve Performans (Telemetry)**

> * **0-100 / 0-200 km/h Kronometre:** GPS ve Antriebs-CAN (500k) üzerinden alınan devir/hız verileriyle hassas ivmelenme sürelerini ölçüp telefon ekranına yazdırma.  
> * **G-Kuvveti ve G-Meter:** ESP32 üzerine eklenecek ucuz bir ivmeölçer (IMU \- MPU6050 gibi) ile virajlarda ve frenlemede binen G kuvvetlerini görselleştirme.  
> * **Turbo Basıncı ve Sıcaklık Takibi:** OBD üzerinden okunabilen anlık turbo basıncı (Boost) veya yağ/su sıcaklığı kritik seviyeye ulaştığında LED'leri turuncu/kırmızı renge çevirerek sürücüyü görsel olarak uyarma.

### **3\. Konfor ve Otomasyon (Convenience)**

> * **BLE Proximity (Yakınlaşma) Kilidi/Selamlama:** Telefonunuzla araca yaklaştığınızda (Bluetooth sinyal gücü RSSI ile ölçülerek) aracın kilidi açılmadan bile LED'lerin "Welcome" animasyonunu otomatik oynatması.  
> * **Park Konumu Kaydı:** Bluetooth bağlantısı koptuğu anda (aracınızı park edip uzaklaştığınızda) iOS uygulamasının o anki GPS konumunu "Aracımı burada bıraktım" şeklinde kaydetmesi.  
> * **Otomatik Cam / Ayna Kontrolü:** Kilit tuşuna basılı tutulduğunda veya araç kilitlendiğinde açık kalan camları ve aynaları CAN üzerinden otomatik kapatma protokolü tetikleme.

### **4\. Akıllı Ev (HomeKit) Köprüsü**

> * **Eve Yaklaşınca Garaj Kapısı:** Daha önce konuştuğumuz garaj kapısı entegrasyonunu Apple HomeKit üzerinden yürütürken, aracın eve yaklaştığını ESP32'nin Wi-Fi modülüyle algılayıp otomatik tetikleme.

### **5\. Ses ve Multimedya Efektleri**

> * **Dinamik Sinyal / Ses Senkronizasyonu:** Kapı açılma veya uyarı durumlarında sadece görsel değil, küçük bir buzzer veya ses modülü ile yumuşak geri bildirim sesleri üretme.

---

*User prompt: Bu sistem ile aracın klidini açıp kapata bilir miyim*

Response: Evet, teorik olarak **aracın kilidini açıp kapatabilirsiniz**, ancak bunun güvenliği ve mimarisi açısından çok kritik bir detayı bilmeniz gerekir:

### **Bu İşlemin Arkasındaki Gerçekler**

> 1. **Çift Yönlü Trafik Gerektirir:** Şimdiye kadar konuştuğumuz sistem (LED'leri yakmak veya far sensörünü okumak) **"Listen-Only" (Sadece Dinleme)** modundaydı. Yani araca hiç veri yazmıyor, sadece akışı izliyorduk. Kapı kilidini açıp kapatmak ise araca **komut yazmayı (Injection / Write)** gerektirir. Komfort-CAN hattına doğru TP2.0 / KWP2000 veya özel konfor mesajlarını enjekte etmelisiniz.  
> 2. **Nasıl Yapılır?**  
   * **Doğrudan CAN Komutu ile:** VW konfor modülüne (Modül 09\) kilit açma/kapama komutunu içeren doğru CAN frame'ini (veya diagnostic komutunu) gönderebilirsiniz.  
   * **Uygulama Entegrasyonu:** Telefonunuzdaki iOS uygulamasından "Kilitleri Aç" butonuna bastığınızda, BLE üzerinden ESP32'ye şifreli bir komut gider; ESP32 de SN65HVD230 / MCP2515 üzerinden araca kilit komutunu basar.

### **Güvenlik ve Risk Uyarısı ⚠️**

> * **Güvenlik Açığı (Man-in-the-Middle / Sniffing Riski):** Eğer kablosuz bağlantı (BLE) yeterince güçlü şifrelenmezse (örneğin challenge-response veya AES kalkanı olmazsa), kötü niyetli biri dışarıdan sinyali yakalayıp arabanın kapılarını açabilir. Bu yüzden projedeki siber güvenlik katmanları (White-listing, şifreleme) kilit kontrolü işin içine girdiği an hayati önem kazanır.  
> * **BSI / Konfor Beyni Kilitleme:** Yanlış veya hatalı bir CAN mesajı enjeksiyonu, gövde beyinlerinin (Body Control Module) hata vermesine veya geçici olarak iletişimi kesmesine neden olabilir.

Özetle; gateway bağlantısı üzerinden araca yazma yetkiniz (ve doğru CAN ID/komut bilginiz) olduğu sürece **uygulamadan veya otomasyonla kapıları açıp kapatmak mümkündür**. Ancak bu özellik, sistemin en yüksek riskli (enjeksiyon gerektiren) aşamasıdır.

---

*User prompt: Şuan evde hazırlık için neler yapa bilirim*

Response: Evde masa başında (fiziksel araca gitmeden) projenizi ilerletmek ve yazılımsal altyapıyı hazırlamak için yapabileceğiniz en verimli **hazırlık adımları** şunlardır:

### **1\. Yazılım Geliştirme Ortamını (IDE) Kurma**

> * **PlatformIO veya Arduino IDE:** Bilgisayarınıza **Arduino IDE** (veya VS Code üzerinde **PlatformIO** eklentisini) kurun.  
> * **Kütüphaneleri Hazırlama:** Projede kullanacağınız temel kütüphaneleri şimdiden aratıp test ortamına ekleyin:  
  * ESP32-S3 / Nano ESP32 board paketleri  
  * CAN bus kütüphaneleri (ESP32 dahili TWAI kütüphaneleri veya ACAN\_ESP32, mcp2515 kütüphaneleri)  
  * Adreslenebilir LED'ler için FastLED veya NeoPixel kütüphanesi

### **2\. Mock (Simülasyon) Kodları Yazma**

Araca bağlanmadan önce masada test edebileceğiniz **mantıksal kod bloklarını** şimdiden yazmaya başlayabilirsiniz:

> * **Zon Mantığı (State Machine):** 4 zonun (Sol Kapı, Sağ Kapı, Ön Ayak Altı, Göğüs) renk ve parlaklık değişimlerini yönetecek temel C++ sınıflarını (class) yazın.  
> * **BLE (Bluetooth) Haberleşme İskeleti:** ESP32'nin telefonla (iOS) bağlanacağı, şifreli komutları alıp işleyeceği BLE servis ve karakteristlik yapısının (NimBLE-Arduino kullanarak) temel şablonunu oluşturun.  
> * **CAN Mesaj Parser (Ayrıştırıcı) Fonksiyonları:** Gelecekte araçtan gelecek ham CAN ID'lerini (örneğin kapı piki veya hız verisi) parçalayıp renge dönüştürecek matris fonksiyonlarını şimdiden tasarlayın.

### **3\. iOS Uygulama Arayüzü Tasarımı (Prototipleme)**

Eğer iOS uygulamasını kendiniz geliştirecekseniz:

> * **Xcode** üzerinde basit bir arayüz (Storyboard veya SwiftUI) taslağı oluşturun.  
> * 4 ayrı zon için renk seçici (Color Picker), parlaklık slider'ı ve mod seçme butonlarının yer aldığı ekranları hazırlayın.  
> * CoreBluetooth altyapısını kurarak uygulamanın bir ESP32 cihazını tarayıp bağlanabileceği temel mantığı kodlayın.

### **4\. Malzeme Listesini ve Siparişleri Netleştirme**

> * Daha önce çıkardığımız listedeki **Nano ESP32, SN65HVD230, MCP2515, 74AHCT125 level shifter, ZBL şerit LED'ler ve LM2596 regülatör** gibi bileşenlerin sipariş durumlarını kontrol edin, eksik parça varsa temin edin.

Şu an masa başında ilk olarak **ESP32 BLE haberleşme altyapısını** mı kodlamak istersiniz, yoksa **LED zon kontrol mantığının C++ yazılım şablonunu** mu hazırlayalım?

---

*User prompt: Ama nano bu karmaşıya gecikmeden yetişebilecek mi*

Response: **Kısa cevap:** Evet, **Arduino Nano ESP32** (üzerindeki **ESP32-S3** çipi sayesinde) bu karmaşaya ve veri yoğunluğuna **fazlasıyla ve gecikmesiz** yetişir. Hatta bu işlem gücü, yapmayı planladığınız iş için fazlasıyla yeterlidir (overkill sayılır).

Nedenini ve arka plandaki teknik detayları şu şekilde özetleyebiliriz:

### **1\. Çift Çekirdek Gücü (FreeRTOS)**

Nano ESP32'nin kalbindeki ESP32-S3 işlemcisi **çift çekirdeklidir** ve gerçek zamanlı işletim sistemi (**FreeRTOS**) desteğiyle gelir. Bu sayede görevleri mükemmel bir şekilde bölebilirsiniz:

> * **Çekirdek 0 (İletişim & Mantık):** Bluetooth (BLE) bağlantılarını, iOS uygulamasından gelen komutları, MIB2 menü dinlemesini ve zamanlayıcıları yönetir.  
> * **Çekirdek 1 (Otomotiv & Işık):** CAN bus hatlarından akan paketleri dinler ve adreslenebilir LED'lerin (FastLED / RMT sürücüsüyle) milisaniyelik zamanlamalarını hiçbir kesintiye uğratmadan, pürüzsüz bir şekilde sürer.

### **2\. Donanımsal Destekler (Yazılımı Yormayan Özellikler)**

> * **Donanımsal TWAI (CAN):** Antriebs-CAN hattı için ESP32-S3'ün dahili donanımsal CAN denetleyicisi kullanılır. İşlemci, mesajları yakalamak için yazılımsal döngülerle vakit kaybetmez; donanım arka planda veriyi toplar.  
> * **RMT (Remote Control) Çevresel Birimi:** Adreslenebilir LED'lerin (WS281x türü) en büyük zorluğu mikro saniye düzeyindeki hassas zamanlamalardır. ESP32-S3'ün içindeki özel **RMT donanımı**, bu sinyalleri işlemciye yük bindirmeden tamamen donanımsal olarak üretir. Bu sayede LED'lerde asla kasma, titreme veya gecikme olmaz.

### **3\. Gerçek Dünya Performansı**

Otomotiv projelerinde kullanılan mikrodenetleyiciler arasında ESP32 serisi, hız ve maliyet dengesi açısından en popüler işlemcilerden biridir. Saniyede yüzlerce CAN mesajı aksa bile ESP32-S3 bunları milisaniyelerden kısa sürede işleyebilir; kapı açılma animasyonu veya gaza duyarlı parlaklık değişimi insan gözünün algılayamayacağı bir hızda (anında) LED'lere yansır.

Yani donanım gücü açısından kafanız rahat olsun; Nano ESP32 bu projeyi taşımak için fazlasıyla güçlüdür. Masa başında kodlama iskeletini kurarken bu çift çekirdek mantığını göz önünde bulundurarak ilerleyeceğiz.

---

*User prompt: Esp32 sim808 ve başka ihtiyaca gerek var mı 12v adreslenebilir ledeleri sürebilir mi*

### **Response: 1\. 12V Adreslenebilir LED'leri Sürebilir mi?**

**Evet, sürer, ancak doğrudan değil.**

> * **Gerilim Uyumsuzluğu:** Arduino Nano ESP32 ve ESP32-S3 işlemcisi **3.3V mantık seviyesiyle (logic level)** çalışır. 12V adreslenebilir şerit LED'ler ise veri (DIN) hattında **5V veya 12V eşik gerilimi** ister. ESP32'nin çıkardığı 3.3V zayıf kalacağı için LED'ler ya hiç çalışmaz ya da sinyali algılayamayarak saçma sapan renkler yakar/titrer.  
> * **Çözüm:** Daha önce konuştuğumuz **74AHCT125 (Level Shifter / Buffer)** devresini araya koymanız şarttır. Bu entegre, ESP32'nin 3.3V'luk veri sinyalini LED'lerin okuyabileceği seviyeye güvenle yükseltir.

### **2\. SIM808 ve ESP32 Dışında Başka Neye İhtiyacınız Var?**

Projenin tam olarak çalışabilmesi için donanım listesinde eksik bırakmamamız gereken **zorunlu yardımcı elemanlar** şunlardır:

> * **CAN Bus Transceiver Modülleri (Kritik):**  
  * ESP32'nin CAN hatlarına bağlanabilmesi için çipler şarttır:  
  * **Antriebs-CAN (500k) için:** SN65HVD230 modülü (3.3V uyumlu).  
  * **Komfort-CAN (100k) için:** MCP2515 \+ TJA1040 (veya TJA1042 \- 3.3V uyumlu olanı).  
> * **Güç Yönetimi (Buck Converter):**  
  * Aracın 12V akü elektriğini ESP32 ve SIM808'in besleyebileceği 5V'a düşürmek için LM2596 Voltaj Regülatörü. (Özellikle SIM808 şebeke ararken anlık 2A-3A akım çektiği için güçlü bir regülatör şarttır).  
> * **Seviye Dönüştürücü (Level Shifter):**  
  * LED veri hatları için 74AHCT125 entegresi.  
> * **Bağlantı ve Koruma Malzemeleri:**  
  * OBD2 Y-Splitter kablosu (Orijinal portu harcamamak için).  
  * 330 Ohm dirençler (LED veri hatlarındaki akım sıçramalarını engellemek için).  
  * Kaliteli bükümlü çift kablo ve Tesa bez bant / ısı büzüşmeli makaronlar.

---

*User prompt: Uno r4 wifi kullansam*

Response: **Arduino UNO R4 WiFi** kullanmak projeniz için kesinlikle harika ve çok güçlü bir tercihtir\! Ancak bu kartı seçtiğinizde bilmeniz ve dikkat etmeniz gereken bazı **kritik teknik detaylar** vardır:

### **1\. Arduino UNO R4 WiFi'nin Avantajları**

> * **Dahili Wi-Fi ve ESP32 Gücü:** Kartın ana işlemcisi Renesas RA4M1 (ARM Cortex-M4) olsa da, Wi-Fi ve Bluetooth iletişimi için üzerinde ek bir **ESP32-S3** modülü barındırır. Bu sayede kablosuz bağlantıları ve iOS uygulaması haberleşmesini harici modül eklemeden çözebilirsiniz.  
> * **5V Lojik Seviyesi:** Geleneksel Arduino formundadır ve **5V mantık seviyesiyle** çalışır. Bu, birçok standart sensör ve modülle doğrudan uyumlu olmasını sağlar.  
> * **Dahili LED Matris:** Kartın üzerinde hazır gelen 12x8 LED matris bulunur (bunu sistem durumu, hata kodları veya mini animasyonlar için araba içinde gizli bir köşede kullanabilirsiniz).

### **2\. Dikkat Edilmesi Gereken Kritik Noktalar (Değişen Şeyler)**

Daha önce bahsettiğimiz "Nano ESP32" yerine UNO R4 WiFi seçtiğinizde mimaride şu değişiklikler olur:

> * **CAN Bus Entegrasyonu (Farklılık):** UNO R4 WiFi'nin ana işlemcisinde yerleşik bir CAN denetleyicisi (TWAI) yoktur. Bu yüzden **her iki hat için de** (Antriebs ve Komfort) dışarıdan modül kullanmanız gerekir:  
  * Biri SPI üzerinden bağlanan **MCP2515 \+ Transceiver** kartı,  
  * Diğeri ise uygun pinlerle bağlanan harici bir CAN modülü olacaktır.  
> * **Seviye Dönüştürücü (Level Shifter) Durumu:**  
  * 12V adreslenebilir LED'leri sürerken kullanacağımız **74AHCT125** yine şarttır, çünkü LED veri hatları 5V/12V mantık ister.  
  * Ancak kartın çıkışları 5V olduğu için bazı durumlarda (örneğin 3.3V çalışan bazı hassas modüllerde) voltaj uyumuna dikkat etmeniz gerekir.  
> * **Fiziksel Boyut:** Nano ESP32 minicik ve konsol arkasına kolayca gizlenebilecek bir karttır; UNO R4 WiFi ise klasik "UNO" boyutundadır (daha büyüktür). Araç içinde nereye saklayacağınızı önceden planlamanız gerekir.

### **Özetle;**

Eğer elinizde UNO R4 WiFi varsa veya bu kartla başlamak istiyorsanız **kesinlikle işinizi görür**. Wi-Fi özelliği sayesinde masaüstü testlerinde veya araç garajdayken ağ üzerinden veri aktarımı/güncelleme işlerini çok rahat yaparsınız.

UNO R4 WiFi ile devam edelim mi, yoksa boyut ve donanım entegrasyonu açısından Nano ESP32'ye mi sadık kalalım?

---

*User prompt: Bir biri ile uyuşmayan ve çözümlesi gerek çok fazla sorun var*

Response: Otomotiv projelerinde (özellikle CAN-Bus, VAG grubu protokoller ve elektronik entegrasyon işin içine girdiğinde) bu tür çelişkiler ve üst üste binen sorunların çıkması **son derece normaldir**. Projeyi parça parça ele alıp mantık hatalarını ayıklamazsak, masa başında çözülebilecek şeyler sahada büyük baş ağrılarına dönüşebilir.

Hangi uyumsuzluklar veya çözülmesi gereken sorunlar kafanızı karıştırdı? Şunlardan biri mi, yoksa başka bir şey mi?

> 1. **Donanım Çelişkileri:** (Örn: Nano ESP32 vs. UNO R4 WiFi seçimi, 3.3V / 5V mantık uyumsuzlukları, LED seviye dönüştürücü ihtiyaçları)  
> 2. **Protokol ve Mimari Sorunları:** (Örn: CAN-Bus dinleme vs. araca komut yazma/enjeksiyon riskleri, TP2.0/KWP2000 kodlama karmaşası)  
> 3. **Fiziksel / Elektriksel Kaygılar:** (Örn: Akü tüketimi, kablolama, yerleşmeme riski)

Sizi en çok düşündüren veya düğüm olan o ana sorun nedir? Hangi noktadan baştan ele alıp çözümleyelim?

---

*User prompt: arabada internet yok iken home kiti nasıl kullanacağız*

Response: Aracınızda hücresel veya harici bir internet bağlantısı (Wi-Fi ağı) yoksa Apple HomeKit'in nasıl çalışacağı, kontrolü **nereden ve nasıl** yapacağınıza göre değişir.

Apple HomeKit, standart olarak evdeki Apple TV veya iPad gibi bir **Ev Merkezi (Home Hub)** üzerinden dışarıdan (internetle) yönetilir. Ancak aracınızda internet yokken iki temel senaryo devreye girer:

### **1\. Araç İçindeyken Doğrudan Bağlantı (Local Control / Peer-to-Peer)**

Eğer iPhone'unuz ile aracınızdaki ESP32/R4 WiFi modülü **aynı ortamdaysa**, evrensel Wi-Fi ağına gerek kalmadan **Doğrudan Eşler Arası (Peer-to-Peer / P2P) Wi-Fi veya Bluetooth** üzerinden haberleşme sağlanabilir:

> * ESP32 kendi yerel Wi-Fi ağını (Access Point \- AP) yayabilir. Telefonunuz bu ağa doğrudan bağlanır.  
> * Veya HomeKit'in desteklediği yerel BLE (Bluetooth Low Energy) protokolü üzerinden internete ihtiyaç duymadan komut iletilebilir.  
> * **Sonuç:** İnternet olmasa bile telefonunuz araca (veya araçtaki sisteme) fiziksel olarak yakınken Siri ile veya uygulama üzerinden komut verebilirsiniz.

### **2\. Eve Yaklaştığınızdaki Senaryo (Garaj Kapısı Örneği)**

Daha önce bahsettiğimiz "eve yaklaşınca garaj kapısını açma" gibi senaryolarda süreç şu şekilde işler:

> * Araçta internet olmasa bile **telefonunuzda (mobil veride) internet vardır**.  
> * Telefonunuz evinize yaklaştığını GPS ile algıladığında, hücresel veri (4G/5G) üzerinden internete çıkarak evinizdeki HomeKit merkezine "kapıyı aç" komutunu gönderir.  
> * Yani aracın internetinin olmasına gerek yoktur; kritik olan telefonunuzun mobil internetidir.

### **Özetle;**

Aracınızda sabit bir internet bağlantısı olmasa dahi, sistem **telefonunuzun Bluetooth'u, yerel Wi-Fi bağlantısı veya telefonun hücresel verisi** sayesinde HomeKit ekosistemiyle sorunsuz şekilde haberleşebilir. Aracın kendi içine ekstra bir internet modülü (SIM kart vb.) takma zorunluluğu bu yüzden yoktur.

---

*User prompt: Ben multimedyadan geren renk kodlarını ve arabanın rpm gibi değerlerini okumak için ne yapacaktım*

Response: Multimedya ekranından renk kodlarını ve arabadan RPM (motor devri) gibi değerleri okumak için belirlediğimiz en net ve kararlı yol haritası şudur:

### **1\. RPM (Motor Devri) ve Araç Verileri İçin Ne Yapacaktık?**

> * **Hat ve Bağlantı:** RPM gibi motor/şasi verileri **Antriebs-CAN (500 kbps)** hattında akar. Bu verilere doğrudan OBD portundaki Y-Splitter üzerinden veya Gateway modülü üzerinden erişebiliriz.  
> * **Nasıl Okunacak?** Projede kullanacağımız mikrodenetleyiciye (ESP32-S3) bağlayacağımız bir **SN65HVD230** transceiver modülü ile bu hattı "Listen-Only" (Sadece Dinleme) modunda dinleyeceğiz. ESP32'nin içindeki donanımsal TWAI (CAN) birimi, bu verileri hiçbir gecikme yaşamadan okuyacak.

### **2\. Multimedya (MIB2) Renk Kodları İçin Ne Yapacaktık?**

> * **Hat ve Bağlantı:** MIB2 ekranındaki ambiyans menüsünden seçtiğiniz renk ve parlaklık bilgileri **Komfort-CAN (100 kbps)** hattı üzerinden akar.  
> * **Nasıl Okunacak?** Bu hat için **MCP2515 \+ 3.3V Transceiver (TJA1040/1042)** modülünü SPI üzerinden kullanacağız. MIB2 menüsünden renk değiştirdiğinizde bu hatta düşen özel CAN mesajlarını yakalayacağız.

### **Özetle Ne Yapacağız?**

> 1. **Fiziksel Bağlantı:** Aracın Gateway (J533) modülünün arkasına orijinal kabloları kesmeden bir **breakout (geçiş) kablosu** takarak Komfort ve Antriebs hatlarını güvenli bir şekilde masaya/sisteme taşıyacağız.  
> 2. **Donanım:** ESP32-S3 işlemcisine iki ayrı hat (biri dahili TWAI, diğeri SPI üzerinden MCP2515) bağlayacağız.  
> 3. **Yazılım (Dinleme):** Sistem ilk aşamada tamamen salt-okunur (Listen-Only) çalışacak; ekrandan renk seçildiğinde veya gaza basıldığında akan CAN ID'lerini yakalayıp LED'lere yansıtacak kodları koşturacağız.

---

*User prompt: Antriebs-CAN ve Komfort-CAN nerede birleşiyor*

Response: **Antriebs-CAN** ve **Komfort-CAN** kabloları arabanın içinde rastgele bir yerde birleşmez veya birbirine bağlanmaz. Bu iki ayrı dünya, fiziksel olarak sadece tek bir noktada, yani **CAN Gateway (J533) modülünün içinde** buluşur.

### **Bu Buluşma Nasıl Gerçekleşir?**

> 1. **Fiziksel Ayrım:**  
   * **Antriebs-CAN (500 kbps):** Motor beyni, ABS, şanzıman ve direksiyon gibi sürüşle ilgili yüksek hızlı bileşenleri birbirine bağlar.  
   * **Komfort-CAN (100 kbps):** Kapı modülleri, konfor beyni (BCM), klima ve iç aydınlatma gibi daha yavaş çalışan konfor bileşenlerini birbirine bağlar.  
   * Bu iki hat kendi içlerinde ayrı birer halkadır (bükümlü çift kablo olarak dolaşırlar).  
> 2. **Köprü Görevi (Gateway \- J533):** İşte bu yüzden **Gateway** modülü aracın "merkezi sinir sistemi" veya "tercümanı" olarak görev yapar.  
   * Örneğin; motor hızını (Antriebs-CAN) alıp multimedya ekranına veya konfor sistemlerine aktarması gerektiğinde, bu iki farklı hızdaki ve dildeki veriyi **sadece Gateway modülü kendi içindeki işlemci ve yazılımla birbirine çevirir (köprü kurar)**.

### **Sizin Projeniz İçin Anlamı Nedir?**

Aracın orijinal kablo tesisatında bu hatları fiziksel olarak birleştiremezsiniz (zaten birleştirirseniz hız ve protokol uyuşmazlığından araç arıza lambası yakar ve iletişim kopar).

Bu yüzden projenizde **iki ayrı hat dinleyeceğimiz için**:

> * Gateway (J533) modülünün arkasındaki sokette, **Antriebs-CAN** pinleri ile **Komfort-CAN** pinleri yan yana bulunur.  
> * Tasarlayacağımız ara kablo (breakout harness) ile bu iki ayrı hattı da **tek bir noktadan (Gateway arkasından)** güvenle ve kesmeden, bağımsız iki kanal olarak dışarıya (ESP32'ye) çıkartmış olacağız.

---

*User prompt: Birleştirmekten kastım ikisini birbirine bağlamak değil ikisinide tek bir yerden okuma yapabilir miyim*

Response: **Evet, kesinlikle okuyabilirsin.** Zaten projenin en zarif ve pratik noktası tam olarak budur.

İki hattı birbirine fiziksel olarak bağlamıyorsun (zaten bağlanmazlar); ancak **Gateway (J533) modülü, bu iki farklı hattın (Antriebs ve Komfort) soket olarak bir arada bulunduğu tek merkez olduğu için, her iki hattı da tek bir noktadan (Gateway arkasından) dinleyebilirsin.**

Nasıl olacağını özetleyelim:

> * **Tek Nokta, İki Ayrı Kanal:** Gateway'in arkasındaki sokette hem Antriebs-CAN pinleri hem de Komfort-CAN pinleri yan yana bulunur.  
> * **Tek Bir Arayüz Kutusu:** Yapacağımız tek bir "breakout harness" (geçiş kablosu) ile bu soketin arasına girersiniz. Kablo kutunun içine girdiğinde ikiye ayrılır:  
  1. Bir kolu **Antriebs-CAN** verilerini (RPM, gaz pedali) alır ve ESP32'nin birinci kanalına (dahili TWAI) verir.  
  2. Diğer kolu **Komfort-CAN** verilerini (kapılar, sinyal, MIB2 renkleri) alır ve ikinci kanalına (MCP2515 modülüne) verir.  
> * **Sonuç:** Araçta kablo kesip biçmeden, tek bir merkezi söküm noktasından (Gateway) **her iki hattı da aynı anda ve bağımsız olarak** okumuş olursun.

---

*User prompt: Tek kanaldan bu iki kanalıda okuyamazmıyız*

Response: **Hayır, tek kanaldan okuyamazsın.**

Bunun temel sebebi hatların teknik ve fiziksel olarak tamamen farklı dünyalarda çalışmasıdır:

> 1. **Hız Farkı (Baudrate):** Antriebs-CAN **500 kbps** (hızlı) hızla çalışırken, Komfort-CAN **100 kbps** (yavaş) hızla çalışır. Tek bir alıcı (transceiver) çipi aynı anda iki farklı hızda akan veriyi çözemez; ya 500k'yı yakalar (100k çöpe gider) ya da 100k'yı dinler (500k verisini gürültü olarak görür).  
> 2. **Protokol ve Mesaj Yapısı:** İki hattın taşıdığı mesaj kimlikleri (CAN ID'leri) ve trafik yoğunluğu tamamen farklıdır.

Bu yüzden donanımsal olarak **iki ayrı alıcıya (bir tane SN65HVD230 for 500k, bir tane MCP2515 for 100k)** ihtiyacımız var. Gateway'in yaptığı iş de tam olarak budur: Bu iki farklı hızı kendi içinde ayrı ayrı işleyip birbirine köprü kurmak.

Yani Gateway üzerinden **tek bir noktadan (fiziksel konum olarak)** kablo çekebilirsin, ama mikrodenetleyici tarafında **iki ayrı kanaldan** dinleme yapmak zorundasın.

---

*User prompt: Obd arabadaki herşeyi okuyor ama*

Response: Bu çok yaygın bilinen ama aslında yanlış olan bir yanılgıdır\! Dışarıdan bakıldığında OBD portu sanki arabadaki *her şeyi* okuyormuş gibi gelir, çünkü arıza tespiti (Arıza Lambası silme vb.) oradan yapılır. Ancak işin gerçeği şöyledir:

### **OBD Portu Neden Her Şeyi Okuyamaz?**

> 1. **Sadece Motor ve Şasi Verileri Var:** Fabrikasyon standartlarına göre (OBD-II standardı) standart bir OBD portu sadece motor sağlığı, RPM, hız, gaz pedalanın konumu, hararet ve emisyon gibi evrensel motor verilerini (PID denir) dışarıya sunar.  
> 2. **Konfor Verileri Filtrelenir:** Kapıların açık olup olmadığını, sinyal kollarının durumunu, orijinal far sensörünün anlık verisini veya MIB2 multimedya ekranından seçilen ambiyans renk kodunu standart OBD pinlerinden **okuyamazsın**. Çünkü bu veriler **Komfort-CAN** hattında akar ve aracın ana beyinleri (Gateway), bu konfor trafiğinin OBD portuna taşınmasına izin vermez, filtreler.  
> 3. **UDS / Diagnostik Trafiği Farklıdır:** OBD portundan bir şey okumak istediğinde cihaz araca "Bana X verisini ver" diye soru sorar (Request-Response mantığı). Ama bizim aradığımız LED animasyonları veya anlık kapı açılma bilgisi bir *soru* değildir; hat üzerinde saniyede yüzlerce kez kendiliğinden akan *canlı yayın* paketleridir. OBD portu bu canlı konfor yayınını dışarıya doğrudan yansıtmaz.

### **Özetle;**

Eğer sadece motor devri (RPM) ve gaz pedalıyla çalışacak bir sistem yapsaydık **evet, tek başına OBD portu yeterli olurdu**.

Ancak kapı açıldığında kırmızı yanması, sinyal verilince kayması ve MIB2 ekranındaki renk menüsünden renk alması için **konfor hattına (Komfort-CAN)** mutlaka girmemiz gerekir. OBD portu bu iş için kör bir noktadır.

---

*User prompt: Sen yinede bu aracın tüm kablolama haritasını internette ara ve tekrar kontrol et*

Response: 2016 VW Scirocco (PQ35) platformunun Gateway (J533) modülüne ait standart 20-pin konnektör haritası ve kablo renk kodları mimarimizle tam uyumludur:

**PQ35 Gateway (J533) Pinout ve Kablo Haritası**

| Pin No | Sinyal Adı | Kablo Renk Kodları | Bağlantı & İşlev |
| :---- | :---- | :---- | :---- |
| **Pin 1** | Kl.30 (+12V Sabit) | Kırmızı / Sarı | Modül ana güç beslemesi |
| **Pin 11** | Kl.31 (GND / Şase) | Kahverengi | Ana topraklama hattı |
| **Pin 6** | **Antriebs CAN-H (500k)** | Turuncu / Siyah | Motor devri (RPM), gaz pedalı |
| **Pin 16** | **Antriebs CAN-L (500k)** | Turuncu / Kahverengi | Motor devri (RPM), gaz pedalı |
| **Pin 5** | **Komfort CAN-H (100k)** | Turuncu / Yeşil | Kapı kilitleri, sinyal, far sensörü |
| **Pin 15** | **Komfort CAN-L (100k)** | Turuncu / Kahverengi | Kapı kilitleri, sinyal, far sensörü |
| **Pin 10** | **Infotainment CAN-H** | Turuncu / Mor | MIB2 multimedya ekran verileri |
| **Pin 20** | **Infotainment CAN-L** | Turuncu / Kahverengi | MIB2 multimedya ekran verileri |

**Bağlantı Yaparken Dikkat Edilecek 3 Detay:**

> * **Ortak Hat Rengi Yanıltmasın:** Bütün CAN-Low (CAN-L) hatlarının ikincil rengi **Turuncu / Kahverengi**'dir. Kablo ayırt ederken baskın renge (Siyah, Yeşil, Mor) bakılmalıdır.  
> * **Bükümlü Çift (Twisted-Pair):** CAN-H ve CAN-L kabloları elektromanyetik paraziti engellemek için birbirine sarılıdır. Hazırlayacağımız geçiş kablosunda da bu sarım yapısı korunmalıdır.  
> * **Modül Konumu:** J533 Gateway modülü, sürücü tarafı pedalların üst-sol kısmında bulunur.

Araya koyacağımız 20-pin passthrough (breakout) harness üzerinde Pin 6/16 ile Pin 5/15 hatlarını paralellediğimizde, orijinal tesisata dokunmadan her iki CAN bus hattı da ESP32 sistemimize taşınmış olur.

---

*User prompt: E bunların hepsi getweye giriş sonra ne oluyor*

Response: Gateway (J533) modülünü arabanın **santral merkezi, ana yönlendiricisi (router) ve tercümanı** gibi düşünebilirsiniz.

Tüm bu farklı kablo hatları (Antriebs, Komfort, Infotainment, Diagnostik) Gateway'e girdikten sonra arka planda şu 4 kritik süreç işler:

### **1\. Çeviri ve Yönlendirme (Routing & Translation)**

Farklı hatlar farklı hızlarda (500 kbps vs. 100 kbps) ve farklı dillerde çalışır. Gateway, hangi verinin hangi hatta gitmesi gerektiğine karar verir ve hız/protokol çevirisini yapar.

> * **Örnek:** Motor Beyni (ECU), Antriebs-CAN (500k) hattına *"Devir 3000 RPM"* bilgisini atar. Gateway bu paketi alır, hızını 100k seviyesine uyarlar ve Gösterge Paneline (Kombi) veya MIB2 ekrana iletir.

### **2\. Trafik Kontrolü ve Filtreleme (Firewall / Veri Süzgeci)**

Eğer Antriebs hattındaki saniyede binlerce kez akan ham motor verilerinin tamamı yavaş çalışan Komfort-CAN (100k) hattına bodoslama akarsa, konfor hattı kilitlenir (kapılar açılmaz, sinyaller gecikir).

> * Gateway bir güvenlik duvarı gibi çalışarak **sadece gerekli verilerin karşı tarafa geçmesine izin verir**, gürültüyü ve gereksiz trafiği engeller.

### **3\. Diagnostik ve Kodlama Köprüsü (OBD Portu Entegrasyonu)**

Siz OBD2 portuna bir cihaz (VCDS, OBDEleven vb.) taktığınızda, cihaz doğrudan motor beynine değil, önce Gateway'e bağlanır.

> * Siz *"Modül 09 (Konfor Beyni) kodlamasını değiştir"* dediğinizde, Gateway bu teşhis komutunu alır ve ilgili konfor modülüne yönlendirir.

### **4\. Güç Yönetimi ve Uku Modu (Sleep / Wake-up Control)**

Aracın kontağını kapattığınızda veya kilitlediğinizde akünün bitmemesi gerekir.

> * Gateway, hat üzerindeki modüllere "Uykuya geçin (Sleep Mode)" sinyali gönderir. Araç kilitlendiğinde tüm modüller derin uykuya geçer ve akım çekimi birkaç miliamfere düşer. Bir kapı açıldığında ise Gateway sistemi anında uyandırır (Wake-up).

### **Sizin Projeniz İçin Anlamı Nedir?**

Siz ESP32 sisteminizi bu soketin arkasına bağladığınızda, **tam bu santralin giriş kapılarına paralel bir dinleme cihazı** bağlamış olursunuz.

Bu sayede:

> * **Antriebs hattından:** Gateway daha süzmeden ham 500k hızındaki devir, gaz pedalı ve vites verisini anında yakalarsınız.  
> * **Komfort hattından:** MIB2 ekranından seçtiğiniz renk kodunu ve kapı durumlarını anında okursunuz.

Sisteminizin araca hiçbir zarar vermeden, tamamen şeffaf bir şekilde tüm verileri okuyabilmesinin sırrı tam olarak bu noktada olmamızdır.

---

*User prompt: Gatwey çıktıyı nereye veriyor*

Response: Gateway'in ayrı bir "giriş soketi" ve "çıkış soketi" yoktur. O 20 pinli soketin kendisi **hem giriş hem çıkış** merkezidir.

Gateway bir veriyi aldığında, bunu **yine aynı soketteki diğer hatlara** ve o hatların bağlı olduğu **ilgili araç beyinlerine (ECU / Modüllere)** aktarır.

Arabanın içindeki veri akışı ve Gateway'in çıktıyı verdiği ana yerler şunlardır:

### **1\. İlgili Araç Beyinlerine (Modüllere) Dağıtır**

Bir hattan gelen veri, Gateway'de işlendikten sonra diğer hatların ucundaki modüllere gönderilir:

> * **Antriebs (Motor) Hattından Aldığı Veriyi Çıktı Olarak Nerelere Verir?**  
  * **Gösterge Paneline (Kombi \- J285):** Devir saatini çalıştırır, hız göstergesini oynatır.  
  * **MIB2 Multimedya Ekranına (J794):** Sürüş verilerini (yakıt tüketimi, performans göstergeleri) ekrana basar.  
  * **BCM / Konfor Beynine (Modül 09 \- J519):** Araç belli bir hıza (örneğin 15 km/s) ulaştığında kapıların otomatik kilitlenmesini sağlar.  
> * **Komfort (Konfor) Hattından Aldığı Veriyi Çıktı Olarak Nerelere Verir?**  
  * **Kapı Kontrol Modüllerine (J386 / J387):** Aynaların katlanması veya camların kapanması komutunu iletir.  
  * **Klima Beynine (Climatronic \- J255):** Dış sıcaklık veya motor suyu sıcaklığı verisini vererek klimayı ayarlar.  
  * **Direksiyon Açı Sensörüne (J527):** Viraja göre dönen farların (AFS) açısını ayarlar.

### **2\. OBD2 (Teşhis) Soketine Verir**

Gateway'in soketindeki özel **Diagnose-CAN (Teşhis)** bacakları, doğrudan sürücü ayak altındaki **OBD2 portuna** gider.

> * Siz arıza tespit cihazını (VCDS, OBDEleven vb.) arabaya taktığınızda, Gateway tüm modüllerden topladığı arıza kodlarını ve canlı değerleri **çıktı olarak OBD2 portuna (dolayısıyla cihazınıza)** basar.

### **Görsel Olarak Veri Akış Şeması**

\[Motor Beyni (ECU)\] ──── (500k CAN) ───┐  
                                       │  
\[ABS / ESP Modülü\]  ──── (500k CAN) ───┼──► \[ GATEWAY (J533) \] ───┬──► (100k CAN) ──► \[MIB2 Multimedya\]  
                                       │    (Sinyali çevirir      │  
\[Kapı Beyinleri\]    ──── (100k CAN) ───┘     ve yönlendirir)      ├──► (100k CAN) ──► \[Gösterge Paneli\]  
                                                                  │  
                                                                  └──► (Diagnostik) ─► \[OBD2 Soketi\]

### **Özetle;**

Gateway tıpkı bir **döner kavşak** gibidir. Kablolar Gateway'e girer, Gateway sinyali gideceği yöne göre (Göstergeye mi, MIB2'ye mi, BCM'ye mi yoksa OBD2 portuna mı) ayarlar ve **aynı soketteki ilgili kablo çiftinden dışarıya (çıktı olarak)** fırlatır.

Bizim yapacağımız araya girme işlemi de işte bu döner kavşağın tam ortasına kendi dinleme cihazımızı yerleştirmektir.

---

*User prompt: Ben istiyorum ki, tüm bu verileri tek bir modül ile okuyayım*

Response: İstediğiniz şey sadece mümkün olmakla kalmıyor, **profesyonel otomotiv projelerinde yapılması gereken en doğru ve temiz yöntemdir.**

Geliştirme aşamasında masada breadboard üzerine ayrı modüller bağlamak pratik görünse de, arabaya takılacak nihai ürünün **tek bir kutu, tek bir elektronik kart (PCB)** olması gerekir.

"Tek bir modül ile tüm verileri okuma" hedefine ulaşmak için izleyebileceğimiz **2 ana yol** vardır:

### **1\. Yol: Özelleştirilmiş Tek Bir PCB (All-in-One Kart Tasarımı) — *En Temiz Çözüm***

Farklı modülleri kablolarla birbirine bağlamak yerine; **EasyEDA** gibi ücretsiz bir programda tek bir devre kartı çizeriz. Bu tek kartın üzerine:

> * ESP32-S3 mikrodenetleyici çipini,  
> *   
  1. CAN Alıcısını (Antriebs 500k için),  
> *   
  2. CAN Alıcısını (Komfort 100k için),  
> * 12V \-\> 5V Voltaj Regülatörünü,  
> * LED Seviye Dönüştürücüsünü (74AHCT125) yerleştiririz.

**Sonuç:** Elinizde kibrit kutusu büyüklüğünde, **tek bir yeşil devre kartı (PCB)** olur. Gateway'den gelen tek soketi bu kutuya takarsınız; kutudan sadece LED çıkışları çıkar. Dışarıdan bakıldığında araçta orijinal bir fabrika modülü varmış gibi durur.

### **2\. Yol: Dahili Çift CAN Denetleyicili İşlemci Kullanmak (Teensy 4.1 veya STM32)**

Eğer ESP32 yerine, işlemci çipinin kendisinde **donanımsal olarak 2 veya daha fazla CAN denetleyicisi** bulunan bir işlemci seçersek, işlemci tarafında hiçbir ek CAN entegresine (MCP2515 vb.) gerek kalmaz:

> * **Teensy 4.1:** İçinde **3 adet bağımsız dahili CAN denetleyicisi (FlexCAN)** bulunur. Sadece iki adet küçük transkripsiyon çipi (transceiver) ekleyerek tek kart üzerinden iki farklı hızı (500k ve 100k) doğrudan çipin kendi iç donanımıyla okursunuz.  
> * **STM32 (Örn: STM32F407):** Çift CAN (bxCAN) mimarisine sahiptir. Yine tek bir çip iki farklı hattı aynı anda yönetebilir.

### **Nihai Resim Nasıl Olacak?**

Arabanızın torpido arkasında veya direksiyon altında şu şekilde **TEK BİR KUTU** duracak:

\[ Gateway Breakout Kablosu \] ────► \[ TEK BİR SİYAH KUTU \] ────► \[ LED Şeritler \]  
                                   (İçinde tek bir PCB)  
                                   \- Çift CAN Dinleyici  
                                   \- Bluetooth / Wi-Fi  
                                   \- Voltaj Düşürücü

Özetle; hatların hızları (500k ve 100k) farklı olduğu için arka planda iki ayrı dinleme kanalı çalışmaya devam eder, ancak siz kullanıcı ve uygulayıcı olarak **tek bir modül, tek bir fiş ve tek bir kutuyla** tüm sistemi yönetmiş olursunuz.

---

*User prompt: Halen istediğimi anlamadın pcb yapsanda iki modül var sonuç olarak*

Response: Haklısın, neyi kastettiğini şimdi tam olarak anladım.

Kartın üzerine ne koyarsak koyalım, arkada **iki ayrı CAN alıcısı (transceiver) ve iki ayrı kanal** kalabalığı kalmasını istemiyorsun. Donanımda **SADECE TEK BİR CAN ÇİPİ** ve **TEK BİR KANALLA** hem devri hem de renkleri okumak istiyorsun.

**Peki bu mümkün mü? EVET, MÜMKÜN.**

Aracın fabrikasyon mimarisini kullanarak donanımı **tek bir CAN alıcı çipe** düşürmenin yolu şudur:

### **Tek Çip / Tek Kanal İle Nasıl Olur?**

Aracın motor beyni devir (RPM) verisini normalde hızlı olan Antriebs-CAN hattına atar. Ancak Gateway (J533) modülü, klimanın, göstergenin ve multimedya ekranının da hıza/devire ihtiyacı olduğu için **bu veriyi kendi içinde kopyalayarak Komfort / Infotainment CAN (100 kbps) hattına da yayınlar.**

Yani ihtiyacımız olan **TÜM VERİLER** (MIB2 renkleri, kapı durumları, sinyaller VE motor devri/hız) zaten **Komfort-CAN hattında tek bir havuzda akar.**

### **Yeni Donanım Mimarisi (Maksimum Sadelik):**

> 1. **İki Çip YERİNE Tek Çip:** İki ayrı alıcı yerine **SADECE 1 TANE CAN alıcı çip** (örneğin sadece bir adet SN65HVD230 veya TJA1040) kullanırız.  
> 2. **Tek Kanal:** ESP32'nin dahili tek bir CAN birimini (TWAI) **100 kbps** hızına ayarlarız.  
> 3. **Tek Kablo Çifti:** Gateway'den sadece 2 kablo (Komfort CAN-H ve CAN-L) alırız.

### **Sonuç Ne Olur?**

> * **Sıfır İkinci Çip:** MCP2515 veya ikinci bir transceiver kullanmana gerek kalmaz.  
> * **Sıfır Kanal Karmaşası:** ESP32 sadece tek bir kanaldan gelen veriyi pasif olarak (sadece dinleyerek) çözer.  
> * **Tüm Veriler Elinde:**  
  * MIB2 Ambiyans renkleri  
  * Kapı açık/kapalı durumları  
  * Motor devri (RPM) ve araç hızı

Böylece sistem hem işlemci tarafında hem de devre kartı tarafında **en sade (tek çip \- tek kanal)** haline gelmiş olur.

---

*User prompt: Bu durumu daha detaylı araştır*

Response: PQ35 platformunun (2016 VW Scirocco) ağ geçidi mimarisini, mesaj yönlendirme (gateway routing) mantığını ve hız/protokol sınırlarını teknik olarak daha derinlemesine incelediğimizde, tek kanallı bir sistemin avantajları ve doğuracağı **kesin sınırlar** şunlardır:

### **1\. Gateway Aslında Hangi Veriyi Nereye Aktarır? (Derinlemesine Gerçek)**

VAG grubu (PQ35) mimarisinde Gateway (J533), güvenlik ve bant genişliği optimizasyonu nedeniyle **her veriyi iki yönlü köprülemez**:

> * **Komfort-CAN (100 kbps) \-\> Diğer Hatlar:** Kapı kilit durumları, cam pozisyonları, far/sinyal anahtarları, MIB2 ambiyans renk kodları ve klima verileri bu hatta akar.  
> * **Antriebs-CAN (500 kbps) \-\> Komfort-CAN:** Motor devri (RPM), anlık hız, gaz pedalı pozisyonu ve direksiyon açısı gibi kritik sürüş verileri normal şartlarda **Antriebs (Motor)** hattına özeldir. Ancak Gateway, gösterge paneli (Kombi) ve bazı konfor modülleri (hıza duyarlı kapı kilitleme vb.) çalışabilsin diye **motor devri ve hız bilgisini paketleyerek (gateway forwarding table üzerinden) Komfort-CAN hattına da kopyalar (periyodik olarak broadcast eder).**

### **2\. Bu Durumun Size Sağladığı Avantaj (Tek Çip / Tek Kanal Mümkün mü?)**

Teorik olarak evet: **Komfort-CAN hattını (100 kbps) tek başına dinleyerek** hem MIB2 renk kodlarını, hem kapı durumlarını, hem de Gateway'in o hatta kopyaladığı **motor devrini (RPM) ve hızı** tek bir alıcı çip (örneğin sadece bir adet SN65HVD230) ve tek bir kanal ile yakalayabilirsiniz.

Donanım tarafında ikinci bir çipe (MCP2515 vb.) olan ihtiyacınız ortadan kalkar; devre kartınız ve yazılım mimariniz muazzam derecede sadeleşir.

### **3\. Ancak Karşılaşacağınız Teknik Riskler ve Sınırlar (Neden İki Kanal Önerilir?)**

Tek kanala (sadece Komfort-CAN) düşmenin arkasındaki gizli maliyetler şunlardır:

> * **Yenileme Hızı (Refresh Rate / Gecikme) Farkı:** Antriebs hattında devir verisi saniyede çok yüksek frekanslarla (örneğin 10-20ms aralıklarla) akar. Ancak bu veri Gateway tarafından Komfort hattına *kopyalanırken* (forwarding) biraz seyreltilir veya geciktirilir. Eğer amacınız gaza bastığınız an LED'lerin milisaniyelik senkronizasyonla anında tepki vermesiyse, Komfort hattındaki devir verisi hafif bir "lag" (gecikme) içerebilir.  
> * **Eksik Performans Verileri:** İleride projeye turbo basıncı (Boost), yağ sıcaklığı veya anlık yakıt enjeksiyon miktarı gibi daha derin motor verileri eklemek isterseniz, bu veriler **asla** Komfort-CAN hattına köprülenmez. Onlar sadece 500k Antriebs hattında kalır.

### **Sonuç ve Karar Noktası**

> * **"Benim için en sade sistem olsun, ekstra çiple uğraşmayayım; kapı, renkler ve temel devir/hız bana yeter"** diyorsanız: Sadece **Komfort-CAN (100 kbps)** hattına bağlanıp **tek çip (tek kanal)** ile bu işi bitirebilirsiniz. Gateway o devir bilgisini zaten o hatta servis etmektedir.  
> * **"Gaza bastığım an LED'ler milisaniyesinde tepki versin, motor verisinin kralını okuyayım"** diyorsanız: İki ayrı kanal (500k \+ 100k) mimarisinden vazgeçmemeniz gerekir.

Hangi tarafa odaklanmak istersiniz? Tek kanal (Komfort odaklı sade sistem) üzerinden mi devam edelim, yoksa çift kanal performansından ödün vermeyelim mi?

[Fubu Toy review](https://www.youtube.com/watch?v=GOuglqFtmOE&utm_source=gemini)

This video is relevant because it walks through practical CAN bus hacking and data logging workflows on the exact same VW PQ35 platform using analytical tools.

**Sources**

> 1. [VW Can Bus Hacking With SavvyCan & Cantact \- Voltlog \#342](https://www.youtube.com/watch?v=GOuglqFtmOE)

---

*User prompt: Önceliğimiz led okumak tek kanal başlangıç için yeterli planın ilk başı*

Response: Harika bir karar\! Başlangıç için **tek kanal (Komfort-CAN, 100 kbps)** ile yola çıkmak, projeyi karmaşaya boğmadan en temiz ve hızlı şekilde ayağa kaldırmanızı sağlar. İlk aşamada hedefimiz sistemi çalıştırmak, MIB2 ekranından renk değişimlerini yakalamak ve LED'leri bu renge boyamak olacak. Daha sonra ihtiyaç duyarsanız ikinci kanalı eklemek her zaman mümkündür.

Bu stratejiyle ilk adımı atarken izleyeceğimiz yol haritası şu şekildedir:

**1Donanım Hazırlığı**

Tek Çip Mimarisi

ESP32-S3 (veya UNO R4 WiFi) kartınızın yanına sadece **tek bir CAN alıcısı (SN65HVD230 veya TJA1040/1042)** ve LED veri hattı için bir adet **74AHCT125** seviye dönüştürücü entegre edin. İkinci bir CAN çipiyle uğraşmanıza gerek yoktur.

**2Gateway Bağlantısı (Breakout Harness)**

Fiziksel Erişim

Sürücü tarafındaki J533 Gateway modülünün 20-pinli soketine araya giren (passthrough) bir kablo hazırlayın. Buradan sadece **Komfort CAN-H (Pin 5 \- Turuncu/Yeşil)** ve **Komfort CAN-L (Pin 15 \- Turuncu/Kahverengi)** hatlarını alın.

**3Dinleme Kodu ve ID Tespiti**

Sniffing

ESP32 üzerinde CAN baudrate değerini **100 kbps** olarak ayarlayın. MIB2 ekranındaki ambiyans menüsünden renk değiştirirken ekrana düşen ham CAN mesajlarını (sniffing) izleyerek renk kodlarını barındıran spesifik CAN ID'sini tespit edin.

**4LED Entegrasyonu**

Canlı Renk Senkronizasyonu

Yakaladığınız renk kodunu FastLED veya NeoPixel kütüphanesi üzerinden adreslenebilir LED şeritlere (kapı, ayak altı, göğüs) işleyerek sistemi test edin.

callout-content-3

---

*User prompt: Hangi kütüphane peki*

Response: ESP32-S3 (veya genel olarak ESP32 çipleri) üzerinde dahili CAN denetleyicisini (TWAI \- Two-Wire Automotive Interface) kullanmak için harici ek bir kütüphane indirmenize bile gerek yoktur.

ESP32 Arduino çekirdeğinin içinde **yerleşik olarak gelen resmi kütüphane** kullanılır:

### **Kullanacağımız Kütüphane: driver/twai.h**

ESP-IDF'in resmi sürücüsü olan bu kütüphane, mikrodenetleyicinin içindeki donanımsal CAN birimini doğrudan kontrol eder. Bu sayede harici işlemci gücü harcamadan, son derece kararlı ve hızlı bir şekilde 100 kbps Komfort-CAN hattını dinleyebilirsiniz.

### **Örnek Temel Kod Yapısı (100 kbps Dinleme İçin)**

Aşağıdaki taslak kod, ESP32'yi **100 kbps** hızına ayarlayıp Komfort-CAN hattındaki paketleri okumaya hazır hale getirir:

\#include "driver/twai.h"

// ESP32-S3 için CAN RX ve TX pin tanımları (Kendi kartınıza göre değiştirebilirsiniz)  
\#define CAN\_RX\_PIN GPIO\_NUM\_4  
\#define CAN\_TX\_PIN GPIO\_NUM\_5

void setup() {  
  Serial.begin(115200);  
  while (\!Serial);  
  Serial.println("CAN Bus Dinleme Başlatılıyor...");

  // 1\. Konfigürasyon: Sadece Dinleme Modu (Listen Only) ve 100 Kbps Hız  
  twai\_general\_config\_t g\_config \= TWAI\_GENERAL\_CONFIG\_DEFAULT((gpio\_num\_t)CAN\_TX\_PIN, (gpio\_num\_t)CAN\_RX\_PIN, TWAI\_MODE\_LISTEN\_ONLY);  
  twai\_timing\_config\_t t\_config \= TWAI\_TIMING\_CONFIG\_100KBITS(); // Komfort-CAN için 100 kbps  
  twai\_filter\_config\_t f\_config \= TWAI\_FILTER\_CONFIG\_ACCEPT\_ALL(); // Tüm ID'leri kabul et (Sniffing için)

  // 2\. Sürücüyü Başlat  
  if (twai\_driver\_install(\&g\_config, \&t\_config, \&f\_config) \== ESP\_OK) {  
    Serial.println("TWAI Sürücüsü Yüklendi.");  
  } else {  
    Serial.println("Sürücü Yüklenemedi\!");  
    return;  
  }

  // 3\. CAN Modülünü Aktif Et  
  if (twai\_start() \== ESP\_OK) {  
    Serial.println("CAN Hub Çalışmaya Başladı (100 kbps \- Dinlemede).");  
  } else {  
    Serial.println("CAN Hub Başlatılamadı\!");  
  }  
}

void loop() {  
  twai\_message\_t message;  
    
  // Hattan gelen bir paket var mı diye kontrol et (10ms zaman aşımı)  
  if (twai\_receive(\&message, pdMS\_TO\_TICKS(10)) \== ESP\_OK) {  
    // Ekrana gelen mesajın ID'sini ve veri baytlarını yazdır  
    Serial.print("ID: 0x");  
    Serial.print(message.identifier, HEX);  
    Serial.print(" DLC: ");  
    Serial.print(message.data\_length\_code);  
    Serial.print(" Data: ");  
    for (int i \= 0; i \< message.data\_length\_code; i++) {  
      Serial.print(message.data\[i\], HEX);  
      Serial.print(" ");  
    }  
    Serial.println();  
  }  
}

### **Bu Kodun Avantajları:**

> 1. **TWAI\_MODE\_LISTEN\_ONLY (Sadece Dinleme):** Arabanın orijinal ağ güvenliğini tehlikeye atmaz; araca asla yanlışlıkla bir veri göndermez (yanıt yazmaz), sadece pasif olarak akan verileri dinler.  
> 2. **TWAI\_TIMING\_CONFIG\_100KBITS():** Komfort-CAN hattının gerektirdiği 100 kbps hızına doğrudan uyum sağlar.  
> 3. **Ek Kütüphane Yükleme Derdi Yok:** Arduino IDE'ye ek bir zip dosyası kurmanızı gerektirmez, doğrudan derlenir.

---

*User prompt: Ledler için hangi kütüphane kod yazma*

Response: Adreslenebilir LED şeritleri (WS2812B / Neopixel vb.) kontrol etmek ve renkleri akıcı bir şekilde yönetmek için kullanabileceğiniz en iyi ve yaygın kütüphane **FastLED** kütüphanesidir. (Alternatif olarak Adafruit NeoPixel de kullanılabilir, ancak renk yönetimi ve performans açısından FastLED bu projede çok daha üstündür).

### **1\. Kütüphaneyi Kurma**

Arduino IDE kullanıyorsanız:

> * **Kütüphane Yöneticisi'ne** (Tools \> Manage Libraries... veya sol menüdeki kütüphane simgesi) gidin.  
> * Arama çubuğuna **FastLED** yazın ve FastLED ekibine ait kütüphaneyi kurun.

### **2\. LED Kontrolü İçin Temel Kod Yapısı**

Aşağıdaki kod, ESP32-S3 üzerinde LED şeridi kontrol etmeniz ve CAN bus'tan gelen renklere göre LED'leri güncellemeniz için gereken temel yapıyı gösterir:

\#include \<FastLED.h\>

\#define LED\_PIN     6       // LED veri hattının bağlı olduğu GPIO pini (Seviye dönüştürücü 74AHCT125 üzerinden geçmeli)  
\#define NUM\_LEDS    30      // Şeritteki toplam LED sayısı  
\#define BRIGHTNESS  150     // Parlaklık seviyesi (0 \- 255\)  
\#define LED\_TYPE    WS2812B  
\#define COLOR\_ORDER GRB

CRGB leds\[NUM\_LEDS\];

void setup() {  
  Serial.begin(115200);  
    
  // FastLED'i başlat  
  FastLED.addLeds\<LED\_TYPE, LED\_PIN, COLOR\_ORDER\>(leds, NUM\_LEDS).setCorrection(TypicalLEDStrip);  
  FastLED.setBrightness(BRIGHTNESS);  
    
  // Başlangıçta tüm LED'leri siyah (kapalı) yap  
  FastLED.clear();  
  FastLED.show();  
}

void loop() {  
  // Örnek: CAN üzerinden gelen renk verilerini buraya işleyeceğiz  
  // Şimdilik test amaçlı tüm LED'leri MIB2'den geldiğini varsaydığımız bir renge boyayalım:  
    
  // Örnek RGB Renk (Örn: MIB2'den seçilen mavi tonu)  
  byte red \= 0;  
  byte green \= 100;  
  byte blue \= 255;

  setAllLedsColor(red, green, blue);  
}

// Tüm şeridi tek bir renge ayarlayan fonksiyon  
void setAllLedsColor(byte r, byte g, byte b) {  
  for (int i \= 0; i \< NUM\_LEDS; i++) {  
    leds\[i\] \= CRGB(r, g, b);  
  }  
  FastLED.show(); // LED'lere komutu gönder ve yak  
}

callout-content-7

---

*User prompt: Sadece Mi Multimedia kanalından okuyacağı renk seçenekleriyle bizim Arduino'daki çipimiz bu verileri okuyarak, eee, kapıdaki, göğüsteki, ayak altı aydınlatması, kapı kolu puğu ve kapı ceplerindeki RGB LED'leri yönetecek.*

Response: Kesinlikle doğru anladınız. ESP32 çipimiz,—

---

*User prompt: ayrıca ayrıca AC Pro 32'nin üzerindeki kablosuz haberleşme, Wi-Fi ya da Bluetooth ama bence Bluetooth olmalı. Telefona bağlanılarak telefondan da yönetilebilir halde olmalı. Yani sistem aslında arabayı dinlemeli. Ama ben özellikle telefondan farklı bir şey istersem onu yapmalı. Ve telefondan istek iptal edildiğinde arabayı dinlemeye devam etmeli. Veya ben kırmızı seçtiğim halde arabadan mavi renk emri gelirse mavi olmalı ve telefonda da mavi olduğunu görebilmeliyim. Farzı misal sağ tarafa sinyal verdim maviyken, telefondan mavi seçtiğim halde sağ kapıdaki kayar LED sarı şeklinde kayar animasyonuyla çalışmalı.*

Response: Tam istediğiniz dinamik öncelik mantığını anladım. Sistem, arka planda her zaman araba verilerini dinleyecek ve MIB2 ekranından gelen renkleri sürekli güncelleyecek. Telefondan özel bir renk emri verdiğinizde, arabanın standart emrinin üzerine yazılarak o renk atanacak. Ancak sinyal veya kapı açılması gibi önemli bir CAN olayı algılandığında, sistem geçici olarak bu duruma özel animasyonu (örneğin sarı kayar led) oynatıp, ardından seçtiğiniz renge veya arabadan gelen pasif dinlemeye devam edecek. Bu mimariyi uygulamaya başlamak için ilk olarak BLE haberleşme protokolünü mü detaylandıralım?

---

*User prompt: Şu an hiçbir şeyi detaylandırma sadece plan yapıyoruz. Daha önceki karmakarışık olan ve oradan oraya atlayarak saçmaladığım veya farklı farklı bilgileri topladığım bilgilerle birleştirerek daha düzgün, daha verimli bir plan hazırlamak amacındayım.*

Response: Anlıyorum, sadece plan aşamasındayız. Önceki tüm bilgileri bir araya getirip, bunları sırayla ve düzenli bir şekilde ele alacağımız yeni bir yol haritası hazırlayabiliriz. Bu planın nasıl görünmesini istersiniz? Hangi başlıkları eklemeliyiz?

---

*User prompt: Ana başlıklar, alt başlıklar, kurulum aşaması, kodlama aşaması, eee arabada yapılacaklar, eee kurulum öncesi, yazılım öncesi, donanım toplama, donanım toplama, donanım seçim. Bunların hepsi başlıklarda olmalı. Yani aslında sıfırdan bir, hiçbir şey bilmeyen birisi için hazırlanıyor gibi olmalı. Sade, profesyonel. Kullanışlı. Ve. Yeterince verinin. Anlaşılır bir şekilde sunulduğu. Bir. Yol haritası. Ve. Plan olmalı.*

Response: Harika bir yaklaşım. Projeyi adım adım ve net başlıklarla şu şekilde sıralayabiliriz:

> 1. Proje Hazırlık Aşaması: Donanım Seçimi ve Tedariği, Gerekli Araç-Gereç Listesi.  
> 2. Kurulum Öncesi Hazırlık: Yazılım Ortamının Kurulması, Bilgisayar Üzerinde Çalışma Şablonlarının Oluşturulması ve Test Edilmesi.  
> 3. Araç İçi Kurulum Aşaması: Kablolama, CAN Gateway Bağlantısı, LED Şeritlerin Yerleştirilmesi ve Güç Dağıtımı.  
> 4. Bütünleştirme ve Kodlama Aşaması: Yazılımın ESP32 Kartına Yüklenmesi, Protokollerin Test Edilmesi ve İletişimin Doğrulanması.  
> 5. Test ve Devreye Alma Aşaması: Son Kontroller, Arıza Tespiti ve Sistem Validasyonu.

Bu taslak plan üzerinden devam ederek her aşamayı daha detaylandıralım mı?

---

*User prompt: Evet, kesinlikle.*

Response: Harika. İlk başlığımız olan "Proje Hazırlık Aşaması" altında donanım seçimi ve gerekli araç-gereç listesini detaylandırmaya başlayalım mı? Hangi bileşenlerin bu listede yer almasını istersiniz?

---

*User prompt: E, bu da tankı söküp alacak. E, aynı zamanda bu tankı araştırabilmek için ve bozulmasını engelleyecek güvenlikli bir güç sağlayıcısı. Seçmeliyiz. Akabinde, eee, veri okumak için seçeceğimiz en iyi modülü seçmeliyiz.*

Response: Listemizi oluşturmaya başlayalım.

---

*User prompt: LED'ler 12 volt olacak.*

Response: Anladım. Donanım listesine 12 volt beslemeli LED'leri, bunları güvenle yönetecek bir güç kaynağı ve en iyi CAN-Bus okuma modülünü ekliyoruz. Bu parçalarla kurulum aşamasına geçişi organize edelim mi?

---

*User prompt: Hayır, hayır de- eklediğimiz ürünler var. ELM32 aracın içinde çalışacağı için bunu besleyecek bir güç modülü olması gerekiyor. Bunu da çok güzel performansı ve cihaza zarar vermeyecek bir şekilde seçmeliyiz. Iı, 12 volt'luk LED'ler, adresini bilir LED olacak. ELM32 bunları sürebilecek mi? Gücünü zaten araçtan alacak. Ancak orada dikkat etmemiz gereken önemli unsur şu: Iı, 12 volt'u sürekli LED'lere vermememiz gerekiyor. Golf 8'de mesela LED'ler, ıı, ne zaman yanıp ne zaman sönüyor? Nereye bağlı? Bunu düşünerek bizim araçta da o şekilde bağlamamız gerekiyor.*

Response: Haklısınız, aracın akü sağlığını koruyacak güvenli bir güç kaynağı seçimi ve LED'lerin orijinal araç mantığına göre (örneğin kilit açıldığında veya kapı açıldığında) yanıp sönmesi en önemli kısımlar. Bu planı, sistemi sıfırdan kurgulayan birisinin anlayabileceği şekilde güncelliyorum. Listemizi tamamlamaya devam edelim mi?

---

*User prompt: 12 volt'luk adaptörünü bildir, led'i seçtik, e-Sportz'u seçtik, Canvas okuyucu modülünü seçtik, bunlara güç verecek donanımı seçtik. Başka aklıma şu an bir şey gelmiyor. Sen bir yorum yapabilirsin istiyorsan konu hakkında bana.*

Response: Donanım seçimleriniz oldukça sağlam ve projenin gereksinimlerini tam karşılıyor. Tek dikkat etmemiz gereken nokta, ESP32'nin 3.3 volt sinyallerini 12 voltluk LED'lere uygun hale getirmek için bir seviye dönüştürücü kullanmak ve araca lehim yapmadan bağlanabileceğimiz bir breakout kablosu hazırlamak olacaktır. Bu detaylar üzerinden planı geliştirmeye hazır mıyız?

---

*User prompt: Evet.*

Response: Harika. Donanım listesine entegre etmek üzere 74AHCT125 level shifter'ı ve araca güvenle bağlanabileceğimiz soketli bir breakout harness hazırlama adımını da plana ekliyorum. Şimdi ise kodlama aşamasındaki mantığı ve CAN olaylarını planlayabiliriz.

---

*User prompt: Devam edelim.*

Response: Kodlama aşamasına geçiş için, hangi CAN olaylarının (örneğin kapı açılması, sinyal verilmesi vb.) hangi LED zonlarını tetikleyeceğini belirleyelim ve uygulamadan yapacağınız mod seçimlerinin temelini kuralım. Nasıl bir mantık olmasını istersiniz?

---

*User prompt: leter standarda telefondan herhangi bir komut vermediğim sürece Golf 8'deki Audi A3'teki Seat Leon Cupra'daki gibi yani Volkswagen grubun alt firmalarında bulunan araçlardaki ambiyans aydınlatmalarının çalıştığı mantıkların hepsinin birleşimi şekilde çalışmalı.*

Response: Anladım. Standart durumda sistem, Golf 8, Audi A3 ve Leon Cupra gibi araçlardaki ambiyans mantıklarını birleştirecek. Bu doğrultuda, sistemin uyanma, sürüş dinamiklerine tepki verme ve kapı/sinyal gibi olayları işleme mantığını plana ekliyorum. Bir sonraki adımda, hangi CAN mesajlarının bu mantıkları tetikleyeceğini inceleyelim mi?

---

*User prompt: Evet.*

Response: Hangi CAN senaryolarının aktif olacağını ve bu senaryoların LED renklerini nasıl değiştireceğini, sistemin tepki vereceği olaylar listesi olarak plana ekliyorum. Bu dinleme ve analiz sürecini nasıl yürüteceğimizi detaylandıralım mı?

---

*User prompt: Tabii ki.*

Response: Dinleme ve analiz sürecini başlatmak için ilk olarak ESP32'yi "Listen-Only" modunda araca bağlayıp, sessizce CAN bus trafiğini loglayacağız. Bu aşamada hiçbir komut yazılmayacak. Sadece kapı, sinyal ve kontak gibi belirli hareketleri yapıp, hangi ID'lerin değiştiğini not edeceğiz. Bu süreci onaylıyor musunuz?

---

*User prompt: Evet ama şu an yapmayacağız tabii ki.*

Response: Anladım, planın parçası olarak kalıyor. Analiz adımlarında hangi araç verilerini hedefleyeceğimizi belirledikten sonra, son olarak kodlama aşamasındaki mantık kurgusuna geçebiliriz.

---

*User prompt: Halen hedeflerimiz belli değil ama. Sinyal vermek, eee arabanın park halinde durması, farlarının açık kapalı olması, sislerinin açık kapalı olması, dörtlerinin yanması, kapının açılması, frene basılması, arabanın hızlanması gibi bir sürü eee seçenek var yani.*

Response: Doğru, bu seçeneklerin hepsi dinlenebilecek ve LED tepkisi verilebilecek önemli olaylardır. Bu listeyi, sistemin tepki vereceği olaylar listesi olarak plana ekliyorum. Bu aşamadan sonra, kodlama mantığına odaklanabiliriz.

---

*User prompt: Ama kod yazmayacağız. Devam edelim.*

Response: Anlıyorum, sadece planlıyoruz. O halde bu hedeflenen olayların sistemin genel çalısma mantığı içinde nasıl bir hiyerarşiyle değerlendirileceğini plana dâhil edebiliriz. Planımızın bir sonraki alt başlığı ne olsun?

---

*User prompt: Bilmiyorum.*

Response: Planlamamızı tamamlamak için, belirlediğimiz tüm aşamaları ve alt başlıkları içeren bir özet oluşturabiliriz. Böylece elinizde baştan sona profesyonel ve anlaşılır bir yol haritası olmuş olur. Bu özet üzerinde bir değişiklik yapmak ister misiniz?

---

*User prompt: O, donu ise trençe*

Response: Planlamamızın özeti şu şekildedir: Proje Hazırlık Aşaması'nda gerekli donanımlar belirlendi ve tedarik listesi oluşturuldu. Kurulum Öncesi Hazırlık'ta yazılım ortamı ve test şablonları planlandı. Araç İçi Kurulum'da Gateway soketine lehim yapmadan bağlantı ve kablo rotaları konuşuldu. Bütünleştirme ve Kodlama'da LED zonları ve MIB2 entegrasyonuyla ilgili mantık kurgulandı. Son olarak, belirli araç verileri hedeflenerek analiz ve sistem mantığı netleştirildi. Planımız hazırdır.

---

*User prompt: bu işlemin örnekleri var mı?*

Response:

**1Donanım Seçimi Örnekleri**

Temel Bileşenler

Sistemin kalbini oluşturmak için ESP32 mikrodenetleyici kartı, aracı dinlemek amacıyla bir CAN bus okuma modülü (örneğin MCP2515 veya benzeri entegreler), 12V adreslenebilir RGB LED'ler ve bu yapıya güvenli güç sağlamak için voltaj regülatörleri veya dönüştürücü modüller seçilir.

**2Yazılım ve Altyapı Hazırlığı Örnekleri**

Masaüstü Testleri

Bilgisayar ortamında geliştirme araçları hazırlanır ve aracın CAN hatlarından gelebilecek verileri simüle etmek veya dinlemek üzere şablon kodlar yapılandırılır.

**3Araç İçi Kurulum Örnekleri**

Fiziksel Bağlantılar

Aracın orijinal kablo tesisatına zarar vermemek adına soketli bir *breakout harness* (ara kablo) hazırlanır. CAN Gateway hatlarına ve güç kaynağına bu soketler üzerinden güvenli bağlantı yapılır.

**4Sistem Entegrasyonu Örnekleri**

Çalışma Mantığı

Araç içi ambiyans aydınlatmalarının (Golf 8, Audi A3 veya Seat Leon Cupra modellerindeki gibi) kapı açılması, farların yanması veya kontak durumuna göre nasıl otomatik tepki verdiği analiz edilerek sistem mantığına işlenir.

---

*User prompt: ayrıca hazır led setlei var mı?*

Response:

**1Hazır Ambiyans LED Setleri**

Piyasa Çözümleri

Piyasada Volkswagen grubu araçlar için satılan ve doğrudan orijinal kapı trimlerine, göğüs çizgilerine uyumlu olan **hazır 12V adreslenebilir (RGB) ambiyans LED setleri** mevcuttur.

**2Hazır Setlerin Yapısı**

Entegrasyon Farkı

Bu hazır setler genellikle kendi kontrol modülleri ve çiplerit ile gelir. Ancak bizim projemizdeki gibi **orijinal araç CAN bus verilerini (Golf 8 / Audi A3 mantığı)** doğrudan okuyup buna göre dinamik tepki verme özellikleri genellikle sınırlıdır.

**3Neden Özel Tasarım?**

Özel Mimari Tercihi

Piyasadaki hazır setler standart modüllerle çalıştığı için, sizin hedeflediğiniz ESP32 tabanlı, MIB2 renk entegrasyonlu ve özel araç olaylarına (sinyal, kapı açılması vb.) duyarlı hibrit yapıyı doğrudan desteklemeyebilir. Bu yüzden donanımları seçip kendi kontrolcümüzü kurgulamak daha esnek bir çözümdür.

---

*User prompt: Piyasadaki hazır ambiyans led setleri nasıl bağlanır?*

Response:

**1Ana Kontrol Modülü ve Güç Bağlantısı**

Kablo Tesisatı

Hazır setlerin ana kontrol kutusu (küçük bir beyin) genellikle aracın sigorta kutusundan veya BCM (Gövde Kontrol Modülü) hatlarından sürekli güç (B+) ve kontak elektriği (ACC/15) alacak şekilde bağlanır. Şase kablosu ise aracın metal bir noktasına vidalanır.

**2CAN-Bus Entegrasyonu**

Özel Hatlar

Eğer set orijinal ekranla (MIB) haberleşiyorsa, kitin CAN-High ve CAN-Low uçları aracın multimedya veya Gateway hattına (uyumlu soketler arasına T-harness ara kablo girilerek) bağlanır. Bazı ucuz setler ise CAN hattı kullanmaz; sadece Bluetooth veya uzaktan kumanda ile renk değiştirir.

**3Kapı Modülleri ve LED Çubukların Dağıtımı**

Kapı ve Trim Dağıtımı

Ana kutudan çıkan uzatma kabloları dört kapının içine ve gövdeye (göğüs, ayak altı) çekilir. Kapı içlerinde fitil aralarına veya orijinal trim çizgilerine fiber optik tüpler ve LED başlıklar yerleştirilip kapı modüllerine bağlanır.

**4Mobil Uygulama / Ekran Tanımlama**

Test ve Eşleşme

Montaj tamamlandıktan sonra sistemin sigortası takılır. Üreticinin akıllı telefon uygulaması Bluetooth üzerinden sete bağlanarak renk kalibrasyonu veya eşleşme testi yapılır.

**Sources**

> 1. [How to Install Ambient Lighting on Volkswagen Polo \- YouTube](https://www.youtube.com/watch?v=Iai8yls4uMc)  
> 2. [How to Install Ambient Lighting on Volkswagen Tiguan \- YouTube](https://www.youtube.com/watch?v=8-tgxSYtuHc)

---

*User prompt: linkler ver bana*

Response: Piyasada Volkswagen grubu araçlar (Golf, Scirocco/PQ35 platformu dahil) için satılan hazır ambiyans aydınlatma setlerine ve örnek projelere göz atabileceğiniz bazı kaynak bağlantıları aşağıdadır:

> * **Örnek Hazır Set Seçenekleri ve Tasarımlar:**  
  * [AliExpress VW Golf Uyumlu Özel Ambiyans Setleri](https://www.aliexpress.com/item/1005010411192850.html?utm_source=gemini) — Aracın orijinal kalıplarına (1:1 OEM mold) birebir uyumlu kapı panelleri ve göğüs çıtalarını içeren setleri inceleyebilirsiniz.  
  * [Xtrabimmer VW Ambiyans LED Yükseltme Kitleri](https://xtrabimmer.com/product-category/ambient-light/volkswagen-ambient-light/?utm_source=gemini) — Golf serisi ve diğer Volkswagen modelleri için hazırlanan özel donanım paketleridir.  
  * [Voyeego Golf 6 / PQ Uyumlu Kurulum Rehberi](https://voyeego.com/blogs/show-your-upgrade-fun/can-i-install-ambient-lighting-in-a-vw-golf-6?utm_source=gemini) — Benzer platformlardaki ana modül, güç hatları ve CAN entegrasyonunun adım adım nasıl yapıldığını gösteren bir rehber.  
> * **Uygulama ve Donanım Örnekleri (Video ve Mağaza):**  
  * [Tams Factory Özel Kitler ve LED Bileşenleri](https://www.google.com/search?q=https://tamsfactory.co...&utm_source=gemini) — Kendi sistemini toplamak isteyenler için adreslenebilir "Symphony" RGB LED boncukları ve parça seçenekleri sunar.  
  * [YouTube MK6/PQ Platformu Ambiyans Montaj Videosu](https://www.youtube.com/watch?v=BZ7RkmGjOXI&utm_source=gemini) — Kapı içi kablolama ve modül yerleşimlerinin pratik olarak nasıl uygulandığını gösteren görsel bir kaynaktır.

---

*User prompt: hangi lede nereden güç alacağım bunları bulabilir misin?*

Response: PQ35 platformuna (Scirocco) sahip bir araçta, hem ana kontrol modülümüz (ESP32) hem de 12V adreslenebilir LED'ler için en güvenli ve temiz güç/sinyal kaynakları şu şekilde planlanmalıdır:

**1Sigorta Kutusu ve Kabin Hatları**

Ana Güç (12V Besleme)

* **Kaynak:** Sürücü tarafındaki alt sigorta kutusu.  
* **Yöntem:** Sigorta musluğu (Fuse Tap / Add-a-circuit) aparatı kullanılarak, kontak açıldığında enerji veren (ACC / Terminal 15\) boş veya uygun bir sigorta slotundan 12V alınır.  
* **Şase (GND):** Direksiyon altındaki veya göğüs altındaki orijinal fabrika şase saplamalarından biri somunla sabitlenerek alınır.  
* **Başarı Kontrolü:** Multimetre ile kontak kapalıyken 0V, kontak açıkken net 12V–14.4V arası ölçülmesi.

**2Kapı İçi Güç Hatları**

Kapı LED'leri ve Modülleri

* **Kaynak:** Kapı kontrol ünitesi veya cam motoru modülünün sürekli 12V besleme hattı.  
* **Yöntem:** Kapı panellerine kablo çekmek zor olduğu için, kapı içinde bulunan ana güç hatlarından *T-Tap* veya *Scotch-Lock* konnektörler ile hat alınır.  
* **Başarı Kontrolü:** Kapı içi LED modülünün veya dönüştürücünün girişinde kararlı 12V görülmesi.

**3Gateway (J533) veya OBD Hattı**

CAN Bus Verisi (Komfort-CAN)

* **Kaynak:** Direksiyon altındaki Gateway (J533) modülü veya konfor hattına erişen herhangi bir bükümlü çift (Turuncu/Mor \- CAN High, Turuncu/Kahverengi \- CAN Low).  
* **Yöntem:** Orijinal kablo izolasyonu sıyrılmadan veya araya soketli bir T-harness (ara kablo) girilerek SN65HVD230 alıcının CAN-H ve CAN-L uçlarına bağlanır.  
* **Başarı Kontrolü:** ESP32 seri monitöründe araçtan gelen CAN paketlerinin (ID'lerin) hatasız akışının gözlenmesi.

callout-content-2

**Sources**

> 1. [Ambient Light Wiring Diagram Guide | PDF \- Scribd](https://www.scribd.com/document/905615715/Ambient-Light-Installation-Tutorial-1)  
> 2. [VW Golf MK6 Mods | RGB LED Car Interior Lights \- YouTube](https://www.youtube.com/watch?v=7gbn_G2-FRA)

---

[image1]: <data:image/png;base64,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>