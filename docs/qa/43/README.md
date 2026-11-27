# QA #43: Slip gaji (PB-10, FR-140, NFR-02)

## Otomatis
- `packages/shared/src/rules/payslip.test.ts`
  - Slip contoh (Bahasa Indonesia) terbaca: Oktober 2026, bruto 12,5 jt, potongan 750 rb, neto 11,75 jt.
  - Format Inggris dengan desimal: Pay Period 09/2026, Gross/Total Deductions/Net Pay.
  - Potongan dihitung bruto − neto bila tidak tertulis.
  - Tren: urut periode, maksimal 12 slip, % perubahan neto.
- Lint, typecheck, dependency-cruiser, dan test shared lulus.

## Manual (localhost:12080/lainnya/slip-gaji)
1. PDF slip contoh dibuat di browser lalu dibaca lewat `pdfToText` + `parsePayslip`: hasil `2026-10`, 12.500.000, 750.000, 11.750.000.
2. Tidak ada permintaan jaringan yang membawa file; `POST /payslips` hanya berisi angka. Tanpa arsip, file tidak tersimpan di mana pun.
3. Empat slip (Agustus–November 2026): hero menampilkan neto terbaru dan "+3,8%"; daftar tren menampilkan % perubahan dengan tanda (+/−), bukan hanya warna.
4. Angka tidak konsisten (neto ≠ bruto − potongan) ditolak 422.
5. Ketuk baris membuka konfirmasi hapus (DS-ACTION-03).
