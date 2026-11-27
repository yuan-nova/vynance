# Design System Vynance — Kontrak UI/UX Mobile-First

**Status: aktif, wajib dipatuhi.** Berlaku untuk seluruh antarmuka `apps/web` dan `packages/ui`, serta semua desain baru di `design/`.

Dokumen ini adalah **satu-satunya sumber aturan UI**. Dokumen terkait:

| Dokumen | Isi | Mengikat? |
|---|---|---|
| [design-system/quick-rules.md](design-system/quick-rules.md) | Ringkasan tabel keputusan dari dokumen ini | Tidak. Bila berbeda, dokumen ini yang berlaku. |
| [design-system/DESIGN-DECISION-RUBRIC.md](design-system/DESIGN-DECISION-RUBRIC.md) | Cara menilai dan memilih satu bentuk desain secara objektif | Ya, lewat DS-GOV-02 |
| [THEME-CONTRAST.md](THEME-CONTRAST.md) | Hasil ukur kontras token | Bukti untuk DS-THEME-01 |
| [`design/`](../design) | SVG referensi visual 390 × 844 | Ilustrasi, bukan sumber aturan |
| [CODING-GUIDELINES.md](CODING-GUIDELINES.md) | Arsitektur kode frontend dan backend | Ya, untuk kode |
| [BRD-Vynance.md](BRD-Vynance.md) | Kebutuhan bisnis, aturan BR-xx | Ya, untuk perilaku |
| [adr/](adr/) | Keputusan arsitektur dan desain yang sudah diambil | Ya |

Setiap kontrak punya **ID stabil**, **ketentuan**, **pengecualian**, dan **penerimaan**. Review, PR, dan tiket merujuk ID ini, bukan nomor bagian.

Kata **WAJIB** dan **DILARANG** adalah syarat penerimaan. **BOLEH** hanya berlaku pada kondisi yang disebut. **SEBAIKNYA** adalah anjuran.

## Lima prinsip

| Prinsip | Artinya |
|---|---|
| **Satu layar, satu angka** | Setiap layar dibuka dengan satu angka atau satu tugas paling penting, yang bisa dipahami dalam 3 detik. |
| **Jempol dulu** | Aksi yang sering dipakai ada di sepertiga bawah layar. Bagian atas untuk judul, kembali, dan aksi jarang. |
| **Warna punya arti tetap** | Hijau = uang masuk, merah = uang keluar, biru = transfer, kuning tua = investasi, di semua tema. Warna tidak pernah menjadi satu-satunya penanda arti. |
| **Satu pola untuk tugas sejenis** | Tugas yang sama memakai komponen dan urutan yang sama di semua layar. Pola baru hanya lewat DS-GOV-02. |
| **Ukur, jangan tebak** | Pilihan desain diputuskan dengan rubrik dan bukti (kontras, jumlah ketukan, uji 5 detik), bukan selera. |

---

## 1. Tata kelola

### DS-GOV-01 — Prioritas keputusan

**Ketentuan.** Konsistensi berarti perilaku, semantik, dan token yang sama pada tugas sejenis. Semua layar tidak harus terlihat identik. Bila dua aturan bertentangan, urutannya: **keamanan uang & data pengguna → tugas pengguna → aksesibilitas → pola/komponen bersama → token & layout → estetika.** Pola yang paling banyak dipakai di kode tidak membenarkan pelanggaran kontrak. Standar UI tidak mengubah aturan bisnis BR-xx.

**Pengecualian.** Pengecualian sah hanya bila dicatat di ADR atau issue, dan catatannya menyebut:
- ID kontrak yang dilanggar
- kebutuhan yang tidak bisa dipenuhi kontrak
- alternatif yang ditimbang
- cakupan
- bukti penerimaan
- pemilik keputusan

**Penerimaan.** Review membedakan tiga hal: (1) pelanggaran kontrak, (2) pengecualian yang belum disetujui, (3) estetika opsional. Hanya (1) dan (2) yang memblokir PR.

### DS-GOV-02 — Penilaian desain objektif

**Ketentuan.** Rubrik di [DESIGN-DECISION-RUBRIC.md](design-system/DESIGN-DECISION-RUBRIC.md) WAJIB dipakai bila:
- ada dua atau lebih bentuk desain untuk satu kebutuhan, atau
- sebuah desain memperkenalkan pola atau komponen baru yang belum ada di kontrak ini, atau
- desain mengubah navigasi, tema, atau pola lintas layar.

Penilaian terdiri dari **gerbang lulus/gagal**, lalu **skor berbobot** dengan jangkar terukur. Hasilnya dicatat di issue atau ADR. Alasan seperti "lebih modern", "lebih bagus", atau "aplikasi X begini" bukan kriteria.

**Pengecualian.** Perbaikan yang sudah ditentukan kontrak (misalnya mengganti warna mentah dengan token) tidak perlu dinilai.

**Penerimaan.** Setiap pola baru di kontrak ini merujuk hasil penilaiannya.

### DS-GOV-03 — Penegakan dan pemeliharaan

**Ketentuan.**
- Aturan yang bisa diuji mesin dijaga test kontrak di CI:
  - kontras token: `design/_source/contrast.py --check`
  - larangan warna mentah, `useEffect` di pages/components, dan kontrol native telanjang: lint dan test kontrak di `apps/web`
- Perubahan aturan WAJIB memperbarui dokumen ini, `quick-rules.md`, SVG referensi yang terdampak, dan test terkait **dalam PR yang sama**.
- Setiap ID hanya punya satu definisi. Ringkasan dan checklist hanya merujuk ID.

**Pengecualian.** Kode lama boleh dimigrasi bertahap selama pelanggarannya tercatat sebagai baseline test dan baseline itu hanya boleh turun.

**Penerimaan.** Test kontrak lulus. Ringkasan, referensi, dan test selaras dengan dokumen ini.

---

## 2. Fondasi mobile-first

### DS-FOUND-01 — Satu layar, satu fokus

**Ketentuan.**
1. Setiap layar punya **satu tugas utama** dan **satu angka utama** di bagian atas. Contohnya: Beranda → kekayaan bersih, Anggaran → sisa anggaran bulan ini, Zakat → zakat yang wajib dibayar.
2. **Angka dulu, grafik kemudian.** Grafik hanya ditambahkan bila menjawab pertanyaan yang tidak bisa dijawab satu angka, misalnya tren 6 bulan atau proporsi per kategori.
3. **Tanpa tabel multi-kolom.** Koleksi selalu ditampilkan sebagai daftar baris atau kartu (DS-DATA-01).
4. **Rincian disembunyikan bertahap.** Rincian sekunder dibuka dengan ketukan (baris → detail, kartu → bottom sheet), bukan dijejalkan di layar induk.

**Pengecualian.** Kalender pembayaran langganan boleh memakai grid tanggal.

**Penerimaan.** Uji 5 detik: penguji bisa menyebut angka utama dan aksi utama layar setelah melihatnya 5 detik.

### DS-FOUND-02 — Layar kecil dulu

**Ketentuan.**
- Ukuran desain kanonik **390 × 844** (folder `design/`). Ukuran uji: **360** (Android umum) dan **320** (batas minimum).
- Pada 320 px: tidak ada scroll horizontal halaman, tidak ada teks terpotong tanpa cara membaca lengkapnya, dan nominal Rp hingga 13 digit tetap terbaca.
- Pada tablet dan desktop, aplikasi tetap satu kolom di tengah dengan lebar maksimum **480 px**, dan bottom nav ikut terkunci pada lebar itu.
- Viewport memakai `min-h-svh` / `dvh`, bukan `100vh`.

**Pengecualian.** Pratinjau PDF slip gaji boleh memenuhi layar.

**Penerimaan.** Bukti di 320, 360, 390, dan 768 px (DS-QA-01).

### DS-FOUND-03 — Zona jempol

**Ketentuan.**

| Zona | Isi |
|---|---|
| **Bawah** (mudah dijangkau) | Bottom nav, tombol **+**, CTA utama form/sheet, aksi konfirmasi |
| **Tengah** | Konten: kartu, daftar, kolom isian |
| **Atas** (sulit dijangkau) | Judul, tombol kembali, aksi sekunder/jarang (filter, ⋮, ekspor) |

DILARANG menaruh aksi utama (Simpan, Tambah, Bayar) **hanya** di pojok kanan atas.

**Pengecualian.** Tombol kembali selalu di kiri atas, sesuai konvensi platform.

**Penerimaan.** Aksi utama setiap layar berada di sepertiga bawah viewport 390 × 844.

---

## 3. Shell dan navigasi

### DS-NAV-01 — Navigasi bawah lima slot

**Ketentuan.** Navigasi utama berisi tepat lima slot: **Beranda · Transaksi · [ + ] · Anggaran · Lainnya** ([ADR 0001](adr/0001-bottom-nav-five-slots.md)).
- Tinggi 64 px + `env(safe-area-inset-bottom)`. Ikon 22 px, label 11 px di bawah ikon.
- Tab aktif: warna `PRI`, latar pil `PRI_S`, `aria-current="page"`. Tab tidak aktif memakai `FAINT`, yang sudah diukur ≥ 4,5:1 (lihat THEME-CONTRAST).
- Slot tengah **+** adalah tombol bulat 54 px yang menonjol ke atas dan membuka bottom sheet Catat transaksi. Tekan lama membuka Scan struk, dan aksi ini WAJIB juga tersedia sebagai opsi di sheet, karena tekan lama tidak bisa ditemukan semua orang.
- Tab tetap aktif di semua turunan rutenya, misalnya `/transactions/123` mengaktifkan Transaksi.
- Bottom nav disembunyikan saat keyboard virtual terbuka atau sheet terbuka penuh.

**Pengecualian.** Layar Masuk, Onboarding, dan alur wizard tanpa bottom nav.

**Penerimaan.** Kelima slot ≥ 64 px lebarnya pada 320 px. Label tidak terpotong. Tab aktif benar di daftar dan detail.

### DS-NAV-02 — Bilah atas

**Ketentuan.**
- **Layar tingkat 1** (tab): judul 22/800 di kiri, maksimal dua aksi ikon di kanan (misalnya cari, notifikasi). Pemilih buku aktif ada di Beranda (DS-NAV-04).
- **Layar tingkat 2+**: tombol kembali 44 px (`ArrowLeft`, `aria-label` "Kembali ke {induk}"), judul 17/800 satu baris dengan truncate, dan maksimal satu aksi kontekstual di kanan.
- Tombol kembali menuju **induk informasi**, bukan sekadar riwayat browser, bila pengguna masuk lewat tautan langsung.

**Pengecualian.** Sheet tidak memakai bilah atas. Sheet memakai judul sheet (DS-SHEET-01).

**Penerimaan.** Buka detail lewat URL langsung, lalu tekan kembali: pengguna sampai di daftar induk.

### DS-NAV-03 — Menu Lainnya

**Ketentuan.** Lainnya berisi kisi menu yang dikelompokkan (Uang, Perencanaan, Data), maksimal 4 kolom pada 390 px dengan label di bawah ikon. Urutan grup tetap. Semua anggota buku melihat menu yang sama karena hak aksesnya sama (BR-49). Fitur yang belum rilis ditampilkan nonaktif dengan label "Segera hadir".

**Penerimaan.** Setiap fitur di BRD §12.2 bisa dicapai dalam maksimal dua ketukan dari Lainnya.

### DS-NAV-04 — Buku aktif

**Ketentuan.**
- Buku aktif selalu terlihat di header Beranda sebagai **nama buku + kode buku** (`Keluarga Pratama · K7QM-3XPA`), dan bisa diganti dengan mengetuknya. Pemilih buku berupa bottom sheet berisi daftar buku dengan nama, kode, dan jumlah anggota.
- Nama buku boleh sama (BR-47), jadi **di mana pun buku disebut dalam daftar atau pilihan, kodenya ikut tampil**. Nama saja tidak cukup untuk membedakan buku.
- Kode buku ditulis dengan angka tabular dan format `XXXX-XXXX`.
- Mengganti buku mereset filter dan kembali ke Beranda. Semua layar menampilkan data **hanya** dari buku aktif.

**Penerimaan.** Dengan dua buku bernama sama, pengguna bisa memilih buku yang benar hanya dari pemilih buku. Setelah mengganti buku, tidak ada data buku lama yang tersisa di cache layar mana pun.

---

## 4. Sentuhan dan aksi

### DS-TOUCH-01 — Target sentuh

**Ketentuan.**
- Area sentuh minimal **44 × 44 px**. Ukuran visual boleh lebih kecil (chip 34 px, ikon 22 px) selama area sentuhnya 44 px.
- Jarak antar target bersebelahan minimal 8 px.
- Gestur (geser untuk hapus, tekan lama) **selalu punya alternatif tombol** yang terlihat.

**Pengecualian.** Tautan di dalam kalimat panjang.

**Penerimaan.** Inspeksi: semua elemen interaktif punya area sentuh ≥ 44 px.

### DS-ACTION-01 — Hierarki aksi

**Ketentuan.** Maksimal **satu tombol primer** terlihat per layar atau sheet.

| Varian | Pakai untuk |
|---|---|
| `primary` (PRI, 52 px, lebar penuh di form/sheet) | Aksi yang menyelesaikan tugas: Simpan, Lanjut, Masuk, Bayar |
| `soft` (PRI_S) | Aksi sekunder setingkat: Undang, Tambah kategori |
| `ghost` | Batal, Kembali, Lewati |
| `dark` (INK) | Masuk dengan penyedia luar (Google, email) di layar Masuk |
| `destructive` | Hanya tombol konfirmasi di sheet konfirmasi hapus |
| link teks | Aksi di dalam kalimat atau section head ("Lihat semua") |

DILARANG membuat varian ad hoc lewat class (misalnya `ghost` + warna merah).

**Penerimaan.** Tidak ada layar dengan dua tombol primer terlihat bersamaan.

### DS-ACTION-02 — Ikon saja, label saja, atau ikon + label

**Ketentuan.** Jawab berurutan, lalu berhenti di jawaban "ya" pertama:
1. Kontrol chrome universal (kembali, tutup, cari, notifikasi, ⋮)? → **ikon saja** + `aria-label`.
2. CTA form atau sheet? → **label saja** (boleh ikon depan dari registri).
3. Aksi di baris berulang yang kata kerjanya ada di registri ikon (DS-ICON-01)? → **ikon saja**, maksimal 2 per baris. Selebihnya masuk ⋮ atau geser.
4. Selain itu → **label wajib**.

**Penerimaan.** Setiap tombol ikon punya nama aksesibel yang menyebut objek ("Hapus transaksi Indomaret").

### DS-ICON-01 — Registri ikon

**Ketentuan.** Satu makna, satu ikon, di semua layar. Ikon garis 1,8 px (2 px saat aktif), ukuran 22 px nav, 20 px tombol, 18–19 px di tile.

| Makna | Ikon | | Makna | Ikon |
|---|---|---|---|---|
| Uang masuk | `in` | | Tambah | `plus` |
| Uang keluar | `out` | | Ubah | `edit` |
| Transfer | `transfer` | | Hapus | `trash` |
| Investasi | `coins` | | Scan struk | `scan` |
| Beranda | `home` | | Cari | `search` |
| Transaksi | `list` | | Filter | `filter` |
| Anggaran | `pie` | | Lainnya (nav) | `grid` |
| Target tabungan | `target` | | Menu baris | `more` |
| Langganan | `repeat` | | Undang | `link` |
| Zakat | `moon` | | Privasi nominal | `eye` / `eye_off` |
| Kembali | `chev_l` | | Tutup | `close` |
| Notifikasi | `bell` | | AI advisor | `spark` |
| Rekening bank | `bank` | | Tunai | `cash` |
| Kartu / PayLater | `card` | | Dana pendidikan | `school` |
| Buku | `book` | | Pengaturan | `sliders` |
| Anggota | `users` | | | |

Nama ikon sama dengan kunci `ICONS` di `design/_source/gen_svg.py` dan komponen `Icon` di `packages/ui`. Tanda * berarti ikon belum ada di generator dan wajib ditambahkan sebelum dipakai. Makna baru WAJIB ditambahkan ke registri ini sebelum dipakai.

**Penerimaan.** Tidak ada ikon yang sama untuk dua makna, dan tidak ada dua ikon untuk satu makna.

### DS-ACTION-03 — Aksi destruktif dan Urungkan

**Ketentuan.**
- Hapus yang **bisa dipulihkan** (transaksi, kategori, target): langsung dijalankan, lalu snackbar "Transaksi dihapus · **Urungkan**" selama 6 detik. Tanpa konfirmasi.
- Hapus yang **tidak bisa dipulihkan** atau berdampak luas (hapus rekening beserta transaksinya, keluarkan anggota, hapus buku): bottom sheet konfirmasi dengan judul yang menyebut objek, isi yang menyebut akibat dalam angka ("128 transaksi ikut terhapus"), lalu tombol Batal (`ghost`) dan Hapus (`destructive`).
- DILARANG memakai `window.confirm` / `alert`.

**Penerimaan.** Setiap aksi hapus masuk ke salah satu dari dua jalur di atas.

---

## 5. Pola layar

### DS-SHEET-01 — Bottom sheet, layar penuh, atau inline

**Ketentuan.** Pilih berdasarkan karakteristik tugas, bukan selera:

| Pilih | Bila tugasnya |
|---|---|
| **Bottom sheet** | Singkat (≤ 6 kolom isian), butuh konteks layar induk, selesai tanpa navigasi lanjutan. Contoh: Catat transaksi, filter, pilih kategori, konfirmasi. |
| **Layar penuh** | > 6 kolom isian, punya langkah yang saling bergantung, atau bisa ditautkan/dibagikan lewat URL. Contoh: Wizard anggaran, Tinjau hasil scan, detail transaksi. |
| **Inline edit** | Mengubah satu nilai di tempatnya. Contoh: nominal anggaran satu kategori. |
| **Wizard** | Hanya bila langkah berikutnya **bergantung** pada input langkah sebelumnya. Form yang panjang saja bukan alasan memakai wizard. |

Struktur sheet: pegangan seret 40 × 4 px, judul sheet, konten yang bisa di-scroll sendiri (maksimal 90 svh), CTA tetap di bawah. Sheet bisa ditutup dengan geser ke bawah, ketukan di luar sheet, dan tombol tutup. Bila form sudah diisi, menutup sheet meminta konfirmasi buang draf.

**Penerimaan.** Setiap sheet atau layar baru menyebut baris tabel yang dipakai sebagai alasan.

### DS-DATA-01 — Daftar transaksi dan baris

**Ketentuan.**
- Daftar dikelompokkan per tanggal. Header grup memakai label 11/700 ("HARI INI · KAMIS, 26 NOV") dengan total grup di kanan.
- Anatomi baris (tinggi 64 px):

  ```
  [tile ikon 40] Judul 14/700 [badge opsional]            Nominal 14/700 tabular
                 Kategori · Rekening 12/500                 meta 11/500 opsional
  ```

- Seluruh baris adalah satu target yang menuju detail. Aksi cepat lewat geser kiri (Hapus) dengan alternatif di detail (DS-TOUCH-01).
- Memuat berikutnya dengan scroll tak berujung (cursor), dengan penanda "Memuat lagi…" dan "Semua transaksi sudah tampil" di akhir.

**Penerimaan.** Baris yang sama dipakai di Beranda, Transaksi, Rekening, dan detail kategori.

### DS-DATA-02 — Cari dan filter

**Ketentuan.**
- Filter jenis (Semua / Keluar / Masuk / Transfer) memakai **chip satu baris**, dan boleh di-scroll horizontal di area chip saja.
- Filter lain (rekening, kategori, rentang tanggal, anggota) ada di **sheet Filter**, dengan jumlah filter aktif ditampilkan di tombolnya ("Filter · 2").
- State filter dan bulan disimpan di URL. Ada tombol **Atur ulang** bila filter bukan default.
- Pencarian memakai debounce 300 ms. Hasil kosong karena filter dibedakan dari daftar yang memang kosong (DS-STATE-01).

**Penerimaan.** Muat ulang halaman mempertahankan filter. Kembali dari detail juga mempertahankan filter dan posisi scroll.

### DS-DATA-03 — Angka utama, ringkasan, dan grafik

**Ketentuan.**
- **Kartu hero**: satu angka utama 32/800 + label + maksimal 3 angka pendukung. Satu per layar.
- **Strip ringkasan**: 2–3 metrik dalam satu kartu yang dipisah garis, bukan satu kartu per metrik.
- **Progres anggaran/target**: bar 8 px + nominal "Rp580.000 dari Rp4.000.000" + status pill (DS-STATE-02). Persentase saja tidak cukup.
- **Grafik**: donut untuk proporsi (maksimal 5 irisan + "Lainnya"), bar untuk perbandingan bulan, garis untuk tren. Setiap grafik punya padanan teks (legenda dengan nilai) yang bisa dibaca screen reader.

**Penerimaan.** Semua angka di grafik juga tersedia sebagai teks.

---

## 6. Form

### DS-FORM-01 — Kontrak kolom isian

**Ketentuan.**
- Label di **atas** kolom isian. DILARANG memakai *floating label* atau placeholder sebagai pengganti label.
- Tinggi kolom isian 48 px, font isi **≥ 16 px** (mencegah zoom otomatis iOS).
- Batas kolom isian memakai token `FIELD_LINE` (≥ 3:1 terhadap `SURF` dan `BG`), dan berubah ke `PRI` 1,5 px saat fokus. `LINE` hanya untuk garis pemisah dan kartu dekoratif.
- Keyboard sesuai data: nominal `inputmode="numeric"`, email `type="email"`, telepon `type="tel"`, dan `autocomplete` yang tepat.
- Error tampil di bawah kolom isian (12 px, `EXP_D`), dihubungkan lewat `aria-describedby`. Saat submit gagal, fokus pindah ke error pertama.
- Kolom isian yang fokus digulir ke tengah area di atas keyboard (`scroll-margin`, `visualViewport`).
- CTA lebar penuh di bawah form, menampilkan spinner dan nonaktif saat proses berjalan (mencegah kirim ganda).

**Penerimaan.** Di Safari iOS, fokus ke kolom isian tidak memicu zoom. Kolom isian terbawah tidak tertutup keyboard.

### DS-FORM-02 — Input nominal

**Ketentuan.**
- Komponen `MoneyInput` adalah satu-satunya cara memasukkan nominal.
- Nominal tampil besar (32/800) di sheet Catat transaksi, dengan pemisah ribuan otomatis saat mengetik ("1.500.000").
- Mendukung singkatan "1,5jt" dan "250rb" (parse di `shared/money`).
- DILARANG ada angka desimal untuk rupiah. Gram emas dan unit memakai `DecimalInput` tersendiri.

**Penerimaan.** Mengetik "1500000" tampil "1.500.000", dan nilai yang dikirim `1500000`.

### DS-FORM-03 — Pilihan

**Ketentuan.**

| Jumlah opsi | Komponen |
|---|---|
| 2–5, dan semuanya muat satu baris | Chip / segmented (jenis transaksi, periode) |
| ≤ 12, perlu ikon (kategori, rekening) | Kisi pilihan di sheet |
| > 12 atau bisa bertambah | Sheet dengan pencarian + "Tambah baru" |
| Tanggal | `DateField`: chip "Hari ini · Kemarin" + kalender di sheet |
| Ya/tidak yang langsung berlaku | Toggle 44 × 26 |

DILARANG memakai `<select>`, checkbox, atau radio native tanpa komponen bersama.

**Penerimaan.** Pilihan yang tidak lagi tersedia (kategori atau rekening dihapus) tetap tampil di data lama dengan label "(dihapus)".

---

## 7. Uang, warna, dan tema

### DS-MONEY-01 — Menampilkan nominal

**Ketentuan.**
- Format **"Rp186.450.000"** (tanpa spasi, titik ribuan, tanpa desimal). Diformat oleh `shared/money`, bukan di komponen.
- Tanda selalu tampil: **"+Rp"** untuk masuk, **"−Rp"** (minus U+2212) untuk keluar, tanpa tanda untuk transfer dan saldo.
- Selalu `tabular-nums` dan rata kanan di baris. DILARANG memotong nominal dengan elipsis.
- Bila tidak muat, nominal disingkat dengan sengaja ("Rp1,2 M") dan nilai lengkapnya tersedia lewat ketukan/`aria-label`.
- **Mode privasi** (BR-44) mengganti semua nominal dengan "Rp ••••••" di semua layar, termasuk grafik dan notifikasi.
- Nol tampil "Rp0". Data tidak ada tampil "—".

**Penerimaan.** Uji dengan nominal 13 digit pada 320 px: tidak ada yang terpotong.

### DS-COLOR-01 — Warna dengan arti tetap

**Ketentuan.**

| Arti | Token | Selalu disertai |
|---|---|---|
| Uang masuk | `INC` | tanda + dan ikon panah masuk |
| Uang keluar | `EXP` | tanda − dan ikon panah keluar |
| Transfer | `TRF` | ikon ⇄ |
| Investasi | `INV` | ikon koin |
| Peringatan | `WARN` / `WARN_D` | teks status |
| Otomatis (dari scan/langganan) | `AUTO` | badge "Otomatis" |

- Warna semantik DILARANG dipakai untuk dekorasi atau merek.
- `PRI` adalah warna merek dan aksi, bukan penanda sukses atau uang masuk.
- Warna tidak pernah menjadi satu-satunya penanda arti.

**Penerimaan.** Tampilan grayscale tetap bisa dipahami: masuk/keluar terbedakan lewat tanda dan ikon.

### DS-THEME-01 — Token dan bukti kontras

**Ketentuan.**
- Semua warna, radius, jarak, dan huruf diambil dari token (`packages/ui`, sumbernya `design/_source/themes.py`). DILARANG memakai warna hex atau palet mentah di komponen.
- Setiap tema WAJIB lolos [THEME-CONTRAST.md](THEME-CONTRAST.md): teks 4,5:1, non-teks 3:1, termasuk state aktif, error, dan fokus. Memakai token tidak otomatis berarti lolos.
- Tema dipilih lewat `data-theme` di `<html>`. Mode gelap (Malam) mengikuti `prefers-color-scheme` kecuali pengguna memilih sendiri.
- Perubahan token WAJIB mengukur ulang kontras di PR yang sama.

**Pengecualian.** Garis pemisah dekoratif tidak wajib 3:1. Batas kolom isian tetap wajib 3:1.

**Penerimaan.** `contrast.py --check` lulus untuk setiap tema yang dirilis.

### DS-TYPE-01 — Skala huruf

**Ketentuan.** Satu keluarga huruf per tema. Angka memakai `tabular-nums`.

| Peran | Ukuran / tebal | Pakai |
|---|---|---|
| Angka hero | 32 / 800 | Satu per layar |
| Judul layar (tingkat 1) | 22 / 800 | `h1` |
| Judul layar (tingkat 2) | 17 / 800 | `h1` |
| Judul kartu / section | 16 / 800 | `h2` |
| Isi utama, nominal baris | 14 / 700 | Judul baris, nominal |
| Isi biasa | 14 / 500 | Paragraf |
| Keterangan | 12 / 500 | Sub-baris, hint |
| Label kecil | 11 / 700 | Header grup tanggal, label nav, pill |

- Satu `h1` per layar.
- Huruf kapital semua hanya untuk header grup tanggal, dengan teks sumber tetap dalam sentence case lalu diubah lewat CSS.
- Teks harus tetap terbaca dan tidak tumpang-tindih saat ukuran teks sistem 200%.

**Penerimaan.** Tidak ada ukuran huruf di luar tabel ini.

### DS-SPACE-01 — Jarak, radius, permukaan

**Ketentuan.**
- Kelipatan 4 px.
- Gutter layar **20 px** pada ≥ 375 px dan **16 px** pada < 375 px. Jarak antar section 24, di dalam section 12–16, label–kolom isian 8, antar tombol 8.
- Radius: kartu 20–26, tombol 16, kolom isian 14, chip/pill penuh, tile ikon 12.
- Permukaan: `BG` untuk latar, `SURF` untuk kartu, `SURF2` untuk isian/track. Satu tingkat bayangan, khusus untuk kartu hero dan sheet.

**Penerimaan.** Inspeksi jarak sesuai token. Tidak ada nilai piksel bebas.

---

## 8. State dan umpan balik

### DS-STATE-01 — State koleksi dan layar

**Ketentuan.** Setiap layar data WAJIB mendesain lima state yang **berbeda**:

| State | Bentuk |
|---|---|
| Memuat pertama | Skeleton seukuran komponen asli, bukan spinner layar penuh |
| Kosong (belum ada data) | Ilustrasi kecil + kalimat ajakan + satu tombol ("Catat transaksi pertamamu") |
| Tidak cocok filter | "Tidak ada transaksi yang cocok" + **Atur ulang filter** |
| Gagal | Pesan penyebab + **Coba lagi**. Data lama tetap tampil bila ada. |
| Offline | Pita "Offline — perubahan akan disinkronkan" di bawah bilah atas |

**Penerimaan.** Kelima state ada di desain dan di bukti QA.

### DS-STATE-02 — Pill status

**Ketentuan.** Satu status punya satu label dan satu tone di semua layar. Peta status ada di `shared`.

| Domain | Status → tone |
|---|---|
| Anggaran kategori (BR status anggaran) | Aman → inc · Pas → warn · Melebihi → exp |
| Target tabungan | Sesuai jalur → inc · Berisiko → warn · Tercapai → pri |
| Langganan | Aktif → inc · Jatuh tempo ≤ 3 hari → warn · Lewat → exp · Dijeda → netral |
| Undangan buku | Aktif → pri · Kedaluwarsa / dibatalkan → netral |

Pill: tinggi 22, 11/700, latar tint `*_S`, teks token yang lolos 4,5:1. Tanpa border. Tidak pernah memakai warna primer solid.

**Penerimaan.** Tidak ada status yang ditulis langsung di komponen.

### DS-STATE-03 — Kanal umpan balik

**Ketentuan.**

| Kanal | Untuk |
|---|---|
| Snackbar (bawah, di atas bottom nav, 4–6 detik) | Hasil aksi: tersimpan, terhapus + Urungkan |
| Error di kolom isian | Validasi kolom isian (DS-FORM-01) |
| Banner di layar | Kondisi yang bertahan: offline, anggaran melebihi, sinkron gagal |
| Sheet konfirmasi | Aksi tak terpulihkan (DS-ACTION-03) |
| Notifikasi push | Tagihan jatuh tempo, anggaran 80 %. Hanya bila pengguna mengizinkan. |

Snackbar diumumkan lewat `aria-live="polite"`. Error kritis memakai `assertive`.

**Penerimaan.** Setiap pesan berada di satu kanal yang sesuai tabel.

### DS-MOTION-01 — Gerak

**Ketentuan.**
- Sheet masuk 240 ms `ease-out` dari bawah dan keluar 200 ms.
- Umpan balik tekan langsung (skala 0,97 atau perubahan latar, ≤ 100 ms).
- Angka hero boleh dianimasikan sekali saat pertama dimuat (≤ 600 ms).
- Tidak ada animasi yang memblokir input.
- `prefers-reduced-motion` mengganti gerak dengan fade ≤ 120 ms atau tanpa animasi.

**Penerimaan.** Dengan reduced motion aktif, tidak ada gerak geser atau skala.

---

## 9. Aksesibilitas dan bahasa

### DS-A11Y-01 — Aksesibilitas

**Ketentuan.**
- Standarnya WCAG 2.2 AA.
- Setiap layar punya landmark `main` dan `nav` berlabel, serta urutan fokus yang sama dengan urutan visual.
- Ring fokus terlihat (2 px `PRI`, kontras ≥ 3:1).
- Setiap tombol ikon punya `aria-label` berbahasa Indonesia.
- Grafik punya padanan teks (DS-DATA-03).
- Sheet: fokus masuk ke sheet, terkunci di dalamnya, dan kembali ke pemicu saat ditutup.
- Mendukung ukuran teks sistem 200 %.

**Penerimaan.** Alur utama (masuk → catat transaksi → lihat anggaran) bisa diselesaikan dengan TalkBack/VoiceOver dan keyboard.

### DS-LANG-01 — Bahasa dan istilah

**Ketentuan.** Bahasa Indonesia yang lugas, sentence case, menyapa pengguna dengan "kamu". Pakai glosarium ini:

| Pakai | Jangan |
|---|---|
| Uang masuk / Uang keluar | Income / Expense, Pemasukan / Pengeluaran |
| Transfer | Pindah dana |
| Rekening | Wallet, Dompet digital |
| Anggaran, Sisa anggaran | Budget, Variance |
| Target tabungan | Goal, Sasaran |
| Buku, Kode buku, Anggota | Ruang, Space, Workspace, Tenant, Grup |
| Catat transaksi | Input transaksi, Tambah data |
| Simpan · Batal · Hapus · Ubah · Kembali · Urungkan | Save, Cancel, Submit |

Pesan error menyebut **apa yang terjadi** dan **apa yang bisa dilakukan** ("Saldo BCA tidak cukup. Pilih rekening lain atau ubah nominal."). Teks pesan ada di `shared/errors`.

**Penerimaan.** Tidak ada istilah dari kolom "Jangan" di UI.

### DS-LANG-02 — Format data

**Ketentuan.**
- Nominal: DS-MONEY-01.
- Tanggal panjang: "Kamis, 26 November 2026". Tanggal pendek: "26 Nov".
- Bulan anggaran: "November 2026".
- Jam: "14.30".
- Relatif hanya untuk ≤ 7 hari ("Kemarin", "3 hari lagi").
- Persentase tanpa desimal, kecuali < 1 % ("0,5 %").
- Zona waktu Asia/Jakarta (lewat `shared/date`).

**Penerimaan.** Semua format berasal dari `shared`, bukan dari komponen.

---

## 10. Penerimaan dan review

### DS-QA-01 — Bukti penerimaan UI

**Ketentuan.** PR yang mengubah UI WAJIB menyertakan bukti di deskripsi PR atau `docs/qa/<nomor>/README.md` (template: [qa/README.md](qa/README.md)):
- ID kontrak yang dipakai, dan hasil rubrik bila ada pola baru (DS-GOV-02)
- tangkapan layar 320, 360, 390 px, tema terang dan Malam
- state di DS-STATE-01 yang relevan
- data terburuk: nama 40 karakter, nominal 13 digit, 0 item, ≥ 200 item
- keyboard dan screen reader untuk alur yang diubah
- batas bukti: apa yang **tidak** diperiksa

**Pengecualian.** Bukti komponen bersama boleh dipakai ulang di PR yang sama. Perubahan komponen bersama menguji ulang semua layar pemakainya.

**Penerimaan.** Tangkapan layar saja tidak membuktikan keyboard atau semantik.

### Checklist (hanya merujuk ID)

- [ ] Tata kelola: DS-GOV-01, DS-GOV-02, DS-GOV-03
- [ ] Fondasi: DS-FOUND-01, DS-FOUND-02, DS-FOUND-03
- [ ] Navigasi: DS-NAV-01, DS-NAV-02, DS-NAV-03, DS-NAV-04
- [ ] Sentuhan & aksi: DS-TOUCH-01, DS-ACTION-01, DS-ACTION-02, DS-ICON-01, DS-ACTION-03
- [ ] Pola layar: DS-SHEET-01, DS-DATA-01, DS-DATA-02, DS-DATA-03
- [ ] Form: DS-FORM-01, DS-FORM-02, DS-FORM-03
- [ ] Uang, warna, tema: DS-MONEY-01, DS-COLOR-01, DS-THEME-01, DS-TYPE-01, DS-SPACE-01
- [ ] State: DS-STATE-01, DS-STATE-02, DS-STATE-03, DS-MOTION-01
- [ ] Aksesibilitas & bahasa: DS-A11Y-01, DS-LANG-01, DS-LANG-02
- [ ] Bukti: DS-QA-01

Acuan: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [kontras](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Angka tinggi, jarak, dan durasi di dokumen ini adalah standar produk Vynance, bukan angka wajib WCAG.
