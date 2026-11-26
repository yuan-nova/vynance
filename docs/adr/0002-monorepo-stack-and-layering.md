# 0002. Monorepo Bun + Hono + TanStack + MySQL dan aturan lapisan

- **Status:** diterima
- **Tanggal:** 2026-11-27
- **Pemilik keputusan:** product owner Vynance
- **Terkait:** [CODING-GUIDELINES.md](../CODING-GUIDELINES.md), BRD §9 (temuan analisa kode), NFR

## Konteks

Aplikasi lama memakai React + Firebase. Analisa kode (BRD §9) menemukan masalah yang bersumber dari arsitektur:
- logika bisnis tersebar di komponen
- kategori dirujuk lewat nama
- tidak ada transaksi DB atomik (saldo dan nilai aset tidak dibalik saat hapus)
- kunci API tersimpan di Firestore

Vynance butuh validasi dan aturan bisnis yang **sama** di frontend dan backend, isolasi data per ruang keluarga, dan uang yang disimpan tanpa float.

## Keputusan

- **D-1. Stack.**

  | Lapisan | Pilihan |
  |---|---|
  | Monorepo | Bun workspaces |
  | API | Hono di Bun |
  | Frontend | Vite + React, SPA + PWA dengan TanStack Router, Query, Form. Bukan TanStack Start, karena semua layar ada di balik login. |
  | Database | MySQL 8 + Drizzle |
  | Validasi | Zod |

- **D-2. Struktur.** Folder `apps/api`, `apps/web`, `apps/worker`, dan `packages/shared`, `packages/db`, `packages/ui`, `packages/config`.
- **D-3. Lapisan backend.** Route → service → repository → db.
  - Route hanya memanggil service.
  - Service boleh memanggil service lain dan repository.
  - Repository boleh memanggil repository lain, tetapi tidak boleh memanggil service.
  - Hanya repository yang menyentuh DB.
  - Tidak boleh ada dependensi melingkar.
- **D-4. Lapisan frontend.** routes → pages → feature components → hooks → services → api-client.
- **D-5. `packages/shared`** memuat semua tipe, fungsi yang dipakai berulang, dan validasi yang dipakai bersama frontend–backend. Isinya TypeScript murni, dengan `zod` sebagai satu-satunya dependensi.
- **D-6. Uang** disimpan sebagai `BIGINT` rupiah utuh. Semua tabel data keluarga punya `space_id`. Relasi lewat FK, bukan nama.

## Alternatif yang ditolak

- **TanStack Start (SSR).** Tumpang-tindih dengan Hono sebagai server. SSR tidak memberi manfaat SEO karena semua layar ada di balik login.
- **Tetap di Firebase.** Tidak ada transaksi lintas dokumen yang praktis untuk saldo + ledger aset, dan aturan akses sulit diuji.
- **Repository dipanggil langsung dari route.** Logika bisnis akan kembali tersebar, persis masalah di aplikasi lama.

## Akibat

- Aturan impor ditegakkan otomatis (dependency-cruiser + Biome) di CI.
- Detail aturan ada di CODING-GUIDELINES.md. ADR ini menjadi alasan di baliknya.
