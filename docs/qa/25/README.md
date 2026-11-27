# QA #25 — Undangan anggota

Diuji di browser (profil default = anggota, profil incognito = belum login) dan iframe 320 px.

| Cek | Hasil |
|---|---|
| Buku → Undang anggota | Sheet menjelaskan akses sama, berlaku 7 hari, sekali pakai; "Belum ada undangan" |
| Buat tautan undangan | Tautan `…/undangan/<43 karakter>` tampil sekali; Salin tautan; Bagikan ke WhatsApp (`wa.me/?text=Gabung ke buku "…" di Vynance: <tautan>`) |
| Daftar undangan | "Aktif · berlaku sampai 4 Des 2026" + Batalkan |
| Buka tautan tanpa login | "Anggota buku mengundangmu ke buku <nama> · Kode XC4V-AWRD · Aktif sampai 4 Des 2026" + "Masuk untuk bergabung" → `/masuk?redirect=/undangan/<token>` |
| Buka tautan sebagai anggota → Gabung | Snackbar "Kamu sudah menjadi anggota buku ini.", kembali ke Beranda; token tidak terpakai |
| Batalkan lalu buka lagi | "Dibatalkan" + "Tautan undangan ini sudah dibatalkan oleh anggota buku." |
| Token asing | "Undangan tidak bisa dibuka · Tautan undangan tidak dikenali. Minta tautan baru ke anggota buku." |
| 320 px | Tidak ada elemen keluar layar |
| Log api | Token mentah tidak muncul (0 baris); path error disamarkan `/invitations/[token]` |

Integration test: hash SHA-256 di DB (token mentah tidak tersimpan), pratinjau publik, terima → anggota, pakai ulang 410 `INVITATION_USED`, anggota 409 tanpa memakai token, dibatalkan 410 `INVITATION_REVOKED`, kedaluwarsa 410 `INVITATION_EXPIRED`, token asing 404, daftar undangan hanya untuk anggota.
