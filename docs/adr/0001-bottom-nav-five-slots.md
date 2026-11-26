# 0001. Navigasi bawah lima slot dengan tombol tambah di tengah

- **Status:** diterima
- **Tanggal:** 2026-11-27
- **Pemilik keputusan:** product owner Vynance
- **Terkait:** BRD §12.1–12.2, PB-02, PB-03, DS-NAV-01, DS-FOUND-03

## Konteks

Tugas yang paling sering di Vynance adalah **mencatat transaksi** (PB-02), beberapa kali sehari, sering dengan satu tangan saat di kasir. Aplikasi lama (`dompet-keluarga`) menaruh semua menu sejajar, sehingga mencatat transaksi butuh pindah layar dulu.

Di sisi lain, ada 12 fitur sekunder (Rekening, Target tabungan, Investasi, Langganan, Zakat, Dana pendidikan, Sumber penghasilan, Slip gaji, Kategori, Keluarga, Pengaturan, AI advisor) yang tidak mungkin semuanya menjadi tab tanpa memperkecil target sentuh di bawah 44 px pada layar 320 px.

## Keputusan

- **D-1.** Navigasi bawah berisi tepat lima slot: **Beranda · Transaksi · [ + ] · Anggaran · Lainnya**.
- **D-2.** Slot tengah adalah tombol tambah bulat 54 px yang membuka bottom sheet Catat transaksi. Tekan lama membuka Scan struk. Opsi Scan struk juga tersedia di dalam sheet, karena tekan lama tidak bisa ditemukan semua orang.
- **D-3.** Fitur sekunder dikelompokkan di layar **Lainnya** (Uang, Rencana, Keluarga, Akun), maksimal dua ketukan dari mana pun.
- **D-4.** Bottom nav disembunyikan di Masuk, Onboarding, wizard, dan saat keyboard virtual terbuka.

## Penilaian

Pada 320 px, lima slot memberi lebar 64 px per slot, cukup untuk target 44 px dan label 11 px tanpa terpotong ("Transaksi" adalah label terpanjang). Mencatat transaksi dari layar tab mana pun: buka (1) + nominal (1) + kategori (1) + simpan (1) = 4 langkah, sama dengan minimum teoretis (K1 = 3).

## Alternatif yang ditolak

- **Empat tab tanpa tombol tengah, dengan FAB melayang di kanan bawah.** FAB menutupi nominal di baris daftar paling bawah, dan posisinya di pojok kanan kurang terjangkau ibu jari kiri.
- **Enam tab atau lebih (menambah Rekening).** Lebar slot < 54 px di 320 px. Label "Rekening" dan "Transaksi" terpotong, gagal gerbang G4.
- **Tombol tambah di bilah atas.** Berada di zona sulit dijangkau, melanggar DS-FOUND-03 (K4 = 0).

## Akibat

- Fitur baru tidak boleh menambah tab. Fitur baru masuk ke Lainnya, atau menggantikan tab lewat ADR baru.
- Kontrak DS-NAV-01 dan DS-NAV-03 di DESIGN-SYSTEM.md mengikuti ADR ini.
