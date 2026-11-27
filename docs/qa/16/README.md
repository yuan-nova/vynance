# QA #16 — Beranda

Diuji di browser, `/?bulan=2026-11`, dan dalam iframe 320×700 untuk lebar HP.

| Cek | Hasil |
|---|---|
| Kekayaan bersih = kas + investasi + utang | Rp1.234.559.090.123 = Rp1.234.565.590.123 + 0 − Rp6.500.000 ✅ |
| Kas dan utang sama dengan `GET /wallets` (layar Rekening) | cash 1234565590123, debt −6500000 ✅ |
| Ringkasan hanya bulan dipilih (temuan no. 14) | November 2026: masuk Rp0, keluar Rp2.600.000, sisa −Rp2.600.000 |
| Anggaran teratas sama dengan layar Anggaran (#15) | Makan & minum Rp1.900.000 / Rp2.000.000 "Aman"; Transportasi Rp700.000 / Rp1.000.000 "Aman" |
| 5 transaksi terakhir | 5 baris, ketuk membuka detail |
| Angka hero panjang | Disingkat "Rp1,2 T" (heroNeedsShort), nominal penuh untuk pembaca layar |
| 320 px | Tidak ada elemen keluar layar; tiga kolom hero 71 px |
| Header | Sapaan + pemilih buku (nama + kode XC4V-AWRD) |

Investasi masih Rp0 sampai #31.
