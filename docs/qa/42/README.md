# QA #42: Sumber penghasilan aktif dan pasif (PB-10, FR-130)

## Otomatis
- `packages/shared/src/rules/income.test.ts`
  - Aktif 12 jt + pasif 3 jt: porsi pasif 20%, belum mencapai target 30%.
  - Aktif 7 jt + pasif 3 jt: porsi 30%, target tercapai.
  - Tanpa sumber: porsi 0%.
- Lint, typecheck, dependency-cruiser, dan test shared lulus.

## Manual (localhost:12080/lainnya/penghasilan)
1. Menu Lainnya → Sumber penghasilan terbuka (sebelumnya "Segera hadir").
2. Tiga sumber (Gaji 12 jt, Sewa kos 2 jt, Dividen 1 jt tidak tetap): total Rp15.000.000, "Pasif 20% · di bawah target", bar kuning.
3. Status dinyatakan dengan teks, bukan hanya warna (DS-COLOR-01).
4. "Target 30%" membuka form persen (0–100%), dipakai bersama dengan inflasi dana pendidikan (`components/PercentForm`).
