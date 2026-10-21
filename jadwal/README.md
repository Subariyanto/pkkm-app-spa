# Jadwal PKKM KKMA 04 Jember

Static front end hosted on GitHub Pages; schedule records and admin operations live in Supabase. The dataset import CSV is kept outside this repository.

## One-time setup
1. Run `supabase-schema.sql` in Supabase SQL Editor.
2. In Supabase Table Editor, import the owner-provided CSV into `pkkm_schedules` (columns: `no,nama_madrasah,nama_kepala,tanggal,jam,lokasi,catatan`). Leave generated `id` and `share_id` out of the import.
3. Configure Supabase Auth/API allowed origins as needed for `https://pkkm.pokjawasjember.com`.
4. GitHub Pages deploys from `.github/workflows/pages.yml`; custom domain uses `CNAME`.

The admin password is generated separately for the owner. Only its SHA-256 digest is embedded in the SQL. Never add the import CSV, admin password, database password, or service-role key to this repo. Supabase publishable keys are intended for client-side use; authorization is enforced in the SQL RPC functions.
