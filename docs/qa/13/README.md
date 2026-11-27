# Bukti #13 — Ubah, hapus, dan urungkan transaksi

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 di 360 px, `bun test` ke MySQL dev.

## Cakupan
- Alur: Transaksi → ketuk baris → Detail transaksi (layar penuh `/transaksi/:id`) → Ubah (sheet, form yang sama dengan catat) / Hapus transaksi → kembali ke daftar + snackbar "Transaksi dihapus · Urungkan".
- Kontrak: DS-SHEET-01 (detail = layar penuh), DS-NAV-01 (tab Transaksi aktif di detail), DS-NAV-02 (kembali ke induk), DS-ACTION-03 (hapus yang bisa dipulihkan: langsung + Urungkan 6 detik, tanpa konfirmasi), DS-STATE-03.

## Bukti
| Pemeriksaan | Hasil |
|---|---|
| Detail: tab Transaksi `aria-current`, "Dicatat oleh", "Diubah oleh" setelah ubah | lulus |
| Ubah jumlah 100.000 → 300.000: detail dan saldo ikut berubah | lulus |
| Hapus → kembali ke `/transaksi`, snackbar dengan Urungkan; utang −6.500.000 → −6.200.000 | lulus |
| Urungkan → transaksi kembali di daftar, utang kembali −6.500.000 | lulus |
| Waktu snackbar muncul setelah hapus: semula 7,1 detik (refetch detail 404 diulang 3 kali), setelah perbaikan 51 ms | lulus |
| Tidak ada `window.confirm`/`alert` | lulus (grep) |
| Transaksi buku lain tidak bisa dibaca/diubah/dihapus/dipulihkan | lulus (test) |

## Batas bukti
- Tangkapan layar tidak dibuat.
- Transaksi beli/jual aset tidak bisa diubah/dihapus dari sini sampai #32 (BR-34).
