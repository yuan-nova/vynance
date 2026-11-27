# ADR 0007: Slip gaji dibaca di perangkat, hanya angka yang disimpan

- Status: diterima
- Tanggal: 2026-11-28
- Tiket: #43 (PB-10, FR-140, NFR-02)

## Konteks
Slip gaji berisi nama, NIK, nomor rekening, dan rincian gaji. NFR-02 meminta file tidak disimpan kecuali pengguna memilih arsip. Belum ada penyimpanan objek (S3 atau sejenisnya) di stack.

## Keputusan
- PDF dibaca di browser dengan `pdfjs-dist` (4.10.38), dimuat malas saat pengguna memilih file. Teks per baris diurai oleh `parsePayslip` di `@vynance/shared` (periode, bruto, potongan, neto).
- Pengguna meninjau dan bisa mengubah angka sebelum menyimpan. Neto selalu = bruto − potongan, dan server menolak angka yang tidak konsisten.
- Server hanya menerima JSON angka (`POST /payslips`). File tidak pernah diunggah, jadi `payslips.file_key` selalu null.
- Satu slip per periode; menyimpan periode yang sama menggantikan angka lama.
- Fitur **arsip PDF ditunda** sampai ada penyimpanan objek terenkripsi. Kolom `file_key` sudah disiapkan.

## Akibat
- Slip hasil pindaian (gambar di dalam PDF) tidak punya teks, jadi pengguna mengisi manual. OCR untuk PDF gambar bisa ditambahkan dengan tesseract.js (ADR 0004).
- Pengguna yang ingin menyimpan arsip PDF belum bisa melakukannya di Vynance.
