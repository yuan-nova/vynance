# QA #20 — Ekspor data dan hapus akun (UU PDP)

Diuji di browser, Pengaturan → Data & akun. Akun dev tidak benar-benar dihapus di browser; alur hapus diuji end-to-end di `account.repository.test.ts`.

| Cek | Hasil |
|---|---|
| Unduh JSON | 200, `application/json`, `attachment; filename="vynance-ekspor-2026-11-27.json"`, berisi profil + semua buku |
| Unduh CSV | 200, `text/csv; charset=utf-8` + BOM, header `buku,kode_buku,tanggal,jenis,jumlah,rekening,rekening_tujuan,kategori,catatan` |
| Sheet hapus akun | Akibat dalam angka: "2 buku dihapus beserta 5 transaksi karena tidak ada anggota lain: …" |
| Email salah | "Email tidak cocok dengan akun ini.", sesi tetap aktif |

Integration test (DB nyata):
- Ekspor memuat semua buku tempat ia anggota; CSV menetralkan formula (`=HYPERLINK` → `'=HYPERLINK`) dan mengutip koma/kutip.
- Pratinjau: buku sendiri `willBeDeleted`, buku bersama tidak (1 anggota lain, 1 transaksi).
- Hapus akun: sesi dihapus, nama/email dianonimkan, buku sendiri terhapus, buku bersama tetap dengan anggota lain aktif, transaksi lama tetap ada (BR-53).
