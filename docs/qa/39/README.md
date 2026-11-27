# QA #39 — Grafik Beranda (FR-52, DS-DATA-03)

## Otomatis
- `packages/shared/src/rules/charts.test.ts`:
  - Donut paling banyak 5 irisan ditambah "Lainnya". Irisan diurutkan dari yang terbesar, dan nilai nol dibuang.
  - Perubahan bulan ini dibanding bulan lalu dihitung dalam basis poin. Hasilnya null bila bulan lalu bernilai nol.
  - Rasio tinggi batang.
- `dashboard.service.test.ts`:
  - Arus kas mencakup 6 bulan dan berakhir di bulan yang dipilih.
  - Donut dan perbandingan per kategori. Contoh: 400 dibanding 250 = +60%.
- Hasil: 237 pass, 0 fail. Lint dan typecheck bersih.

## Manual (localhost:12080, Beranda)
1. Di bawah "Transaksi terakhir" muncul tiga bagian:
   - Arus kas 6 bulan: batang masuk dan keluar, lalu tabel per bulan.
   - Pengeluaran per kategori: donut dan legenda berisi nominal serta persen. Contoh: Makan & minum 74%.
   - Bulan ini vs bulan lalu: kalimat ringkas dan batang per kategori.
2. Padanan teks untuk pembaca layar:
   - SVG diberi `aria-hidden`.
   - Tabel arus kas punya caption.
   - Legenda dan nilai ditampilkan sebagai teks (DS-DATA-03).
3. Mode privasi diuji lewat tombol "Sembunyikan nominal":
   - SVG grafik disembunyikan (0 elemen).
   - Semua nominal tampil sebagai "Rp ••••••".
   - Persen ikut disembunyikan.
4. LCP: grafik memakai query `dashboard/charts` yang terpisah dan baru dimuat setelah data utama Beranda tersedia. Angka utama tidak menunggu grafik.
5. Pada lebar 320 px tidak ada scroll horizontal (scrollWidth 301).
