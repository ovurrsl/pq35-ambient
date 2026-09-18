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
npx eas env:create --name EXPO_PUBLIC_SUPABASE_URL \
  --value https://pfyiemswjsmbguallxwy.supabase.co \
  --environment development --environment preview --environment production --visibility plaintext

npx eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value <panelden aldığın publishable anahtar> \
  --environment development --environment preview --environment production --visibility sensitive
```

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

veya panelden ID'yi kopyalayıp elle gir:
**https://expo.dev/accounts/ovur.rsl/projects/pq35/settings** → *Project ID*

```jsonc
// app.json → expo
"extra": { "eas": { "projectId": "<panelden gelen UUID>" } }
```

### GitHub ayarı — bu yapılmadan bulut build başlamaz

Uygulama depo kökünde değil, **`mobile/` altında**. Expo panelinde:

> Project GitHub settings → **Base directory** → `mobile` → Save

Kök dizinde `app.json` olmadığı için bu alan `/` kalırsa build hemen düşer.

### Build profilleri (`eas.json`)

| Profil | Ne için | Apple Developer hesabı |
|---|---|---|
| `development-simulator` | Mac'te iOS simülatörü | **gerekmez** |
| `development` | Kendi iPhone/iPad'inde | gerekir |
| `preview` | Dahili dağıtım | gerekir |
| `production` | App Store | gerekir |

Apple hesabı yoksa `development-simulator` ile başlanır: ekranlar görünür, **BLE
görünmez** — simülatörde Bluetooth donanımı yoktur, o zaten araç takılınca test edilecek.

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
