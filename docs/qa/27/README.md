# QA #27 — Realtime SSE

Diuji lewat nginx (`localhost:12080`) dengan dua tab terpisah di `/lainnya/target` (tab B = penulis, tab C = pengamat).

| Cek | Hasil |
|---|---|
| Tab B membuat target "Uji Realtime SSE" | Tab C bertambah dari 3 ke 4 kartu tanpa muat ulang |
| Tab B menghapus target itu | Kartu hilang di tab C **51 ms** setelah permintaan dikirim (syarat ≤ 3 detik, NFR-03) |
| nginx | `proxy_buffering off` + `proxy_read_timeout 1h` (sudah ada); ping SSE tiap 8 detik supaya tidak diputus idle timeout |
| Ganti buku / logout | Hook `useBookRealtime` bergantung pada `bookId` dan dilepas bersama layout tab, jadi `EventSource.close()` dipanggil |

Test: tulis berhasil menerbitkan `{ type: "invalidate", keys: ["goals"], actorId }` hanya ke buku itu; GET dan tulis gagal (422) tidak; stream SSE mengirim `ready` lalu `invalidate`; bukan anggota 404; putus koneksi → berhenti berlangganan.
