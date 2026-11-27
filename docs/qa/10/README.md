# Bukti #10 — Onboarding: buku Pribadi, data bawaan, saldo awal

Penguji: Claude (agen). Tanggal: 2026-11-27. Cara: preview browser T3 (profil incognito, 320 px), `bun test` ke MySQL dev.

## Cakupan
- Alur: akun baru (OTP) → buku "Pribadi" otomatis + data bawaan → `/mulai` (02b, langkah 2 dari 3) → langkah 3 "Kelola sendiri atau bersama?" → Beranda.
- Kontrak: DS-NAV-01 (Onboarding tanpa bottom nav), DS-FORM-02 (`MoneyInput`, singkatan "28,64jt"), DS-ACTION-01 (satu primary per layar), DS-STATE-01, DS-LANG-01.
- Aturan: PB-01, BR-46, BR-54.

## Bukti
| Pemeriksaan | Hasil |
|---|---|
| Akun baru → `GET /books` = ["Pribadi"] tanpa langkah manual | lulus |
| `/` → `/mulai` selama `onboardedAt` kosong | lulus |
| Tiga rekening bawaan tampil: Dompet Tunai, Bank, Kartu Kredit | lulus |
| Total kas dihitung langsung: 850.000 + "28,64jt" = Rp29.490.000; utang tidak masuk kas | lulus |
| Lanjut → langkah 3 → Kelola sendiri → Beranda dengan bottom nav | lulus |
| Tanpa scroll horizontal di 320 px | lulus |
| Buku baru berisi 3 rekening, 10 kategori keluar, 4 kategori masuk | lulus (test) |
| Insert data bawaan gagal → tidak ada buku setengah jadi | lulus (test) |
| Saldo awal ke rekening buku lain → 404 tanpa perubahan sebagian | lulus (test) |

## Batas bukti
- "Waktu login pertama sampai Beranda ≤ 60 detik dalam uji pengguna" belum diukur dengan pengguna nyata. Alurnya 3 layar dengan 1 form.
- Tombol "Undang anggota" nonaktif ("Segera hadir") sampai #25.
- Tangkapan layar tidak dibuat.
