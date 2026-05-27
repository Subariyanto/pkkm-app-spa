# PKKM App SPA

Aplikasi web Penilaian Kinerja Kepala Madrasah (PKKM) untuk Pengawas Madrasah / Pokjawas Kemenag.

**Live:** _belum di-deploy_

**Repo:** _belum di-init_

## Stack

- Vanilla JS SPA, hash routing
- Bootstrap 5 + Bootstrap Icons (CDN)
- ExcelJS (CDN) untuk export rekap
- localStorage (key prefix `pkkm_v1_`)
- PWA: manifest.json, sw.js (network-first untuk app shell)

## Struktur Data

5 komponen penilaian, masing-masing punya beberapa aspek (skor 1-4):

1. **Pengembangan Madrasah** (PM) - 6 aspek
2. **Pelaksanaan Tugas Manajerial** (MJ) - 8 aspek
3. **Pengembangan Kewirausahaan** (KW) - 5 aspek
4. **Supervisi Guru & Tendik** (SP) - 5 aspek
5. **Hasil Kinerja Kepala Madrasah** (HK) - 6 aspek

**Skor:** 1 (Kurang), 2 (Cukup), 3 (Baik), 4 (Amat Baik).

**Rumus:**
- Nilai komponen = (Σskor / Σmaks) × 100
- Nilai akhir = Σ(nilai komponen × bobot) / Σbobot

**Sebutan akhir:**
- > 90 Amat Baik
- > 75 Baik
- > 60 Cukup
- > 50 Sedang
- ≤ 50 Kurang

Bobot komponen default 20% × 5; bisa diubah di menu **Pengaturan**.

## Modul

- Beranda - dashboard ringkas
- Kepala Madrasah - CRUD data kamad binaan
- Penilaian - pilih periode + kamad → form skoring per aspek
- Rekap - tabel nilai per kamad per periode + Export Excel
- Cetak - laporan A4 siap TTD pengawas + ketua pokjawas
- Instrumen - viewer instrumen lengkap
- Backup - export/import JSON, wipe data
- Pengaturan - bobot komponen + identitas TTD

## Cara Pakai Lokal

```powershell
cd C:\Users\subar\.openclaw\workspace\pkkm-app-spa
node generate-icons.js          # buat icon-192/512.png (sekali saja)
# Buka index.html via server lokal (mis: vscode Live Server) atau:
python -m http.server 8080
# lalu buka http://localhost:8080
```

Service worker hanya aktif via `http(s)://`, tidak via `file://`.

## Catatan

- Data per-device. Pindah device → Backup → Restore manual.
- Sprint 1: CRUD + skoring + rekap + cetak (selesai).
- Sprint 2 (todo): upload bukti dukung, import xlsm, integrasi rata-rata PKG.
- Sprint 3 (todo): multi-periode lintas tahun, rekap KKMA.
