-- PQ35-AMBIENT — Row Level Security
--
-- KURAL: her tabloda RLS açık ve VARSAYILAN REDDET. Politika yazılmayan her işlem
-- yasaktır. Politika yazmayı unutmak, veriyi açıkta bırakmak değil, erişilemez kılar —
-- bu bilinçli bir tercihtir (CLAUDE.md §3.2).
--
-- İki tabloya hiç istemci politikası yazılmaz: cihaz_anahtarlari ve denetim_kaydi'na
-- yazma. Onlara yalnızca service role erişir, o da sadece Edge Function'da bulunur.

-- ---------------------------------------------------------------------------
-- Yardımcı fonksiyonlar
-- ---------------------------------------------------------------------------
--
-- Politikaların içinde alt sorgu tekrar etmesin diye. `security definer` çünkü
-- kullanıcının eslesmis_telefonlar üzerinde okuma politikası olmasa da erişim
-- kontrolünün çalışması gerekir; `search_path` boşaltıldı ki arama yolu ele geçirilemesin.

create or replace function public.arac_sahibi_mi(p_arac_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.araclar a
     where a.id = p_arac_id
       and a.sahip_id = (select auth.uid())
  );
$$;

-- Sahip VEYA iptal edilmemiş eşleşmiş telefonu olan misafir.
create or replace function public.arac_erisimi_var(p_arac_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.arac_sahibi_mi(p_arac_id)
      or exists (
        select 1 from public.eslesmis_telefonlar e
         where e.arac_id = p_arac_id
           and e.kullanici_id = (select auth.uid())
           and not e.iptal_edildi
      );
$$;

-- ---------------------------------------------------------------------------
-- araclar
-- ---------------------------------------------------------------------------

alter table public.araclar enable row level security;
alter table public.araclar force row level security;

create policy araclar_oku on public.araclar
  for select to authenticated
  using (public.arac_erisimi_var(id));

create policy araclar_ekle on public.araclar
  for insert to authenticated
  with check (sahip_id = (select auth.uid()));

-- Aracı yalnızca sahibi değiştirir; misafir okuyabilir ama dokunamaz.
create policy araclar_guncelle on public.araclar
  for update to authenticated
  using (sahip_id = (select auth.uid()))
  with check (sahip_id = (select auth.uid()));

create policy araclar_sil on public.araclar
  for delete to authenticated
  using (sahip_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- eslesmis_telefonlar
-- ---------------------------------------------------------------------------

alter table public.eslesmis_telefonlar enable row level security;
alter table public.eslesmis_telefonlar force row level security;

-- Erişimi olan herkes listeyi görür — kimin bağlı olduğunu görmek bir güvenlik özelliğidir.
create policy telefon_oku on public.eslesmis_telefonlar
  for select to authenticated
  using (public.arac_erisimi_var(arac_id));

-- Eşleştirmeyi ve iptali YALNIZCA sahip yapar. Misafir kendini yükseltemez.
create policy telefon_ekle on public.eslesmis_telefonlar
  for insert to authenticated
  with check (public.arac_sahibi_mi(arac_id));

create policy telefon_guncelle on public.eslesmis_telefonlar
  for update to authenticated
  using (public.arac_sahibi_mi(arac_id))
  with check (public.arac_sahibi_mi(arac_id));

create policy telefon_sil on public.eslesmis_telefonlar
  for delete to authenticated
  using (public.arac_sahibi_mi(arac_id));

-- ---------------------------------------------------------------------------
-- cihaz_anahtarlari — istemci politikası YOK
-- ---------------------------------------------------------------------------
--
-- RLS açık, hiçbir politika yok: authenticated ve anon rolleri için tablo tamamen
-- kapalıdır. Yalnızca service role (Edge Function) erişir. Token özeti hiçbir
-- koşulda tarayıcıya veya uygulamaya inmez.

alter table public.cihaz_anahtarlari enable row level security;
alter table public.cihaz_anahtarlari force row level security;

-- ---------------------------------------------------------------------------
-- bolge_ayarlari — misafir de kullanabilir
-- ---------------------------------------------------------------------------
--
-- Misafir profili LED ve sahneleri kullanır (CLAUDE.md §3.2), bu yüzden yazabilir.
-- Kapalı olan şey kilit, arama ve kodlama komutlarıdır; onlar veri tabanı işlemi
-- değil, karta giden BLE komutlarıdır ve kartta engellenir.

alter table public.bolge_ayarlari enable row level security;
alter table public.bolge_ayarlari force row level security;

create policy bolge_oku on public.bolge_ayarlari
  for select to authenticated
  using (public.arac_erisimi_var(arac_id));

create policy bolge_ekle on public.bolge_ayarlari
  for insert to authenticated
  with check (public.arac_erisimi_var(arac_id));

create policy bolge_guncelle on public.bolge_ayarlari
  for update to authenticated
  using (public.arac_erisimi_var(arac_id))
  with check (public.arac_erisimi_var(arac_id));

create policy bolge_sil on public.bolge_ayarlari
  for delete to authenticated
  using (public.arac_sahibi_mi(arac_id));

-- ---------------------------------------------------------------------------
-- sahneler
-- ---------------------------------------------------------------------------

alter table public.sahneler enable row level security;
alter table public.sahneler force row level security;

create policy sahne_oku on public.sahneler
  for select to authenticated
  using (public.arac_erisimi_var(arac_id));

create policy sahne_ekle on public.sahneler
  for insert to authenticated
  with check (public.arac_erisimi_var(arac_id));

create policy sahne_guncelle on public.sahneler
  for update to authenticated
  using (public.arac_erisimi_var(arac_id))
  with check (public.arac_erisimi_var(arac_id));

create policy sahne_sil on public.sahneler
  for delete to authenticated
  using (public.arac_erisimi_var(arac_id));

-- ---------------------------------------------------------------------------
-- konum_kayitlari — YALNIZCA SAHİP OKUR, KİMSE YAZMAZ
-- ---------------------------------------------------------------------------
--
-- Misafir bilerek dışarıda: aracı kullanabilmek, aracın nerelere gittiğini görmeyi
-- gerektirmez. Konum geçmişi bu sistemdeki en hassas veridir.
--
-- INSERT/UPDATE/DELETE politikası hiç yok: satırlar yalnızca Edge Function'dan,
-- service role ile gelir. Bir istemci anahtarı sızsa bile sahte konum yazılamaz.

alter table public.konum_kayitlari enable row level security;
alter table public.konum_kayitlari force row level security;

create policy konum_oku on public.konum_kayitlari
  for select to authenticated
  using (public.arac_sahibi_mi(arac_id));

-- ---------------------------------------------------------------------------
-- denetim_kaydi — sahip okur, kimse yazmaz
-- ---------------------------------------------------------------------------
--
-- Yazmanın istemciye kapalı olması özellikle önemli: denetim kaydını, kaydı üreten
-- kişinin değiştiremeyeceği bir yerde tutmak gerekir.

alter table public.denetim_kaydi enable row level security;
alter table public.denetim_kaydi force row level security;

create policy denetim_oku on public.denetim_kaydi
  for select to authenticated
  using (arac_id is null and kullanici_id = (select auth.uid())
         or public.arac_sahibi_mi(arac_id));

-- ---------------------------------------------------------------------------
-- Fonksiyon yetkileri
-- ---------------------------------------------------------------------------

revoke all on function public.konum_kayitlarini_temizle(integer) from public, anon, authenticated;
revoke all on function public.arac_sahibi_mi(uuid) from public, anon;
revoke all on function public.arac_erisimi_var(uuid) from public, anon;
grant execute on function public.arac_sahibi_mi(uuid) to authenticated;
grant execute on function public.arac_erisimi_var(uuid) to authenticated;
