# QA #22 — Hapus dan pulihkan buku

Diuji di browser, Lainnya → Buku, dengan buku uji "Uji Hapus QA".

| Cek | Hasil |
|---|---|
| Tombol Hapus buku di kartu buku aktif | Sheet "Hapus buku Uji Hapus QA?" menyebut akibat dalam angka: 0 transaksi, rekening, anggaran, target; masa pulih 30 hari |
| Nama salah ("Uji Hapus") | "Nama yang diketik tidak sama dengan nama buku." |
| Nama benar | Snackbar "… dihapus. Bisa dipulihkan 30 hari", kembali ke Beranda, buku aktif pindah ke "Pribadi" |
| Daftar Buku terhapus | "Uji Hapus QA · Kode ZWYC-DHEE · bisa dipulihkan sampai 27 Des 2026" |
| Pulihkan | Snackbar "Buku Uji Hapus QA dipulihkan", buku jadi aktif lagi di Beranda |
| Layar Buat buku pertamamu | Ikut menampilkan Buku terhapus, supaya pengguna yang menghapus satu-satunya bukunya bisa memulihkan |

Integration test (`book-delete.repository.test.ts`): info hapus (transaksi, anggota), konfirmasi salah 422, setelah hapus 404 untuk semua anggota (termasuk sub-rute `/wallets`), hilang dari `GET /books`, purge_after = +30 hari, bukan anggota tidak melihat/tidak bisa memulihkan (404), anggota lain bisa memulihkan, masa pulih lewat → tidak tampil dan 404.
