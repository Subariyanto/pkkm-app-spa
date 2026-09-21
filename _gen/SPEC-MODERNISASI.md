# SPEC MODERNISASI INSTRUMEN PKKM MI/MTs/MA (Opsi C)

## Tujuan
Modernisasi ISI redaksi 108 indikator PKKM MI/MTs/MA agar selaras regulasi 2025–2026,
TANPA mengubah struktur (5 komponen, 29 aspek, 108 indikator, bobot 20%×5, skala 1–4).

## Kerangka regulasi wajib rujuk
- Struktur: Kepdirjen Pendis 1111/2019 (tidak berubah).
- KMA 1503/2025 (ubah KMA 450/2024): KTSP ⇒ **Kurikulum Madrasah (KM)**; modul ajar; KKTP.
- Kepdirjen Pendis 6077/2025: **Panca Cinta** (cinta kepada Allah & Rasul, sesama manusia, diri sendiri, lingkungan, ilmu/kemajuan — rumusan ringkas: cinta Allah-Rasul, manusia, diri, lingkungan, tanah air/bangsa).
- Permendikdasmen 21/2025 Pasal 14: kompetensi kepala satuan pendidikan — kepribadian, sosial, profesional: kepemimpinan kurikulum, pembelajaran berpusat pada murid, tata kelola berbasis data, kemitraan orang tua, lingkungan aman-inklusif, inovasi, kewirausahaan, kepemimpinan transformasional.
- Permendikdasmen 1/2026 (Standar Proses, ganti Permendikbudristek 16/2022), 10/2025 (SKL), 12/2025 (Standar Isi), 26/2025 (Standar Pengelolaan).

## Aturan penulisan
1. **Pertahankan** nomor aspek (`kode`), nomor indikator (`no`), dan ID (`{komponen}_{aspek}_{no}`).
2. Ganti istilah usang:
   - KTSP → Kurikulum Madrasah (KM) / Kurikulum Operasional
   - KKM → KKTP (kriteria ketercapaian tujuan pembelajaran)
   - UN / Ujian Nasional → Asesmen Nasional (AN) / Asesmen Madrasah (AM)
   - PAS / PAT → asesmen formatif & sumatif
   - silabus → perangkat ajar / modul ajar
   - RPP → modul ajar (RPP untuk KM)
   - "8 SNP" tunggal → SNP disandingkan SPMI/Rapor Mutu (tetap boleh menyebut 8 SNP tetapi kontekstualkan)
3. Sisipkan dimensi baru pada indikator yang relevan: Panca Cinta, pembelajaran mendalam (berkesadaran–bermakna–menggembirakan), pembelajaran berpusat pada murid, tata kelola berbasis data, kemitraan orang tua, lingkungan aman-inklusif, moderasi beragama/penguatan karakter, numerasi & AKM, kepemimpinan transformasional.
4. Bahasa Indonesia formal, ringkas, netral jenjang (MI/MTs/MA) kecuali memang menyebut jenjang.
5. Jangan mengarang nomor regulasi baru di dalam redaksi.

## Format output per indikator (WAJIB)
Setiap indikator harus punya 5 field (dan boleh `penggalian`):
```json
{
  "no": 1,
  "indikator": "redaksi indikator modern",
  "penggalian": "fokus yang digali pengawas (2–3 kalimat)",
  "data": "data/dokumen yang diharapkan",
  "bukti": "cara penggalian: telaah dokumen, observasi, wawancara (rinci nomor 1..n)",
  "rubrik": {"1":"...","2":"...","3":"...","4":"..."}
}
```

### Panduan rubrik 1–4 (skala sama dengan instrumen RA)
Rantai logika skor: **Perencanaan → Implementasi → Evaluasi/Refleksi → Tindak Lanjut → Dampak**.
- **1 (Kurang):** tidak ada/ tidak relevan/ tidak terlaksana.
- **2 (Cukup):** ada dokumen/rencana tetapi implementasi terbatas atau administratif saja.
- **3 (Baik):** terlaksana dan terdokumentasi, sebagian besar berjalan, tindak lanjut belum optimal/merata.
- **4 (Amat Baik):** terencana partisipatif, terlaksana konsisten, dievaluasi/refleksi, ditindaklanjuti, dan berdampak terukur pada mutu/peserta didik.

## Struktur output akhir
Kembalikan JSON valid **array aspek** dengan bentuk sama seperti input, contoh:
```json
[{"kode":"1.1","no":1,"unsur":"...","indikator":[{...}]}, ...]
```
Tulis hasil ke file yang diminta (path diberikan di task), lalu verifikasi JSON valid via `node -e`.
