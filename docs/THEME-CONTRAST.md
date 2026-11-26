# Bukti kontras tema

Dokumen ini berisi hasil ukur kontras pasangan token warna di keenam tema desain. Kontraknya adalah **DS-THEME-01** di [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). Nilai token ada di [`design/_source/themes.py`](../design/_source/themes.py).

Diukur 27 November 2026 dari token di `themes.py` saat itu. **Setiap perubahan token wajib mengukur ulang dan memperbarui tabel ini di PR yang sama.**

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
| `FAINT` / `SURF` | label nav tidak aktif, meta 11 px | 4,5 | 3,16 **gagal** | 3,12 **gagal** | 3,26 **gagal** | 3,34 **gagal** | 3,99 **gagal** | 3,38 **gagal** |
| `ONP` / `PRI` | teks/ikon di tombol primer | 4,5 | 7,72 | 8,31 | 5,29 | 8,03 | 8,69 | 15,99 |
| `PRI` / `SURF` | link & label nav aktif | 4,5 | 7,72 | 8,31 | 5,20 | 8,03 | 8,88 | 18,42 |
| `PRI` / `BG` | ring fokus, batas kontrol aktif | 3,0 | 7,01 | 7,60 | 4,84 | 7,42 | 9,73 | 16,70 |
| `INC` / `SURF` | nominal uang masuk 14/700 | 4,5 | 4,34 **gagal** | 4,46 **gagal** | 4,96 | 4,52 | 9,32 | 4,51 |
| `EXP` / `SURF` | nominal uang keluar 14/700 | 4,5 | 5,06 | 4,44 **gagal** | 7,20 | 4,53 | 6,72 | 4,25 **gagal** |
| `TRF` / `SURF` | nominal transfer 14/700 | 4,5 | 5,64 | 5,87 | 5,78 | 4,61 | 7,70 | 6,00 |
| `INV` / `SURF` | nominal investasi 14/700 | 4,5 | 4,06 **gagal** | 4,06 **gagal** | 4,96 | 3,85 **gagal** | 9,21 | 4,00 **gagal** |
| `WARN` / `SURF` | teks peringatan | 4,5 | 3,62 **gagal** | 3,62 **gagal** | 3,80 **gagal** | 3,62 **gagal** | 9,55 | 3,62 **gagal** |
| `INC` / `INC_S` | pill Aman | 4,5 | 3,67 **gagal** | 3,77 **gagal** | 4,25 **gagal** | 3,83 **gagal** | 7,49 | 3,84 **gagal** |
| `EXP_D` / `EXP_S` | pill Melebihi | 4,5 | 6,28 | 6,41 | 6,12 | 6,31 | 8,99 | 6,38 |
| `TRF` / `TRF_S` | pill transfer | 4,5 | 4,60 | 4,74 | 4,83 | 3,80 **gagal** | 6,71 | 4,89 |
| `INV` / `INV_S` | pill investasi | 4,5 | 3,43 **gagal** | 3,45 **gagal** | 4,16 **gagal** | 3,27 **gagal** | 7,27 | 3,38 **gagal** |
| `WARN_D` / `WARN_S` | pill Pas / banner peringatan | 4,5 | 6,05 | 6,05 | 5,86 | 6,05 | 9,19 | 6,05 |
| `AUTO` / `AUTO_S` | badge Otomatis | 4,5 | 5,30 | 5,21 | 5,02 | 4,32 **gagal** | 7,44 | 5,00 |
| `PRI` / `PRI_S` | chip aktif, tombol soft | 4,5 | 6,28 | 6,73 | 4,19 **gagal** | 6,55 | 6,53 | 16,33 |
| `HERO_FG` / `HERO1` | teks kartu hero (ujung terang gradien) | 4,5 | 5,94 | 5,78 | 4,18 **gagal** | 5,83 | 8,74 | 15,72 |
| `HERO_FG` / `HERO2` | teks kartu hero (ujung gelap gradien) | 4,5 | 11,76 | 13,36 | 10,16 | 15,05 | 15,95 | 20,38 |
| `GOLD` / `HERO2` | aksen grafis di hero | 3,0 | 5,87 | 6,46 | 6,66 | 9,76 | 9,78 | 17,69 |
| `HERO_NEG` / `HERO1` | nominal negatif di hero | 4,5 | 3,51 **gagal** | 3,75 **gagal** | 3,06 **gagal** | 3,87 **gagal** | 5,00 | 7,79 |
| `LINE` / `SURF` | batas kolom isian (non-teks) | 3,0 | 1,32 **gagal** | 1,29 **gagal** | 1,33 **gagal** | 1,30 **gagal** | 1,28 **gagal** | 1,30 **gagal** |
| **Jumlah gagal** | | | **8** | **9** | **8** | **9** | **2** | **7** |

## Temuan

1. **Belum ada tema yang lolos.** Malam paling dekat, dengan 2 kegagalan. Menurut gerbang G2 di [rubrik penilaian desain](design-system/DESIGN-DECISION-RUBRIC.md), tema yang gagal kontras belum boleh dipilih sebagai tema rilis. Token wajib diperbaiki dulu.
2. **Warna semantik terang terlalu pucat untuk teks.** `INC`, `INV`, dan `WARN` dipakai untuk nominal 14 px dan pill 11 px, dan di hampir semua tema terang hasilnya di bawah 4,5. Perbaikannya: gelapkan token teksnya, atau tambahkan token `*_D` khusus teks (seperti `WARN_D` dan `EXP_D` yang sudah lolos) dan pertahankan token terang untuk ikon dan grafik.
3. **`FAINT` gagal di semua tema.** Token ini dipakai untuk label nav tidak aktif dan meta 11 px. Pilihannya: pakai `MUTED` untuk semua teks, atau gelapkan `FAINT` sampai ≥ 4,5. `FAINT` boleh tetap dipakai untuk elemen dekoratif yang bukan teks.
4. **`LINE` terlalu pucat untuk batas kolom isian.** `LINE` boleh tetap dipakai untuk garis pemisah dekoratif, karena garis pemisah tidak wajib 3:1. Kolom isian wajib memakai token batas tersendiri (`FIELD_LINE`) dengan rasio ≥ 3:1 terhadap `SURF`.
5. **Hero:** `HERO_NEG` (nominal negatif di hero) gagal di 4 tema, dan teks hero di Terakota gagal di ujung terang gradien. Gelapkan `HERO1` atau terangkan `HERO_NEG`.
6. **Warna tidak boleh menjadi satu-satunya penanda arti (DS-COLOR-01).** Walaupun kontrasnya lolos, nominal tetap wajib diberi tanda `+` / `−` dan ikon arah.

## Batas bukti

- Pengukuran ini hanya mencakup pasangan token. State hover, tekan, dan disabled di aplikasi diukur ulang setelah komponen dibuat.
- Teks di atas pola dekoratif kartu hero (`hero_pattern`) belum diukur per piksel. Polanya wajib tetap di bawah teks dengan opasitas yang tidak menurunkan rasio di bawah ambang.
- Kontras token bukan bukti bahwa layar lolos. Layar tetap diperiksa sesuai DS-QA-01.
