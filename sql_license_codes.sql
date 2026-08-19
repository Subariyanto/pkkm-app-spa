-- ============================================================
-- PKKM License System — Tahap 2 (Server = Source of Truth)
-- Run this in Supabase SQL Editor
-- URUTAN: 1) Enable pgcrypto, 2) Migration kolom, 3) RPC, 4) RLS
-- ============================================================

-- 0. Enable pgcrypto untuk digest() function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. MIGRASI KOLOM — tambah kolom baru ke tabel existing
--    (HARIS sebelum buat RPC yang reference kolom ini)
-- ============================================================
DO $$
BEGIN
  -- Add status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'license_codes' AND column_name = 'status'
  ) THEN
    ALTER TABLE license_codes ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
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

-- Migrate data lama: revoked=true → status='revoked'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'license_codes' AND column_name = 'revoked'
  ) THEN
    UPDATE license_codes SET status = 'revoked' WHERE revoked = true AND status IS DISTINCT FROM 'revoked';
  END IF;
END $$;

-- Hapus master code lama (tidak boleh ada bypass)
DELETE FROM license_codes WHERE code = 'FULL-PKKM-POKJAWAS-2026' AND used_by IS NULL;

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_license_codes_code ON license_codes(code);
CREATE INDEX IF NOT EXISTS idx_license_codes_used_by ON license_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_license_codes_status ON license_codes(status);

-- ============================================================
-- 2. ENABLE RLS
-- ============================================================
ALTER TABLE license_codes ENABLE ROW LEVEL SECURITY;

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
-- 3. RPC: claim_license — Claim atomik 1 kode = 1 device
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
-- 4. RPC: verify_license — Cek status lisensi untuk device
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
    RETURN json_build_object('valid', false, 'reason', 'not_claimed');
  END IF;

  IF lic.used_by = p_device_id THEN
    RETURN json_build_object('valid', true, 'reason', 'same_device');
  END IF;

  RETURN json_build_object('valid', false, 'reason', 'other_device');
END;
$$;

-- ============================================================
-- 5. RPC: admin_reset_device — Admin lepas binding device
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
-- 6. RPC: admin_generate_code — Admin buat kode baru
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

  LOOP
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
-- 7. RPC: admin_revoke_code — Admin cabut kode
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
-- 8. RPC: admin_list_codes — Admin lihat semua kode
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
-- 9. RPC: admin_update_recipient — Admin update penerima kode
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
