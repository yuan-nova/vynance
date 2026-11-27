# Architecture Decision Records (ADR)

ADR mencatat keputusan arsitektur dan desain yang **sudah diambil**, beserta konteks dan alternatif yang ditolak. Tujuannya supaya keputusan yang sama tidak dibahas ulang, dan setiap orang tahu alasannya.

## Kapan menulis ADR

- Pola atau aturan lintas layar, navigasi, atau tema (hasil [rubrik penilaian desain](../design-system/DESIGN-DECISION-RUBRIC.md), DS-GOV-02).
- Pengecualian terhadap kontrak DESIGN-SYSTEM.md atau CODING-GUIDELINES.md (DS-GOV-01).
- Pilihan teknologi, struktur data, atau batas modul yang sulit diubah nanti.

Keputusan satu layar cukup dicatat di issue/PR.

## Aturan

- Nama file `NNNN-judul-singkat.md`, nomor naik berurutan dan **tidak dipakai ulang**.
- ADR yang sudah diterima tidak diubah isinya. Keputusan baru yang menggantikannya ditulis sebagai ADR baru, lalu ADR lama diberi status `digantikan oleh NNNN`.
- Format mengikuti [0000-template.md](0000-template.md).

## Daftar

| No | Judul | Status |
|---|---|---|
| [0001](0001-bottom-nav-five-slots.md) | Navigasi bawah lima slot dengan tombol tambah di tengah | diterima |
| [0002](0002-monorepo-stack-and-layering.md) | Monorepo Bun + Hono + TanStack + MySQL dan aturan lapisan | diterima |
| [0003](0003-release-theme.md) | Tema rilis: Hutan (terang) + Malam (gelap) | usulan |
