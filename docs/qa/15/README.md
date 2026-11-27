# QA #15 — Realisasi dan status anggaran

Diuji di browser 320×700, `/anggaran?bulan=2026-11`, data uang keluar 10 Nov 2026.

| Kategori | Alokasi | Terpakai | Hasil |
|---|---|---|---|
| Transportasi | Rp1.000.000 | Rp700.000 | Pill "Aman" hijau, bar hijau, 70% |
| Makan & minum | Rp1.000.000 | Rp1.900.000 | Pill "Melebihi" merah, 190% |
| Makan & minum (diubah ke Rp2.000.000) | Rp2.000.000 | Rp1.900.000 | Pill "Aman", bar dan teks kuning, "95% · hampir habis" (BR-11) |

Status selalu tampil sebagai teks di pill dan persen di bawah bar, bukan hanya warna. Tidak ada scroll horizontal (scrollWidth 305 = clientWidth).
