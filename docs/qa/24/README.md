# QA #24 — Arsip rekening

Diuji di browser dengan rekening Kartu Kredit (sudah punya transaksi).

| Cek | Hasil |
|---|---|
| Ubah rekening → Hapus rekening | Sheet berubah jadi "Arsipkan Kartu Kredit?" dengan alasan; hanya tombol Arsipkan + Batal (tidak menawarkan hapus) |
| Arsipkan | Catatan "Rekening ini diarsipkan…" + tombol Aktifkan lagi di detail |
| Total kekayaan | Sebelum: kas Rp1.234.565.590.123, utang −Rp6.500.000. Sesudah: sama persis (BR-35) |
| Pilihan rekening di Catat transaksi | Kartu Kredit tidak muncul; hanya rekening aktif |
| Daftar Rekening | Seksi "Diarsipkan" dengan penjelasan; hitungan "1 rekening · 0 utang" |
| Aktifkan lagi | Kembali ke daftar aktif, seksi Diarsipkan hilang |

Server menolak transaksi baru ke rekening arsip (`WALLET_ARCHIVED`, sudah ada sejak #8). Integration test: ringkasan kas/utang tidak berubah setelah arsip, saldo rekening tetap, unarchive, rekening buku lain 404.
