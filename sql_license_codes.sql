-- ============================================================
-- PKKM License System — Tahap 2 + 3 (Server = Source of Truth)
-- Run this in Supabase SQL Editor
-- URUTAN: 1) pgcrypto, 2) Migration, 3) Drop old funcs, 4) RPC, 5) RLS
-- ============================================================

-- 0. Enable pgcrypto untuk digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. MIGRASI KOLOM
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_codes' AND column_name = 'status') THEN
    ALTER TABLE license_codes ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_codes' AND column_name = 'expires_at') THEN
    ALTER TABLE license_codes ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_codes' AND column_name = 'note') THEN
    ALTER TABLE license_codes ADD COLUMN note TEXT DEFAULT '';
  END IF;
END $$;

-- Migrate data lama
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_codes' AND column_name = 'revoked') THEN
    UPDATE license_codes SET status = 'revoked' WHERE revoked = true AND status IS DISTINCT FROM 'revoked';
  END IF;
END $$;

-- Hapus master code lama
DELETE FROM license_codes WHERE code = 'FULL-PKKM-POKJAWAS-2026' AND used_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_license_codes_code ON license_codes(code);
CREATE INDEX IF NOT EXISTS idx_license_codes_used_by ON license_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_license_codes_status ON license_codes(status);

-- ============================================================
-- 2. DROP OLD FUNCTIONS (hilangkan signature lama yang konflik)
-- ============================================================
DROP FUNCTION IF EXISTS claim_license(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS verify_license(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_reset_device(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_generate_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_revoke_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_list_codes(TEXT);
DROP FUNCTION IF EXISTS admin_reactivate_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_delete_unused_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_batch_create_codes(INT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_get_stats(TEXT);
DROP FUNCTION IF EXISTS admin_get_audit_log(TEXT, INT);
DROP FUNCTION IF EXISTS admin_update_recipient(TEXT, TEXT, TEXT);

-- ============================================================
-- 3. AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS license_audit_log (
  id BIGSERIAL PRIMARY KEY,
  license_code TEXT NOT NULL,
  action TEXT NOT NULL,
  admin_user TEXT DEFAULT '',
  old_device TEXT,
  new_device TEXT,
  detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_code ON license_audit_log(license_code);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON license_audit_log(created_at DESC);

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE license_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_license_codes" ON license_codes;
DROP POLICY IF EXISTS "anon_insert_license_codes" ON license_codes;
DROP POLICY IF EXISTS "anon_update_license_codes" ON license_codes;
DROP POLICY IF EXISTS "anon_delete_license_codes" ON license_codes;

CREATE POLICY "anon_select_license_codes"
  ON license_codes FOR SELECT TO anon USING (used_by IS NOT NULL);
-- Anon bisa cek kode yang sudah dipakai (untuk verifikasi), tapi tidak bisa lihat kode yang belum dipakai
-- No INSERT/UPDATE/DELETE for anon — all via RPC

-- ============================================================
-- 5. RPC FUNCTIONS
-- ============================================================

-- claim_license
CREATE FUNCTION claim_license(
  p_code TEXT,
  p_device_id TEXT,
  p_device_info TEXT DEFAULT ''
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE lic RECORD;
BEGIN
  SELECT * INTO lic FROM license_codes WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'reason', 'invalid_code'); END IF;
  IF lic.status <> 'active' THEN RETURN json_build_object('success', false, 'reason', 'inactive'); END IF;
  IF lic.used_by IS NULL THEN
    UPDATE license_codes SET used_by = p_device_id, used_at = NOW(), device_info = p_device_info WHERE code = p_code;
    INSERT INTO license_audit_log (license_code, action, new_device) VALUES (p_code, 'CLAIM', p_device_id);
    RETURN json_build_object('success', true, 'reason', 'claimed');
  END IF;
  IF lic.used_by = p_device_id THEN RETURN json_build_object('success', true, 'reason', 'same_device'); END IF;
  RETURN json_build_object('success', false, 'reason', 'other_device');
END;
$$;

-- verify_license
CREATE FUNCTION verify_license(
  p_code TEXT,
  p_device_id TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE lic RECORD;
BEGIN
  SELECT * INTO lic FROM license_codes WHERE code = p_code LIMIT 1;
  IF NOT FOUND THEN RETURN json_build_object('valid', false, 'reason', 'invalid_code'); END IF;
  IF lic.status <> 'active' THEN RETURN json_build_object('valid', false, 'reason', 'inactive'); END IF;
  IF lic.used_by IS NULL THEN RETURN json_build_object('valid', false, 'reason', 'not_claimed'); END IF;
  IF lic.used_by = p_device_id THEN RETURN json_build_object('valid', true, 'reason', 'same_device'); END IF;
  RETURN json_build_object('valid', false, 'reason', 'other_device');
END;
$$;

-- admin_reset_device
CREATE FUNCTION admin_reset_device(
  p_code TEXT,
  p_admin_key TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE lic RECORD;
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  SELECT * INTO lic FROM license_codes WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'reason', 'invalid_code'); END IF;
  INSERT INTO license_audit_log (license_code, action, old_device) VALUES (p_code, 'RESET_DEVICE', lic.used_by);
  UPDATE license_codes SET used_by = NULL, used_at = NULL, device_info = '' WHERE code = p_code;
  RETURN json_build_object('success', true, 'reason', 'reset_done');
END;
$$;

-- admin_generate_code
CREATE FUNCTION admin_generate_code(
  p_admin_key TEXT,
  p_recipient TEXT DEFAULT ''
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  ch TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  p1 TEXT; p2 TEXT; p3 TEXT; new_code TEXT; exists INT;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  LOOP
    p1 := ''; FOR i IN 1..4 LOOP p1 := p1 || substr(ch, 1 + floor(random() * length(ch))::INT, 1); END LOOP;
    p2 := ''; FOR i IN 1..4 LOOP p2 := p2 || substr(ch, 1 + floor(random() * length(ch))::INT, 1); END LOOP;
    p3 := ''; FOR i IN 1..4 LOOP p3 := p3 || substr(ch, 1 + floor(random() * length(ch))::INT, 1); END LOOP;
    new_code := 'FULL-' || p1 || '-' || p2 || '-' || p3;
    SELECT COUNT(*) INTO exists FROM license_codes WHERE code = new_code;
    EXIT WHEN exists = 0;
  END LOOP;
  INSERT INTO license_codes (code, status, recipient, created_by) VALUES (new_code, 'active', p_recipient, 'admin');
  INSERT INTO license_audit_log (license_code, action, detail) VALUES (new_code, 'CREATE', p_recipient);
  RETURN json_build_object('success', true, 'code', new_code);
END;
$$;

-- admin_revoke_code
CREATE FUNCTION admin_revoke_code(
  p_code TEXT,
  p_admin_key TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  UPDATE license_codes SET status = 'revoked' WHERE code = p_code;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'reason', 'invalid_code'); END IF;
  INSERT INTO license_audit_log (license_code, action) VALUES (p_code, 'REVOKE');
  RETURN json_build_object('success', true, 'reason', 'revoked');
END;
$$;

-- admin_list_codes
CREATE FUNCTION admin_list_codes(
  p_admin_key TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  result JSON;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
  INTO result FROM (
    SELECT id, code, status, recipient, created_by, used_by, used_at, device_info, created_at, expires_at, note
    FROM license_codes
  ) t;
  RETURN json_build_object('success', true, 'codes', result);
END;
$$;

-- admin_reactivate_code
CREATE FUNCTION admin_reactivate_code(
  p_code TEXT,
  p_admin_key TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  lic RECORD;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  SELECT * INTO lic FROM license_codes WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'reason', 'invalid_code'); END IF;
  IF lic.status = 'active' THEN RETURN json_build_object('success', false, 'reason', 'already_active'); END IF;
  UPDATE license_codes SET status = 'active' WHERE code = p_code;
  INSERT INTO license_audit_log (license_code, action, old_device, new_device) VALUES (p_code, 'REACTIVATE', lic.used_by, lic.used_by);
  RETURN json_build_object('success', true, 'reason', 'reactivated');
END;
$$;

-- admin_delete_unused_code
CREATE FUNCTION admin_delete_unused_code(
  p_code TEXT,
  p_admin_key TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  lic RECORD;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  SELECT * INTO lic FROM license_codes WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'reason', 'invalid_code'); END IF;
  IF lic.used_by IS NOT NULL THEN RETURN json_build_object('success', false, 'reason', 'already_used'); END IF;
  INSERT INTO license_audit_log (license_code, action) VALUES (p_code, 'DELETE');
  DELETE FROM license_codes WHERE code = p_code;
  RETURN json_build_object('success', true, 'reason', 'deleted');
END;
$$;

-- admin_batch_create_codes
CREATE FUNCTION admin_batch_create_codes(
  p_count INT,
  p_admin_key TEXT,
  p_recipient TEXT DEFAULT ''
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  ch TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  p1 TEXT; p2 TEXT; p3 TEXT; new_code TEXT; exists INT;
  result TEXT[] := '{}'; i INT;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  IF p_count < 1 OR p_count > 100 THEN
    RETURN json_build_object('success', false, 'reason', 'invalid_count');
  END IF;
  FOR i IN 1..p_count LOOP
    LOOP
      p1 := ''; FOR j IN 1..4 LOOP p1 := p1 || substr(ch, 1 + floor(random() * length(ch))::INT, 1); END LOOP;
      p2 := ''; FOR j IN 1..4 LOOP p2 := p2 || substr(ch, 1 + floor(random() * length(ch))::INT, 1); END LOOP;
      p3 := ''; FOR j IN 1..4 LOOP p3 := p3 || substr(ch, 1 + floor(random() * length(ch))::INT, 1); END LOOP;
      new_code := 'FULL-' || p1 || '-' || p2 || '-' || p3;
      SELECT COUNT(*) INTO exists FROM license_codes WHERE code = new_code;
      EXIT WHEN exists = 0;
    END LOOP;
    INSERT INTO license_codes (code, status, recipient, created_by) VALUES (new_code, 'active', p_recipient, 'admin');
    result := array_append(result, new_code);
  END LOOP;
  INSERT INTO license_audit_log (license_code, action, detail) VALUES (result[1], 'CREATE', 'Batch ' || p_count || ' codes');
  RETURN json_build_object('success', true, 'codes', result);
END;
$$;

-- admin_get_stats
CREATE FUNCTION admin_get_stats(
  p_admin_key TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  total INT; unused INT; used INT; revoked INT;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  SELECT COUNT(*) INTO total FROM license_codes;
  SELECT COUNT(*) INTO unused FROM license_codes WHERE used_by IS NULL;
  SELECT COUNT(*) INTO used FROM license_codes WHERE used_by IS NOT NULL;
  SELECT COUNT(*) INTO revoked FROM license_codes WHERE status = 'revoked';
  RETURN json_build_object('success', true, 'total', total, 'unused', unused, 'used', used, 'revoked', revoked);
END;
$$;

-- admin_get_audit_log
CREATE FUNCTION admin_get_audit_log(
  p_admin_key TEXT,
  p_limit INT DEFAULT 50
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  result JSON;
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
  INTO result FROM (
    SELECT id, license_code, action, admin_user, old_device, new_device, detail, created_at
    FROM license_audit_log LIMIT p_limit
  ) t;
  RETURN json_build_object('success', true, 'logs', result);
END;
$$;

-- admin_update_recipient
CREATE FUNCTION admin_update_recipient(
  p_code TEXT,
  p_recipient TEXT,
  p_admin_key TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  UPDATE license_codes SET recipient = p_recipient WHERE code = p_code;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'reason', 'invalid_code'); END IF;
  RETURN json_build_object('success', true, 'reason', 'updated');
END;
$$;
