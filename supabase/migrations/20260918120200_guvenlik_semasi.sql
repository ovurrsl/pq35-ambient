-- PQ35-AMBIENT — yardımcı fonksiyonlar API yüzeyinden çıkarılıyor
--
-- NEDEN: `arac_sahibi_mi` ve `arac_erisimi_var` `public` şemasındaydı ve `authenticated`
-- rolüne EXECUTE verilmişti (RLS politikaları onları çağırdığı için bu grant ZORUNLU —
-- PostgreSQL, fonksiyon bir politika içinden çağrılsa bile çağıranın EXECUTE yetkisini
-- arar). Ama `public` şeması PostgREST tarafından dışa açıldığı için aynı fonksiyonlar
-- `/rest/v1/rpc/arac_sahibi_mi` olarak da çağrılabiliyordu.
--
-- Sızdırdıkları bilgi yok: her ikisi de yalnızca `auth.uid()` ile ilgili cevap verir,
-- yabancı bir araç id'si için her hâlükârda `false` döner — araç var mı yok mu bile
-- anlaşılmaz. Yine de gereksiz bir saldırı yüzeyi; Supabase denetçisi de bunu işaretledi.
--
-- ÇÖZÜM: fonksiyonlar dışa açılmayan `guvenlik` şemasına taşınır. Politikalar oradan
-- çağırmaya devam eder; PostgREST'in gördüğü şemalarda artık görünmezler.

create schema if not exists guvenlik;

revoke all on schema guvenlik from public;
revoke all on schema guvenlik from anon;
-- Politikalar fonksiyonu çağırabilsin diye yalnızca USAGE; şemada başka nesne yok.
grant usage on schema guvenlik to authenticated;

create or replace function guvenlik.arac_sahibi_mi(p_arac_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.araclar a
     where a.id = p_arac_id and a.sahip_id = (select auth.uid())
  );
$$;

create or replace function guvenlik.arac_erisimi_var(p_arac_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select guvenlik.arac_sahibi_mi(p_arac_id)
      or exists (
        select 1 from public.eslesmis_telefonlar e
         where e.arac_id = p_arac_id
           and e.kullanici_id = (select auth.uid())
           and not e.iptal_edildi
      );
$$;

revoke all on function guvenlik.arac_sahibi_mi(uuid) from public, anon;
revoke all on function guvenlik.arac_erisimi_var(uuid) from public, anon;
grant execute on function guvenlik.arac_sahibi_mi(uuid) to authenticated;
grant execute on function guvenlik.arac_erisimi_var(uuid) to authenticated;

-- Politikalar eski fonksiyonlara bağımlı; önce onlar düşürülüp yeniden kurulur.
drop policy araclar_oku on public.araclar;
drop policy telefon_oku on public.eslesmis_telefonlar;
drop policy telefon_ekle on public.eslesmis_telefonlar;
drop policy telefon_guncelle on public.eslesmis_telefonlar;
drop policy telefon_sil on public.eslesmis_telefonlar;
drop policy bolge_oku on public.bolge_ayarlari;
drop policy bolge_ekle on public.bolge_ayarlari;
drop policy bolge_guncelle on public.bolge_ayarlari;
drop policy bolge_sil on public.bolge_ayarlari;
drop policy sahne_oku on public.sahneler;
drop policy sahne_ekle on public.sahneler;
drop policy sahne_guncelle on public.sahneler;
drop policy sahne_sil on public.sahneler;
drop policy konum_oku on public.konum_kayitlari;
drop policy denetim_oku on public.denetim_kaydi;

create policy araclar_oku on public.araclar
  for select to authenticated using (guvenlik.arac_erisimi_var(id));

create policy telefon_oku on public.eslesmis_telefonlar
  for select to authenticated using (guvenlik.arac_erisimi_var(arac_id));
create policy telefon_ekle on public.eslesmis_telefonlar
  for insert to authenticated with check (guvenlik.arac_sahibi_mi(arac_id));
create policy telefon_guncelle on public.eslesmis_telefonlar
  for update to authenticated
  using (guvenlik.arac_sahibi_mi(arac_id)) with check (guvenlik.arac_sahibi_mi(arac_id));
create policy telefon_sil on public.eslesmis_telefonlar
  for delete to authenticated using (guvenlik.arac_sahibi_mi(arac_id));

create policy bolge_oku on public.bolge_ayarlari
  for select to authenticated using (guvenlik.arac_erisimi_var(arac_id));
create policy bolge_ekle on public.bolge_ayarlari
  for insert to authenticated with check (guvenlik.arac_erisimi_var(arac_id));
create policy bolge_guncelle on public.bolge_ayarlari
  for update to authenticated
  using (guvenlik.arac_erisimi_var(arac_id)) with check (guvenlik.arac_erisimi_var(arac_id));
create policy bolge_sil on public.bolge_ayarlari
  for delete to authenticated using (guvenlik.arac_sahibi_mi(arac_id));

create policy sahne_oku on public.sahneler
  for select to authenticated using (guvenlik.arac_erisimi_var(arac_id));
create policy sahne_ekle on public.sahneler
  for insert to authenticated with check (guvenlik.arac_erisimi_var(arac_id));
create policy sahne_guncelle on public.sahneler
  for update to authenticated
  using (guvenlik.arac_erisimi_var(arac_id)) with check (guvenlik.arac_erisimi_var(arac_id));
create policy sahne_sil on public.sahneler
  for delete to authenticated using (guvenlik.arac_erisimi_var(arac_id));

create policy konum_oku on public.konum_kayitlari
  for select to authenticated using (guvenlik.arac_sahibi_mi(arac_id));

create policy denetim_oku on public.denetim_kaydi
  for select to authenticated
  using (arac_id is null and kullanici_id = (select auth.uid())
         or guvenlik.arac_sahibi_mi(arac_id));

drop function public.arac_erisimi_var(uuid);
drop function public.arac_sahibi_mi(uuid);

-- Bakım fonksiyonu da dışa açık şemadan çıkıyor. Yalnızca service role çağırır.
create or replace function guvenlik.konum_kayitlarini_temizle(gun_sayisi integer default 90)
returns integer language plpgsql security definer set search_path = ''
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

revoke all on function guvenlik.konum_kayitlarini_temizle(integer) from public, anon, authenticated;

drop function public.konum_kayitlarini_temizle(integer);

comment on schema guvenlik is
  'RLS yardımcıları. PostgREST tarafından dışa açılmaz; buradaki fonksiyonlar yalnızca '
  'politika ifadelerinden ve service role''den çağrılır.';
