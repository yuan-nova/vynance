# QA #45: Mode demo dan impor data (FR-151, PB-01 langkah 4)

## Otomatis
- `packages/shared/src/rules/demo.test.ts`
  - Kategori dicocokkan dengan nama (tanpa beda huruf besar/kecil), cadangan "Hiburan"/"Pemasukan lain".
  - Kunci impor (`demo_<id>`) stabil, jadi impor ulang tidak membuat transaksi ganda.
  - Tanpa kategori sejenis, transaksi masuk `skipped` dan tidak hilang.
  - Total bulan berjalan.
- Lint, typecheck, dependency-cruiser, test shared lulus.

## Manual (localhost:12080)
1. Layar Masuk punya tombol "Coba dulu tanpa akun" → `/demo` (tanpa login). Data tersimpan di `localStorage` saja; pita menjelaskannya.
2. Dua transaksi demo (bakso 25 rb, gaji 5 jt) tampil di `/demo` dengan ringkasan bulan berjalan.
3. Setelah masuk, Beranda menampilkan "Ada 2 transaksi dari mode demo" dengan Impor / Buang (Buang minta konfirmasi kedua).
4. Buku QA tidak punya kategori pemasukan: impor pertama memasukkan 1, melewati 1, dan menyisakan transaksi gaji di perangkat dengan snackbar penjelasan.
5. Data demo yang sama dimuat ulang lalu diimpor lagi: transaksi bakso tetap **satu** (kunci `demo_qademo0001`).
6. Setelah kategori Gaji ditambahkan, impor berikutnya memasukkan gaji. Hasil akhir di DB: tepat 2 transaksi (`demo_qademo0001`, `demo_qademo0002`), kartu impor hilang.
