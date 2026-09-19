# Apple HIG — kontrol listesi ve kaynağa erişim

Araç sahibinin isteği: *"her yazdığın kod için Apple standartlarına uygun mu kontrol et."*
Bu dosya o denetimin **kaynağı ve kontrol listesi**dir. Tahminle değil, Apple'ın kendi
metniyle çalışılır.

## Kaynağa nasıl erişilir — HIG sayfaları düz çekimle okunmaz

`developer.apple.com/design/human-interface-guidelines/...` sayfaları JavaScript ile
render edilir; `curl` veya basit bir fetch **yalnızca sayfa başlığını** döndürür. İçerik
sayfanın arkasındaki DocC JSON servisindedir:

```bash
BASE="https://developer.apple.com/tutorials/data/design/human-interface-guidelines"
curl -s "$BASE/materials.json"      # Liquid Glass ve standart malzemeler
curl -s "$BASE/typography.json"     # SF Pro / SF Mono, Dynamic Type
curl -s "$BASE/layout.json"         # safe area, kenar boşlukları
curl -s "$BASE/color.json"
curl -s "$BASE/accessibility.json"
curl -s "$BASE/tab-bars.json"
curl -s "$BASE/lists-and-tables.json"
curl -s "$BASE/toggles.json" "$BASE/sliders.json" "$BASE/buttons.json"
curl -s "$BASE/sf-symbols.json"
curl -s "$BASE/live-activities.json" "$BASE/notifications.json"
curl -s "$BASE/sheets.json" "$BASE/dark-mode.json"
```

Sayfa adı URL'deki son parçadır. Hepsi çalışmaz (`navigation-bars` 404 verir), yanıt
kodu kontrol edilir. JSON'un okunabilir metne çevrilmesi: `primaryContentSections` →
`content` blokları; `paragraph` içindeki `inlineContent`, `unorderedList` içindeki
`items`, `aside` blokları ve **`tabNavigator` içindeki platform sekmeleri** gezilir.

## Bu projede uygulanan kurallar

### Liquid Glass — içerik katmanında KULLANILMAZ

> "**Don't use Liquid Glass in the content layer.** Liquid Glass works best when it
> provides a clear distinction between interactive elements and content, and including
> it in the content layer can result in unnecessary complexity and a confusing visual
> hierarchy. Instead, use [standard materials] for elements in the content layer."

> "**Use Liquid Glass effects sparingly.** ... overusing this material in multiple custom
> controls can provide a subpar user experience by distracting from that content.
> **Limit these effects to the most important functional elements in your app.**"

**Bu kural bir kez ihlal edildi ve geri alındı.** `Card` bileşenine `GlassSurface`
bağlanmıştı; `Card` 23 ekranın hepsinde kullanıldığı için bu, camı içerik katmanının
tamamına yaymak demekti — Apple'ın açıkça "yapmayın" dediği şey.

Camın doğru yeri: **sekme çubuğu, yığın başlıkları, modal sheet'ler** — ve üçünü de
sistem kendisi uygular (`NativeTabs` gerçek bir `UITabBar`'dır). Elle blur çizilmez.
`CLAUDE.md` §9.1 bunu zaten söylüyordu.

İstisna, HIG'in kendi belirttiği: içerik katmanındaki **geçici etkileşim** anında
(örn. kaydırıcı sürüklenirken) öğe cam görünümü alabilir.

`regular` / `clear` seçimi: `clear` yalnızca **görsel olarak zengin** zeminler (fotoğraf,
video) üzerinde; metin ağırlıklı her şeyde `regular`.

### Tipografi — sistem fontu, ince ağırlık yok

> "In general, **avoid light font weights.** ... prefer Regular, Medium, Semibold, or Bold
> font weights, and avoid Ultralight, Thin, and Light."

> "Using text styles with the system fonts also ensures support for **Dynamic Type** and
> larger accessibility type sizes."

`theme/tokens.ts` → `FONTS` sistem fontunu kullanır (`System` = SF Pro; tek aralıklı için
`Menlo`, çünkü SF Mono React Native'e ad olarak açılmaz). Ağırlıklar 400/500/600/700 —
hepsi önerilen kümede.

**Açık kalan iş:** HIG gömülü *text style*'ları (body, headline, caption) öneriyor;
proje sabit punto + `maxFontSizeMultiplier` kullanıyor. Dynamic Type kısmen destekleniyor,
tam desteği text style'lara geçmek verir.

### Yerleşim — safe area zorunlu

> "**Respecting the safe area is essential** to make sure system UI and hardware features
> like the **Dynamic Island** don't obstruct content and controls."

Dokunma hedefi: `HIT_SIZE = 44` (`theme/tokens.ts`), Apple HIG asgarisi.

Büyük başlık (`headerLargeTitle`) kullanan yığınlardaki ScrollView'lar
`contentInsetAdjustmentBehavior="automatic"` almalıdır; yoksa başlık doğru toplanmaz ve
üstte ölü bir bant kalır.

### Sekme çubuğu — alt ekranda da görünür kalır

> "**Make sure the tab bar is visible when people navigate to different sections of your
>  app.** If you hide the tab bar, people can forget which area of the app they're in. The
>  exception is when a modal view covers the tab bar, because a modal is temporary and
>  self-contained." — `tab-bars.md › Best practices`

Bulgu: alt ekranların tamamı (`arac/`, `ayarlar/`, `bolge/`, `hava/`, `egzoz/`) kök
`Stack`te, `(tabs)` grubunun **kardeşi** olarak duruyordu; hangisi itilse gerçek
`UITabBar`'ın üstünü kapatıyordu.

Düzeltme: her sekme kendi `Stack`ine kavuştu ve alt ekranlar onun altına taşındı. Ölçüm
`tools/rota-agaci.js` ile yapıldı — `expo-router`'ın kendi `getRoutes`'u, ağacı dosya
adlarından değil router mantığından kurar. Eskimiş `href`'leri `typedRoutes` + `tsc`
yakaladı (iki tane: `/(tabs)` → `/(tabs)/bolgeler`).

Tek istisna `app/onay.tsx`: `formSheet` olarak sunulur, yani HIG'in kendi saydığı modal
istisnası.

### Renk — kontrast hesapla, gözle bakma

> "The **contrast ratio** between text and its background must be at least **4.5:1** for
>  text smaller than 18 points… **3:1** for text that's 18 points or larger, or bold text
>  that's 14 points or larger." — `accessibility.md › Color and effects`

Ölçüm `tools/` dışında, oturum içinde WCAG formülüyle yapıldı. Renk sistemi koyu tema için
seçilmiş, açık tema için hiç yeniden türetilmemişti; uygulama gerçekten tema değiştirdiği
için (`theme-provider` `useColorScheme()` okuyor) bu teorik değil ölçülen bir hataydı. En
kötü değer `EVENT_COLORS.turn` beyaz üzerinde **1.59:1**.

Kural: bir marka rengi **metin** olarak kullanılıyorsa `markaMetin(ham, scheme)` üzerinden
geçer; **dolgu** olarak kullanılıyorsa ham renk doğrudur ve üstüne binen etiket
`MARKA_ETIKET` olur (yedi bölge rengi de parlak, koyu etiket 5.95:1–10.95:1 okunuyor).

## Yeni kod yazarken

1. Dokunulan bileşenin HIG sayfasını yukarıdaki JSON uçlarından çek.
2. `tabNavigator` içinden **iOS/iPadOS** sekmesini oku — platform kuralları farklıdır.
3. Çelişki varsa **HIG kazanır**; `CLAUDE.md` ve tasarım kanvası buna göre güncellenir.
4. Erişilebilirlik yedeği her zaman: Şeffaflığı Azalt / Kontrastı Artır açıkken cam
   opak zemine düşer (`GlassSurface` bunu yapar).
