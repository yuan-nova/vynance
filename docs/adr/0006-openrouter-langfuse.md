# ADR 0006 — LLM lewat OpenRouter, dipantau dengan Langfuse

- Status: diterima
- Tanggal: 2026-11-28
- Menggantikan: [ADR 0005](0005-llm-provider.md) (bagian penyedia saja; aturan persetujuan, data yang dikirim, dan keluaran tidak tepercaya tetap berlaku)

## Konteks
Pemilik produk ingin bebas berganti model tanpa mengganti kode, dan ingin melihat latensi, token, dan biaya tiap panggilan AI.

## Keputusan
- **Penyedia**: OpenRouter (`https://openrouter.ai/api/v1/chat/completions`), dipanggil dengan `fetch` dan di-stream (SSE format OpenAI). Tidak ada SDK tambahan; `@anthropic-ai/sdk` dihapus.
  - Model dipilih lewat `LLM_MODEL` (bawaan `anthropic/claude-opus-5.5`).
  - `max_tokens` 2000. `finish_reason` `length` menambahkan "…", `content_filter` menambahkan pesan penolakan.
  - `LLM_API_KEY` kosong = endpoint 503 `AI_UNAVAILABLE`, sama seperti sebelumnya.
- **Observabilitas**: Langfuse lewat Ingestion API (`/api/public/ingestion`), satu trace + satu generation per pertanyaan, berisi model, waktu, token, biaya, dan status.
  - Fire-and-forget: Langfuse yang gagal hanya dicatat di log.
  - **Isi prompt dan jawaban bawaannya tidak direkam** (`LANGFUSE_CAPTURE_CONTENT=0`), karena berisi angka keuangan pengguna (NFR-02, UU PDP). Persetujuan AI pengguna mencakup penyedia model, bukan alat pemantauan.
  - Tidak ada id pengguna, id buku, atau email yang dikirim ke Langfuse.

## Akibat
- OpenRouter menjadi pemroses data tambahan; layar persetujuan AI sudah menyebut OpenRouter sebagai perantara.
- Menyalakan `LANGFUSE_CAPTURE_CONTENT` di produksi memerlukan dasar hukum dan pembaruan kebijakan privasi; disarankan hanya di development atau dengan Langfuse self-host.
