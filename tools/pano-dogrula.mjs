/**
 * Pano doğrulayıcı — CLAUDE.md §9'un iki adımını tek komutta yapar.
 *
 * NEDEN İKİ ADIM: ölçüm tek başına yetmiyor. Pano `overflow: hidden` içinde olduğu için
 * "içerik alt kenarı ≤ çerçeve" testi kırpılmayı yakalamaz — pano "sığıyor" der ama metin
 * sekme çubuğunun altında kesilir. Bu yüzden script hem ölçer hem **ekran görüntüsü alır**;
 * görüntü gözle kontrol edilmeden pano doğrulanmış sayılmaz.
 *
 * KULLANIM (depo kökünden):
 *   node tools/pano-dogrula.mjs design/project/AppKurulum.dc.html /tmp/cikti.png
 *   node tools/pano-dogrula.mjs design/project/*.dc.html            (yalnızca ölçüm + png/)
 *
 * GEREKSİNİM: `npm i playwright` (depoya bağımlılık eklenmiyor; araç geçici kurulumla
 * çalışır). Tarayıcı indirilmez — ortamda hazır olan Chromium kullanılır.
 */
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * `playwright` depo bağımlılığı DEĞİL: bu araç yılda birkaç kez çalışır, uygulamanın
 * paketine girmesinin anlamı yok. Bu yüzden modül ESM çözümlemesiyle değil, elle
 * belirtilebilen bir kökten yükleniyor.
 *
 *   npm i --prefix /tmp/pw playwright
 *   PQ35_PLAYWRIGHT=/tmp/pw node tools/pano-dogrula.mjs design/project/X.dc.html out.png
 */
const pwKok = process.env.PQ35_PLAYWRIGHT ?? process.cwd();
const require_ = createRequire(path.join(path.resolve(pwKok), 'package.json'));
let chromium;
try {
  ({ chromium } = require_('playwright'));
} catch {
  console.error(
    'playwright bulunamadı. Kur ve kökü göster:\n' +
      '  npm i --prefix /tmp/pw playwright\n' +
      '  PQ35_PLAYWRIGHT=/tmp/pw node tools/pano-dogrula.mjs <pano.dc.html> [cikti.png]'
  );
  process.exit(2);
}

/** Ortamda hazır Chromium. Sürüm playwright'ın beklediğinden farklı olabilir; indirme yok. */
const CHROMIUM = process.env.PQ35_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const girdiler = process.argv.slice(2);
if (girdiler.length === 0) {
  console.error('kullanım: node tools/pano-dogrula.mjs <pano.dc.html> [cikti.png]');
  process.exit(2);
}

/** Tek bir .dc.html verildiyse ikinci argüman çıktı yolu olabilir. */
const tekli = girdiler.length === 2 && girdiler[1].endsWith('.png');
const panolar = tekli ? [girdiler[0]] : girdiler;
const ciktiDizini = tekli ? null : 'design/.render';
if (ciktiDizini) mkdirSync(ciktiDizini, { recursive: true });

const tarayici = await chromium.launch({ executablePath: CHROMIUM });
let hataliVar = false;

for (const dosya of panolar) {
  const kaynak = readFileSync(dosya, 'utf8');
  const m = kaynak.match(/"\$preview":\{"width":(\d+),"height":(\d+)\}/);
  if (!m) {
    console.error(`${dosya}: $preview boyutu bulunamadı`);
    hataliVar = true;
    continue;
  }
  const w = Number(m[1]);
  const h = Number(m[2]);

  const sayfa = await tarayici.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
  });
  await sayfa.goto('file://' + path.resolve(dosya), { waitUntil: 'networkidle' });
  // Web fontları geç yüklenirse ölçüm kayar.
  await sayfa.waitForTimeout(600);

  const olcum = await sayfa.evaluate((cerceve) => {
    const kok = document.querySelector('x-dc > div, body > div');
    if (!kok) return { hata: 'kök eleman yok' };
    let enAlt = 0;
    for (const el of kok.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.height > 0) enAlt = Math.max(enAlt, r.bottom);
    }
    return { cerceve, icerikAlt: Math.round(enAlt), tasma: Math.round(enAlt - cerceve) };
  }, h);

  const png = tekli ? girdiler[1] : path.join(ciktiDizini, path.basename(dosya, '.dc.html') + '.png');
  await sayfa.screenshot({ path: png });
  await sayfa.close();

  const durum = olcum.tasma > 0 ? 'TAŞMA' : 'sığıyor';
  if (olcum.tasma > 0) hataliVar = true;
  console.log(`${durum.padEnd(8)} ${path.basename(dosya).padEnd(28)} ${w}×${h}  içerik alt: ${olcum.icerikAlt}  (${olcum.tasma > 0 ? '+' : ''}${olcum.tasma})  → ${png}`);
}

await tarayici.close();
console.log('\nÖLÇÜM YETMEZ: her panonun png’si gözle de kontrol edilmeli (CLAUDE.md §9).');
process.exit(hataliVar ? 1 : 0);
