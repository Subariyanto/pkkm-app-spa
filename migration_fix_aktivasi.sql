-- ============================================================
-- PKKM FIX MIGRATION — Perbaikan bug penerbitan kode aktivasi
-- Run ini di Supabase SQL Editor
-- 
-- Masalah:
-- 1. admin_batch_create_codes generate prefix 'PKKM-' sedangkan
--    admin_generate_code (single) generate 'FULL-'. Kode PKKM-
--    ditolak di frontend karena verifyActivationCode hanya cek 'FULL-'.
-- 2. RLS anon SELECT terbuka — semua kode (termasuk unused) bisa
--    di-fetch publik via REST API.
-- ============================================================

-- 1. FIX: Drop & recreate admin_batch_create_codes dengan prefix 'FULL-'
DROP FUNCTION IF EXISTS admin_batch_create_codes(INT, TEXT, TEXT);

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

-- 2. FIX: Update RLS policy — anon hanya bisa SELECT kode yang SUDAH dipakai
--    (untuk verifikasi). Kode yang belum dipakai tidak bisa di-fetch publik.
ALTER TABLE license_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_license_codes" ON license_codes;
CREATE POLICY "anon_select_license_codes"
  ON license_codes FOR SELECT TO anon USING (used_by IS NOT NULL);

-- 3. OPTIONAL: Rename kode lama berprefix 'PKKM-' yang belum dipakai menjadi 'FULL-'
--    (hanya yang belum pernah di-claim / used_by IS NULL)
DO $$
DECLARE r RECORD; new_code TEXT;
BEGIN
  FOR r IN SELECT code FROM license_codes WHERE code LIKE 'PKKM-%' AND used_by IS NULL LOOP
    new_code := 'FULL-' || substring(r.code FROM 6);
    -- Cek tabrakan
    IF NOT EXISTS (SELECT 1 FROM license_codes WHERE code = new_code) THEN
      UPDATE license_codes SET code = new_code WHERE code = r.code;
      INSERT INTO license_audit_log (license_code, action, detail) VALUES (new_code, 'MIGRATE_PREFIX', 'Renamed from ' || r.code);
    END IF;
  END LOOP;
END $$;

-- 4. VERIFY: Cek hasil
SELECT 
  prefix_left(code, 5) AS prefix, 
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE used_by IS NULL) AS unused,
  COUNT(*) FILTER (WHERE used_by IS NOT NULL) AS used
FROM license_codes 
GROUP BY prefix_left(code, 5)
ORDER BY prefix;
