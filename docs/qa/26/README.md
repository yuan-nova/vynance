# QA #26 — Anggota, keluar, aktivitas

Diuji di browser (Lainnya → Buku) dan iframe 320 px. Alur dua anggota diuji di integration test karena akun dev hanya satu.

| Cek | Hasil |
|---|---|
| Seksi Anggota | "Anggota · Akses sama", tanpa label peran; baris diri sendiri berpill "Kamu" + email + tanggal bergabung + tombol Keluar |
| Keluar sebagai anggota terakhir | Sheet "Kamu anggota terakhir · Buku harus punya minimal satu anggota… Hapus bukunya…" dengan tombol Hapus buku (BR-51) |
| Aktivitas terbaru | Kalimat per aksi + waktu relatif ("4 mnt lalu"): undangan, arsip rekening, target, dll.; nominal disamarkan saat mode privasi |
| 320 px | Tidak ada elemen keluar layar |

Integration test (`members.repository.test.ts`): daftar anggota tanpa `role`, `isMe`; anggota mana pun mengeluarkan anggota lain → akses langsung 404, transaksi yang ia catat tetap `created_by` dia (BR-53); keluar; anggota terakhir 409 `BOOK_LAST_MEMBER`; aktivitas memuat nama pelaku.
