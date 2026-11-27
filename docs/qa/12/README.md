# Bukti #12 — Daftar transaksi per tanggal, filter, dan cari

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 di 360 px dengan 1.001 transaksi uji, `bun test` ke MySQL dev.

## Cakupan
- Layar Transaksi (05): bulan (◀ ▶), strip ringkasan Masuk/Keluar, chip jenis satu baris, grup per tanggal + total harian, sheet Filter (cari + rekening, "Filter · n"), state memuat/kosong/tidak cocok/gagal, scroll tak berujung.
- Kontrak: DS-DATA-01, DS-DATA-02, DS-DATA-03 (strip ringkasan), DS-COLOR-01, DS-MONEY-01, DS-STATE-01, DS-LANG-02.

## Bukti
| Pemeriksaan | Hasil |
|---|---|
| 1.001 transaksi termuat lewat 20 halaman cursor, tanpa duplikat, berakhir "Semua transaksi sudah tampil" | lulus |
| Frame terburuk saat scroll 1.500 px per frame: 20 ms (desktop) | lulus, lihat batas bukti |
| URL `?jenis=masuk&cari=Muat 70&bulan=2026-11` menampilkan hasil yang sama setelah dibuka langsung; chip dan label "Filter · 1" sesuai | lulus |
| Header grup "Hari ini · Jumat, 27 Nov" + total harian bertanda | lulus |
| Nominal bertanda + / − dan ikon arah (`in`/`out`/`transfer`), bukan warna saja | lulus |
| Halaman berikut gagal → tombol "Gagal memuat. Coba lagi" (bukan "Memuat lagi…" selamanya) | lulus (setelah perbaikan) |
| Cursor, filter tipe/rentang/rekening, cari memperlakukan `%` dan `_` sebagai huruf, ringkasan, isolasi buku | lulus (test) |

## Batas bukti
- "Lancar di HP menengah" baru diukur di desktop; daftar belum divirtualisasi (≈10 rb node DOM untuk 1.000 baris). Bila uji perangkat nyata patah-patah, tambahkan virtualisasi.
- Total harian tidak menghitung transfer (BRD PB-02), jadi berbeda dari angka di SVG 05 (Rabu 25 Nov) yang ikut menghitung transfer.
- Tangkapan layar tidak dibuat.
