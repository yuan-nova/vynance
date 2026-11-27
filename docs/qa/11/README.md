# Bukti #11 — Catat uang masuk, uang keluar, dan transfer

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 di 390 px, `bun test` ke MySQL dev.

## Cakupan
- Alur: tombol + → sheet Catat transaksi (04) → jenis (chip) → Jumlah (besar, 32/800) → kategori (sering dipakai di depan) → rekening → tanggal (Hari ini · Kemarin + tanggal lain) → catatan → Simpan → snackbar.
- Kontrak: DS-NAV-01 (Scan struk juga tersedia di sheet), DS-SHEET-01 (6 kolom isian → sheet), DS-FORM-01/02/03, DS-ACTION-01 (satu primer), DS-A11Y-01 (fokus masuk/kembali), DS-STATE-03.
- Aturan: BR-30, BR-31, BR-45, FR-20, FR-23.

## Bukti
| Pemeriksaan | Hasil |
|---|---|
| Fokus awal di kolom Jumlah; Escape mengembalikan fokus ke + | lulus (setelah perbaikan `data-autofocus`) |
| Simpan tanpa kategori → "Pilih kategori" | lulus |
| Simpan → sheet tertutup, snackbar "Transaksi dicatat" | lulus |
| Transfer: label "Dari rekening" + "Ke rekening", tanpa kategori | lulus |
| Tanpa scroll horizontal di 390 px; tinggi sheet ≤ 90 svh dengan scroll internal | lulus |
| `Idempotency-Key` sama → satu transaksi | lulus (test) |
| Transfer mengubah saldo dua rekening, total kas tetap | lulus (test) |
| Rekening/kategori buku lain → 422 dengan field yang tepat | lulus (test) |

## Batas bukti
- "Satu tangan di 390 px": semua kontrol ada di sheet bawah dan CTA di bagian bawah, tetapi belum diuji di perangkat nyata. Keypad memakai keyboard angka bawaan HP (`inputmode="numeric"`), bukan keypad khusus seperti di desain.
- Tipe Aset (beli/jual) menyusul di #32.
