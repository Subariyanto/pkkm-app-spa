-- Run this once in Supabase SQL Editor to enable the single public all-schools link.
-- This RPC returns schedule fields only and never returns the per-school share_id.
create or replace function public.pkkm_public_schedules()
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
   'NO.',no,
   'Nama Madrasah',nama_madrasah,
   'Nama Kepala Madrasah',nama_kepala,
   'Tanggal PKKM',tanggal,
   'Jam',jam,
   'Lokasi',lokasi,
   'Catatan',catatan
 ) order by no),'[]'::jsonb)
 from public.pkkm_schedules;
$$;
revoke all on function public.pkkm_public_schedules() from public;
grant execute on function public.pkkm_public_schedules() to anon,authenticated;
