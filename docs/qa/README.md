# Bukti QA UI

Folder ini menyimpan bukti penerimaan UI sesuai **DS-QA-01** di [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md). Setiap PR UI yang buktinya tidak muat di deskripsi PR membuat folder `docs/qa/<nomor-PR-atau-issue>/` berisi `README.md` dan tangkapan layar.

## Penamaan tangkapan layar

`<state>-<lebar>-<tema>.png`. Contoh: `default-320-terang.png`, `kosong-390-malam.png`, `gagal-360-terang.png`, `before-390-terang.png`.

## Template `README.md`

```markdown
# Bukti #<nomor> — <judul singkat>

Basis commit: <sha>. Penguji: <nama>. Tanggal: YYYY-MM-DD.

## Cakupan
- Layar/alur: <…>
- Kontrak: DS-xx, DS-xx
- Pola baru: tidak ada | ada → hasil rubrik: <tautan issue/ADR>
- Aturan bisnis yang tersentuh: BR-xx (tidak berubah | berubah: <…>)

## Bukti
| Pemeriksaan | Hasil | Berkas |
|---|---|---|
| 320 / 360 / 390 / 768 px tanpa scroll horizontal | lulus | `default-320-terang.png` … |
| Tema terang + Malam | lulus | |
| State: memuat / kosong / tidak cocok filter / gagal / offline | lulus (offline tidak relevan: <alasan>) | |
| Data terburuk: nama 40 karakter, nominal 13 digit, 0 item, ≥ 200 item | lulus | |
| Mode privasi menyembunyikan semua nominal | lulus | |
| Akses buku: dua akun anggota melihat data yang sama; akun bukan anggota ditolak; dua buku bernama sama bisa dibedakan | lulus | |
| Keyboard: urutan fokus, ring fokus, Escape menutup sheet | lulus | |
| Screen reader (TalkBack/VoiceOver): label tombol ikon, pengumuman snackbar | lulus | |
| Teks sistem 200 % | lulus | |
| `contrast.py --check` (bila token berubah) | lulus | |

## Batas bukti
Apa yang **tidak** diperiksa dan alasannya. Contoh: "VoiceOver belum diuji, perangkat iOS tidak tersedia."
```

Tangkapan layar saja tidak membuktikan keyboard, semantik, atau screen reader. Tuliskan cara pemeriksaannya.
