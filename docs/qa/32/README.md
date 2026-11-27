# QA #32 — Beli dan jual aset

Diuji di browser lewat sheet Catat transaksi (tombol + di bawah) dan layar Investasi.

| Cek | Hasil |
|---|---|
| Jenis "Beli aset" | Pilihan aset muncul (nama + nilai kini), kategori disembunyikan, catatan "tidak dihitung sebagai pemasukan atau pengeluaran" |
| Beli Emas Antam Rp1.000.000 | Investasi: Rp48.000.000 → Rp49.000.000 (modal ikut naik), saldo rekening turun |
| Jual Rp999.000.000 | Ditolak: "Jumlah jual melebihi nilai kini atau modal aset." (BR-33) |
| Detail transaksi aset | Tombol Ubah dan Hapus kini tersedia (BR-34) |

Integration test (`asset-trade.repository.test.ts`): beli → saldo −2 jt, modal & nilai +2 jt, ringkasan pengeluaran tetap 0; tanpa aset 422 (BR-32); jual melebihi 422 `ASSET_SELL_EXCEEDS`; ubah jual 3 jt → 1 jt membalik dampak lama lalu menerapkan yang baru; hapus mengembalikan; urungkan hapus menerapkan lagi; hapus beli mengembalikan modal & nilai.
