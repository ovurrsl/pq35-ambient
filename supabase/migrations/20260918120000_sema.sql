-- PQ35-AMBIENT — şema
--
-- Tasarım kaynağı: design/ kanvası (Panel — konum, Panel — cihazlar, Güvenlik mimarisi)
-- ve CLAUDE.md §3.2. RLS politikaları ayrı migration'da (20260918120100_rls.sql).
--
-- İKİ KURAL BU DOSYAYI YÖNETİR:
--   1. Her tabloda RLS açılır ve varsayılan reddettir. Politika yazılmayan işlem yapılamaz.
--   2. Cihaz (ESP32) bu tablolara doğrudan yazmaz. Service role anahtarı yalnızca Edge
--      Function'da bulunur; cihaz kendi token'ıyla oraya konuşur (sert kural 11).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum'lar
-- ---------------------------------------------------------------------------

-- Misafir; bölge ve sahneleri kullanır, kilit/arama/kodlama komutlarını kullanamaz.
-- Bu kısıt asıl olarak kartta uygulanır; buradaki değer yetkinin kaydıdır.
create type public.yetki_seviyesi as enum ('sahip', 'misafir');

-- SIM808 2G-only. Şebeke zayıfken GPRS yerine SMS yedek yolu kullanılır.
create type public.konum_kaynagi as enum ('gprs', 'sms');

-- ---------------------------------------------------------------------------
-- Araçlar
-- ---------------------------------------------------------------------------

create table public.araclar (
  id              uuid primary key default gen_random_uuid(),
  sahip_id        uuid not null references auth.users (id) on delete cascade,
  ad              text not null check (length(trim(ad)) between 1 and 80),
  -- VIN'in tamamı saklanmaz; panelde ve uygulamada zaten maskeli gösteriliyor.
  vin_son4        text check (vin_son4 ~ '^[A-HJ-NPR-Z0-9]{4}$'),
  firmware_surumu text,
  son_gorulme     timestamptz,
  olusturuldu     timestamptz not null default now()
);

comment on column public.araclar.vin_son4 is
  'VIN''in yalnızca son 4 hanesi. Tam VIN saklanmaz — tanımlamak için gerekli değil.';

-- ---------------------------------------------------------------------------
-- Eşleşmiş telefonlar
-- ---------------------------------------------------------------------------
--
-- Kalıcı bir BLE adresi SAKLANMAZ: iOS adresi ~15 dakikada bir değiştirir (RPA) ve
-- uygulamalara MAC hiç vermez. Telefonu araç, bonding sırasında sakladığı IRK ile çözer.
-- Buradaki kayıt yetkinin ve iptal edilebilirliğin kaydıdır, kimlik eşlemesi değil.

create table public.eslesmis_telefonlar (
  id             uuid primary key default gen_random_uuid(),
  arac_id        uuid not null references public.araclar (id) on delete cascade,
  kullanici_id   uuid not null references auth.users (id) on delete cascade,
  cihaz_adi      text not null check (length(trim(cihaz_adi)) between 1 and 80),
  yetki          public.yetki_seviyesi not null default 'misafir',
  eslesme_tarihi timestamptz not null default now(),
  son_baglanti   timestamptz,
  iptal_edildi   boolean not null default false,
  unique (arac_id, kullanici_id)
);

create index eslesmis_telefonlar_arac_idx
  on public.eslesmis_telefonlar (arac_id) where not iptal_edildi;

-- ---------------------------------------------------------------------------
-- Cihaz anahtarları — istemciye HİÇ açılmaz
-- ---------------------------------------------------------------------------
--
-- Edge Function, cihazdan gelen token'ı burada saklanan özetle karşılaştırır.
-- Token'ın kendisi saklanmaz. Bu tabloya hiçbir istemci politikası yazılmaz;
-- yalnızca service role erişir.

create table public.cihaz_anahtarlari (
  id           uuid primary key default gen_random_uuid(),
  arac_id      uuid not null references public.araclar (id) on delete cascade,
  -- Token'ın kendisi DEĞİL, SHA-256 özeti. Sızsa bile token geri üretilemez.
  token_ozeti  text not null unique,
  -- Cihazla paylaşılan AES-GCM anahtarı (base64). SIM808'in TLS'i güvenilmez olduğu
  -- için taşımaya değil, payload'ın kendisine güveniyoruz (CLAUDE.md §3.2, dört sert
  -- gerçek / 4). Cihaz kendi kopyasını flash'ta tutar.
  aes_anahtari text not null,
  -- Tekrar (replay) koruması: kartta senkron saat yok, zaman damgası kullanılamaz.
  -- Gelen paketin sayacı bundan büyük olmalı.
  son_sayac    bigint not null default 0,
  olusturuldu  timestamptz not null default now(),
  son_kullanim timestamptz,
  iptal_edildi boolean not null default false
);

create index cihaz_anahtarlari_arac_idx
  on public.cihaz_anahtarlari (arac_id) where not iptal_edildi;

-- ---------------------------------------------------------------------------
-- Bölge ayarları — 7 bölge (CLAUDE.md §4)
-- ---------------------------------------------------------------------------
--
-- Scirocco 3 kapılıdır: z5/z6 "arka sol/sağ YAN PANEL"dir, arka kapı değildir.

create table public.bolge_ayarlari (
  arac_id        uuid not null references public.araclar (id) on delete cascade,
  bolge          text not null check (bolge in ('z1','z2','z3','z4','z5','z6','z7')),
  renk           text not null default '#4CC2FF' check (renk ~ '^#[0-9A-Fa-f]{6}$'),
  parlaklik      smallint not null default 70 check (parlaklik between 0 and 100),
  acik           boolean not null default true,
  -- Hangi olaylara tepki verileceği: {"kapi":true,"sinyal":true,"geri":false,"redline":false}
  olay_tepkileri jsonb not null default '{}'::jsonb,
  guncellendi    timestamptz not null default now(),
  primary key (arac_id, bolge)
);

-- ---------------------------------------------------------------------------
-- Sahneler
-- ---------------------------------------------------------------------------

create table public.sahneler (
  id          uuid primary key default gen_random_uuid(),
  arac_id     uuid not null references public.araclar (id) on delete cascade,
  ad          text not null check (length(trim(ad)) between 1 and 60),
  aciklama    text,
  -- Bölge başına renk/parlaklık bileşimi.
  ayarlar     jsonb not null default '{}'::jsonb,
  olusturuldu timestamptz not null default now()
);

create index sahneler_arac_idx on public.sahneler (arac_id);

-- ---------------------------------------------------------------------------
-- Konum kayıtları — HASSAS VERİ
-- ---------------------------------------------------------------------------
--
-- Bu tabloya istemci YAZAMAZ. Satırlar yalnızca Edge Function üzerinden gelir:
-- cihaz payload'ı AES-GCM ile şifreleyip imzalar, fonksiyon doğrulayıp service role
-- ile yazar. Okuma da yalnızca araç sahibine açıktır — misafir, aracın nerelere
-- gittiğini göremez.

create table public.konum_kayitlari (
  id               uuid primary key default gen_random_uuid(),
  arac_id          uuid not null references public.araclar (id) on delete cascade,
  zaman            timestamptz not null,
  enlem            double precision not null check (enlem between -90 and 90),
  boylam           double precision not null check (boylam between -180 and 180),
  dogruluk_m       real check (dogruluk_m >= 0),
  hiz_kmh          real check (hiz_kmh >= 0),
  kaynak           public.konum_kaynagi not null,
  paket_dogrulandi boolean not null default false,
  alindi           timestamptz not null default now()
);

create index konum_kayitlari_arac_zaman_idx
  on public.konum_kayitlari (arac_id, zaman desc);

comment on table public.konum_kayitlari is
  'Hassas veri. Saklama süresi sınırlıdır (public.konum_kayitlarini_temizle), '
  'panelde maskeli gösterilir, dışa aktarım denetim kaydına yazılır.';

-- ---------------------------------------------------------------------------
-- Denetim kaydı
-- ---------------------------------------------------------------------------
--
-- İstemci yazamaz. Yazma yetkisi yalnızca service role'dedir ki kayıt, kaydı
-- üretenin silemeyeceği bir yerde dursun.

create table public.denetim_kaydi (
  id           uuid primary key default gen_random_uuid(),
  kullanici_id uuid references auth.users (id) on delete set null,
  arac_id      uuid references public.araclar (id) on delete cascade,
  islem        text not null,
  ayrinti      jsonb,
  ip           inet,
  zaman        timestamptz not null default now()
);

create index denetim_kaydi_arac_zaman_idx
  on public.denetim_kaydi (arac_id, zaman desc);

-- ---------------------------------------------------------------------------
-- Saklama süresi
-- ---------------------------------------------------------------------------
--
-- Zamanlanmış çalıştırma (pg_cron) bilerek burada kurulmuyor: uzantı her projede
-- açık olmayabilir. Panel veya bir Edge Function bu fonksiyonu çağırır.

create or replace function public.konum_kayitlarini_temizle(gun_sayisi integer default 90)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  silinen integer;
begin
  delete from public.konum_kayitlari
   where zaman < now() - make_interval(days => gun_sayisi);
  get diagnostics silinen = row_count;
  return silinen;
end;
$$;

comment on function public.konum_kayitlarini_temizle is
  'Konum geçmişini budar. Varsayılan 90 gün; hassas veri olduğu için süresiz tutulmaz.';
