# LAPORAN MODERNISASI INSTRUMEN PKKM MI/MTs/MA (Opsi C)

Tanggal: 22 Sep 2026
Basis audit: `AUDIT-PKKM-MI-MTs-MA.md`
Hasil: **108 indikator dimodernisasi + rubrik 4–3–2–1**, struktur tidak berubah.

---

## A. Prinsip yang dipegang
- Struktur & bobot **tidak diubah**: 5 komponen (PM/MJ/KW/SP/HK), 29 aspek, 108 indikator, bobot 20%×5, skala 1–4.
- ID indikator **dipertahankan** (`PM_1.1_1` … `HK_5.4_7`) → data penilaian lama tetap aman.
- Key localStorage tetap `pkkm_v1_*`. Tidak ada migrasi.
- Instrumen **RA tidak disentuh** (tetap dataset terpisah `PKKM_INSTRUMEN_RA_*`).

## B. File perubahan
| File | Jenis | Isi |
|---|---|---|
| `instrumen-mi-v3.js` | **BARU** (126 KB) | Dataset v3: 5 komponen/29 aspek/108 indikator + `penggalian` + `rubrik` |
| `index.html` | ubah | Tambah `<script src="instrumen-mi-v3.js">`; bump cache `instrumen.js?v=…c`, `app.js?v=…c` |
| `sw.js` | ubah | `CACHE_VERSION = 'pkkm-v20-2026-09-22-instrumen-mi-v3'`; daftarkan file v3 |
| `AUDIT-PKKM-MI-MTs-MA.md` | baru | Laporan audit awal |
| `_gen/SPEC-MODERNISASI.md` | baru | Spec penulisan (aturan modernisasi) |

`_gen/assemble.js` merakit 6 chunk (`OUT_E1…E5`, `OUT_C.json`) → `instrumen-mi-v3.js`, dengan validasi otomatis.

## C. Modernisasi istilah usang
| Lama | Baru |
|---|---|
| KTSP | Kurikulum Madrasah (KM) / kurikulum operasional |
| KKM | KKTP (kriteria ketercapaian tujuan pembelajaran) |
| UN / Ujian Nasional | Asesmen Nasional (AN) / Asesmen Madrasah (AM) |
| PAS / PAT | asesmen formatif & sumatif |
| silabus | perangkat ajar / modul ajar |
| RPP | modul ajar (RPP disebut sebagai padanan dalam tanda kurung) |
| "8 SNP" tunggal | SNP disandingkan SPMI / Rapor Mutu |

Sisa "RPP" hanya 2× dan selalu sebagai padanan "modul ajar (RPP)" — dipertahankan sengaja.

## D. Dimensi baru yang disisipkan
Panca Cinta · pembelajaran mendalam (berkesadaran–bermakna–menggembirakan) · pembelajaran berpusat pada murid ·
tata kelola berbasis data · kemitraan orang tua · lingkungan aman-inklusif · moderasi beragama & penguatan karakter ·
literasi–numerasi/AKM · kepemimpinan transformasional.

## E. Rubrik 1–4
Seluruh **108 indikator** punya rubrik lengkap, dengan rantai logika:
**Perencanaan → Implementasi → Evaluasi/Refleksi → Tindak Lanjut → Dampak**
- 1 Kurang · 2 Cukup · 3 Baik · 4 Amat Baik.

## F. Manajemen regresi / kompatibilitas
`instrumen-mi-v3.js` meng-override: `PKKM_INSTRUMEN_PENGAWAS`, `PKKM_INSTRUMEN_GTK`, `PKKM_KOMPONEN`, `PKKM_TOTAL_INDIKATOR`.
`getInstrumenByJenjang()` tetap mengembalikan dataset RA untuk jenjang RA, sehingga MI/MTs/MA memakai v3 dan RA tetap utuh.

## G. Uji
Headless (`_mi_v3_test.js`, stub localStorage + vm): **30 PASS, 0 FAIL**
- struktur 108/29/5; ID identik versi lama; rubrik 108/108; penggalian 108/108
- tidak ada KTSP/KKM/UN/PAS/PAT/silabus; ada Kurikulum Madrasah, KKTP, dimensi baru
- RA tetap 29 indikator & tidak memakai redaksi v3; MI tidak memuat istilah RA
- nilai akhir MI (skor 3) = 75.00; detail komponen tahunan = 4 (HK di-skip)
- key `pkkm_v1_*` tetap

Regresi RA (`_ra_test.js`): **19 PASS, 0 FAIL** (tidak ada yang rusak).

Syntax check `node --check`: 8/8 file OK.

## H. Deploy
- Repo: **app-ry/pkkm-app-spa** (branch `gh-pages`), build Pages status **built**.
- Live: `https://app-ry.github.io/pkkm-app-spa/` dan `http://pkkm.pokjawasjember.com/`.
- Verifikasi live: `index.html` memuat `instrumen-mi-v3.js?v=20260922a`; `sw.js` = `pkkm-v20-2026-09-22-instrumen-mi-v3`.

## I. Catatan / TODO
- **HTTPS belum aktif** — sertifikat masih `authorization_created`. Penyebab: CNAME DNS masih `subariyanto.github.io`.
  Perlu diubah di Domainesia: `pkkm` → `app-ry.github.io`. Pemantauan otomatis sudah berjalan dan akan mengabari saat HTTPS 200.
- Instrumen **MAK** belum ditambahkan (fase terpisah).
- Belum diuji di browser asli oleh pengguna (baru headless).

## J. Rekomendasi lanjutan
- Uji manual di browser: buka menu **Instrumen** untuk jenjang MI/MTs/MA, cek modal ⓘ memuat Fokus Penggalian + Data + Bukti + Rubrik 4-3-2-1.
- Jika disetujui, pola yang sama bisa dipakai untuk MAK.
