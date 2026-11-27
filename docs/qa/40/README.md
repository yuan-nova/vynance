# QA #40 — AI advisor (PB-11, FR-100)

## Otomatis
- `packages/shared/src/rules/advisor.test.ts`
  - Ringkasan memuat angka utama.
  - Kategori dan aset dibatasi 5 teratas.
  - Nama buatan pengguna dikutip, termasuk upaya injeksi.
- `apps/api/src/modules/advisor/advisor.service.test.ts`
  - Tanpa persetujuan: hasilnya 403 `AI_CONSENT_REQUIRED`, dan tidak ada data yang dikumpulkan maupun dikirim ke LLM.
  - Tanpa `LLM_API_KEY`: hasilnya 503.
  - Dengan persetujuan: ringkasan dikirim di dalam `<data>` dan jawaban di-stream.
- Lint, typecheck, dan seluruh tes lulus.

## Manual (localhost:12080/lainnya/asisten)
1. `POST /advisor/ask` sebelum setuju mengembalikan 403 dengan pesan "Setujui dulu pengiriman ringkasan data ke penyedia AI."
2. Layar persetujuan menampilkan isi ringkasan yang akan dikirim: bulan, aset bersih, kas, investasi, utang, dan seterusnya.
3. Setelah menekan "Setuju dan mulai bertanya", chip "Tips hemat bulan ini" menampilkan "Asisten AI belum tersedia. Coba lagi nanti." karena `LLM_API_KEY` belum diisi di dev.
4. "Cabut izin AI" mengembalikan layar ke kartu persetujuan.
5. Pada lebar 320 px tidak ada scroll horizontal (scrollWidth 316).

## Belum diuji
- Jawaban asli dari Claude belum diuji karena butuh `LLM_API_KEY`. Isi kunci itu di `.env`, lalu jalankan `docker compose up -d api` untuk mencoba.
