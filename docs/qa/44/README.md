# QA #44: PWA dan pencatatan offline (NFR-04, BRD §12.4, TSD §8)

## Otomatis
- `apps/web/src/features/transactions/services/outbox.test.ts`
  - Simpan offline lalu terkirim tepat sekali saat online; simpan ganda dengan kunci yang sama tidak menambah antrean.
  - Jaringan putus di tengah: kirim berhenti, sisa antrean tetap urut.
  - Ditolak server (4xx) dibuang dari antrean.
- `bun run lint`, `typecheck`, `lint:deps`, dan `vite build` lulus.

## Manual
1. **Tepat sekali** (localhost:12080): transaksi "QA offline" dimasukkan ke antrean, lalu dikirim tiga kali dengan Idempotency-Key yang sama (dua flush paralel + kirim ulang). Hasil: antrean kosong, server hanya punya **1** transaksi.
2. **Ditolak server**: item dengan rekening tidak valid dibuang dari antrean dan muncul snackbar "0 transaksi tersinkron, 1 ditolak server. Periksa daftar transaksi."
3. **PWA** (build produksi, `vite preview`): service worker aktif di scope `/`, cache `vynance-shell-v1` berisi `/`, manifest, dan ikon. `<link rel="manifest">` terpasang; ikon 192/512 + maskable.
4. `/api/*` tidak pernah di-cache oleh service worker.

## Belum diuji
- Pasang ke layar utama dan mode pesawat di ponsel fisik.
