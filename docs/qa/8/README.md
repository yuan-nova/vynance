# Bukti #8 — Rekening: tambah, ubah, hapus 6 tipe dengan saldo dihitung

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 di 320 px, `bun test` ke MySQL dev.

## Cakupan
- Layar/alur: Lainnya → Rekening (06): kartu hero total kas, total utang, jumlah rekening; kelompok "Uang & tabungan" dan "Utang"; sheet tambah/ubah; sheet konfirmasi hapus.
- Kontrak: DS-DATA-01, DS-DATA-03 (hero + bar 8 px + nominal teks), DS-FORM-01, DS-FORM-02 (`MoneyInput`), DS-FORM-03 (chip tipe), DS-MONEY-01, DS-ACTION-03 (konfirmasi hapus), DS-SHEET-01, DS-STATE-01, DS-ICON-01 (tambah `wallet` = E-wallet, `trend` = RDN).
- Pola baru: `MoneyInput`, `ChipGroup`, `ProgressBar` sebagai komponen bersama kontrak yang sudah ada. Tidak ada pola layar baru.
- Aturan: BR-01…BR-05, BR-35 (hapus ditolak bila ada transaksi).

## Bukti
| Pemeriksaan | Hasil |
|---|---|
| State kosong "Belum ada rekening" + tombol | lulus |
| `MoneyInput`: "1234567890123" tampil "1.234.567.890.123"; "15jt" → 15.000.000 | lulus |
| Nama > 40 karakter ditolak dengan pesan di kolom | lulus |
| Kartu kredit −Rp6.200.000 limit Rp15.000.000 → "Terpakai 41%" + bar | lulus |
| Kas Rp1.234.567.890.123 di 320 px: semula `scrollWidth` 377 (gagal), setelah perbaikan hero disingkat `Rp1,2 T` dengan nilai penuh untuk screen reader, `scrollWidth` 320 | lulus |
| Nominal di baris 13 digit tidak terpotong | lulus |
| Saldo BR-01 dengan masuk, keluar, transfer; ringkasan kas/utang | lulus (test) |
| Hapus rekening berisi transaksi → 409 `WALLET_HAS_TRANSACTIONS` | lulus (test) |
| Rekening buku lain → 404 | lulus (test) |

## Batas bukti
- Tangkapan layar tidak dibuat; pengukuran lewat DOM.
- Arsip rekening (#24) dan detail + riwayat (#23) belum ada; tombol hapus mengarahkan ke arsip lewat pesan error.
- Tema Malam tidak diuji ulang (token tidak berubah).
