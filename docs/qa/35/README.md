# QA #35 — Notifikasi anggaran 90%

Diuji di browser. Rencana November: Makan & minum dialokasikan Rp2.000.000, terpakai Rp1.900.000.

| Cek | Hasil |
|---|---|
| Lonceng di Beranda sebelum | "Notifikasi", tanpa badge |
| Catat uang keluar Makan Rp10.000 | Lonceng "Notifikasi, 1 belum dibaca", badge "1" (lewat realtime) |
| Layar Notifikasi | "Anggaran Makan & minum hampir habis · Pengeluaran Makan & minum sudah 95% dari anggaran November 2026. · baru saja · baru" — tanpa nominal (aman mode privasi & layar kunci) |
| Tandai semua sudah dibaca | Tombol muncul dengan jumlah belum dibaca |
| Buku → sakelar "Peringatan anggaran 90%" | Tampil, aktif secara bawaan (`book_settings.budget_alert_enabled`) |
| Notifikasi perangkat | Tombol izin eksplisit muncul hanya saat izin browser masih "default"; di browser uji izin "denied" jadi tidak ditawarkan |

Integration test: di bawah 90% tidak ada; dua anggota mencatat bersamaan melewati 90% → tepat satu notifikasi 90% per anggota (UNIQUE budget_alerts); 100% mengirim yang kedua; baca semua → 0; pengaturan mati → tidak ada peringatan. Unit test ambang dan teks tanpa nominal.

Web push saat aplikasi tertutup butuh service worker + VAPID; disiapkan bersama PWA (#44). Saat aplikasi terbuka, notifikasi perangkat memakai Notification API setelah izin.
