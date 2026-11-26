# Vynance

Aplikasi keuangan keluarga, mobile-first. Proyek ini masih di tahap kebutuhan, desain, dan aturan. Kode aplikasi belum ada.

## Dokumen

| Dokumen | Isi |
|---|---|
| [docs/BRD-Vynance.md](docs/BRD-Vynance.md) | Kebutuhan bisnis: proses PB-xx, aturan BR-xx, kebutuhan fungsional FR-xx |
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

## Stack (rencana)

Monorepo Bun · Hono · Vite + React + TanStack Router/Query/Form · MySQL + Drizzle · Zod. Alasannya ada di [ADR 0002](docs/adr/0002-monorepo-stack-and-layering.md).

## Review PR

Skill review PR untuk agen ada di [`.agents/skills/pr-code-review/`](.agents/skills/pr-code-review/SKILL.md). Skill ini memeriksa PR terhadap BRD, coding guidelines, design system, dan ADR.
