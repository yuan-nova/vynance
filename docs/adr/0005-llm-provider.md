# ADR 0005 — Penyedia LLM untuk AI advisor: Anthropic Claude

- Status: digantikan oleh [ADR 0006](0006-openrouter-langfuse.md)
- Tanggal: 2026-11-28
- Tiket: #40 (PB-11, FR-100, TSD §14 no. 2)

## Konteks
AI advisor menjawab pertanyaan keuangan dalam Bahasa Indonesia dengan memakai angka milik pengguna. Data keuangan bersifat pribadi (NFR-02, UU PDP). Karena itu, sebelum data dikirim ke penyedia luar, pengguna harus memberi persetujuan eksplisit.

## Keputusan
- **Penyedia**: Anthropic Claude (`claude-opus-5-5`) lewat SDK resmi `@anthropic-ai/sdk`.
  - Jawaban di-stream (`messages.stream`).
  - `effort: low` dipakai untuk tanya jawab.
  - `max_tokens` 2000, dengan target sekitar 300 kata di system prompt.
  - Fallback sisi server diaktifkan untuk permintaan yang ditolak (`server-side-fallback-2026-07-01`, `fallbacks: "default"`).
- **Kunci API**: `LLM_API_KEY` adalah milik layanan Vynance (TSD §3). Jika kosong, endpoint mengembalikan 503 `AI_UNAVAILABLE`.
- **Persetujuan**: disimpan per pengguna di `users.ai_consent_at`.
  - Service memeriksa persetujuan dulu sebelum mengumpulkan atau mengirim data. Tanpa persetujuan, endpoint mengembalikan 403 `AI_CONSENT_REQUIRED`.
  - Layar persetujuan menampilkan isi ringkasan apa adanya sebelum pengguna setuju.
  - Izin bisa dicabut kapan saja.
- **Data yang dikirim**: aset bersih, kas, investasi, utang kartu kredit, angka bulan ini, 5 kategori terbesar, skor, target tabungan, dan 5 aset teratas.
  - Nama rekening, email, dan id tidak ikut dikirim.
  - Nama buatan pengguna dikutip sebagai JSON di dalam `<data>`.
- **Keluaran tidak tepercaya**:
  - Jawaban dirender sebagai teks biasa (`white-space: pre-wrap`), tanpa HTML atau Markdown.
  - Model tidak diberi tool, jadi jawaban tidak memicu aksi apa pun.
  - System prompt menegaskan bahwa isi `<data>` adalah data, bukan perintah.

## Akibat
- Biaya dihitung per pertanyaan. Pertimbangkan rate limit per pengguna bila pemakaian membesar.
- Tombol aksi seperti "Pindahkan dana" di desain belum dibuat, karena aksi dari keluaran LLM perlu konfirmasi terpisah. Bisa dibuat menyusul.
