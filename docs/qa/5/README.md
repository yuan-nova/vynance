# Bukti #5 — Fondasi frontend

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 di `http://localhost:12080/lainnya`, diukur dengan JavaScript di halaman.

## Cakupan
- Layar/alur: shell tab (Beranda, Transaksi, Anggaran, Lainnya), bottom nav, sheet Catat transaksi (isi sementara), menu Lainnya.
- Kontrak: DS-NAV-01, DS-NAV-02, DS-NAV-03, DS-TOUCH-01, DS-ACTION-01, DS-ACTION-02, DS-ICON-01, DS-SHEET-01, DS-FORM-01, DS-MONEY-01, DS-STATE-01, DS-STATE-02, DS-STATE-03, DS-MOTION-01, DS-A11Y-01, DS-THEME-01.
- Pola baru: tidak ada. Semua komponen mengikuti kontrak yang sudah ada.
- Aturan bisnis: BR-44 (mode privasi) disiapkan lewat `privacyStore`; nilainya diisi dari profil di tiket #19.
- Ikon `trash` dan `eye_off` (bertanda * di DS-ICON-01) ditambahkan ke `gen_svg.py` dan registri.

## Bukti
| Pemeriksaan | Hasil | Catatan |
|---|---|---|
| 320 px tanpa scroll horizontal | lulus | `scrollWidth` 305 = lebar tanpa scrollbar desktop |
| 360 px tanpa scroll horizontal, gutter 16 px | lulus | |
| 390 px tanpa scroll horizontal, gutter 20 px | lulus | |
| Lebar slot bottom nav | lulus | 78 px di 390; 61 px di 320 dengan scrollbar desktop 15 px (64 px di HP tanpa scrollbar) |
| Label nav tidak terpotong di 320 px | lulus | `scrollWidth <= clientWidth` untuk keempat label |
| Semua tombol/tautan ≥ 44 × 44 | lulus | tidak ada elemen interaktif di bawah 44 px |
| Satu `h1`, `nav` berlabel "Navigasi utama", `aria-current="page"` di tab aktif | lulus | |
| Sheet: fokus masuk, Escape menutup, fokus kembali ke tombol + | lulus | |
| Tema Malam (`prefers-color-scheme: dark`) | lulus | latar `rgb(14, 20, 18)` = token Malam |
| Kontras token | tidak berubah dari `themes.py` | nilai disalin dari Hutan dan Malam yang sudah lolos di THEME-CONTRAST.md |
| `prefers-reduced-motion` | ada di CSS | animasi sheet diganti fade 120 ms |

## Batas bukti
- Tangkapan layar tidak dibuat: browser preview tidak menghasilkan frame karena jendela T3 tidak tampil. Pengukuran di atas diambil lewat DOM.
- Belum diuji di perangkat iOS/Android nyata, TalkBack/VoiceOver, dan teks sistem 200 %.
- State gagal, kosong, dan tidak cocok filter tersedia sebagai komponen; layar data nyata baru memakainya di tiket fitur.
- Di Safari, klik tidak memberi fokus ke tombol, jadi fokus setelah sheet ditutup kembali ke `body`, bukan ke tombol +.
