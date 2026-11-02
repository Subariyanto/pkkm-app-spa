-- ============================================================
-- PKKM FIX MIGRATION — Bug kode aktivasi panjang tidak konsisten
-- Jalankan di Supabase SQL Editor
--
-- MASALAH:
--   Fungsi admin_batch_create_codes memakai:
--     p1 := p1 || substr(ch, 1 + floor(random()*length(ch))::INT, 1);
--   substr(text, start, 1) mengembalikan '' bila start > length(ch).
--   Karena random() bisa ~1.0, start bisa jadi 33 pada ch sepanjang 32
--   => satu karakter blok hilang => kode jadi 18 atau 17 karakter.
--   Contoh rusak: PKKM-MNPQ-KLMN-9, PKKM-89-WXYZ-3456
--
-- PERBAIKAN:
--   1. Pakai indexing array ch[n] (tidak pernah menghasilkan '')
--   2. Loop ulang sampai length(new_code) = 19
--   3. Guard validasi format sebelum INSERT
--   4. Tandai kode cacat yang sudah terbit sebagai 'invalid' (bukan dihapus,
--      supaya audit trail tetap utuh)
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. GENERATOR BERSIH
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS admin_batch_create_codes(INT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_batch_create_codes(INT, TEXT, TEXT, TEXT);

CREATE FUNCTION admin_batch_create_codes(
  p_count INT,
  p_admin_key TEXT,
  p_recipient TEXT DEFAULT ''
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ADMIN_HASH TEXT := '3f235be78e11ac88393a6c2024cf023e220bd097abbb70638a529f7f4c164803';
  ch TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  p1 TEXT; p2 TEXT; p3 TEXT; new_code TEXT;
  exists INT; i INT; j INT; attempt INT;
  result TEXT[] := '{}';
BEGIN
  IF encode(digest(p_admin_key, 'sha256'), 'hex') <> ADMIN_HASH THEN
    RETURN json_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  IF p_count IS NULL OR p_count < 1 OR p_count > 100 THEN
    RETURN json_build_object('success', false, 'reason', 'invalid_count');
  END IF;

  FOR i IN 1..p_count LOOP
    attempt := 0;
    LOOP
      attempt := attempt + 1;
      IF attempt > 50 THEN
        RAISE EXCEPTION 'Gagal generate kode unik setelah 50 percobaan';
      END IF;

      p1 := ''; FOR j IN 1..4 LOOP p1 := p1 || ch[1 + floor(random() * length(ch))::INT]; END LOOP;
      p2 := ''; FOR j IN 1..4 LOOP p2 := p2 || ch[1 + floor(random() * length(ch))::INT]; END LOOP;
      p3 := ''; FOR j IN 1..4 LOOP p3 := p3 || ch[1 + floor(random() * length(ch))::INT]; END LOOP;

      new_code := 'PKKM-' || p1 || '-' || p2 || '-' || p3;

      -- guard: format harus persis 19 karakter
      EXIT WHEN length(new_code) = 19
                AND p1 ~ '^[A-Z2-9]{4}$'
                AND p2 ~ '^[A-Z2-9]{4}$'
                AND p3 ~ '^[A-Z2-9]{4}$'
                AND NOT EXISTS (SELECT 1 FROM license_codes WHERE code = new_code);
    END LOOP;

    INSERT INTO license_codes (code, status, recipient, created_by)
    VALUES (new_code, 'active', p_recipient, 'admin');

    result := array_append(result, new_code);
  END LOOP;

  INSERT INTO license_audit_log (license_code, action, detail)
  VALUES (result[1], 'CREATE', 'Batch ' || p_count || ' codes'
          || CASE WHEN p_recipient <> '' THEN ' | ' || p_recipient ELSE '' END);

  RETURN json_build_object('success', true, 'codes', result);
END;
$$;

-- ------------------------------------------------------------
-- 2. SINGLE GENERATOR — samakan prefix & guard
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS admin_generate_code(TEXT, TEXT);

CREATE FUNCTION admin_generate_code(
  p_admin_key TEXT,
  p_recipient TEXT DEFAULT ''
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r JSON;
BEGIN
  r := admin_batch_create_codes(1, p_admin_key, p_recipient);
  IF (r->>'success')::BOOLEAN THEN
    RETURN json_build_object('success', true, 'code', r->'codes'->>0);
  END IF;
  RETURN r;
END;
$$;

-- ------------------------------------------------------------
-- 3. TANDAI KODE CACAT YANG SUDAH TERBIT
--    Kode yang belum dipakai DAN panjangnya bukan 19 => status 'invalid'
--    Kode yang sudah dipakai dibiarkan (jangan putus lisensi aktif)
-- ------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT code FROM license_codes
    WHERE used_by IS NULL
      AND (code NOT LIKE 'PKKM-%' OR length(code) <> 19)
  LOOP
    UPDATE license_codes SET status = 'invalid' WHERE code = r.code;
    INSERT INTO license_audit_log (license_code, action, detail)
    VALUES (r.code, 'MARK_INVALID', 'Panjang/format tidak valid (bug substr generator)');
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 4. OPSIONAL: hapus permanen kode invalid yang belum dipakai
--    (buka blok ini kalau yakin tidak perlu jejak audit)
-- ------------------------------------------------------------
-- DELETE FROM license_codes
-- WHERE used_by IS NULL AND (code NOT LIKE 'PKKM-%' OR length(code) <> 19);

COMMIT;

-- ------------------------------------------------------------
-- 5. VERIFIKASI
-- ------------------------------------------------------------
SELECT length(code) AS panjang,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE used_by IS NULL) AS belum_dipakai,
       COUNT(*) FILTER (WHERE used_by IS NOT NULL) AS sudah_dipakai
FROM license_codes
GROUP BY length(code)
ORDER BY panjang;
