# QA #41: Dana pendidikan anak (PB-09, FR-120, BR-43)

## Otomatis
- `packages/shared/src/rules/education.test.ts`
  - Biaya masa depan: 150 jt × 1,12² = 188,16 jt.
  - Anak umur 3: TK Juli 2027 = 5,6 jt, 8 bulan lagi, setor 700 rb/bln.
  - Tabungan 10 jt dibagi berurutan: TK 5,6 jt, SD 4,4 jt, sisanya 0 (temuan BRD §9 no. 9).
  - Status per umur: umur 13 → TK/SD selesai, SMP berjalan, SMA/Kuliah akan datang.
- Lint, typecheck, dependency-cruiser, dan seluruh test shared lulus.

## Manual (localhost:12080/lainnya/pendidikan)
1. Menu Lainnya → Dana pendidikan terbuka (sebelumnya "Segera hadir").
2. Dua anak (lahir 2013 dan 2023, tabungan 0 dan 10 jt) tampil dengan rincian per jenjang, status (teks + warna), dan total setoran per bulan.
3. Jenjang yang sudah tertutup tabungan menampilkan "sudah tercukupi".
4. Ketuk "Inflasi 12%/tahun" membuka form untuk mengubah inflasi (BR-43, 0–30%).
5. Target sentuh tombol ≥ 44 px.
