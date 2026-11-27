# 0003. Tema rilis: Hutan (terang) + Malam (gelap)

- **Status:** usulan. Menunggu skor penilai 2 (lihat Langkah 4 rubrik).
- **Tanggal:** 2026-11-27
- **Pemilik keputusan:** pemilik produk Vynance
- **Terkait:** BRD §12.5, [DESIGN-DECISION-RUBRIC](../design-system/DESIGN-DECISION-RUBRIC.md) contoh 1, [THEME-CONTRAST](../THEME-CONTRAST.md), DS-THEME-01, issue #21

## Konteks

Vynance punya enam tema (`design/_source/themes.py`). Layout dan komponen sama, yang berbeda hanya token warna dan jenis huruf. Rilis butuh satu tema terang bawaan dan satu tema gelap. Keenam tema lulus gerbang G2 (kontras) per 27 November 2026 (`python -I design/_source/contrast.py --check` → 0 gagal). Tema gelap hanya ada satu, Malam, jadi yang dipilih lewat rubrik adalah tema terangnya.

**Bobot diubah sebelum menilai** (sesuai contoh 1 rubrik): K1 Efisiensi dan K4 Jempol tidak relevan karena layout sama di semua tema. Bobotnya (35) dipindah ke K2 (+15), K6 (+15), dan K3 (+5).

| Kriteria | Bobot |
|---|---:|
| K2 Kejelasan | 35 |
| K3 Konsistensi | 25 |
| K5 Ketahanan data | 10 |
| K6 Aksesibilitas di atas minimum | 25 |
| K7 Biaya & performa | 5 |

## Bukti yang sama untuk semua penilai

| Tema terang | Kontras teks terendah | Huruf | Huruf sama dengan Malam? | Catatan semantik |
|---|---:|---|---|---|
| Hutan | 4,68 (`FAINT`/`SURF`, `TRF`/`TRF_S`) | Plus Jakarta Sans | ya | hijau/merah/biru/kuning tua standar |
| Samudra | 4,68 (`FAINT`/`SURF`) | Manrope | tidak | transfer ungu-biru (pengecualian) |
| Terakota | 4,65 (`INV`/`INV_S`) | DM Sans | tidak | standar |
| Anggrek | 4,66 (`HERO_NEG`/`HERO1`) | Outfit | tidak | standar |
| Citrus | 4,70 (`FAINT`/`SURF`) | Space Grotesk | tidak | standar |

Sumber kontras: keluaran `contrast.py` (tabel lengkap di THEME-CONTRAST). Token Hutan dan Malam sudah terpasang di `packages/ui/src/tokens.css` sejak tiket #5.

## Penilaian

### Penilai 1: Claude (AI, juga pengusul)

| Kriteria | Bobot | Hutan | Samudra | Terakota | Anggrek | Citrus | Bukti |
|---|---:|---:|---:|---:|---:|---:|---|
| K2 Kejelasan | 35 | 3 | 3 | 3 | 3 | 3 | Heuristik 6/6 untuk semua: layout dan label sama, status selalu bertext. Belum uji 5 detik. |
| K3 Konsistensi | 25 | 3 | 2 | 2 | 2 | 2 | Hutan memakai huruf yang sama dengan Malam dan token yang sudah terpasang. Tema lain menambah keluarga huruf kedua, sehingga tipografi terang dan gelap berbeda. |
| K5 Ketahanan | 10 | 3 | 3 | 3 | 3 | 3 | Layout sama. Lebar huruf alternatif terhadap nominal 13 digit belum diukur. |
| K6 Aksesibilitas | 25 | 2 | 2 | 2 | 2 | 2 | Kontras terendah semua tema di rentang 4,5–5,49. |
| K7 Biaya | 5 | 3 | 1 | 1 | 1 | 1 | Hutan: 0 aset baru. Lainnya: satu keluarga huruf tambahan, 4–5 ketebalan (perkiraan > 10 kB). |
| **Skor** | | **91,7** | **80,0** | **80,0** | **80,0** | **80,0** | Σ bobot × skor ÷ 3 |

### Penilai 2: belum ada

Wajib diisi orang yang **bukan pengusul**, dengan bukti di atas, **sebelum** melihat skor penilai 1 bila memungkinkan. Bila skor satu kriteria berbeda ≥ 2 poin dengan penilai 1, bukti diperiksa ulang bersama.

| Kriteria | Bobot | Hutan | Samudra | Terakota | Anggrek | Citrus | Bukti |
|---|---:|---:|---:|---:|---:|---:|---|
| K2 Kejelasan | 35 | | | | | | |
| K3 Konsistensi | 25 | | | | | | |
| K5 Ketahanan | 10 | | | | | | |
| K6 Aksesibilitas | 25 | | | | | | |
| K7 Biaya | 5 | | | | | | |

## Keputusan (usulan)

- **D-1.** Tema terang bawaan: **Hutan**. Selisih penilai 1 terhadap alternatif terbaik 11,7 poin (≥ 10), jadi menurut aturan keputusan Hutan menang tanpa pemecah seri.
- **D-2.** Tema gelap: **Malam** (satu-satunya tema gelap, lulus G2 dengan kontras teks terendah 5,00).
- **D-3.** Tidak ada perubahan token. `packages/ui/src/tokens.css` sudah berisi Hutan + Malam.

Status berubah menjadi **diterima** setelah penilai 2 mengisi skornya dan totalnya tetap memenangkan Hutan dengan selisih ≥ 10. Bila selisihnya < 10, berlaku pemecah seri rubrik (K3 → K1 → K5 → K7) atau uji 5 detik dengan ≥ 5 orang.

## Alternatif yang ditolak (sementara)

- **Samudra, Terakota, Anggrek, Citrus.** Tidak lebih jelas atau lebih aksesibel dari Hutan menurut bukti yang ada. Mereka kalah di K3 dan K7 karena menambah keluarga huruf kedua.

## Batas bukti

- K2 dinilai lewat heuristik, belum lewat uji 5 detik atau uji klik pertama.
- Keunggulan Hutan sebagian besar datang dari K3 dan K7, yaitu tema yang sudah terpasang dan huruf yang sama dengan Malam. Ini bias "tema yang sudah ada" yang sah menurut rubrik, tapi penilai 2 perlu menimbangnya.
- Lebar huruf alternatif belum diukur terhadap data terburuk K5.

## Akibat

- Tidak ada pekerjaan token atau aset tambahan untuk rilis.
- Tema lain tetap tersedia sebagai opsi lanjutan. Bila nanti dipasang, setiap tema wajib lolos `contrast.py --check` dan memakai huruf yang sama dengan pasangan gelapnya, atau menambah tema gelap sendiri.
