-- Jalankan sekali di Supabase SQL Editor untuk mengaktifkan foto tim penilai.
-- Foto disimpan sebagai JPEG terkompresi, hanya bisa diubah lewat RPC ber-password admin.
create table if not exists public.pkkm_evaluators (
  slot smallint primary key check (slot in (1,2)),
  image_data text not null,
  updated_at timestamptz not null default now()
);
alter table public.pkkm_evaluators enable row level security;
revoke all on public.pkkm_evaluators from anon, authenticated;

create or replace function public.pkkm_public_evaluators()
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'image_data',image_data) order by slot),'[]'::jsonb)
 from public.pkkm_evaluators;
$$;

create or replace function public.pkkm_admin_save_evaluator(p_admin_key text,p_slot smallint,p_image_data text)
returns boolean language plpgsql security definer set search_path='' as $$
declare expected text;
begin
 select password_sha256 into expected from public.pkkm_admin_config where singleton=true;
 if expected is null or encode(extensions.digest(convert_to(coalesce(p_admin_key,''),'UTF8'),'sha256'),'hex') <> expected then
   raise exception 'unauthorized' using errcode='42501';
 end if;
 if p_slot not in (1,2) or p_image_data is null or length(p_image_data)>500000 or p_image_data not like 'data:image/jpeg;base64,%' then
   raise exception 'invalid image or slot';
 end if;
 insert into public.pkkm_evaluators(slot,image_data) values(p_slot,p_image_data)
 on conflict(slot) do update set image_data=excluded.image_data,updated_at=now();
 return true;
end $$;
revoke all on function public.pkkm_public_evaluators() from public;
grant execute on function public.pkkm_public_evaluators() to anon,authenticated;
revoke all on function public.pkkm_admin_save_evaluator(text,smallint,text) from public;
grant execute on function public.pkkm_admin_save_evaluator(text,smallint,text) to anon,authenticated;
