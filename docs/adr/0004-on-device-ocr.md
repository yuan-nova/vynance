# ADR 0004 — OCR struk di perangkat dengan tesseract.js

- Status: diterima
- Tanggal: 2026-11-28
- Tiket: #36 (PB-03, TSD §14 no. 2)

## Konteks

Tambah Cepat (PB-03) membaca foto struk, mutasi rekening, dan riwayat e-wallet. NFR-02 meminta data pribadi tidak keluar dari perangkat tanpa perlu. Foto struk dan mutasi berisi nomor rekening, nama, dan lokasi.

## Keputusan

- OCR berjalan di browser dengan `tesseract.js` (bahasa `ind+eng`). Modul dimuat malas (`import()`) hanya saat pengguna memilih foto, jadi bundel awal tidak membesar.
- Teks hasil OCR dipecah oleh aturan deterministik di `@vynance/shared` (`parseScanText`): jenis dokumen, total struk, baris mutasi DB/CR, tanggal, dan tebakan kategori dari kata kunci.
- Server hanya menerima baris yang sudah ditinjau dan dipilih pengguna (`POST /transactions/scan`, `source=scan`). Gambar tidak pernah diunggah.
- Selalu ada jalan cadangan: tempel teks.

## Akibat

- Akurasi bergantung pada kualitas foto dan kamera; layar tinjau wajib sebelum simpan.
- Data bahasa (~10 MB) diunduh sekali dari CDN tesseract dan di-cache browser. Offline penuh menunggu PWA (#44).
- Opsi OCR server/AI ditolak untuk sekarang karena biaya dan privasi; bisa ditinjau ulang bersama fitur AI (#40).
