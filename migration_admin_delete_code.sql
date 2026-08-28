-- ============================================================
-- MIGRATION: admin_delete_code (hapus kode APA PUN, termasuk terpakai)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Drop jika sudah ada (safe re-run)
DROP FUNCTION IF EXISTS admin_delete_code(TEXT, TEXT);

-- admin_delete_code — hapus kode permanen (baik sudah/belum terpakai)
CREATE FUNCTION admin_delete_code(
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
  IF NOT FOUND THEN 
    RETURN json_build_object('success', false, 'reason', 'invalid_code'); 
  END IF;
  
  -- Catat di audit log sebelum hapus
  INSERT INTO license_audit_log (license_code, action, old_device, detail) 
  VALUES (p_code, 'DELETE', lic.used_by, 'Permanently deleted via admin_delete_code');
  
  -- Hapus permanen
  DELETE FROM license_codes WHERE code = p_code;
  
  RETURN json_build_object('success', true, 'reason', 'deleted');
END;
$$;

-- Verifikasi
SELECT proname FROM pg_proc WHERE proname = 'admin_delete_code';
