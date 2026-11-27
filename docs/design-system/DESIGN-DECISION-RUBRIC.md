# Rubrik penilaian desain — memilih bentuk desain secara objektif

Kontrak: **DS-GOV-02** di [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md).

Rubrik ini dipakai untuk memutuskan **bentuk desain mana yang diterapkan** bila ada lebih dari satu pilihan, atau bila sebuah desain membawa pola baru. Tujuannya supaya keputusan bisa diulang: dua penilai yang memakai bukti yang sama sampai pada hasil yang sama, siapa pun yang mengusulkan desainnya.

## Kapan wajib dipakai

- Ada **≥ 2 alternatif** untuk satu kebutuhan. Contoh: Catat transaksi sebagai sheet atau layar penuh, atau memilih tema rilis dari enam tema.
- Desain memperkenalkan **pola atau komponen baru** yang belum ada di DESIGN-SYSTEM.md.
- Desain mengubah **navigasi, tema, atau pola lintas layar**.

Tidak perlu dipakai untuk perbaikan yang sudah ditentukan kontrak, misalnya mengganti warna mentah dengan token atau memperbesar target sentuh ke 44 px.

## Yang BUKAN kriteria

Hal berikut tidak boleh menaikkan atau menurunkan skor:

- Selera pribadi: "lebih bagus", "lebih modern", "lebih bersih".
- "Aplikasi X juga begitu", kecuali disertai data pengguna atau konvensi platform yang terdokumentasi.
- Pola yang paling banyak ada di kode saat ini (DS-GOV-01).
- Siapa yang mengusulkan, atau berapa lama desainnya dibuat.
- Tren visual (glassmorphism, neumorphism, dan sejenisnya) tanpa kebutuhan tugas.

---

## Langkah 1 — Rumuskan kebutuhannya

Tulis dalam satu paragraf sebelum melihat alternatif mana pun:

1. **Tugas pengguna** yang dilayani, dikaitkan ke proses bisnis BRD (PB-xx) dan persona.
2. **Tugas inti yang diukur**: satu atau dua skenario konkret. Contoh: "Rina mencatat belanja Rp287.500 di Indomaret dari rekening BCA, kategori Belanja Bulanan."
3. **Kendala**: aturan BR-xx, kontrak DS-xx yang terkait, dan batas teknis.

Semua alternatif dinilai terhadap skenario yang **sama**.

## Langkah 2 — Gerbang (lulus/gagal)

Setiap alternatif wajib lolos **semua** gerbang. Alternatif yang gagal satu gerbang **gugur** dan tidak diberi skor. Pengecualiannya hanya lewat DS-GOV-01: pengecualian tercatat di ADR.

| # | Gerbang | Cara memeriksa | Lulus bila |
|---|---|---|---|
| G1 | **Kebenaran bisnis** | Bandingkan dengan BR-xx dan PB-xx | Tidak ada aturan bisnis yang salah atau hilang. Angka yang ditampilkan dihitung sesuai rumus BRD. |
| G2 | **Kontras** | `design/_source/contrast.py` untuk token. Untuk warna di luar token, ukur pasangannya. | Teks ≥ 4,5:1, non-teks ≥ 3:1, di tema terang **dan** Malam |
| G3 | **Target sentuh** | Ukur area sentuh di desain | Semua ≥ 44 × 44 px, jarak ≥ 8 px |
| G4 | **Layar kecil** | Render atau periksa desain di 320 px | Tidak ada scroll horizontal. Nominal 13 digit dan nama 40 karakter tidak terpotong tanpa cara membacanya. |
| G5 | **State lengkap** | Periksa desain | Kelima state DS-STATE-01 yang relevan sudah didesain |
| G6 | **Arti tidak hanya lewat warna** | Lihat desain dalam grayscale | Masuk/keluar/status tetap terbedakan |
| G7 | **Kontrak yang ada** | Checklist DESIGN-SYSTEM.md | Tidak melanggar kontrak DS-xx, kecuali kontrak itu memang yang diusulkan untuk diubah (lalu jalur ADR) |
| G8 | **Keamanan data** | Periksa | Tidak menampilkan data buku lain, menghormati mode privasi (BR-44), dan buku bernama sama tetap bisa dibedakan lewat kodenya |

## Langkah 3 — Skor berbobot

Setiap kriteria diberi skor **0–3** berdasarkan **jangkar terukur** di bawah. Skor akhir:

```
Skor = Σ (bobot × skor_kriteria / 3)        → rentang 0–100
```

| # | Kriteria | Bobot |
|---|---|---:|
| K1 | Efisiensi tugas | 25 |
| K2 | Kejelasan | 20 |
| K3 | Konsistensi | 20 |
| K4 | Ergonomi jempol | 10 |
| K5 | Ketahanan data | 10 |
| K6 | Aksesibilitas di atas minimum | 10 |
| K7 | Biaya & performa | 5 |
| | **Total** | **100** |

Bobot boleh diubah per keputusan **hanya sebelum** alternatif dinilai, dengan alasan tertulis. Contoh: untuk memilih tema, K1 tidak relevan, jadi bobotnya dipindah ke K2 dan K6.

### K1 — Efisiensi tugas (25)

Ukur dengan menjalankan skenario Langkah 1 di desain atau prototipe. Hitung **ketukan + ketikan kolom isian + perpindahan layar** dari titik awal sampai tugas selesai. Bandingkan dengan **jumlah minimum teoretis** (langkah yang benar-benar wajib, misalnya nominal + kategori + simpan).

| Skor | Jangkar |
|---|---|
| 3 | ≤ minimum + 1 langkah, tanpa pindah layar yang tidak perlu |
| 2 | minimum + 2–3 langkah |
| 1 | minimum + 4–5 langkah, atau ada satu pindah layar yang bisa dihindari |
| 0 | > minimum + 5, atau tugas tidak bisa diselesaikan tanpa bantuan |

Bila sudah ada prototipe interaktif, tambahkan **waktu penyelesaian median** dari ≥ 5 penguji. Alternatif yang > 20 % lebih lambat dari yang tercepat turun satu skor.

### K2 — Kejelasan (20)

Ukur dengan **uji 5 detik** dan **uji klik pertama** pada ≥ 5 orang dari persona target, atau ≥ 3 orang untuk keputusan kecil. Penguji melihat desain 5 detik, lalu menjawab: "Angka apa yang paling penting?" dan "Untuk mencatat pengeluaran, kamu mengetuk di mana?"

| Skor | Jangkar |
|---|---|
| 3 | ≥ 80 % menjawab angka utama **dan** klik pertama dengan benar |
| 2 | 60–79 % |
| 1 | 40–59 % |
| 0 | < 40 % |

Bila belum bisa menguji orang, ganti dengan **checklist heuristik** (1 poin per butir, skor = poin ÷ 2, dibulatkan ke bawah, maksimal 3):

1. Satu angka utama terlihat jelas (DS-FOUND-01).
2. Aksi utama hanya satu dan terlihat (DS-ACTION-01).
3. Label memakai glosarium DS-LANG-01, tanpa istilah teknis.
4. Status selalu punya teks, bukan hanya warna.
5. Hierarki huruf sesuai DS-TYPE-01, tanpa ukuran di luar skala.
6. Tidak ada elemen yang artinya perlu ditebak (ikon tanpa label di luar registri).

Catat di hasil penilaian bahwa K2 dinilai lewat heuristik, bukan lewat uji pengguna.

### K3 — Konsistensi (20)

Hitung bagian desain yang memakai **komponen dan pola yang sudah ada** (inventaris `packages/ui` dan kontrak DS-xx), dibanding yang **baru**.

| Skor | Jangkar |
|---|---|
| 3 | 0 komponen/pola baru. Tugas sejenis di layar lain memakai urutan dan komponen yang sama. |
| 2 | 1 komponen baru yang **dapat dipakai ulang** di ≥ 2 layar lain dan didokumentasikan |
| 1 | 2 komponen baru, atau 1 komponen yang hanya dipakai di layar ini |
| 0 | ≥ 3 komponen baru, atau tugas sejenis berperilaku berbeda dari layar lain |

### K4 — Ergonomi jempol (10)

Periksa letak aksi yang **sering dipakai** di skenario pada layar 390 × 844, dibagi tiga zona (DS-FOUND-03).

| Skor | Jangkar |
|---|---|
| 3 | Semua aksi yang sering dipakai ada di sepertiga bawah. Tidak ada aksi utama di atas. |
| 2 | Aksi utama di bawah, ada 1 aksi yang sering dipakai di zona atas |
| 1 | Aksi utama di tengah, atau ≥ 2 aksi yang sering dipakai di zona atas |
| 0 | Aksi utama hanya di zona atas |

### K5 — Ketahanan data (10)

Isi desain dengan data terburuk berikut, lalu hitung yang **rusak** (terpotong tanpa jalan baca, tumpang-tindih, tata letak pecah, atau menyesatkan):

1. Nama rekening/kategori 40 karakter
2. Nominal 13 digit (Rp1.234.567.890.123)
3. Nominal 0 dan negatif (utang, saldo minus)
4. 0 item
5. 1 item
6. ≥ 200 item
7. 12 kategori dalam satu anggaran
8. 5 anggota dengan nama mirip, dan 2 buku dengan nama sama
9. Teks sistem 200 %
10. Data lama dengan kategori yang sudah dihapus

| Skor | Jangkar |
|---|---|
| 3 | 0 rusak |
| 2 | 1 rusak, dan bisa diperbaiki tanpa mengubah pola |
| 1 | 2–3 rusak |
| 0 | ≥ 4 rusak, atau ada yang menyesatkan (nominal terpotong menjadi angka lain) |

### K6 — Aksesibilitas di atas minimum (10)

Gerbang G2–G3 sudah memastikan batas minimum. K6 menilai **margin** di atas batas itu:

| Skor | Jangkar |
|---|---|
| 3 | Kontras terendah ≥ 5,5:1 untuk teks, urutan baca screen reader sama dengan urutan visual, semua gestur punya alternatif tombol, dan lolos teks 200 % tanpa kehilangan isi |
| 2 | Kontras terendah 4,5–5,49, dan butir lainnya terpenuhi |
| 1 | Satu butir selain kontras tidak terpenuhi |
| 0 | ≥ 2 butir tidak terpenuhi |

### K7 — Biaya & performa (5)

| Skor | Jangkar |
|---|---|
| 3 | Tanpa dependensi baru, perkiraan ≤ 2 hari kerja, tanpa aset berat |
| 2 | Perkiraan 3–5 hari, atau 1 dependensi kecil (< 10 kB gzip) |
| 1 | Perkiraan 6–10 hari, atau dependensi 10–50 kB, atau animasi/grafik yang berat |
| 0 | > 10 hari, atau dependensi > 50 kB, atau menurunkan target performa (LCP > 2,5 detik di perangkat menengah) |

## Langkah 4 — Siapa yang menilai

- Minimal **dua penilai**, dan salah satunya bukan pengusul desain.
- Setiap penilai memberi skor **sendiri-sendiri** dulu, berdasarkan bukti yang sama, sebelum berdiskusi.
- Bila skor satu kriteria berbeda **≥ 2 poin**, penilai memeriksa ulang buktinya bersama, lalu menyepakati satu skor. Bila skornya berbeda 1 poin, ambil rata-ratanya.
- Pemilik keputusan (product owner) menandatangani hasilnya, tetapi **tidak boleh mengubah skor tanpa bukti baru**.

## Langkah 5 — Aturan keputusan

1. Alternatif yang gugur di gerbang tidak dipertimbangkan.
2. **Skor tertinggi menang** bila selisihnya dengan alternatif kedua **≥ 10 poin**.
3. Bila selisih < 10 poin, ambil yang lebih tinggi di kriteria berikut, berurutan: **K3 Konsistensi → K1 Efisiensi → K5 Ketahanan → K7 Biaya**. Alternatifnya: jalankan uji pengguna (K2) dengan ≥ 5 orang untuk kedua kandidat, lalu nilai ulang.
4. Skor pemenang **< 60** berarti belum ada alternatif yang cukup baik. Perbaiki alternatif terbaik di kriteria terendahnya, lalu nilai ulang.
5. Keputusan dicatat:
   - **Pola lintas layar, navigasi, tema** → ADR baru di `docs/adr/`, lalu kontraknya ditambahkan ke DESIGN-SYSTEM.md.
   - **Keputusan satu layar** → komentar di issue/PR, dengan tabel penilaian.

## Template hasil penilaian

Salin ke issue, PR, atau ADR:

```markdown
## Penilaian desain: <kebutuhan>

**Kebutuhan:** <tugas pengguna, PB-xx, persona>
**Skenario yang diukur:** <skenario konkret>
**Kontrak terkait:** DS-xx, BR-xx
**Penilai:** <nama 1>, <nama 2> · **Pemilik keputusan:** <nama>
**Bobot:** standar | diubah: <alasan>

### Gerbang
| Gerbang | Alt A | Alt B |
|---|---|---|
| G1 Kebenaran bisnis | lulus | lulus |
| G2 Kontras | lulus (min 4,8) | gagal (`INV`/`SURF` 4,06) |
| … | | |

### Skor (hanya alternatif yang lulus gerbang)
| Kriteria | Bobot | Alt A | Bukti |
|---|---:|---:|---|
| K1 Efisiensi | 25 | 3 | 4 langkah, minimum 3 |
| K2 Kejelasan | 20 | 2 | heuristik 5/6 |
| K3 Konsistensi | 20 | 3 | 0 komponen baru |
| K4 Jempol | 10 | 3 | Simpan di zona bawah |
| K5 Ketahanan | 10 | 2 | nominal 13 digit wrap; bisa diperbaiki |
| K6 Aksesibilitas | 10 | 2 | kontras min 4,8 |
| K7 Biaya | 5 | 3 | tanpa dependensi |
| **Skor** | | **86,7** | |

### Keputusan
<alternatif terpilih, aturan keputusan yang dipakai, tindak lanjut>

### Batas bukti
<apa yang belum diuji, misalnya: K2 dari heuristik, belum diuji ke pengguna>
```

---

## Contoh 1 — Memilih tema rilis (gerbang saja, data nyata)

**Kebutuhan:** satu tema terang sebagai bawaan dan satu tema gelap. **Bobot diubah:** K1 dan K4 tidak relevan karena layout sama di semua tema; bobotnya (35) dipindah ke K2 (+15), K6 (+15), dan K3 (+5).

**Gerbang G2** (dari [THEME-CONTRAST.md](../THEME-CONTRAST.md), 27 November 2026):

| Tema | Gagal, ukur awal | G2 awal | Gagal, setelah perbaikan token | G2 sekarang |
|---|---:|---|---:|---|
| Hutan | 8 | gagal | 0 | lulus |
| Samudra | 9 | gagal | 0 | lulus |
| Terakota | 8 | gagal | 0 | lulus |
| Anggrek | 9 | gagal | 0 | lulus |
| Malam | 2 | gagal | 0 | lulus |
| Citrus | 7 | gagal | 0 | lulus |

**Hasil:** pada ukur awal tidak ada tema yang boleh dinilai, karena semuanya gugur di G2. Sesuai aturan keputusan, token diperbaiki lalu diukur ulang (lihat bagian Riwayat di THEME-CONTRAST). Sekarang keenam tema lulus G2, jadi langkah berikutnya menilai K2–K7 untuk memilih tema terang bawaan, dengan Malam sebagai tema gelap. Contoh ini menunjukkan gerbang mencegah keputusan berbasis tampilan: tema yang "terlihat paling bagus" tidak bisa dipilih sebelum kontrasnya lolos.

## Contoh 2 — Catat transaksi: bottom sheet atau layar penuh (ilustrasi)

> Angka di contoh ini **ilustrasi cara menghitung**, bukan hasil uji. Keputusan sebenarnya memakai bukti nyata.

**Skenario:** Rina mencatat belanja Rp287.500 di Indomaret dari BCA, kategori Belanja Bulanan, tanggal hari ini. Minimum teoretis: buka (1) + nominal (1) + kategori (1) + simpan (1) = **4 langkah**. Rekening dan tanggal memakai nilai bawaan.

| Kriteria | Bobot | A: Bottom sheet | B: Layar penuh |
|---|---:|---|---|
| Gerbang G1–G8 | | lulus | lulus |
| K1 Efisiensi | 25 | 3 (4 langkah) | 2 (6 langkah: pindah layar + kembali) |
| K2 Kejelasan | 20 | 2 (heuristik 5/6) | 2 (heuristik 5/6) |
| K3 Konsistensi | 20 | 3 (sheet sudah dipakai di filter dan konfirmasi) | 2 (1 pola layar form baru) |
| K4 Jempol | 10 | 3 (semua di sepertiga bawah) | 2 (kategori di tengah atas) |
| K5 Ketahanan | 10 | 2 (12 kategori perlu scroll di sheet) | 3 |
| K6 Aksesibilitas | 10 | 2 | 2 |
| K7 Biaya | 5 | 3 | 3 |
| **Skor** | | **25 + 13,3 + 20 + 10 + 6,7 + 6,7 + 5 = 86,7** | **16,7 + 13,3 + 13,3 + 6,7 + 10 + 6,7 + 5 = 71,7** |

**Keputusan (ilustrasi):** A menang dengan selisih 15 poin (≥ 10). Tindak lanjut dari K5: kisi kategori di sheet memakai scroll sendiri, dan ada pencarian bila jumlahnya > 12 (DS-FORM-03).
