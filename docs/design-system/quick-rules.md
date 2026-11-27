# Design system — aturan cepat (baca sebelum menyentuh UI)

Ringkasan tabel keputusan dari [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md). Setiap baris menyebut ID kontraknya. **Bila ringkasan ini berbeda dengan DESIGN-SYSTEM.md, yang berlaku DESIGN-SYSTEM.md**, dan ringkasan ini diperbaiki di PR yang sama.

Referensi visual: SVG di [`design/`](../../design), terutama `00-design-system.svg` dan `vynance-board.svg`.

Cara pakai:
1. Cari kasusmu di tabel, lalu pakai baris pertama yang cocok.
2. Kalau tidak ada yang cocok, atau ada lebih dari satu bentuk yang mungkin, nilai dengan [rubrik](DESIGN-DECISION-RUBRIC.md) (DS-GOV-02).
3. Sebelum PR: isi bukti di [qa/README.md](../qa/README.md) (DS-QA-01).

## 0. Lima prinsip

| Prinsip | Artinya |
|---|---|
| Satu layar, satu angka | Satu angka utama + satu tugas utama, terbaca dalam 3 detik |
| Jempol dulu | Aksi yang sering dipakai di sepertiga bawah layar |
| Warna punya arti tetap | Hijau masuk · merah keluar · biru transfer · kuning tua investasi, selalu disertai tanda/ikon |
| Satu pola untuk tugas sejenis | Komponen dan urutan yang sama di semua layar |
| Ukur, jangan tebak | Pilihan desain lewat rubrik dan bukti |

## 1. Ukuran dasar

| Hal | Nilai | ID |
|---|---|---|
| Layar desain / uji / minimum | 390 × 844 / 360 / 320 | DS-FOUND-02 |
| Lebar maksimum di tablet/desktop | 480 px, di tengah | DS-FOUND-02 |
| Area sentuh minimum | 44 × 44, jarak 8 | DS-TOUCH-01 |
| Tombol utama | 52 px, lebar penuh di form/sheet | DS-ACTION-01 |
| Kolom isian | 48 px, font ≥ 16 px, label di atas | DS-FORM-01 |
| Bottom nav | 64 px + safe area, 5 slot | DS-NAV-01 |
| Baris daftar | 64 px | DS-DATA-01 |
| Gutter | 20 px (≥ 375), 16 px (< 375) | DS-SPACE-01 |
| Jarak | antar section 24 · dalam section 12–16 · label–kolom isian 8 · antar tombol 8 | DS-SPACE-01 |
| Radius | kartu 20–26 · tombol 16 · kolom isian 14 · tile 12 · chip penuh | DS-SPACE-01 |

## 2. Huruf — DS-TYPE-01

| Peran | Ukuran / tebal |
|---|---|
| Angka hero | 32 / 800 (satu per layar) |
| Judul layar tab / detail | 22 / 800 · 17 / 800 |
| Judul kartu / section | 16 / 800 |
| Judul baris, nominal | 14 / 700, `tabular-nums` |
| Isi | 14 / 500 |
| Keterangan | 12 / 500 |
| Label kecil (grup tanggal, nav, pill) | 11 / 700 |

## 3. Tombol — DS-ACTION-01, DS-ACTION-02

| Butuh | Pakai |
|---|---|
| Menyelesaikan tugas (Simpan, Lanjut, Bayar) | `primary`, **maks. satu per layar/sheet** |
| Aksi sekunder setingkat (Undang, Tambah kategori) | `soft` |
| Batal, Kembali, Lewati | `ghost` |
| Masuk dengan Google/email | `dark` |
| Konfirmasi hapus tak terpulihkan | `destructive` (hanya di sheet konfirmasi) |
| Aksi di kalimat / section head ("Lihat semua") | link teks |

Ikon atau label? Jawab berurutan:
1. Chrome universal (kembali, tutup, cari, notifikasi, ⋮) → **ikon saja** + `aria-label`.
2. CTA form/sheet → **label**.
3. Baris berulang + kata kerja ada di registri → **ikon saja**, maks. 2 per baris.
4. Selain itu → **label wajib**.

## 4. Pilih pola layar — DS-SHEET-01

| Tugas | Pola |
|---|---|
| Singkat, ≤ 6 kolom isian, butuh konteks induk | **Bottom sheet** |
| > 6 kolom isian, bisa dibagikan via URL, atau punya detail | **Layar penuh** |
| Ubah satu nilai di tempat | **Inline edit** |
| Langkah berikut bergantung pada langkah sebelumnya | **Wizard** (panjang saja bukan alasan) |

## 5. Pilih kontrol — DS-FORM-03

| Opsi | Kontrol |
|---|---|
| 2–5, muat satu baris | Chip / segmented |
| ≤ 12, perlu ikon | Kisi pilihan di sheet |
| > 12 atau bertambah | Sheet + cari + "Tambah baru" |
| Tanggal | Chip "Hari ini · Kemarin" + kalender di sheet |
| Ya/tidak langsung berlaku | Toggle |
| Nominal | `MoneyInput` (satu-satunya) |

DILARANG memakai `<select>`, checkbox, atau radio native tanpa komponen bersama, juga `window.confirm`/`alert`.

## 6. Hapus — DS-ACTION-03

| Kasus | Bentuk |
|---|---|
| Bisa dipulihkan (transaksi, kategori, target) | Langsung hapus + snackbar **Urungkan** 6 detik |
| Tak terpulihkan / berdampak luas (rekening + transaksinya, anggota, buku) | Sheet konfirmasi: judul menyebut objek, isi menyebut akibat dalam angka, Batal + Hapus |

## 7. Nominal — DS-MONEY-01, DS-COLOR-01

| Kasus | Tampil |
|---|---|
| Uang masuk | `+Rp287.500` warna `INC` + ikon `in` |
| Uang keluar | `−Rp287.500` (U+2212) warna `EXP` + ikon `out` |
| Transfer, saldo | `Rp287.500` tanpa tanda |
| Nol / tidak ada data | `Rp0` / `—` |
| Tidak muat | Singkat `Rp1,2 M`, nilai penuh lewat ketukan/`aria-label`. **Jangan** dipotong elipsis. |
| Mode privasi | `Rp ••••••` di semua tempat |

## 8. Status — DS-STATE-02

| Domain | Status → tone |
|---|---|
| Anggaran | Aman → inc · Pas → warn · Melebihi → exp |
| Target tabungan | Sesuai jalur → inc · Berisiko → warn · Tercapai → pri |
| Langganan | Aktif → inc · Jatuh tempo ≤ 3 hari → warn · Lewat → exp · Dijeda → netral |

## 9. State layar — DS-STATE-01

Memuat (skeleton) · Kosong (ajakan + tombol) · Tidak cocok filter (+ Atur ulang) · Gagal (+ Coba lagi, data lama tetap) · Offline (pita).

## 10. Umpan balik — DS-STATE-03

| Kanal | Untuk |
|---|---|
| Snackbar | Hasil aksi (+ Urungkan) |
| Error di kolom isian | Validasi |
| Banner | Kondisi yang bertahan (offline, anggaran melebihi) |
| Sheet konfirmasi | Aksi tak terpulihkan |

## 11. Istilah — DS-LANG-01

Uang masuk / Uang keluar · Transfer · Rekening · Anggaran / Sisa anggaran · Target tabungan · Buku · Kode buku · Anggota · Catat transaksi · Simpan · Batal · Hapus · Ubah · Kembali · Urungkan. Menyapa pengguna dengan "kamu", sentence case.

## 12. Sebelum PR — DS-QA-01

- [ ] Sebut ID kontrak yang dipakai. Pola baru → lampirkan hasil rubrik.
- [ ] Tangkapan layar 320 / 360 / 390, tema terang + Malam.
- [ ] State DS-STATE-01 yang relevan.
- [ ] Data terburuk: nama 40 karakter, nominal 13 digit, 0 item, ≥ 200 item.
- [ ] Keyboard + screen reader untuk alur yang diubah.
- [ ] `contrast.py --check` lulus bila token berubah.
- [ ] Tulis batas bukti.
