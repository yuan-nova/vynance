# QA #29 — Langganan

Diuji di browser, Lainnya → Langganan.

| Cek | Hasil |
|---|---|
| Kosong | "Belum ada langganan … Transaksinya dibuat otomatis tiap tanggal bayar." + Tambah langganan |
| Netflix Premium Rp186.000, tgl 25 | Dikenali layanan Netflix (ikon + tone), "Tgl 25 · Kartu Kredit", Rp186.000/bln |
| ChatGPT Plus US$20, kurs kosong | Pratinjau "≈ Rp318.000" (kurs otomatis 15.900), baris "US$20 · kurs otomatis · Rp318.000/bln" |
| Asuransi Mobil Rp5.400.000 tahunan, tgl 31 Feb | Rp450.000/bln (BR-40 ÷ 12), tagihan berikutnya 28 Feb 2027 (tanggal 31 → akhir bulan) |
| Hero | Rp954.000/bln (= 186.000 + 318.000 + 450.000), Rp11.448.000/thn, "ChatGPT Plus · 14 Des (17 hari lagi)" |

Unit test BR-40 (contoh design/11 = Rp1.452.800), tanggal 31 di Feb/Apr/kabisat, tahunan hanya di bulan tagihan, konversi kurs, pengenalan layanan. Integration test: kurs manual, tahunan wajib bulan, rekening buku lain 422, buku lain 404, jeda keluar dari total, hapus.

Kurs otomatis memakai `reference_rates` terbaru; selama tabel kosong dipakai kurs cadangan di `shared/rules/subscription.ts`. Pengambilan kurs/harga emas berkala oleh worker menyusul bersama zakat (#37).
