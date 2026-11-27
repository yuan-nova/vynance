# Bukti #7 — Buku: buat, daftar, ganti buku aktif, ubah nama, kode unik

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 di 320 px, `bun test` ke MySQL dev.

## Cakupan
- Layar/alur: `/buku-baru` (BR-54), pemilih buku di Beranda, layar Buku `/lainnya/buku` (17-books), ubah nama, buat buku baru.
- Kontrak: DS-NAV-01 (tab Lainnya aktif di turunan), DS-NAV-02 (tingkat 2 + kembali ke induk), DS-NAV-04, DS-SHEET-01, DS-FORM-01, DS-STATE-01, DS-STATE-02 (pill Aktif → pri), DS-STATE-03.
- Aturan: BR-45, BR-47, BR-48, BR-49, BR-54.

## Bukti
| Pemeriksaan | Hasil |
|---|---|
| Pengguna tanpa buku → `/buku-baru`, tanpa bottom nav | lulus |
| Buat buku → Beranda, header `Pribadi · BTA8-R8K2` | lulus (setelah perbaikan cache, lihat PR) |
| Dua buku bernama "Pribadi" terbedakan di pemilih: `BTA8-R8K2` dan `XC4V-AWRD` + jumlah anggota | lulus |
| Ganti buku → header berubah, kembali ke `/`, cache `["book", lama]` dibuang | lulus |
| Layar Buku: tab Lainnya `aria-current`, nama 40 karakter terpotong tanpa scroll horizontal di 320 px | lulus |
| Ubah nama → snackbar "Nama buku disimpan" | lulus |
| `GET /books/:id` buku orang lain → 404; ID tidak valid → 404 | lulus (test) |
| `PATCH` dengan `code` → 422 (`strict`); kode tetap | lulus (test) |
| Data buku A tidak terbaca dari pengguna B | lulus (test) |

## Batas bukti
- Tangkapan layar tidak dibuat; pengukuran lewat DOM.
- Anggota, undangan, hapus/pulihkan buku masuk tiket #22, #25, #26.
