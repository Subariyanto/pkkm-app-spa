# AUDIT INSTRUMEN PKKM MI/MTs/MA vs REGULASI 2025–2026

Tanggal: 22 Sep 2026
Objek: `instrumen.js` — `PKKM_INSTRUMEN_PENGAWAS` + `PKKM_INSTRUMEN_GTK`
cakupan: 5 komponen · 29 aspek · 108 indikator

> Catatan keterbatasan: `web_search`/`web_fetch` tidak tersedia saat audit ini, sehingga
> pemetaan regulasi mengacu pada kerangka berlapis yang dikonfirmasi Pemilik (22 Sep 2026).

---

## 1. KERANGKA & STRUKTUR — SESUAI (tidak perlu diubah)

| Item | Regulasi acuan | Kondisi instrumen | Verdict |
|---|---|---|---|
| 4 komponen tahunan + hasil kinerja 4-tahunan | Kepdirjen Pendis 1111/2019 (s/d 2025) | PM/MJ/KW/SP (tahunan) + HK (4-tahunan) | SESUAI |
| Jumlah aspek | 1111/2019 | 29 aspek | SESUAI |
| Jumlah indikator | 1111/2019 | 108 indikator | SESUAI |
| Bobot komponen | 1111/2019 | 20% × 5 | SESUAI |
| Skala skor | praktik PKKM | 1–4 (Kurang–Amat Baik) | SESUAI |
| Komponen HK hanya di 4-tahunan | 1111/2019 | auto-skip bila `periode.type !== 'tahun_4'` | SESUAI |

**Kesimpulan:** kerangka resmi masih benar. Struktur & bobot jangan diubah.

---

## 2. ISTILAH USANG — PERLU DIMODERNISASI

Basis: KMA 1503/2025 (perubahan KMA 450/2024) — KTSP ⇒ **Kurikulum Madrasah (KM)**.

| Istilah lama | Jumlah | Lokasi utama | Pengganti yang disarankan |
|---|---|---|---|
| KTSP | 8 | PM_1.4_1, MJ_2.7_1, MJ_2.7_2, dll | KM / Kurikulum Madrasah / KOP |
| KKM | 5 | MJ_2.3_1, PM (data+bukti) | kriteria ketercapaian tujuan pembelajaran (KKTP) |
| UN / Ujian Nasional | 6 | PM_1.2_1, PM_1.2_4, PM_1.1_1, MJ_2.3_1 | Asesmen Nasional (AN/AKM) & Asesmen Madrasah (AM) |
| PAS / PAT | 2 | PM_1.4_3 | asesmen formatif & sumatif |
| silabus | 2 | PM_1.4_2 | perangkat ajar / modul ajar |
| RPP | 10 | PM_1.4_2, MJ_2.7_4, KW_3.2_1 | modul ajar / RPP (KM: modul ajar) |
| 8 SNP (tunggal) | 14 | PM_1.4_*, MJ_2.1_1, MJ_2.9_4 | SNP + SPMI / Rapor Mutu (sandingkan) |

Indikator terflag lengkap (14):
- `PM_1.2_1` (UN) · `PM_1.2_3` (KTSP) · `PM_1.2_4` (UN)
- `PM_1.4_1` (KTSP, 8 SNP) · `PM_1.4_2` (8 SNP, silabus, RPP) · `PM_1.4_3` (PAS/PAT, 8 SNP) · `PM_1.4_4` (8 SNP)
- `MJ_2.1_1` (8 SNP) · `MJ_2.3_1` (KKM, UN) · `MJ_2.7_1` (KTSP) · `MJ_2.7_2` (KTSP) · `MJ_2.7_4` (RPP)
- `MJ_2.9_4` (8 SNP) · `KW_3.2_1` (RPP)

---

## 3. DIMENSI BARU — ABSEN (celah keselarasan)

Dibanding Permendikdasmen 21/2025 (Pasal 14) & Kepdirjen 6077/2025 (Panca Cinta):

| Dimensi | Kemunculan | Status |
|---|---|---|
| Panca Cinta | 0 | ABSEN |
| Pembelajaran mendalam (berkesadaran/bermakna/menggembirakan) | 0 | ABSEN |
| Kepemimpinan berpusat pada murid | 0 | ABSEN |
| Tata kelola berbasis data | 0 | ABSEN |
| Kepemimpinan transformasional | 0 | ABSEN |
| Lingkungan aman-inklusif | 0 (inklusif) | ABSEN |
| Moderasi beragama / penguatan karakter | 0 | ABSEN |
| Numerasi | 0 | ABSEN (literasi hanya 5) |
| AKM / Asesmen Nasional | 0 | ABSEN |
| Kemitraan orang tua | kemitraan 8 · orang tua 2 | LEMAH |

**Kesimpulan:** isi indikator belum modernisasi era KM/Panca Cinta; masih berorientasi
administratif-era KTSP (KKM/UN/PAS/PAT).

---

## 4. VERDICT

1. **Struktur/kerangka: SESUAI** — pertahankan (Kepdirjen 1111/2019).
2. **Redaksi & substansi: BELUM SEPENUHNYA SELARAS** dengan regulasi 2025–2026.
   - Istilah usang: KTSP, KKM, UN, PAS/PAT, silabus.
   - Dimensi baru hilang: Panca Cinta, pembelajaran mendalam, berpusat pada murid,
     tata kelola berbasis data, inklusif, numerasi, kemitraan orang tua.
3. **Rekomendasi:** modernisasi **isi indikator** (bukan struktur) — pola yang sama
   dengan pekerjaan RA: pertahankan 5 komponen/29 aspek/108 indikator & bobot,
   perbarui redaksi + tambah dimensi baru pada indikator yang relevan.

---

## 5. USULAN TINDAK LANJUT

Opsi A (minimal): bersihkan istilah usang saja (KTSP→KM, KKM→KKTP, UN→AN/AM, silabus→perangkat ajar).
Opsi B (menengah): Opsi A + suntik dimensi baru (Panca Cinta, pembelajaran mendalam, berpusat pada murid, berbasis data, inklusif).
Opsi C (penuh): Opsi B + selaraskan seluruh 108 indikator + rubrik 4–3–2–1 seperti instrumen RA.

Belum ada perubahan apa pun yang dilakukan — ini murni hasil audit.
