# QA #17 — Skor kesehatan

Screenshot headless Chrome, mode terang, 390 px dan 320 px: `home-*.png` (kartu skor di Beranda) dan `rincian-*.png` (layar rincian pilar).

| Cek | Hasil |
|---|---|
| Pilar tanpa data | Tabungan "Belum dinilai" (belum ada uang masuk), bukan 25 poin gratis |
| Skor proporsional | 59/100 "Cukup" dari 3 pilar yang dinilai; keterangan menyebut 1 pilar belum dinilai |
| Label | Teks di pill, bukan warna saja |
| Pilar utang | Pemakaian limit 43,3% → 19/25 |
| 320 px | Tidak ada teks terpotong atau scroll horizontal |

Unit test: label (≥80, ≥60, ≥40, <40), tiap pilar, tanpa kartu kredit/PayLater tidak dapat skor utang palsu, penskalaan pilar belum dinilai.
