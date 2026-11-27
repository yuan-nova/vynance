# QA #19 — Pengaturan

Diuji di browser, `/lainnya/pengaturan` (menu Lainnya → Pengaturan), Beranda dalam iframe 320 px.

| Cek | Hasil |
|---|---|
| Mode privasi (sakelar `role="switch"`) | `aria-checked="true"`, tersimpan di server (`privacyMode: true`) |
| Privasi di Beranda | 16 nominal tampil `Rp ••••••`, tidak ada angka rupiah tersisa; tombol mata "Show amounts" |
| Tema Gelap | `<html data-theme="dark">`, latar `rgb(14, 20, 18)`, tersimpan di server |
| Bahasa English | `<html lang="en">`, nav "Home / Transactions / Budget / More", judul "Settings", tersimpan di server |
| Optimistis | Tema/bahasa/privasi langsung berlaku sebelum respons server; gagal → kembali ke nilai lama + snackbar |
| 320 px | Pengaturan dan Beranda tanpa elemen keluar layar |
| Tema Malam | `python -I design/_source/contrast.py --check` → 0 pasangan gagal di semua tema |
| Tarik untuk muat ulang | Sentuhan saja, hanya di posisi paling atas, ambang 64 px; memuat ulang data buku aktif + profil |

Setelah uji, preferensi dikembalikan ke privasi mati, tema sistem, Bahasa Indonesia.

Cakupan bahasa English: navigasi bawah, menu Lainnya, Pengaturan, tombol privasi, indikator muat ulang. Layar lain masih Bahasa Indonesia dan diterjemahkan bertahap lewat `packages/shared/src/i18n/messages.ts`.
