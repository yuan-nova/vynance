# Bukti kontras tema

Dokumen ini berisi hasil ukur kontras pasangan token warna di keenam tema desain. Kontraknya adalah **DS-THEME-01** di [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). Nilai token ada di [`design/_source/themes.py`](../design/_source/themes.py).

Diukur ulang 27 November 2026 setelah perbaikan token. **Setiap perubahan token wajib mengukur ulang dan memperbarui tabel ini di PR yang sama.**

## Metode dan ambang

- Rumus: *relative luminance* sRGB WCAG 2.2, rasio `(L_terang + 0,05) / (L_gelap + 0,05)`.
- **Teks normal: 4,5:1.** Ini berlaku juga untuk nominal 14 px tebal, pill 11 px, dan label nav 11 px. Ambang 3:1 untuk teks besar hanya berlaku mulai 24 px biasa atau 18,67 px tebal.
- **Non-teks: 3:1.** Ini berlaku untuk ring fokus, batas kolom isian, dan ikon yang menjadi satu-satunya penanda arti.
- Kartu hero memakai gradien `HERO1 → HERO2`, jadi teks diukur terhadap **ujung terang** (`HERO1`), yaitu kasus terburuk.
- Hasil dibandingkan dengan nilai penuh. Angka di tabel dibulatkan dua digit hanya untuk dibaca.

Reproduksi:

```bash
cd design/_source
python -I contrast.py           # cetak tabel di bawah
python -I contrast.py --check   # exit 1 bila ada yang gagal (dipakai di CI)
```

## Hasil ukur

| Pasangan | Dipakai untuk | Ambang | Hutan | Samudra | Terakota | Anggrek | Malam | Citrus |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `INK` / `BG` | teks utama di latar | 4,5 | 15,19 | 15,81 | 15,03 | 16,14 | 16,06 | 17,11 |
| `INK` / `SURF` | teks utama di kartu | 4,5 | 16,73 | 17,28 | 16,16 | 17,47 | 14,65 | 18,88 |
| `MUTED` / `SURF` | teks sekunder di kartu | 4,5 | 5,81 | 6,15 | 6,22 | 6,49 | 7,12 | 6,72 |
| `MUTED` / `BG` | teks sekunder di latar | 4,5 | 5,27 | 5,62 | 5,78 | 6,00 | 7,81 | 6,09 |
| `FAINT` / `SURF` | label nav tidak aktif, meta 11 px | 4,5 | 4,68 | 4,68 | 4,72 | 4,71 | 4,70 | 4,71 |
| `ONP` / `PRI` | teks/ikon di tombol primer | 4,5 | 7,72 | 8,31 | 5,94 | 8,03 | 8,69 | 15,99 |
| `PRI` / `SURF` | link & label nav aktif | 4,5 | 7,72 | 8,31 | 5,85 | 8,03 | 8,88 | 18,42 |
| `PRI` / `BG` | ring fokus, batas kontrol aktif | 3,0 | 7,01 | 7,60 | 5,43 | 7,42 | 9,73 | 16,70 |
| `INC` / `SURF` | nominal uang masuk 14/700 | 4,5 | 5,59 | 5,65 | 5,51 | 5,55 | 9,32 | 5,53 |
| `EXP` / `SURF` | nominal uang keluar 14/700 | 4,5 | 5,06 | 4,70 | 7,20 | 4,69 | 6,72 | 4,70 |
| `TRF` / `SURF` | nominal transfer 14/700 | 4,5 | 5,73 | 5,87 | 5,78 | 5,69 | 7,70 | 6,00 |
| `INV` / `SURF` | nominal investasi 14/700 | 4,5 | 5,57 | 5,53 | 5,55 | 5,53 | 9,21 | 5,68 |
| `WARN` / `SURF` | teks peringatan | 4,5 | 4,71 | 4,71 | 4,70 | 4,71 | 9,55 | 4,71 |
| `INC` / `INC_S` | pill Aman | 4,5 | 4,72 | 4,77 | 4,72 | 4,70 | 7,49 | 4,70 |
| `EXP_D` / `EXP_S` | pill Melebihi | 4,5 | 6,28 | 6,41 | 6,12 | 6,31 | 8,99 | 6,38 |
| `TRF` / `TRF_S` | pill transfer | 4,5 | 4,68 | 4,74 | 4,83 | 4,70 | 6,71 | 4,89 |
| `INV` / `INV_S` | pill investasi | 4,5 | 4,71 | 4,70 | 4,65 | 4,69 | 7,27 | 4,80 |
| `WARN_D` / `WARN_S` | pill Pas / banner peringatan | 4,5 | 6,05 | 6,05 | 5,86 | 6,05 | 9,19 | 6,05 |
| `AUTO` / `AUTO_S` | badge Otomatis | 4,5 | 5,30 | 5,21 | 5,02 | 4,67 | 7,44 | 5,00 |
| `PRI` / `PRI_S` | chip aktif, tombol soft | 4,5 | 6,28 | 6,73 | 4,71 | 6,55 | 6,53 | 16,33 |
| `HERO_FG` / `HERO1` | teks kartu hero (ujung terang gradien) | 4,5 | 5,94 | 5,78 | 6,36 | 5,83 | 8,74 | 15,72 |
| `HERO_FG` / `HERO2` | teks kartu hero (ujung gelap gradien) | 4,5 | 11,76 | 13,36 | 10,16 | 15,05 | 15,95 | 20,38 |
| `GOLD` / `HERO2` | aksen grafis di hero | 3,0 | 5,87 | 6,46 | 6,66 | 9,76 | 9,78 | 17,69 |
| `HERO_NEG` / `HERO1` | nominal negatif di hero | 4,5 | 4,72 | 4,74 | 4,65 | 4,66 | 5,00 | 7,79 |
| `FIELD_LINE` / `SURF` | batas kolom isian (non-teks) | 3,0 | 3,50 | 3,46 | 3,43 | 3,43 | 3,15 | 3,52 |
| `FIELD_LINE` / `BG` | batas kolom isian di latar (non-teks) | 3,0 | 3,18 | 3,16 | 3,19 | 3,17 | 3,46 | 3,19 |
| **Jumlah gagal** | | | **0** | **0** | **0** | **0** | **0** | **0** |

## Riwayat

| Tanggal | Perubahan | Gagal (Hutan · Samudra · Terakota · Anggrek · Malam · Citrus) |
|---|---|---|
| 27 Nov 2026, ukur awal | Token asli | 8 · 9 · 8 · 9 · 2 · 7 |
| 27 Nov 2026, perbaikan | Token di bawah | 0 · 0 · 0 · 0 · 0 · 0 |

Token yang diubah. Hue dipertahankan; hanya *lightness* yang digeser sampai lolos dengan margin 0,15. Hex lengkap per tema ada di `themes.py`.

| Token | Perubahan | Alasan |
|---|---|---|
| `FAINT` | Digelapkan di semua tema terang, diterangkan di Malam | Dipakai untuk label nav tidak aktif dan meta 11 px, jadi wajib 4,5:1 |
| `INC`, `INV`, `WARN` | Digelapkan di semua tema terang | Nominal 14 px dan pill 11 px |
| `EXP`, `TRF`, `AUTO` | Digelapkan di tema yang gagal saja (Samudra, Anggrek, Citrus; Hutan `TRF` untuk margin) | Nominal dan badge |
| `HERO_NEG` | Diterangkan (Hutan, Samudra, Anggrek) | Nominal negatif di kartu hero |
| `PRI`, `HERO1` (Terakota) | Digelapkan | Chip aktif, teks dan nominal negatif di hero |
| `FIELD_LINE` | **Token baru**, ≥ 3:1 terhadap `SURF` dan `BG` | Batas kolom isian. `LINE` tetap untuk garis pemisah dekoratif |

Generator juga diubah: kolom isian (onboarding saldo, detail catat transaksi, input AI) memakai `FIELD_LINE`, dan pill "Cek kategori" memakai `WARN_D` alih-alih `WARN`.

## Temuan

1. **Semua tema lolos** setelah perbaikan token. Gerbang G2 di [rubrik penilaian desain](design-system/DESIGN-DECISION-RUBRIC.md) terpenuhi untuk keenam tema, jadi pemilihan tema rilis bisa lanjut ke penilaian K2–K7.
2. **Margin tipis.** Banyak pasangan sekarang di 4,6–4,8 (teks) dan 3,1–3,2 (`FIELD_LINE`). Menggelapkan latar (`BG`, `SURF`, `*_S`) atau menerangkan token teks sedikit saja bisa membuatnya gagal lagi. Jalankan `contrast.py --check` di setiap PR yang mengubah token.
3. **Token terang untuk teks, token `*_D` untuk teks di atas tint.** `WARN_D` dan `EXP_D` dipakai untuk teks di pill tint. Jangan memakai `WARN` atau `EXP` di atas `*_S` tanpa mengukur.
4. **`LINE` bukan batas kontrol.** `LINE` hanya untuk pemisah dan kartu dekoratif. Kolom isian, checkbox, dan kontrol lain wajib memakai `FIELD_LINE` atau `PRI` saat fokus.
5. **Warna tidak boleh menjadi satu-satunya penanda arti (DS-COLOR-01).** Walaupun kontrasnya lolos, nominal tetap wajib diberi tanda `+` / `−` dan ikon arah.

## Batas bukti

- Pengukuran ini hanya mencakup pasangan token. State hover, tekan, dan disabled di aplikasi diukur ulang setelah komponen dibuat.
- Teks di atas pola dekoratif kartu hero (`hero_pattern`) belum diukur per piksel. Polanya wajib tetap di bawah teks dengan opasitas yang tidak menurunkan rasio di bawah ambang.
- Kontras token bukan bukti bahwa layar lolos. Layar tetap diperiksa sesuai DS-QA-01.
