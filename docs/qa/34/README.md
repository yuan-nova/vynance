# QA #34 — Bawa sisa bulan lalu

Diuji di browser, `/anggaran?bulan=2026-12`, dengan rencana November: Transportasi alokasi Rp1.000.000 (terpakai Rp700.000), Makan & minum Rp2.000.000 (terpakai Rp1.900.000).

| Cek | Hasil |
|---|---|
| Sebelum | Baris kategori tanpa sisa |
| Tekan "Bawa sisa bulan lalu" | Snackbar "Sisa November 2026 dibawa ke bulan ini"; Transportasi "+ sisa Rp300 rb", Makan & minum "+ sisa Rp100 rb"; alokasi efektif ikut naik (BR-14) |
| Tekan lagi | Tetap Rp300.000 dan Rp100.000 (tidak dobel); API `carriedOver: ["300000","100000"]` |

Integration test (`carry-over.repository.test.ts`): Oktober → November membuat rencana baru dengan sisa makan 300 rb, transport 0 (terpakai > alokasi), investasi emas 1,5 jt (alokasi 2 jt − beli aset 500 rb); dua kali tetap sama dan tanpa baris ganda; tanpa rencana bulan lalu 422 `PLAN_NO_PREVIOUS`. Unit test BR-14.
