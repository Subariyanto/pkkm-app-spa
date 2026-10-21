-- Run once in Supabase SQL Editor to enable editing madrasah names as well as date/time.
create or replace function public.pkkm_admin_update_v2(
 p_admin_key text,
 p_id bigint,
 p_nama_madrasah text,
 p_tanggal date,
 p_jam text,
 p_lokasi text,
 p_catatan text
)
returns boolean language plpgsql security definer set search_path='' as $$
declare expected text;
begin
 select password_sha256 into expected from public.pkkm_admin_config where singleton=true;
 if expected is null or encode(extensions.digest(convert_to(coalesce(p_admin_key,''),'UTF8'),'sha256'),'hex') <> expected then
   raise exception 'unauthorized' using errcode='42501';
 end if;
 update public.pkkm_schedules
 set nama_madrasah=coalesce(nullif(trim(p_nama_madrasah),''),nama_madrasah),
     tanggal=p_tanggal, jam=coalesce(p_jam,''), lokasi=coalesce(p_lokasi,''),
     catatan=coalesce(p_catatan,''), updated_at=now()
 where id=p_id;
 return found;
end $$;
revoke all on function public.pkkm_admin_update_v2(text,bigint,text,date,text,text,text) from public;
grant execute on function public.pkkm_admin_update_v2(text,bigint,text,date,text,text,text) to anon,authenticated;
