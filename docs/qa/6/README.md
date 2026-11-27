# Bukti #6 — Login Google dan email OTP, logout

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 di `http://localhost:12080` (360 px) dan `curl` lewat nginx.

## Cakupan
- Layar/alur: Masuk (02a) → sheet Masuk dengan email → kode OTP → Beranda; Lainnya → Keluar.
- Kontrak: DS-NAV-01 (Masuk tanpa bottom nav), DS-ACTION-01 (`dark` untuk penyedia login), DS-FORM-01, DS-SHEET-01, DS-LANG-01.
- Pola baru: tidak ada.

## Bukti
| Pemeriksaan | Hasil |
|---|---|
| `/` tanpa sesi diarahkan ke `/masuk?redirect=%2F` | lulus |
| Kirim kode → langkah kode; OTP tampil di log api (dev, tanpa `EMAIL_API_KEY`) | lulus |
| Kode salah → "Kode salah. Periksa lagi email kamu." di bawah kolom, lewat `aria-describedby` | lulus |
| Kode benar → Beranda | lulus |
| Keluar → `/masuk`; baris `sessions` terhapus di DB; `/me` → 401 | lulus |
| Rate limit kirim OTP: permintaan ke-3+ dalam 1 menit dari IP sama → 429 | lulus |
| Kolom isian 16 px, tanpa scroll horizontal di 360 px | lulus |
| Tombol Google tersembunyi bila `GOOGLE_CLIENT_ID` kosong | lulus |

## Batas bukti
- Login Google belum diuji: butuh `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` dari Google Cloud Console. Kodenya terpasang dan aktif begitu env diisi.
- Pengiriman email lewat Resend belum diuji: butuh `EMAIL_API_KEY`.
- Tangkapan layar tidak dibuat; pengukuran lewat DOM.
- "Coba dulu tanpa akun" di desain 02a masuk tiket #45 (mode demo).
