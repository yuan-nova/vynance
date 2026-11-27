# QA #18 — Target tabungan

Diuji di browser, `/lainnya/target` (menu Lainnya → Target tabungan), dan dalam iframe 320 px.

| Cek | Hasil |
|---|---|
| Kosong | Empty state "Belum ada target tabungan" + tombol Tambah target |
| Validasi form | Simpan tanpa nama → "Nama target wajib diisi" |
| Tambah Dana Darurat Rp54 jt, terkumpul Rp28 jt, Des 2027 | "13 bln lagi", "Sesuai jalur" (target baru bulan ini belum punya riwayat setoran), 51% |
| Setor Rp2 jt (nominal terisi otomatis dari kebutuhan/bulan) | Terkumpul Rp30 jt, 55%, "Setor Rp1.846.200/bln" = contoh design/09 (BR-20); snackbar "Setoran dicatat" |
| Lewat tenggat (tanggal 26 Nov 2026) | Pill merah "Lewat tenggat", "Sisa Rp5.000.000" |
| Tercapai | Pill hijau "Tercapai", "Selamat, target tercapai!", tombol Setor disembunyikan |
| Nama 61 karakter | Ditolak API (422); nama 60 karakter terpotong rapi (truncate) |
| 320 px | Tidak ada elemen keluar layar, tanpa scroll horizontal |

"Perlu perhatian" (BR-21) diuji di unit test: laju rata-rata ≤ 3 bulan terakhir < kebutuhan/bulan, contoh Umroh design/09 (butuh Rp2.239.100, laju Rp1,2 jt).
