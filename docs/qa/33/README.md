# QA #33 — Wizard anggaran

Diuji di browser: Anggaran → "Susun dengan wizard 50/30/20" → `/anggaran/wizard?bulan=2026-12` (layar penuh, bukan sheet).

| Langkah | Hasil |
|---|---|
| 1 Metode | 50/30/20 · Klasik terpilih; opsi 60/20/20, 70/10/20, Atur sendiri (persen), Nominal tetap |
| 2 Pendapatan | Gaji Rp24.500.000 |
| 3 Alokasi | Kebutuhan Rp12.250.000 · Keinginan Rp7.350.000 · Tabungan & investasi Rp4.900.000; "Plafon pengeluaran = Kebutuhan + Keinginan = Rp19.600.000" (sama dengan design/08) |
| Kembali ke langkah 2 | Isian Rp24.500.000 tetap ada |
| 4 Kategori | Nominal kelompok dibagi rata ke kategori ber-grup (kelipatan ribuan), bisa diubah; penanda terpakai/total per kelompok |
| 5 Simpan | Ringkasan → Simpan → kembali ke Anggaran |
| Hasil di API | `method: "50_30_20"`, `spendingCap: 19600000`, incomes `[Gaji 24.500.000]`, alokasi nominal per kategori = rencana biasa (sama dengan isian manual setara) |

Unit test: contoh design/08, sisa pembulatan ke tabungan, kustom < 100%, bagi rata kelipatan ribuan dengan jumlah tepat.
