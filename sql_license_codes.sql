-- ============================================================
-- PKKM License System — Tahap 2 (Server = Source of Truth)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Tabel license_codes (preserve existing data)
CREATE TABLE IF NOT EXISTS license_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',  -- active | revoked
  recipient TEXT DEFAULT '',
  created_by TEXT DEFAULT 'admin',
  used_by TEXT,                            -- device_id yang claim
  used_at TIMESTAMPTZ,
  device_info TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                  -- nullable, untuk masa berlaku
  note TEXT DEFAULT ''
);

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_license_codes_code ON license_codes(code);
CREATE INDEX IF NOT EXISTS idx_license_codes_used_by ON license_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_license_codes_status ON license_codes(status);

-- 2. Enable RLS
ALTER TABLE license_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS POLICIES — anon hanya bisa SELECT, tidak bisa INSERT/UPDATE/DELETE
-- ============================================================

-- Drop old policies jika ada
DROP POLICY IF EXISTS "anon_select_license_codes" ON license_codes;
DROP POLICY IF EXISTS "anon_insert_license_codes" ON license_codes;
DROP POLICY IF EXISTS "anon_update_license_codes" ON license_codes;
DROP POLICY IF EXISTS "anon_delete_license_codes" ON license_codes;

-- Policy: anon hanya bisa SELECT (untuk lihat status kode)
CREATE POLICY "anon_select_license_codes"
  ON license_codes FOR SELECT
  TO anon
  USING (true);

-- TIDAK ada policy INSERT/UPDATE/DELETE untuk anon.
-- Semua mutasi dilakukan via RPC (SECURITY DEFINER) yang bypass RLS.


-- ============================================================
-- 4. RPC: claim_license — Claim atomik 1 kode = 1 device
-- ============================================================
CREATE OR REPLACE FUNCTION claim_license(
  p_code TEXT,
  p_device_id TEXT,
  p_device_info TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lic RECORD;
BEGIN
  -- Lock row untuk mencegah race condition
  SELECT * INTO lic
  FROM license_codes
  WHERE code = p_code
  FOR UPDATE;

  -- Kode tidak ditemukan
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'invalid_code');
  END IF;

  -- Kode dicabut
  IF lic.status <> 'active' THEN
    RETURN json_build_object('success', false, 'reason', 'inactive');
  END IF;

  -- Kode belum pernah dipakai → claim sekarang
  IF lic.used_by IS NULL THEN
    UPDATE license_codes
    SET
      used_by = p_device_id,
      used_at = NOW(),
      device_info = p_device_info
    WHERE code = p_code;

    RETURN json_build_object('success', true, 'reason', 'claimed');
  END IF;

  -- Kode sudah dipakai perangkat yang sama → izinkan
  IF lic.used_by = p_device_id THEN
    RETURN json_build_object('success', true, 'reason', 'same_device');
  END IF;

  -- Kode sudah dipakai perangkat lain → tolak
  RETURN json_build_object('success', false, 'reason', 'other_device');
END;
$$;


-- ============================================================
-- 5. RPC: verify_license — Cek status lisensi untuk device
-- ============================================================
CREATE OR REPLACE FUNCTION verify_license(
  p_code TEXT,
  p_device_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lic RECORD;
BEGIN
  SELECT * INTO lic
  FROM license_codes
  WHERE code = p_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'reason', 'invalid_code');
  END IF;

  IF lic.status <> 'active' THEN
    RETURN json_build_object('valid', false, 'reason', 'inactive');
  END IF;

  IF lic.used_by IS NULL THEN
    -- Kode belum di-claim siapa pun
    RETURN json_build_object('valid', false, 'reason', 'not_claimed');
  END IF;

  IF lic.used_by = p_device_id THEN
    RETURN json_build_object('valid', true, 'reason', 'same_device');
  END IF;

  -- Dipakai device lain
  RETURN json_build_object('valid', false, 'reason', 'other_device');
END;
$$;


-- ============================================================
-- 6. RPC: admin_reset_device — Admin lepas binding device
-- ============================================================
CREATE OR REPLACE FUNCTION admin_reset_device(
  p_code TEXT,
  p_admin_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lic RECORD;
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
BEGIN
  -- Validasi admin key (SHA-256 hash, bukan plaintext)
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  SELECT * INTO lic
  FROM license_codes
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'invalid_code');
  END IF;

  -- Reset binding
  UPDATE license_codes
  SET
    used_by = NULL,
    used_at = NULL,
    device_info = ''
  WHERE code = p_code;

  RETURN json_build_object('success', true, 'reason', 'reset_done');
END;
$$;


-- ============================================================
-- 7. RPC: admin_generate_code — Admin buat kode baru
-- ============================================================
CREATE OR REPLACE FUNCTION admin_generate_code(
  p_admin_key TEXT,
  p_recipient TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  ch TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  p1 TEXT;
  p2 TEXT;
  p3 TEXT;
  new_code TEXT;
  exists INT;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  -- Generate unique code with retry
  LOOP
    p1 := substr(string_agg(substr(ch, 1 + floor(random() * length(ch))::INT, 1), ''), 1, 4);
    -- Generate 4 random chars
    p1 := '';
    FOR i IN 1..4 LOOP
      p1 := p1 || substr(ch, 1 + floor(random() * length(ch))::INT, 1);
    END LOOP;
    p2 := '';
    FOR i IN 1..4 LOOP
      p2 := p2 || substr(ch, 1 + floor(random() * length(ch))::INT, 1);
    END LOOP;
    p3 := '';
    FOR i IN 1..4 LOOP
      p3 := p3 || substr(ch, 1 + floor(random() * length(ch))::INT, 1);
    END LOOP;
    new_code := 'FULL-' || p1 || '-' || p2 || '-' || p3;

    SELECT COUNT(*) INTO exists FROM license_codes WHERE code = new_code;
    EXIT WHEN exists = 0;
  END LOOP;

  INSERT INTO license_codes (code, status, recipient, created_by)
  VALUES (new_code, 'active', p_recipient, 'admin');

  RETURN json_build_object('success', true, 'code', new_code);
END;
$$;


-- ============================================================
-- 8. RPC: admin_revoke_code — Admin cabut kode
-- ============================================================
CREATE OR REPLACE FUNCTION admin_revoke_code(
  p_code TEXT,
  p_admin_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  UPDATE license_codes
  SET status = 'revoked'
  WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'invalid_code');
  END IF;

  RETURN json_build_object('success', true, 'reason', 'revoked');
END;
$$;


-- ============================================================
-- 9. RPC: admin_list_codes — Admin lihat semua kode
-- ============================================================
CREATE OR REPLACE FUNCTION admin_list_codes(
  p_admin_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  result JSON;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
  INTO result
  FROM (
    SELECT id, code, status, recipient, created_by, used_by, used_at, device_info, created_at, expires_at, note
    FROM license_codes
  ) t;

  RETURN json_build_object('success', true, 'codes', result);
END;
$$;


-- ============================================================
-- 10. RPC: admin_update_recipient — Admin update penerima kode
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_recipient(
  p_code TEXT,
  p_recipient TEXT,
  p_admin_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  UPDATE license_codes
  SET recipient = p_recipient
  WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'invalid_code');
  END IF;

  RETURN json_build_object('success', true, 'reason', 'updated');
END;
$$;


-- ============================================================
-- MIGRASI: Tambah kolom status jika belum ada (untuk tabel existing)
-- ============================================================
DO $$
BEGIN
  -- Add status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'license_codes' AND column_name = 'status'
  ) THEN
    ALTER TABLE license_codes ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    -- Migrate: revoked=true → status='revoked', revoked=false → status='active'
    UPDATE license_codes SET status = 'revoked' WHERE revoked = true;
  END IF;

  -- Add expires_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'license_codes' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE license_codes ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  -- Add note if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'license_codes' AND column_name = 'note'
  ) THEN
    ALTER TABLE license_codes ADD COLUMN note TEXT DEFAULT '';
  END IF;
END $$;

-- Enable pgcrypto for digest() function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hapus master code lama dari tabel (tidak boleh ada bypass)
DELETE FROM license_codes WHERE code = 'FULL-PKKM-POKJAWAS-2026' AND used_by IS NULL;
