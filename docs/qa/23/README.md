# QA #23 — Detail rekening

Diuji di browser, Lainnya → Rekening → ketuk rekening, dan dalam iframe 320 px.

| Cek | Hasil |
|---|---|
| Ketuk rekening di daftar | Membuka `/lainnya/rekening/:id` (bisa ditautkan; tab Lainnya tetap aktif) |
| Kartu kredit | Hero −Rp6.500.000 = saldo di daftar Rekening; bar limit "Terpakai 43% · Limit Rp15.000.000" (BR-05) |
| Riwayat | Hanya transaksi rekening ini (termasuk transfer masuk ke rekening ini), dikelompokkan per tanggal, ketuk membuka detail transaksi |
| Bank, nama 40 karakter, saldo 13 digit, 320 px | Judul terpotong rapi, hero disingkat "Rp1,2 T" + nominal penuh untuk pembaca layar, saldo = daftar (1234565590123), tidak ada elemen keluar layar |
| Ubah/hapus | Tombol pensil di bilah atas membuka sheet Ubah rekening (dipindah dari layar daftar) |

Saldo detail dan daftar memakai sumber data yang sama (`GET /wallets`, BR-01), jadi selalu sama.
