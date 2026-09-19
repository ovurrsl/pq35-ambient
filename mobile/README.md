# mobile/ — PQ35 Ambient iOS uygulaması

Expo (React Native) + Expo Router + TypeScript. Projenin bağlamı ve sert kuralları için
önce depo kökündeki [`CLAUDE.md`](../CLAUDE.md) okunur — özellikle §7.1 (ekran seti ve
kimlik zinciri) ve §9.1 (yığın kararı).

## Neden `ios/` değil `mobile/`

`npx expo prebuild` projenin içinde **kendi `ios/` yerel klasörünü üretir**. Proje kökünü
`ios/` yapmak `ios/ios/` demek olurdu.

## Kurulum

```bash
npm install
cp .env.example .env.local   # ve doldur
```

`.env.local` üç değer ister: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
`EXPO_PUBLIC_API_URL`.

### Supabase projesi — kurulu ve çalışıyor

| | |
|---|---|
| Proje | `pq35-ambient` · `eu-central-1` |
| URL | `https://pfyiemswjsmbguallxwy.supabase.co` |
| Şema | 7 tablo, RLS açık ve **varsayılan reddet** |
| Edge Function | `cihaz-konum` · `verify_jwt` **kapalı** (cihazda JWT yok, kendi token'ıyla doğrulanır) |
| RLS yardımcıları | dışa açılmayan `guvenlik` şemasında — PostgREST üzerinden çağrılamaz |

Publishable (anon) anahtarı panelden alınır:
**Project Settings → API Keys**.

> **Bu depo public.** Publishable anahtar tasarımı gereği istemciye açıktır ve zaten
> uygulama paketine gömülür — ama public bir depoya yazılırsa otomatik tarayıcılar
> saatler içinde bulur. Bu yüzden anahtar **depoya commit edilmez**, EAS ortam
> değişkeni olarak tutulur:

```bash
# eas-cli 24.x'te komut env:set — env:create hâlâ var ama gizli ve "deprecated" işaretli
npx eas env:set --name EXPO_PUBLIC_SUPABASE_URL \
  --value https://pfyiemswjsmbguallxwy.supabase.co \
  --environment development --environment preview --environment production --visibility plaintext

npx eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value <panelden aldığın publishable anahtar> \
  --environment development --environment preview --environment production --visibility sensitive
```

> **Bu ikisi yapıldı** — üç ortama da yazılı. Kontrol:
> `npx eas env:list --environment development --include-sensitive`.
> Kullanılan anahtar modern `sb_publishable_…` biçimi (`supabase-js` 2.116 bunu destekler),
> eski `anon` JWT'si değil.

Yerel geliştirme için aynı iki değer `.env.local`'a yazılır (o dosya `.gitignore`'da).

> **Yapılmadan bırakılmamalı:** kendi hesabını açtıktan **sonra** Supabase'de
> *Authentication → Sign In / Providers* altında **açık kayda kapat**. Depo public
> olduğu için anon anahtarla ulaşılabilen tek yüzey Auth'tur; RLS varsayılan reddet
> olduğundan veri okunamaz ama açık kayıt bırakılırsa yabancılar hesap açabilir.
> Misafirleri sen davet edersin, kendileri kaydolmaz.

> **`EXPO_PUBLIC_*` pakete gömülür ve okunabilir.** Oraya yalnızca publishable (anon)
> anahtar konur. Service role anahtarı, SIM808 ön paylaşımlı anahtarı ve cihaz device
> token'ı asla uygulamaya girmez. Güvenlik RLS'ten gelir, anahtarın gizliliğinden değil.

## EAS / Expo projesine bağlanma

Expo tarafındaki proje: **`@ovur.rsl/pq35`** (hesap `ovur.rsl`, slug `pq35`).
`app.json`'daki `owner` ve `slug` bu projeye göre hizalanmıştır — eşleşmeseler
`eas init` ikinci bir proje açardı.

`extra.eas.projectId` **artık yazılı** — `2ea85b1a-b6d7-4b5f-ba3e-535bef47669a`.

Bulut build'i `eas build:internal` komutunu **non-interactive** çalıştırır; o modda proje
kendiliğinden bağlanamaz, bu yüzden ID'nin app config'de durması zorunludur. Yoksa build
"EAS project not configured" diyip düşer.

### GitHub ayarı — bu yapılmadan bulut build başlamaz

Uygulama depo kökünde değil, **`mobile/` altında**. Expo panelinde:

> Project GitHub settings → **Base directory** → `mobile` → Save

Kök dizinde `app.json` olmadığı için bu alan `/` kalırsa build hemen düşer.

### Build profilleri (`eas.json`)

| Profil | Ne için | Apple Developer hesabı |
|---|---|---|
| `development-simulator` | Mac'te iOS simülatörü | **gerekmez** |
| `development` | Kendi iPhone/iPad'inde | **ücretli üyelik** gerekir |
| `preview` | Dahili dağıtım | **ücretli üyelik** gerekir |
| `production` | App Store | **ücretli üyelik** gerekir |

Ad hoc dağıtım **ücretsiz Apple ID ile yapılamaz** — ücretsiz hesapta distribution
sertifikası diye bir şey yoktur, dolayısıyla `distribution: "internal"` hiçbir zaman
derlenmez. Ücretli üyelik yoksa tek çalışan profil `development-simulator`'dır: ekranlar
görünür, **BLE görünmez** (simülatörde Bluetooth donanımı yoktur) ve çıktısını çalıştırmak
için yine bir Mac gerekir. Yani BLE testi için ücretli üyelik kaçınılmazdır.

### OTA güncelleme — `--platform ios` bayrağı zorunlu

`expo-updates` kurulu ve `runtimeVersion` politikası **fingerprint**. Güncelleme
yayınlarken **her zaman** platform belirtilir:

```bash
npx eas update --channel development --platform ios \
  --message "..." --environment development
```

**`--platform ios` yazılmazsa güncelleme sessizce işe yaramaz.** Sebebi ölçülerek
bulundu: platform verilmediğinde eas-cli Android tarafını da hazırlamaya çalışır ve
`app.json`'a `android.runtimeVersion` yazar — **fingerprint'i hesaplamadan önce**.
iOS fingerprint'i app config'in tamamından türediği için Android'e ait tek bir anahtar
bile onu kaydırır:

| app.json durumu | iOS fingerprint |
|---|---|
| temiz (commit'teki hâli) | `d34a1ef47158fe35d966c61f83fb78f088b8bc1e` |
| `android.runtimeVersion` eklenmiş | `9b4db3fd47d2784824aa9555317bf2b6a9759507` |

Build `d34a1ef…` ile imzalanmışken güncelleme `9b4db3fd…` olarak yayınlanır ve cihaza
**hiç ulaşmaz** — hata da vermez, sadece görünmez. Fingerprint politikasının güvenli
tarafı budur (`appVersion` olsaydı uyumsuz paket yüklenip çökerdi), ama teşhisi zordur.

Aynı yazma davranışı `app.json`'daki Android izinlerini de **çiftler**; eklenti zaten
sağladığı için o satırlar app.json'da hiç durmamalı. Yayından sonra kontrol:

```bash
git status --porcelain mobile/app.json      # boş olmalı
npx expo-updates fingerprint:generate --platform ios   # build'inkiyle aynı olmalı
```

Geçerli güncellemeler: `npx eas update:list --branch development`

### iOS imzalama — bir kez etkileşimli oturum şart

`development` profili `distribution: "internal"`, yani **ad hoc** imzalama. Bu, EAS
kasasında şu kaydın **önceden var olmasını** ister: bir Apple **Distribution** sertifikası
+ bir **ad hoc** provisioning profili (`IOS_APP_ADHOC`), ikisi tek bir
`IosAppBuildCredentials` kaydında `AD_HOC` tipiyle birleşmiş.

**Panelden veya GitHub'dan tetiklenen build bunu üretemez.** Sebep eas-cli'nin kendi
kaynağında: bulut `build:internal` komutunu çalıştırır ve o komut *"always run with
implicit --non-interactive"* diye işaretlidir. `SetUpInternalProvisioningProfile`'ın
non-interactive dalı yalnızca mevcut kayıtları **sayar**; ikisi de sıfırsa

```
You're in non-interactive mode. EAS CLI couldn't find any credentials
suitable for internal distribution. Run this command again in interactive mode.
```

der ve Apple'a hiç bağlanmaz. Panelde düğmeye tekrar basmak bu yüzden işe yaramaz.

**App Store Connect API anahtarı bu boşluğu kapatmaz.** Anahtarın işi mevcut kimlik
bilgisini *tamir/yenilemek* — cihaz listesini güncellemek, profili yeniden imzalamak.
`SetUpDistributionCertificate` sertifika üretimini yalnızca `runInteractiveAsync` içinde
yapar. Sertifika sıfırdan **etkileşimli** bir oturumda doğar; bu bir Apple kısıtı değil,
eas-cli'nin koyduğu emniyet kilidi.

Önemli ayrım: **"etkileşimli" = soru sorulabilen bir terminal (TTY), Mac değil.**
Windows veya Linux'ta çalışır — EAS derlemeyi kendi macOS makinelerinde yapar.

```bash
npx eas device:create      # en az bir iPhone UDID'i kaydet; ad hoc profil bir izin listesidir
npx eas credentials:configure-build --platform ios --environment development
```

Apple girişi iki yoldan yapılabilir:

| Yol | Ne gerekir |
|---|---|
| Apple ID + şifre + 6 haneli kod | bir insan, her seferinde |
| App Store Connect API anahtarı | `EXPO_ASC_API_KEY_PATH` + `EXPO_ASC_KEY_ID` + `EXPO_ASC_ISSUER_ID`, yanına `EXPO_APPLE_TEAM_ID` ve `EXPO_APPLE_TEAM_TYPE`. `hasAscEnvVars()` bunları görürse `AuthenticationMode.API_KEY`'e geçer ve şifre sorulmaz |

Anahtar **Admin** yetkili olmalı (Expo'nun şartı), `.p8` Apple'dan **yalnızca bir kez**
indirilir ve `EXPO_ASC_API_KEY_PATH` `fs.readFile` ile okunduğu için gerçek bir dosya
yolu olmak zorundadır. `.p8`, Expo jetonu ve Team ID **depoya girmez** — bu depo public.

Bunlar bir kez kurulduktan sonra panelden/GitHub'dan tetiklenen build çalışır. Sonradan
yeni cihaz eklenirse profil kendiliğinden güncellenmez:
`--refresh-ad-hoc-provisioning-profile` gerekir (eas-cli ≥ 19.1.0) ve o da EAS'ta kayıtlı
bir ASC anahtarı ister. Bu bayrak `--freeze-credentials` ile birlikte kullanılamaz.

> Apple, yeni veya yakınlarda yenilenmiş üyeliklerde yeni kaydedilen cihazı işlemek için
> **24–72 saat** alabilir. O pencerede ilk build cihazı bulamayıp düşebilir; bu bir
> yapılandırma hatası değildir.

### Yerel ön kontrol — bulut build'i yakmadan

```bash
npx expo prebuild --platform ios --no-install --clean
```

Eklenti ve yapılandırma hatalarını EAS'e gitmeden yakalar. `ios/` ve `android/`
`.gitignore`'da; üretilen klasörler depoya girmez.

## Çalıştırma — Expo Go yetmez

`react-native-ble-plx` yerel bir modüldür, **Expo Go'da çalışmaz**. Custom dev client şart:

```bash
npx expo prebuild --platform ios
npx expo run:ios            # veya EAS build ile cihaza kur
```

BLE'ye dokunmayan ekranlar (kimlik akışı, ayarlar) Expo Go'da açılır, ama araç bağlantısı
gerektiren hiçbir şey çalışmaz.

## Mimari

```
src/app/            Expo Router — dosya tabanlı rotalar
  (auth)/           kilit · giris · dogrulama · eslestirme   (sekme çubuğu YOK)
  (tabs)/           Bölgeler · Olaylar · Araç · Sahneler · Ayarlar
src/state/          kimlik durum makinesi
src/lib/            supabase · keychain · oturum kasası · ble
src/theme/          kanvastan gelen token'lar, tema sağlayıcı
src/components/ui/  GlassSurface, Card, RuleBox, Pill, UnverifiedBadge
src/types/          Supabase şema tipleri (geçici — migration sonrası üretilecek)
```

## Oturum saklama — buradaki tuzağı bilerek oku

`expo-secure-store`, `requireAuthentication: true` verildiğinde girdiyi
`.biometryCurrentSet` ile korur. İstediğimiz tam olarak bu: kayıtlı yüz seti değişirse
girdi geçersiz olur.

Ama aynı modül **var olan** bir girdiyi yazarken `SecItemUpdate` + `kSecUseOperationPrompt`
kullanır — yani her yazma Face ID sorar. Supabase access token'ı arka planda yenilediği
için bu, kullanıcıya sürekli Face ID sorulması demekti.

Çözüm iki parçalı ([`src/lib/secure-keychain.ts`](src/lib/secure-keychain.ts),
[`src/lib/session-vault.ts`](src/lib/session-vault.ts)):

1. Supabase'e **bellek içi** depo verilir; diske hiç yazmaz.
2. Refresh token ayrı bir korumalı girdide durur ve yazarken **önce silinir, sonra
   eklenir**. Silme ve ekleme kimlik doğrulaması istemez.

Sonuç: **Face ID yalnızca okumada, yani uygulama açılışında sorulur.**

Bunun zorunlu karşılığı: arka plandan dönüşte kilitleme **kapatılamaz**. Face ID tek kapı
olduğu için açık kalan bir uygulama kapısız demektir.

## Liquid Glass

Sekme çubuğu `expo-router/unstable-native-tabs` ile gerçek bir `UITabBar`'dır; iOS 26'da
Liquid Glass'ı sistem uygular ve içerik altından kayarken çubuk buna tepki verir. Elle
blur çizmek hem yanlış görünür hem erişilebilirlik ayarlarını es geçer.

Kart ve yüzeyler için [`GlassSurface`](src/components/ui/glass-surface.tsx): gerçek cam
yalnızca iOS 26+ **ve** Şeffaflığı Azalt kapalıyken çizilir, aksi hâlde opak zemine düşer.
Bu bir bozulma değil, HIG gereğidir.

## Kontroller

```bash
npx tsc --noEmit    # strict, any yok
npm run lint
```

## Tasarım kaynağı

Ekranların içerik spesifikasyonu [`design/`](../design) altındaki kanvastır
(31 pano, 16'sı iOS ekranı). **Kanvas ile kod çelişirse kanvas kazanır.**
