# QA #31 — Investasi

Diuji di browser, Lainnya → Investasi.

| Cek | Hasil |
|---|---|
| Kosong | Hero Rp0, "Belum ada aset" + Tambah aset |
| Tambah jenis "Emas" target Rp100.000.000 | Muncul di "Target per jenis" |
| Tambah aset Emas Antam, 30 unit, modal Rp42.820.000, nilai Rp48.000.000 | Baris "Emas · 30 · Rp48.000.000 · +12,1%" (contoh design/10) |
| Hero | Nilai Rp48.000.000, untung Rp5.180.000 (+12,1%), modal Rp42,8 jt |
| Progres jenis | Bar 48% "Rp48 jt / Rp100 jt" |
| Beranda | `wealth.investments` = 48.000.000, kekayaan bersih ikut naik (BR-04) |

Unit test: untung/rugi = nilai kini − modal (+12,1%, rugi −20%, modal 0), total portofolio (+8,8% design/10), progres target. Integration test: target jenis, aset + untung/rugi, nilai kini manual, jenis dengan aset 409, jenis buku lain 422, buku lain 404, hapus aset & jenis.
