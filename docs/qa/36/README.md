# QA #36 — Scan struk / mutasi (PB-03)

## Otomatis
- `packages/shared/src/rules/scan.test.ts`: struk Indomaret menjadi satu baris uang keluar Rp50.300 dengan kategori "Belanja Bulanan". Mutasi bank menjadi 3 baris, dan arah tiap baris (masuk/keluar) dibaca dari DB/CR. Ada juga uji untuk angka, tanggal, kategori, dan jenis dokumen.
- `transactions.repository.test.ts`: `POST /transactions/scan` menyimpan dua baris dengan `source=scan`. Jika permintaan dengan Idempotency-Key yang sama dikirim ulang, baris yang sudah tersimpan dikembalikan dan tidak dibuat ganda. Daftar kosong ditolak dengan 422.
- Hasil terakhir: 225 pass, 0 fail. Lint dan typecheck bersih.

## Manual (browser, localhost:12080)
1. Buka Catat transaksi → Scan struk → tempel teks struk Indomaret → Baca teks.
2. Layar tinjau menampilkan satu baris: INDOMARET, Rp50.300, tanggal 2026-11-27, jenis Uang keluar.
3. Buku dev tidak punya kategori "Belanja Bulanan". Karena itu kategori dibiarkan kosong, dan tombol simpan terkunci dengan teks "Lengkapi kategori atau rekening tujuan".
4. Setelah kategori dipilih, ketuk Simpan 1 transaksi. Muncul snackbar "1 transaksi dicatat" dan transaksinya ada di daftar.
5. Pada lebar 320 px tidak ada scroll horizontal (scrollWidth 301).
6. OCR foto memakai tesseract.js yang dimuat hanya saat foto dipilih (ADR 0004). Uji dengan foto asli dilakukan di ponsel.
