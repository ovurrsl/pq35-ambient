/**
 * Rota ağacı denetçisi — expo-router'ın kendi çözümlemesini yazdırır.
 *
 * NE İŞE YARAR: sekme çubuğunun kapanıp kapanmadığı bir görünüm sorusu değil, **ağaç
 * sorusudur.** Bir ekran `(tabs)` grubunun kardeşi olarak kök `Stack`te duruyorsa
 * itildiğinde gerçek `UITabBar`'ın üstünü kapatır (CLAUDE.md §7.1, sert kural). Bu
 * script ağacı dosya adlarından değil **router'ın kendi `getRoutes`'undan** kurar, yani
 * "şu klasör şu sekmenin altında mı" sorusu tahminle değil ölçümle yanıtlanır.
 *
 * Modülleri yüklemez (`internal_stripLoadRoute`), yalnızca dosya adlarını verir — bu
 * yüzden Metro, Babel veya cihaz gerekmez.
 *
 * KULLANIM (mobile/ içinden):
 *   node ../tools/rota-agaci.js
 *   node ../tools/rota-agaci.js src/app
 *
 * Yeniden yapılandırmadan önce ve sonra çalıştırıp çıktıları karşılaştır. Eskimiş
 * `href`'leri ise `tsc` yakalar: `typedRoutes` açık olduğu için her rota tipe döner.
 */
const fs = require('fs');
const path = require('path');

const APP = path.resolve(process.argv[2] || 'src/app');
const ROUTER = path.resolve('node_modules/expo-router');
const { getRoutes } = require(path.join(ROUTER, 'build/getRoutes.js'));

function walk(dir, taban = '') {
  const cikti = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = taban ? `${taban}/${e.name}` : e.name;
    if (e.isDirectory()) cikti.push(...walk(path.join(dir, e.name), rel));
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) cikti.push(`./${rel}`);
  }
  return cikti;
}

const keys = walk(APP).sort();
const ctx = (k) => ({ default: () => null });
ctx.keys = () => keys;
ctx.resolve = (k) => k;
ctx.id = APP;

const tree = getRoutes(ctx, {
  internal_stripLoadRoute: true,
  skipGenerated: true,
  platform: 'ios',
  sitemap: false,
  notFound: false,
});

function yaz(node, derinlik = 0) {
  const girinti = '  '.repeat(derinlik);
  const ad = node.route === '' ? '(kök)' : node.route;
  const etiket = node.type && node.type !== 'route' ? ` [${node.type}]` : '';
  const dosya = node.contextKey ? `  ← ${node.contextKey}` : '';
  console.log(`${girinti}${ad}${etiket}${dosya}`);
  for (const c of node.children ?? []) yaz(c, derinlik + 1);
}

if (!tree) {
  console.error('ROTA AĞACI ÇÖZÜLEMEDİ');
  process.exit(1);
}
yaz(tree);

/**
 * Gezinilebilir tam yolları düz liste olarak çıkar — **expo-router'ın URL kurallarıyla**.
 *
 * NEDEN ÖNEMLİ: bu script önce `index` yapraklarını olduğu gibi yazıyordu, yani kökteki
 * `index.tsx` listede `/index` diye görünüyordu. Gerçek URL ise `/`. Fark masum değil:
 * sekmeler klasöre dönüştürülünce uygulamanın `/` rotası tamamen kayboldu ve uygulama
 * açılışta "Unmatched Route"ta kaldı — ama liste `/index` yerine hiçbir şey göstermediği
 * için eksiklik gözden kaçtı. Artık `index` segmenti üst yola katlanıyor ve kök rota
 * listede `/` olarak görünüyor; yoksa görünmüyor ve eksikliği anlamak mümkün oluyor.
 */
const yollar = [];
(function topla(node, onek) {
  // `index` bir segment üretmez; üst yolun kendisidir (expo-router kuralı).
  const parca = node.route === '' || node.route === 'index' ? '' : node.route;
  const tam = [onek, parca].filter(Boolean).join('/');
  if (!node.children?.length) yollar.push('/' + tam);
  for (const c of node.children ?? []) topla(c, tam);
})(tree, '');
console.log('\n=== yapraklar (gerçek URL) ===');
for (const y of [...new Set(yollar)].sort()) console.log(y);

// Kök rota kontrolü: bu eksikse uygulama açılışta hiçbir yere düşemez.
const grupsuz = (y) => y.replace(/\/\([^)]+\)/g, '') || '/';
if (!yollar.some((y) => grupsuz(y) === '/')) {
  console.log('\nUYARI: `/` rotası YOK — uygulama açılışta eşleşmeyen bir yola düşer.');
}
