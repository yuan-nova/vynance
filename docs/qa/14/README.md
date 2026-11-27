# QA #14 — Rencana bulanan

Diuji di browser 320×700, `/anggaran?bulan=2026-11`.

| Cek | Hasil |
|---|---|
| Tambah penghasilan "Gaji" Rp10.000.000 + plafon Rp6.000.000 | Hero Rp10.000.000, "Belum diatur" Rp10 jt |
| Simpan otomatis ±0,6 detik | Status "Tersimpan otomatis" |
| Konflik: PUT dari luar (versi sama), lalu ubah di UI | API 409, snackbar "Rencana bulan ini baru diubah anggota lain. Data terbaru sudah dimuat.", plafon dimuat ulang ke Rp7.000.000 |
| Scroll horizontal | Tidak ada (scrollWidth 305 ≤ 320) |
