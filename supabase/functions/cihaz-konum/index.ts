/**
 * Edge Function — cihazdan konum alımı.
 *
 * Bu, service role anahtarının bulunduğu TEK yerdir. ESP32 bu anahtarı asla taşımaz
 * (CLAUDE.md sert kural 11); kendi device token'ıyla buraya konuşur, burası doğrulayıp
 * service role ile yazar. Anahtar sızarsa etki tek cihazla sınırlı kalır ve o cihaz
 * `cihaz_anahtarlari.iptal_edildi` ile kapatılır.
 *
 * NEDEN PAYLOAD ŞİFRELİ — taşıma katmanına güvenmiyoruz:
 * SIM808'in dahili HTTP yığınında HTTPS desteği sürüme göre değişir ve kararsızdır.
 * Bu yüzden hat düz HTTP olsa bile veri okunamasın ve taklit edilemesin diye payload
 * cihazda AES-GCM ile şifrelenip imzalanır. AES-GCM aynı anda hem gizlilik hem
 * bütünlük verir; ayrı bir HMAC gerekmez.
 *
 * TEKRAR KORUMASI: kartta senkron saat yok, bu yüzden zaman damgası kullanılamaz.
 * Her paket artan bir sayaç taşır; sayaç son görülenden büyük değilse paket reddedilir.
 *
 * İstek:
 *   POST /functions/v1/cihaz-konum
 *   x-cihaz-token: <cihazın kendi token'ı>
 *   gövde: base64( nonce(12 bayt) || AES-GCM şifreli JSON )
 *
 * Şifreli JSON:
 *   { sayac: number, zaman: string, enlem: number, boylam: number,
 *     dogruluk_m?: number, hiz_kmh?: number, kaynak: "gprs" | "sms" }
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const NONCE_UZUNLUK = 12;

interface KonumPaketi {
  sayac: number;
  zaman: string;
  enlem: number;
  boylam: number;
  dogruluk_m?: number;
  hiz_kmh?: number;
  kaynak: 'gprs' | 'sms';
}

/** Sabit süreli karşılaştırma — token özeti kıyaslarken zamanlama sızıntısı olmasın. */
function esitMi(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

async function sha256Hex(girdi: string): Promise<string> {
  const ozet = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(girdi));
  return Array.from(new Uint8Array(ozet))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64Coz(s: string): Uint8Array {
  const ham = atob(s);
  const cikti = new Uint8Array(ham.length);
  for (let i = 0; i < ham.length; i++) cikti[i] = ham.charCodeAt(i);
  return cikti;
}

/** Ayrıntı vermeyen yanıt: saldırgan hangi adımda takıldığını öğrenmemeli. */
function reddet(durum: number): Response {
  return new Response(JSON.stringify({ ok: false }), {
    status: durum,
    headers: { 'content-type': 'application/json' },
  });
}

function gecerliPaketMi(p: unknown): p is KonumPaketi {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.sayac === 'number' && Number.isFinite(o.sayac) &&
    typeof o.zaman === 'string' && !Number.isNaN(Date.parse(o.zaman)) &&
    typeof o.enlem === 'number' && o.enlem >= -90 && o.enlem <= 90 &&
    typeof o.boylam === 'number' && o.boylam >= -180 && o.boylam <= 180 &&
    (o.kaynak === 'gprs' || o.kaynak === 'sms')
  );
}

Deno.serve(async (istek: Request): Promise<Response> => {
  if (istek.method !== 'POST') return reddet(405);

  const token = istek.headers.get('x-cihaz-token');
  if (!token || token.length < 32) return reddet(401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    // Service role YALNIZCA burada. Uygulamaya ve panele hiç inmez.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const tokenOzeti = await sha256Hex(token);

  const { data: cihaz, error: cihazHatasi } = await supabase
    .from('cihaz_anahtarlari')
    .select('id, arac_id, token_ozeti, aes_anahtari, son_sayac')
    .eq('token_ozeti', tokenOzeti)
    .eq('iptal_edildi', false)
    .maybeSingle();

  if (cihazHatasi || !cihaz || !esitMi(cihaz.token_ozeti, tokenOzeti)) return reddet(401);

  // --- payload'ı çöz ---
  let paket: KonumPaketi;
  try {
    const govde = base64Coz((await istek.text()).trim());
    if (govde.length <= NONCE_UZUNLUK) return reddet(400);

    const anahtar = await crypto.subtle.importKey(
      'raw',
      base64Coz(cihaz.aes_anahtari),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const acik = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: govde.slice(0, NONCE_UZUNLUK) },
      anahtar,
      govde.slice(NONCE_UZUNLUK)
    );

    const cozulmus: unknown = JSON.parse(new TextDecoder().decode(acik));
    if (!gecerliPaketMi(cozulmus)) return reddet(400);
    paket = cozulmus;
  } catch {
    // Çözme başarısızsa paket ya bozuk ya da sahte; ikisi de aynı yanıtı alır.
    return reddet(400);
  }

  // --- tekrar koruması ---
  if (paket.sayac <= cihaz.son_sayac) return reddet(409);

  // Sayaç önce ilerletilir. Eşzamanlı iki istek gelirse ikincisi burada düşer;
  // `son_sayac` koşulu bu güncellemeyi atomik kılar.
  const { data: ilerletildi, error: sayacHatasi } = await supabase
    .from('cihaz_anahtarlari')
    .update({ son_sayac: paket.sayac, son_kullanim: new Date().toISOString() })
    .eq('id', cihaz.id)
    .lt('son_sayac', paket.sayac)
    .select('id')
    .maybeSingle();

  if (sayacHatasi || !ilerletildi) return reddet(409);

  const { error: yazmaHatasi } = await supabase.from('konum_kayitlari').insert({
    arac_id: cihaz.arac_id,
    zaman: paket.zaman,
    enlem: paket.enlem,
    boylam: paket.boylam,
    dogruluk_m: paket.dogruluk_m ?? null,
    hiz_kmh: paket.hiz_kmh ?? null,
    kaynak: paket.kaynak,
    paket_dogrulandi: true,
  });

  if (yazmaHatasi) return reddet(500);

  await supabase.from('araclar')
    .update({ son_gorulme: new Date().toISOString() })
    .eq('id', cihaz.arac_id);

  await supabase.from('denetim_kaydi').insert({
    arac_id: cihaz.arac_id,
    islem: 'konum.alindi',
    ayrinti: { kaynak: paket.kaynak, sayac: paket.sayac },
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 202,
    headers: { 'content-type': 'application/json' },
  });
});
