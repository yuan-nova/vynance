# Bukti #9 — Kategori: tambah, ubah, urutkan, grup 50/30/20, anggaran bulanan

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 di 320 px, `bun test` ke MySQL dev.

## Cakupan
- Layar: Lainnya → Kategori. Segmented Uang keluar / Uang masuk (di URL `?jenis=`), daftar, sheet tambah/ubah, tombol naik/turun.
- Kontrak: DS-FORM-03 (chip grup, kisi ikon), DS-FORM-02, DS-ACTION-02 (maks. 2 ikon per baris), DS-ACTION-03 (hapus kategori → snackbar Urungkan), DS-TOUCH-01 (geser urutan punya tombol), DS-STATE-01, DS-ICON-01 (tambah `chev_u`).
- Aturan: BR-36.

## Bukti
| Pemeriksaan | Hasil |
|---|---|
| Tambah kategori, nama 40 karakter terpotong tanpa scroll horizontal di 320 px | lulus |
| Nama > 40 karakter ditolak di kolom | lulus |
| Pindah ke bawah mengubah urutan (optimistic) dan tersimpan | lulus |
| Hapus → snackbar "Makan & minum dihapus · Urungkan" → Urungkan memulihkan | lulus |
| Tab Uang masuk lewat URL `?jenis=masuk`, state kosong | lulus |
| BR-36: ganti nama mempertahankan ID yang dipakai transaksi | lulus (test) |
| Kategori dipakai → diarsipkan, tidak muncul di daftar pilihan; dipulihkan | lulus (test) |
| Urutan harus memuat semua kategori aktif | lulus (test) |
| Kategori buku lain → 404 | lulus (test) |

## Batas bukti
- Tangkapan layar tidak dibuat; pengukuran lewat DOM.
- Kategori bawaan (10 keluar + 4 masuk) dibuat di #10.
