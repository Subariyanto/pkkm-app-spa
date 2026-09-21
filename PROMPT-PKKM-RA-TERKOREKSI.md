# PROMPT OPENCLAW — PENAMBAHAN INSTRUMEN PKKM KHUSUS KEPALA RA

## Aplikasi PKKM SPA (versi terkoreksi, 22 Sep 2026)

Aplikasi yang direvisi: **https://subariyanto.github.io/pkkm-app-spa/**
Repositori lokal: `C:\Users\subar\.openclaw\workspace\pkkm-app-spa`

Tujuan: menambahkan **Instrumen Penilaian Kinerja Kepala RA** ke aplikasi PKKM yang sudah ada,
tanpa mengubah instrumen MI/MTs/MA dan tanpa mengubah data existing.

---

## 0. RINGKASAN HASIL AUDIT APLIKASI EXISTING (WAJIB DIBACA SEBELUM EKSEKUSI)

Berdasarkan audit source, kondisi existing adalah:

| Aspek | Kondisi existing | Implikasi |
|---|---|---|
| Skala skor | **1–4** (1 Kurang … 4 Amat Baik) | Rubrik 1–4 dipakai langsung; bobot 20% tidak diubah |
| Field `jenjang` | **Sudah ada**; daftar `['MI','MTs','MA','RA']` | Tidak perlu migrasi field; RA sudah terdaftar |
| Penyimpanan | `localStorage`, key `pkkm_v1_*` | Key **tidak boleh** diubah/ditambah jenjang |
| Supabase | **Tidak dipakai** (100% lokal) | Larangan "jangan ubah Supabase" aman & tidak relevan |
| Struktur instrumen | `PM/MJ/KW/SP/HK` → `aspek` → `indikator` | Pola komponen RA **cocok** (7-10-5-3-4 sub-aspek) |
| ID indikator | `PM_1.1_1` (komponen_aspek_indikator) | **Pertahankan pola ini** untuk RA (lihat §20) |
| Komponen 5 (HK) | Otomatis di-skip bila `periode.type !== 'tahun_4'` | Perilaku tahunan/4-tahunan sudah benar |
| Varian lama RA | `PKKM_RA_VARIAN` + `PKKM_RA_SKIP` (tambal sulam) | **Harus dinonaktifkan** saat mode RA (§5) |
| Popup ⓘ | `openPenggalianModal()` sudah ada (field `data`, `bukti`) | Perlu ditambah blok rubrik (§14) |
| Service worker | `sw.js` dengan `CACHE_VERSION` | Wajib naikkan versi setelah deploy (§31) |

### Kerangka regulasi (berlapis — dikonfirmasi Pemilik, 22 Sep 2026)

**A. Dasar formal PKKM (struktur penilaian tetap):**
- PMA Nomor 58 Tahun 2017 tentang Kepala Madrasah, sebagaimana diubah dengan **PMA Nomor 24 Tahun 2018**.
- **Keputusan Dirjen Pendis Nomor 1111 Tahun 2019** tentang Juknis Penilaian Kinerja Kepala Madrasah.
  → Rujukan struktur: 4 komponen tahunan + komponen Hasil Kinerja untuk penilaian 4 tahunan.
  Praktik PKKM Kemenag s.d. 2025 masih memakai Kepdirjen 1111/2019 ini.

**B. Isi kurikulum & istilah terbaru madrasah/RA (modernisasi indikator):**
- **KMA Nomor 1503 Tahun 2025** — perubahan atas KMA 450/2024 tentang Pedoman Implementasi
  Kurikulum pada RA, MI, MTs, MA, dan MAK. Dasar penggantian istilah lama (KTSP → **Kurikulum
  Madrasah/KM**) dan penyesuaian indikator pembelajaran. Status JDIH Kemenag: berlaku.

**C. Kurikulum Berbasis Cinta (Panca Cinta):**
- **Keputusan Dirjen Pendidikan Islam Nomor 6077 Tahun 2025** tentang Panduan Kurikulum Berbasis
  Cinta → dasar masuknya **Panca Cinta** ke indikator Kepala RA & Kepala Madrasah.

**D. Kompetensi terbaru kepala satuan pendidikan:**
- **Permendikdasmen Nomor 21 Tahun 2025** tentang Standar Tenaga Kependidikan.
  → Pasal 14 memperbarui arah kompetensi kepala satuan pendidikan: kepribadian, sosial, dan
  profesional, termasuk kepemimpinan kurikulum, pembelajaran berpusat pada murid, tata kelola
  berbasis data, kemitraan orang tua, lingkungan aman-inklusif, inovasi, kewirausahaan, dan
  kepemimpinan transformasional.

**E. Karakter khusus RA/PAUD (standar nasional terbaru):**
- **Permendikdasmen 10/2025** — Standar Kompetensi Lulusan.
- **Permendikdasmen 12/2025** — Standar Isi.
- **Permendikdasmen 26/2025** — Standar Pengelolaan.
- **Permendikdasmen 1/2026** — Standar Proses (menggantikan Permendikbudristek 16/2022;
  berlaku untuk PAUD, pendidikan dasar, dan menengah).

**Prinsip penerapan:** kerangka resmi penilaian tetap dari **Kepdirjen 1111/2019**
(struktur & bobot komponen tidak diubah), sedangkan **isi indikator dimodernisasi** berdasarkan
regulasi 2025–2026 di atas, khususnya untuk konteks RA (Panca Cinta, KM/KOP RA, pembelajaran
berpusat pada anak, standar proses PAUD terbaru).

> Catatan: **STPPA** tetap dipakai sebagai istilah capaian perkembangan anak (bukan "STPPD").
> Jangan mencantumkan nomor regulasi yang tidak ada pada daftar di atas tanpa konfirmasi Pemilik.

---

## 1. PRINSIP PENGEMBANGAN

Jangan membuat ulang aplikasi. Jangan mengubah:
sistem login, kode aktivasi, backup/restore, data penilaian existing, formula rekap,
routing Tahunan/4 Tahunan, cetak, ekspor, dan menu yang sudah berfungsi —
kecuali bagian yang memang diperlukan untuk menambahkan jenjang RA.
Modifikasi sekecil mungkin.

## 2. BACKUP SEBELUM MODIFIKASI

1. `git commit` / salin folder `pkkm-app-spa` ke `_backup_pkkm_<tanggal>` sebelum menyentuh source.
2. Jangan hapus data, jangan ganti key penyimpanan existing (`pkkm_v1_kamad`, `pkkm_v1_periode`,
   `pkkm_v1_penilaian`, `pkkm_v1_skor`, `pkkm_v1_meta`, `pkkm_v1_instrumen_overrides`, `pkkm_v2_pkb`).

## 3. PILIHAN JENJANG

Field `jenjang` **sudah ada**. Pastikan pilihan mencakup: `RA`, `MI`, `MTs`, `MA`.
Kode internal RA = `RA` (jangan `TK`, `PAUD`, atau `RA/TK`).
**MAK belum ditambahkan pada tahap ini** — penambahan MAK dilakukan sebagai tahap terpisah
agar tidak mengganggu data lama.

## 4. NOMENKLATUR OTOMATIS

Jika `jenjang === 'RA'`, gunakan istilah **Kepala RA** (bukan "Kepala Madrasah") pada bagian yang
berkaitan langsung dengan objek penilaian.

**Scope yang WAJIB disesuaikan (prioritas):**
- judul & header halaman Penilaian, Rekap, Cetak/Laporan;
- identitas pada kartu Data Kepala;
- judul dokumen cetak (§23).

**Scope sekunder (boleh disesuaikan bila aman):** label menu, badge dashboard, footer.

Nama aplikasi tetap **PKKM**. Tidak perlu aplikasi terpisah.
Gunakan helper tunggal, mis. `sebutanKepala(jenjang)` → `'Kepala RA' | 'Kepala Madrasah'`,
agar tidak ada string tersebar di banyak tempat.

## 5. LOGIKA PEMILIHAN INSTRUMEN

Buat dataset terpisah dan fungsi pemilih berbasis jenjang **dan role**:

```javascript
window.PKKM_INSTRUMEN_RA_PENGAWAS = [ /* 29 sub-aspek, 1 indikator/sub-aspek */ ];
window.PKKM_INSTRUMEN_RA_GTK      = [ /* versi RA untuk guru/tendik/komite — §6b */ ];

window.getInstrumenByJenjang = function (jenjang, role) {
  if (jenjang === 'RA') {
    return (role === 'gtk') ? window.PKKM_INSTRUMEN_RA_GTK : window.PKKM_INSTRUMEN_RA_PENGAWAS;
  }
  return (role === 'gtk') ? window.PKKM_INSTRUMEN_GTK : window.PKKM_INSTRUMEN_PENGAWAS;
};
```

- Integrasikan ke `setInstrumenRole()` dan ke jalur render penilaian.
- **Jangan menduplikasi fungsi render.** Yang berbeda cukup DATASET.
- **NONAKTIFKAN jalur varian lama saat mode RA:** `PKKM_RA_VARIAN` dan `PKKM_RA_SKIP`
  tidak boleh ikut diterapkan ketika instrumen RA baru aktif (cegah dobel-handle).
  `getIndikatorTampil()` harus berhenti memakai varian RA lama untuk jenjang RA.

## 6. JENIS PENILAIAN

- **Tahunan** (Tahun 1/2/3, formatif, sumatif): Komponen 1–4 saja. Komponen 5 tidak tampil.
- **4 Tahunan** (Tahun ke-4): Komponen 1–5.
- Pertahankan logika periode existing (Komponen 5 sudah otomatis di-skip; jangan ubah).

## 6b. INSTRUMEN GTK/KOMITE UNTUK RA (keputusan Pemilik)

Agar penilaian 4-tahunan RA konsisten, instrumen Guru/Tendik & Komite **juga dibuat versi RA**
(`PKKM_INSTRUMEN_RA_GTK`), dengan penyesuaian redaksi setara: hilangkan UN/laboratorium/KKM/
UH/PTS/PAS/PAT/ranking, ganti dengan perkembangan anak, asesmen autentik, pembelajaran berbasis
bermain, perlindungan & kesejahteraan anak, kemitraan orang tua, Panca Cinta.
Struktur, jumlah aspek, dan bobot role tetap sama dengan instrumen GTK existing.

## 7. SKALA PENILAIAN

Skala existing **1–4** → pakai rubrik 1–4 langsung.
Jangan mengubah bobot komponen maupun bobot role hanya karena menambahkan RA.

## 8. STRUKTUR DATA SETIAP INDIKATOR

Sesuaikan dengan struktur existing, perkaya dengan `rubrik`:

```javascript
{
  no: 1,                       // nomor indikator dalam aspek
  indikator: "...",
  data: "...",                 // "Data Yang Diharapkan"
  bukti: "...",                // narasi sumber/bukti + cara penggalian
  rubrik: { 4: "...", 3: "...", 2: "...", 1: "..." },
  penggalian: "..."            // narasi fokus penggalian data
}
```

Struktur komponen/aspek tetap mengikuti pola existing (`code`, `no`, `label`, `aspek[{kode,no,unsur,indikator[]}]`).

## 9–13. DATASET INSTRUMEN RA

Gunakan substansi rubrik yang sudah disusun Pemilik, dirapikan ke struktur §8.
**29 sub-aspek total** (1 indikator per sub-aspek):

- **K1 Usaha Pengembangan RA** — PM: 1.1 … 1.7 (7)
- **K2 Tugas Manajerial Kepala RA** — MJ: 2.1 … 2.10 (10)
- **K3 Kewirausahaan & Inovasi** — KW: 3.1 … 3.5 (5)
- **K4 Supervisi Pembelajaran RA** — SP: 4.1 … 4.3 (3)
- **K5 Hasil Kinerja Kepala RA** — HK: 5.1 … 5.4 (4) — hanya 4-tahunan

Setiap sub-aspek wajib memuat: Indikator, Catatan Penggalian Data, Sumber/Bukti, dan Rubrik 4/3/2/1.

## 14. POPUP CATATAN PENGGALIAN DATA

Pertahankan tombol **ⓘ Catatan Penggalian Data** → `openPenggalianModal()`.
Kembangkan isi modal menjadi 3 blok:

1. **Fokus yang Digali** — narasi `penggalian`.
2. **Sumber/Bukti yang Dapat Digunakan** — `data` + `bukti`.
3. **Rubrik Skor** — 4 = Sangat Baik, 3 = Baik, 2 = Cukup, 1 = Kurang (deskripsi per indikator).

Catatan tetap (tampilkan di dalam modal):

> **Bukti tidak harus seluruhnya tersedia. Penilai menggunakan sumber bukti yang relevan dan
> melakukan triangulasi melalui dokumen, observasi, wawancara/konfirmasi serta data hasil.
> Kelengkapan dokumen bukan satu-satunya dasar pemberian skor.**

Tombol **Tutup**. Modal responsif, dapat di-scroll di HP, tombol selalu terjangkau.

## 15. RUBRIK SKOR

Saat skor dipilih, tampilkan deskripsi rubrik (popup/tooltip) — minimal dapat diakses lewat
tombol ⓘ. Jangan hanya menampilkan angka tanpa penjelasan bila struktur memungkinkan.

## 16. CATATAN PENILAI & RTL

Gunakan field existing (**Catatan Penilai** dan **Rekomendasi / Rencana Tindak Lanjut**).
Jangan membuat duplikasi field.

## 17. ISTILAH YANG DILARANG (DATASET RA)

Sebagai istilah utama wajib RA: `KTSP`, `KOSP`, `KKM`, `UH`, `PTS`, `PAS`, `PAT`, `ranking`,
pembelajaran klasikal sebagai kondisi ideal, prestasi akademik sebagai satu-satunya keberhasilan,
`Microsoft Office` sebagai ukuran kompetensi digital, jumlah sertifikat sebagai ukuran otomatis,
kantin/koperasi sebagai syarat kewirausahaan.

## 18. ISTILAH YANG DIGUNAKAN (RA)

Kurikulum Madrasah (KM) RA / KOP RA · anak · perkembangan anak · pengalaman belajar ·
bermain-belajar · pembelajaran berbasis bermain · asesmen autentik · catatan perkembangan ·
lingkungan bermain dan belajar · APE · interaksi guru-anak · kemitraan orang tua ·
perlindungan anak · kesejahteraan anak · **Panca Cinta** · **Pembelajaran Mendalam** ·
**berkesadaran, bermakna, menggembirakan** · **STPPA** (Standar Tingkat Pencapaian Perkembangan Anak).

## 19. MIGRASI DATA

Data lama tidak boleh hilang. Field `jenjang` sudah ada → tidak perlu migrasi struktur.
Jangan otomatis mengubah data lama menjadi RA. Jangan ubah ID periode/kepala/hasil/skor/key.

## 20. ID INDIKATOR (KOREKSI PENTING)

**JANGAN memakai prefix `RA-1.1`.** Pertahankan pola existing `PM_1.1_1`, `MJ_2.1_1`, dst.
Alasan: skor disimpan per `penilaian_id`, dan setiap penilaian terikat pada `kamad_id`
(yang memuat `jenjang`). RA dan MI memiliki kamad berbeda → skor sudah otomatis terpisah.
Prefix `RA-` justru akan merusak mapping laporan/Excel/tren/agregasi yang sudah memakai pola existing.

## 21. PENYIMPANAN SKOR (KOREKSI PENTING)

**JANGAN** menambahkan `jenjang` ke key skor atau memigrasikan struktur `pkkm_v1_skor`.
Pemisahan skor antar-jenjang sudah dijamin oleh `(kamad_id → jenjang) + periode_id + penilaian_id`.
Tidak ada risiko "skor 1.1 RA menimpa 1.1 MI" selama penilaian RA dibuat pada kamad berjenjang RA.

## 22. GANTI JENJANG

Bila pengguna mengubah jenjang kamad yang sudah memiliki penilaian, **jangan reset data**.
Tampilkan konfirmasi:

> **Perubahan jenjang akan menggunakan instrumen yang berbeda. Data penilaian pada jenjang
> sebelumnya tetap disimpan. Lanjutkan?**

## 23. CETAK HASIL

Jika jenjang = RA: judul cetak **PENILAIAN KINERJA KEPALA RA**
(tahunan → "Penilaian Tahunan"; 4 tahunan → "Penilaian 4 Tahunan").
Tampilkan: identitas Kepala RA, nama RA, NSM/NPSN (bila ada), periode, komponen, indikator,
skor, catatan, rekomendasi/RTL, rekap. Hindari istilah "Kepala Madrasah" untuk objek RA.

## 24. REKAP

Pertahankan formula existing.
Tahunan RA: Komponen 1–4. 4 Tahunan RA: Komponen 1–5.
Jangan mencampur Komponen 5 ke hasil tahunan.

## 25. DASHBOARD

Tambahkan badge **RA** pada data kepala yang dinilai (mis. `Kepala RA · RA Al-Hikmah [RA]`).
Tanpa perubahan desain besar.

## 26. RESPONSIVE

Uji desktop, tablet, smartphone: indikator mudah dibaca, pilihan skor mudah ditekan,
popup tidak terpotong, modal dapat di-scroll, tombol Tutup terjangkau.

## 27. PENCARIAN GLOBAL SOURCE (SETELAH IMPLEMENTASI)

Cari pada **dataset RA saja**: `KTSP`, `KOSP`, `KKM`, `UH`, `PTS`, `PAS`, `PAT`, `ranking`,
`Microsoft Office`, `koperasi`, `kantin`. Pastikan tidak muncul sebagai indikator wajib RA
(kecuali konteks historis yang tak dapat dihapus).

## 28. JANGAN UBAH DATASET JENJANG LAIN

Jangan merevisi indikator MI/MTs/MA (dan tidak menambah MAK) pada tahap ini.

## 29. PENGUJIAN WAJIB (TEST 1–15)

1. Data Kepala RA + jenjang RA → instrumen RA tampil.
2. Data Kepala MI → instrumen RA tidak tampil.
3. MTs → instrumen MTs existing tetap tampil.
4. MA → instrumen MA existing tetap tampil.
5. RA + Tahunan → hanya Komponen 1–4.
6. RA + 4 Tahunan → Komponen 1–5.
7. Klik ⓘ → popup penggalian data muncul (Fokus + Bukti + Rubrik).
8. Nilai indikator RA → simpan → reload → tetap tersimpan.
9. Nilai RA 1.1 tidak mengubah 1.1 pada data MI.
10. Catatan Penilai + RTL → reload → tetap tersimpan.
11. Cetak Kepala RA → judul/instrumen/skor/rekap benar, tanpa istilah terlarang.
12. Navigasi Dashboard → Data Kepala → Penilaian RA → Rekap → kembali → data utuh.
13. Buka di smartphone → nyaman.
14. Data PKKM lama tetap tersedia.
15. Backup & Restore → data RA ikut & dapat dipulihkan.

## 30. VALIDASI AKHIR

Syntax error; console browser bersih; tidak ada `undefined/null` akibat `jenjang`;
data existing kompatibel; instrumen RA tidak muncul untuk jenjang lain;
Komponen 5 tidak muncul di tahunan; semua popup berfungsi; scoring & rekap utuh;
cetak berjalan; backup/restore mengenali data RA.

## 31. CACHE / SERVICE WORKER

Naikkan `CACHE_VERSION` di `sw.js` setelah implementasi. Jangan hapus mekanisme PWA existing.

## 32. LAPORAN HASIL

Sajikan: **A** File yang diubah · **B** Dataset yang ditambahkan · **C** Sistem pemilihan jenjang ·
**D** Penyimpanan (jelaskan pemisahan RA vs jenjang lain) · **E** Konfirmasi Tahunan (K1–4) ·
**F** Konfirmasi 4 Tahunan (K1–5) · **G** Popup · **H** Cetak (nomenklatur Kepala RA) ·
**I** Backup/Restore · **J** Hasil TEST 1–15 dengan status `PASS`/`FAIL`.

## 33. PRINSIP TERPENTING

Instrumen RA **bukan** salinan instrumen MI berganti nama jenjang. Karakter RA harus menonjolkan:
kepemimpinan pembelajaran AUD, pembelajaran berbasis bermain, perkembangan & kebutuhan anak,
interaksi guru-anak, asesmen autentik, lingkungan bermain-belajar, perlindungan & kesejahteraan anak,
kemitraan keluarga, KM/KOP RA, Pembelajaran Mendalam, Panca Cinta, peningkatan kompetensi guru,
refleksi, inovasi, dan dampak kepemimpinan.

> **Jangan menilai ketebalan administrasi. Nilailah kualitas praktik, konsistensi, refleksi,
> tindak lanjut dan dampaknya terhadap anak, guru serta mutu RA.**

## 34. BATAS PEKERJAAN

Setelah instrumen RA selesai dan seluruh test lulus: **BERHENTI.**
Jangan mengubah instrumen MI/MTs/MA, sistem aktivasi, atau menambah fitur di luar permintaan.
Sajikan laporan hasil implementasi dan pengujian.

---

## LAMPIRAN — RINGKASAN 6 KOREKSI DARI PROMPT ASLI

1. **§20** — ID indikator: pakai pola existing `PM_1.1_1`, bukan `RA-1.1`.
2. **§21** — Jangan tambah `jenjang` ke key skor / jangan migrasi `pkkm_v1_skor`.
3. **§5** — Wajib nonaktifkan `PKKM_RA_VARIAN` + `PKKM_RA_SKIP` lama saat mode RA.
4. **§14** — Field `rubrik` baru → modal diperluas (Fokus + Bukti + Rubrik + disclaimer).
5. **§3** — MAK tidak ditambahkan pada tahap ini.
6. **§4/§23** — Nomenklatur "Kepala RA" dibatasi scope-nya; prioritas cetak/laporan/header.
7. **§6b** — Instrumen GTK/Komite juga dibuatkan versi RA (keputusan Pemilik).
8. **Regulasi** — pakai STPPA (bukan STPPD), KM/KOP RA, Panca Cinta & Pembelajaran Mendalam;
   nomor Juknis resmi menunggu konfirmasi Pemilik.
