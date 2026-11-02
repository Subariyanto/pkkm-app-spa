-- Jalankan sekali di Supabase SQL Editor (project rnprnkeoumnunysvuycv).
-- Menambahkan: edit nama kepala madrasah, tambah madrasah baru, hapus madrasah.

-- 1) Simpan (tambah/ubah) jadwal beserta nama kepala madrasah
create or replace function public.pkkm_admin_save_v3(
  p_admin_key text,
  p_id bigint,
  p_nama_madrasah text,
  p_nama_kepala text,
  p_tanggal date,
  p_jam text,
  p_lokasi text,
  p_catatan text
)
returns bigint language plpgsql security definer set search_path='' as $$
declare expected text; new_id bigint; next_no integer; nm text; kp text;
begin
  select password_sha256 into expected from public.pkkm_admin_config where singleton=true;
  if expected is null or encode(extensions.digest(convert_to(coalesce(p_admin_key,''),'UTF8'),'sha256'),'hex') <> expected then
    raise exception 'unauthorized' using errcode='42501';
  end if;

  nm := nullif(trim(coalesce(p_nama_madrasah,'')),'');
  kp := nullif(trim(coalesce(p_nama_kepala,'')),'');
  if nm is null then raise exception 'nama madrasah wajib diisi' using errcode='22023'; end if;
  if kp is null then raise exception 'nama kepala madrasah wajib diisi' using errcode='22023'; end if;

  if p_id is null then
    select coalesce(max(no),0)+1 into next_no from public.pkkm_schedules;
    insert into public.pkkm_schedules(no,nama_madrasah,nama_kepala,tanggal,jam,lokasi,catatan)
    values(next_no,nm,kp,p_tanggal,coalesce(p_jam,''),coalesce(p_lokasi,''),coalesce(p_catatan,''))
    returning id into new_id;
  else
    update public.pkkm_schedules
       set nama_madrasah=nm,
           nama_kepala=kp,
           tanggal=p_tanggal,
           jam=coalesce(p_jam,''),
           lokasi=coalesce(p_lokasi,''),
           catatan=coalesce(p_catatan,''),
           updated_at=now()
     where id=p_id
     returning id into new_id;
    if new_id is null then raise exception 'jadwal tidak ditemukan' using errcode='P0002'; end if;
  end if;
  return new_id;
end $$;
revoke all on function public.pkkm_admin_save_v3(text,bigint,text,text,date,text,text,text) from public;
grant execute on function public.pkkm_admin_save_v3(text,bigint,text,text,date,text,text,text) to anon,authenticated;

-- 2) Hapus jadwal
create or replace function public.pkkm_admin_delete_v1(p_admin_key text,p_id bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare expected text;
begin
  select password_sha256 into expected from public.pkkm_admin_config where singleton=true;
  if expected is null or encode(extensions.digest(convert_to(coalesce(p_admin_key,''),'UTF8'),'sha256'),'hex') <> expected then
    raise exception 'unauthorized' using errcode='42501';
  end if;
  delete from public.pkkm_schedules where id=p_id;
  return found;
end $$;
revoke all on function public.pkkm_admin_delete_v1(text,bigint) from public;
grant execute on function public.pkkm_admin_delete_v1(text,bigint) to anon,authenticated;
