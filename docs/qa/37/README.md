# QA #37: Zakat maal (PB-08, BR-42)

## Otomatis
- `packages/shared/src/rules/zakat.test.ts`
  - Contoh dari desain: zakat Rp4.661.250.
  - Harta tepat di nisab wajib zakat, satu rupiah di bawah nisab tidak wajib.
  - Utang bisa membuat harta turun di bawah nisab.
  - Haul dihitung 354 hari.
- `apps/api/src/modules/zakat/zakat.service.test.ts`
  - Sumber harga emas berurutan: isian manual, lalu cache, lalu nilai bawaan.
  - Haul tercapai terhitung dengan benar.
  - Pembayaran membuat transaksi uang keluar kategori Zakat & Infaq, dan haul dimulai ulang dari tanggal bayar.
  - Job harga emas melewati pengambilan selama data terakhir belum 6 jam.
- Hasil: 233 pass, 0 fail. Lint dan typecheck bersih.

## Manual (localhost:12080/lainnya/zakat)
1. Layar mengikuti `design/15-zakat.svg`:
   - Harga emas dan sumbernya, lalu tombol Ubah.
   - Daftar harta: kas, investasi, utang jatuh tempo, total.
   - Nisab 85 g.
   - Pill wajib zakat dan besar zakat 2,5%.
   - Catatan "perkiraan".
2. Saat mulai haul diisi 2025-11-30, layar menampilkan "Haul tercapai: Kamis, 19 November 2026".
3. `?goldPrice=` mengganti harga dengan isian manual: `goldSource=manual`.
4. Tombol Catat pembayaran hanya muncul jika kategori "Zakat & Infaq" ada. Buku dev tidak punya kategori itu, jadi layar menampilkan arahan untuk membuatnya. Alur pembayaran sudah diuji di service test.
5. Pada lebar 320 px tidak ada scroll horizontal.

## Catatan
- Harga emas live: job `gold-price` di worker berjalan bila `GOLD_PRICE_URL` diisi. Respons harus berisi `{ "price": <rupiah per gram> }`. Tanpa URL itu, sistem memakai cache terakhir atau nilai bawaan Rp1.580.000.
- Pengingat haul tampil di layar Zakat. Push saat aplikasi tertutup menyusul di #44 (PWA).
