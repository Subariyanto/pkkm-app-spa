-- SQL untuk Supabase SQL Editor
-- Buat tabel license_codes untuk PKKM cross-device license sync

CREATE TABLE IF NOT EXISTS license_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  recipient TEXT DEFAULT '',
  created_by TEXT DEFAULT 'admin',
  used_by TEXT,          -- device_id pengawas yang klaim
  used_at TIMESTAMPTZ,
  device_info TEXT DEFAULT '',
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_license_codes_code ON license_codes(code);
CREATE INDEX IF NOT EXISTS idx_license_codes_used_by ON license_codes(used_by);

-- Enable RLS
ALTER TABLE license_codes ENABLE ROW LEVEL SECURITY;

-- Policy: anon bisa SELECT (untuk validasi kode)
CREATE POLICY "anon_select_license_codes"
  ON license_codes FOR SELECT
  TO anon
  USING (true);

-- Policy: anon bisa INSERT (untuk generate kode oleh admin)
CREATE POLICY "anon_insert_license_codes"
  ON license_codes FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: anon bisa UPDATE (untuk claim kode & revoke)
CREATE POLICY "anon_update_license_codes"
  ON license_codes FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: anon bisa DELETE (jika perlu)
CREATE POLICY "anon_delete_license_codes"
  ON license_codes FOR DELETE
  TO anon
  USING (true);

-- Insert master code supaya bisa dipakai cross-device juga
INSERT INTO license_codes (code, recipient, created_by, revoked)
VALUES ('FULL-PKKM-POKJAWAS-2026', 'Master Code', 'system', false)
ON CONFLICT (code) DO NOTHING;
