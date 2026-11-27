# QA #38 — Ekspor transaksi ke CSV (FR-22)

## Otomatis
- `transactions-list.repository.test.ts` memeriksa:
  - `GET /exports/transactions.csv?type=income` mengembalikan 12 baris sesuai filter daftar.
  - Berkas diawali BOM, memakai pemisah `;`, nominal ditulis sebagai bilangan bulat, dan tanggal dalam format ISO.
  - Header `attachment` terpasang.
  - Waktu proses di bawah 5 detik.
- Ekspor akun (`/me/export?format=csv`) sekarang memakai helper `lib/csv.ts` yang sama. Uji CSV injection-nya tetap lulus.
- Lint, typecheck, dan semua tes lulus.

## Manual
1. Di layar Transaksi, tombol unduh di samping Filter membuka `exports/transactions.csv` dengan bulan, jenis, rekening, dan kata cari yang sedang aktif.
2. Respons 200 dengan nama berkas `vynance-transaksi-2026-11-28.csv`. Isinya baris seperti `2026-11-27;Uang keluar;50300;Kartu Kredit;;Makan & minum;INDOMARET;`.
3. Pemisah `;` dipilih karena Excel dengan pengaturan wilayah Indonesia memakai koma sebagai desimal. Google Sheets mengenali pemisah ini otomatis.
4. **Belum diuji**: membuka berkas di Excel desktop dan di Google Sheets. Perlu dicek manual oleh reviewer.

## Kinerja
- Ekspor memakai satu query dengan batas 50.000 baris. Uji 10.000 baris di DB lokal perlu data seed. Hasil uji dengan 120 baris jauh di bawah batas 5 detik.
