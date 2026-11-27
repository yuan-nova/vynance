# Vynance

Aplikasi keuangan keluarga, mobile-first. Satu akun bisa punya beberapa **buku** dan mengelolanya bersama anggota yang diundang.

## Menjalankan (Docker)

Butuh Docker dan Bun.

```bash
bun install        # dependensi host + hook pre-commit
bun run dev        # docker compose up -d --build
bun run db:migrate # migrasi DB (setelah ada tabel)
```

| Layanan | Alamat |
|---|---|
| Aplikasi (nginx) | http://localhost:12080 |
| Backend | http://localhost:12081/api/v1/health |
| Frontend (Vite) | http://localhost:12082 |
| MySQL | `localhost:12306`, user `vynance`, DB `vynance`, sandi bawaan `vynance_dev` |

### Migrasi dan seed

```bash
# 1. Ubah/tambah tabel di packages/db/src/schema/ (pakai helper di schema/columns.ts)
bun run db:generate                 # buat file migrasi SQL di packages/db/drizzle/
bun run db:migrate                  # jalankan ke localhost:12306 dari host
docker compose run --rm migrate     # atau jalankan dari container
bun run db:seed                     # data contoh development (ditolak bila NODE_ENV=production)
```

File migrasi wajib ikut di-commit bersama perubahan skema. DB produksi tidak boleh diubah manual.

Log: `bun run dev:logs`. Berhenti: `bun run dev:down`. Detail lingkungan ada di [TSD §3](docs/TSD-Vynance.md#3-lingkungan-dan-port).

## Dokumen

| Dokumen | Isi |
|---|---|
| [docs/BRD-Vynance.md](docs/BRD-Vynance.md) | Kebutuhan bisnis: proses PB-xx, aturan BR-xx, kebutuhan fungsional FR-xx |
| [docs/TSD-Vynance.md](docs/TSD-Vynance.md) | Spesifikasi teknis: arsitektur, lingkungan, ERD, API, keamanan, worker |
| [docs/CODING-GUIDELINES.md](docs/CODING-GUIDELINES.md) | Aturan kode: lapisan, `packages/shared`, validasi, `any`, `useEffect` |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Kontrak UI/UX mobile-first (`DS-*`) |
| [docs/design-system/quick-rules.md](docs/design-system/quick-rules.md) | Ringkasan tabel keputusan UI |
| [docs/design-system/DESIGN-DECISION-RUBRIC.md](docs/design-system/DESIGN-DECISION-RUBRIC.md) | Cara menilai dan memilih bentuk desain secara objektif |
| [docs/THEME-CONTRAST.md](docs/THEME-CONTRAST.md) | Hasil ukur kontras keenam tema |
| [docs/adr/](docs/adr/) | Keputusan arsitektur dan desain |
| [docs/qa/](docs/qa/) | Template dan bukti QA UI |

## Desain

SVG mobile 390 × 844 ada di [`design/`](design/): 17 layar, design system, sitemap, dan papan semua layar. Lima tema alternatif ada di `design/themes/<tema>/`, dengan perbandingan di `design/tema-perbandingan.svg`.

Membuat ulang desain (butuh Python 3):

```bash
cd design/_source
python -I gen_svg.py .. hutan                    # tema awal ke design/
python -I gen_svg.py ../themes/samudra samudra   # tema lain
python -I compare.py                             # lembar perbandingan
python -I contrast.py                            # tabel kontras token
```

## Stack

Monorepo Bun · Hono · Vite + React + TanStack Router/Query/Form · MySQL + Drizzle · Zod. Alasannya ada di [ADR 0002](docs/adr/0002-monorepo-stack-and-layering.md).

## Lint & format

```bash
bun install        # memasang dependensi dan hook pre-commit
bun run lint       # Biome + dependency-cruiser
bun run lint:fix   # perbaiki otomatis
```

Hook pre-commit menjalankan Biome (lint + format) pada file yang di-stage dan memeriksa aturan lapisan. Detailnya ada di [CODING-GUIDELINES §13](docs/CODING-GUIDELINES.md#13-penegakan-otomatis).

## Review PR

Skill review PR untuk agen ada di [`.agents/skills/pr-code-review/`](.agents/skills/pr-code-review/SKILL.md). Skill ini memeriksa PR terhadap BRD, coding guidelines, design system, dan ADR.
