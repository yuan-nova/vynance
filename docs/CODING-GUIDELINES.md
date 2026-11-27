# Coding Guidelines — Vynance

Dokumen ini berisi aturan menulis kode di monorepo Vynance. Semua kode baru dan semua pull request wajib mengikutinya. Kalau sebuah aturan perlu dilanggar, tulis alasannya di deskripsi PR.

Kata **wajib** dan **dilarang** berarti aturan mutlak. Kata **sebaiknya** berarti anjuran yang boleh dilewati dengan alasan jelas.

---

## 1. Stack

| Lapisan | Teknologi |
|---|---|
| Runtime & package manager | Bun (workspaces) |
| API | Hono di Bun, Hono RPC (`hc<AppType>`) |
| Frontend | Vite + React + TanStack Router, Query, Form |
| Database | MySQL 8 + Drizzle ORM |
| Validasi | Zod |
| Auth | Better Auth |
| Lint & format | Biome |
| Test | `bun test` (backend & shared), Vitest + Testing Library (web), Playwright (e2e) |

---

## 2. Struktur monorepo

```
vynance/
├─ apps/
│  ├─ api/          Hono: route → service → repository
│  ├─ web/          Vite + React: route → page → component → hook → service
│  └─ worker/       job terjadwal (memakai service dari api)
├─ packages/
│  ├─ shared/       tipe, skema validasi, aturan bisnis, util: dipakai FE & BE
│  ├─ db/           skema Drizzle, migrasi, seed: hanya backend
│  ├─ ui/           token tema + komponen dasar: hanya frontend
│  └─ config/       tsconfig bersama
├─ tooling/         plugin Biome (GritQL), runner dependency-cruiser
└─ docs/
```

Nama paket memakai scope `@vynance/*` (`@vynance/shared`, `@vynance/db`, `@vynance/ui`).

---

## 3. Aturan dependensi antar lapisan

### 3.1 Backend (`apps/api`, `apps/worker`)

```
route ──▶ service ──▶ repository ──▶ db
            │  ▲          │  ▲
            └──┘          └──┘
     service → service   repository → repository
```

| Dari \ Ke | service | repository | db (Drizzle/SQL) | shared |
|---|---|---|---|---|
| **route** | ✅ | ❌ | ❌ | ✅ |
| **service** | ✅ | ✅ | ❌ | ✅ |
| **repository** | ❌ | ✅ | ✅ | ✅ |
| **middleware** | ✅ | ❌ | ❌ | ✅ |
| **worker job** | ✅ | ❌ | ❌ | ✅ |

Aturannya:

1. **Route hanya boleh memanggil service.** Route dilarang mengimpor repository, `db`, atau apa pun dari `@vynance/db`.
2. **Service boleh memanggil service lain dan repository.** Service dilarang memakai `db`, Drizzle, atau SQL secara langsung.
3. **Repository boleh memanggil repository lain.** Repository dilarang memanggil service.
4. **Semua akses data wajib lewat repository.** Hanya file `*.repository.ts` (dan `db/` untuk client & transaksi) yang boleh mengimpor dari `@vynance/db` atau `drizzle-orm`.
5. **Dilarang ada dependensi melingkar.** Kalau `A.service` memanggil `B.service`, maka `B.service` dilarang memanggil `A.service`, baik langsung maupun lewat service lain. Bila dua service saling butuh, pindahkan bagian bersamanya ke service ketiga atau ke `shared/rules`. Aturan yang sama berlaku untuk repository.
6. Dependensi disuntikkan lewat constructor dan dirakit di `container.ts`. Dilarang membuat instance service atau repository di dalam fungsi lain. `container.ts` hanya boleh diimpor oleh titik masuk app (`src/app.ts`, `src/index.ts`, `src/main.ts`). Route menerima service lewat parameter, bukan mengambilnya dari container.

### 3.2 Frontend (`apps/web`)

```
routes ──▶ pages ──▶ features/*/components ──▶ features/*/hooks ──▶ features/*/services ──▶ lib/api-client
  │              └─▶ components (generik)                ▲
  └──────────── queryOptions untuk loader ────────────────┘
```

| Dari \ Ke | pages | feature components | components (generik) | hooks | services | api-client |
|---|---|---|---|---|---|---|
| **routes** | ✅ | ❌ | ❌ | ✅ hanya `queryOptions` untuk `loader` | ❌ | ❌ |
| **pages** | ❌ (kecuali file di folder halaman yang sama) | ✅ | ✅ | ✅ | ❌ | ❌ |
| **feature components** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **components (generik)** | ❌ | ❌ | ✅ | ❌ hook data; ✅ hook utilitas `lib/hooks` | ❌ | ❌ |
| **hooks** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **services** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

1. **Komponen dan halaman dilarang memanggil `fetch`, `hc`, atau service secara langsung.** Data selalu diambil lewat hook.
2. **Service frontend dilarang memakai React** (hook, state, JSX).
3. Fitur lain hanya boleh diimpor lewat `features/<nama>/index.ts`. Dilarang mengimpor file internal fitur lain.
4. Komponen generik di `components/` dan `packages/ui` dilarang berisi logika bisnis atau memanggil hook data. Hook utilitas tanpa data server dari `lib/hooks` (misalnya `useOnlineStatus`) boleh dipakai.
5. **`queryOptions` untuk `loader` ditaruh di `features/<fitur>/hooks/`**, bersama `useQuery`-nya, dan diekspor lewat `features/<fitur>/index.ts`. Route hanya mengimpor `queryOptions` dari sana. Hook dan `loader` memakai `queryOptions` yang sama supaya query key dan fungsi ambilnya tidak ditulis dua kali.
6. Hooks memanggil API hanya lewat service fitur, bukan `lib/api-client` atau `hc` langsung.

### 3.3 Paket

| Dari \ Ke | shared | db | ui |
|---|---|---|---|
| **apps/api, apps/worker** | ✅ | ✅ (hanya di repository & `db/`) | ❌ |
| **apps/web** | ✅ | ❌ | ✅ |
| **packages/shared** | — | ❌ | ❌ |
| **packages/db** | ✅ | — | ❌ |
| **packages/ui** | ✅ | ❌ | — |

### 3.4 Penegakan

Aturan impor diperiksa otomatis oleh **dependency-cruiser** (`.dependency-cruiser.cjs`) dan Biome `noRestrictedImports` di hook pre-commit. Pemeriksaan yang sama wajib dijalankan di CI (workflow CI belum dibuat). Daftar lengkap aturan yang ditegakkan alat ada di [§13](#13-penegakan-otomatis).

---

## 4. `packages/shared`

### 4.1 Aturan umum

1. **Semua tipe wajib dibuat di `shared`.** Ini mencakup tipe domain (Wallet, Transaction, Budget, …), tipe input/output API, enum, kode error, dan tipe konteks (`ServiceCtx`).
2. **Semua fungsi yang dipakai lebih dari satu tempat wajib dibuat di `shared`.** Contohnya format Rupiah, parse uang, perhitungan periode, dan aturan bisnis.
3. **Validasi yang dipakai frontend dan backend wajib dibuat di `shared`.**
4. `shared` wajib berisi **TypeScript murni**. Dilarang mengimpor `react`, `hono`, `drizzle-orm`, `bun:*`, `node:*`, atau API DOM. Satu-satunya dependensi luar yang diizinkan adalah `zod`.
5. Fungsi di `shared` wajib **deterministik** dan **tidak mengambil data sendiri**. Tanggal hari ini, harga emas, dan data dari DB dikirim sebagai parameter.
6. `shared` tidak punya langkah build. Paket diekspor langsung dari file `.ts` lewat subpath exports.

**Pengecualian tipe** (boleh di luar `shared`):

- Tipe baris tabel hasil Drizzle (`InferSelectModel`) di `packages/db`. Tipe ini dipakai hanya di dalam repository dan wajib dipetakan ke tipe domain `shared` sebelum keluar dari repository.
- Tipe internal kerangka kerja, seperti `AppEnv` Hono dan `AppType` RPC di `apps/api`.
- `Props` komponen React, yang ditulis di file komponennya.

### 4.2 Struktur

```
packages/shared/src/
├─ types/        tipe domain & DTO
├─ enums/        konstanta (as const) + tipe turunannya
├─ schemas/      skema Zod input/output API
├─ rules/        aturan bisnis murni (BR-xx) + permissions
├─ errors/       kode error + pesan Indonesia
├─ money/        format, parse, konversi string ↔ bigint
├─ date/         zona Asia/Jakarta, periode bulan, rentang
└─ index.ts
```

### 4.3 Tipe

- **Sebaiknya** tipe input/output diturunkan dari skema Zod (`z.infer`), tidak ditulis dua kali.
- Gunakan `type`, bukan `interface`, kecuali butuh *declaration merging*.
- Dilarang memakai `enum` TypeScript. Pakai objek `as const` atau `z.enum`.

```ts
export const TX_TYPES = ["income", "expense", "transfer", "asset_buy", "asset_sell"] as const
export const txTypeSchema = z.enum(TX_TYPES)
export type TxType = z.infer<typeof txTypeSchema>
```

### 4.4 Aturan bisnis

Setiap fungsi aturan mengembalikan hasil, bukan melempar error. Dengan begitu hasilnya bisa dipakai frontend untuk tampilan dan backend untuk melempar `BusinessError`.

```ts
export type RuleResult = { ok: true } | { ok: false; code: ErrorCode; field?: string }

export function checkTransferWallets(from: string, to?: string): RuleResult {
  if (to && to === from) return { ok: false, code: "TRANSFER_SAME_WALLET", field: "toWalletId" }
  return { ok: true }
}
```

Setiap fungsi di `rules/` wajib punya unit test dan mencantumkan nomor aturan BRD di komentar (`// BR-17`).

---

## 5. Validasi

| Jenis | Ditulis di | Dipakai di |
|---|---|---|
| Bentuk & format input (tipe, wajib, rentang, enum, aturan antar-field) | `shared/schemas` | form FE, route, worker, scan/AI |
| Aturan bisnis murni (data dikirim sebagai parameter) | `shared/rules` | FE (umpan balik), service |
| Keanggotaan buku | middleware `bookAccess`: pengguna wajib anggota buku di URL. Tidak ada peran; semua anggota punya hak sama (BR-49) | backend saja |
| Aturan yang butuh query DB | service | backend saja |
| Integritas data | constraint DB di migrasi | backend saja |

1. **Setiap pintu masuk wajib mem-parse inputnya** dengan skema dari `shared`: route (`zValidator`), payload job worker, dan keluaran OCR/LLM.
2. **Service menerima input yang sudah bertipe** dan tidak mem-parse ulang bentuknya. Service fokus pada aturan bisnis.
3. Validasi frontend hanya untuk kenyamanan pengguna. **Semua aturan wajib dicek ulang di backend.**
4. Field yang ditentukan server (`bookId`, `code` buku, `createdBy`, `createdAt`) dilarang ada di skema input. Nilainya diambil dari sesi dan URL.

---

## 6. Backend

### 6.1 Struktur modul

```
apps/api/src/modules/<fitur>/
├─ <fitur>.route.ts
├─ <fitur>.service.ts
├─ <fitur>.repository.ts
├─ <fitur>.mapper.ts             baris DB → tipe domain
├─ <fitur>.service.test.ts
└─ <fitur>.repository.test.ts
```

### 6.2 Route

- Hanya berisi: validator, memanggil **satu** method service, dan mengembalikan respons. Middleware `auth` dan `bookAccess` dipasang sekali di grup `/books/:bookId`, bukan di tiap route.
- Dilarang berisi logika bisnis, perulangan atas data, atau perhitungan.
- Route wajib dirangkai (*chained*) supaya `AppType` terbaca oleh Hono RPC.

```ts
export const walletRoutes = (svc: WalletService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list(c.var.ctx)))
    .post("/", zValidator("json", createWalletSchema, validationHook),
      async (c) => created(c, await svc.create(c.var.ctx, c.req.valid("json"))))
```

### 6.3 Service

- Parameter pertama selalu `ctx: ServiceCtx` (`{ userId, bookId }`). Dilarang menerima `Context` Hono.
- Menjalankan aturan bisnis lewat `shared/rules`. Kalau hasilnya gagal, lempar `BusinessError`.
- Batas transaksi DB ditentukan di service lewat `withTransaction`.
- Kalau service memanggil service lain di dalam transaksi, executor transaksi wajib diteruskan supaya semuanya berjalan di transaksi yang sama.

### 6.4 Repository

- Satu repository per agregat/tabel utama.
- **Setiap query wajib difilter `bookId`.** Dilarang ada query data keuangan tanpa filter buku. Pengecualian: query daftar buku dan keanggotaan milik pengguna (`books`, `book_members`), yang difilter `userId`.
- Menerima `Executor` (`db` atau `tx`) di constructor.
- Mengembalikan tipe domain dari `shared`, bukan baris Drizzle mentah.
- Dilarang berisi aturan bisnis (misalnya memutuskan status anggaran). Repository hanya membaca dan menulis.
- Repository yang memanggil repository lain wajib memakai executor yang sama.
- Data dihapus dengan *soft delete* (`deletedAt`). Semua query baca wajib menyaring `deletedAt IS NULL`.

### 6.5 Transaksi DB

```ts
await withTransaction(async (r) => {
  await r.transactions.insert(...)
  await r.wallets.adjustBalance(...)
})
```

Perubahan yang harus konsisten (transaksi + saldo dompet + ledger aset) wajib berada dalam satu `withTransaction`.

### 6.6 Error

- Pakai kelas dari `lib/errors.ts`: `ValidationError` (422), `BusinessError` (422/409), `NotFound` (404), `Forbidden` (403), `Unauthorized` (401).
- Kode error wajib berasal dari `shared/errors`. Dilarang menulis string pesan langsung di service.
- Dilarang menelan error (`catch {}` kosong). Tangani dengan jelas atau biarkan naik ke `error-handler`.
- Format respons error:

```json
{ "error": { "code": "CATEGORY_TYPE_MISMATCH", "message": "Kategori tidak sesuai jenis transaksi", "field": "categoryId" } }
```

### 6.7 Konvensi API

- URL: `/api/v1/books/:bookId/<resource>`, kata benda jamak, kebab-case.
- Respons sukses: `{ data }`; daftar: `{ data, nextCursor }` (cursor, bukan offset).
- `POST` yang membuat transaksi wajib mendukung header `Idempotency-Key`.

### 6.8 Data

- **Uang** disimpan sebagai `BIGINT` (rupiah utuh) dan diolah sebagai `bigint` di kode. Di JSON dikirim sebagai string. Dilarang memakai `number`/float untuk uang.
- **Gram emas, unit reksa dana** disimpan sebagai `DECIMAL(18,6)`.
- **Waktu** disimpan dalam UTC (`DATETIME`). **Tanggal transaksi** disimpan sebagai `DATE`. Konversi zona waktu hanya lewat `shared/date`.
- **Relasi** selalu lewat ID dan FK, tidak pernah lewat nama.
- Perubahan skema hanya lewat migrasi Drizzle. Dilarang mengubah DB produksi secara manual.

---

## 7. Frontend

### 7.1 Lapisan

| Folder | Isi |
|---|---|
| `routes/` | Definisi rute: path, guard, `validateSearch`, `loader`. Tanpa markup. |
| `pages/<menu>/` | Komponen satu layar. Menyusun komponen dari fitur, menangani loading/kosong/error halaman. |
| `features/<fitur>/components/` | Bagian layar yang bisa dipakai ulang. |
| `features/<fitur>/hooks/` | TanStack Query/Mutation, `queryOptions` untuk `loader`, invalidasi. Query key diambil dari `lib/query-keys.ts`. |
| `features/<fitur>/services/` | Panggilan API lewat `hc`, konversi data. |
| `components/` | Komponen generik aplikasi (layout, form, data, feedback). |
| `stores/` | State UI saja (buku aktif, tema, draf). |

### 7.2 Aturan

1. **State dari server hanya disimpan di TanStack Query.** Dilarang menyalin data server ke `useState` atau store.
2. Query key hanya dibuat lewat `lib/query-keys.ts`.
3. Setiap mutasi wajib meng-invalidate semua data yang ikut berubah. Contohnya, transaksi baru memengaruhi transaksi, dompet, anggaran, dan Beranda.
4. Filter, tab, dan bulan aktif disimpan di URL (`validateSearch`), bukan di state lokal.
5. Halaman memakai `getRouteApi()` untuk membaca param dan search. Dilarang mengimpor file route.
6. Form memakai TanStack Form + skema dari `shared/schemas`.
7. Tidak ada peran: semua anggota buku melihat tombol dan aksi yang sama (BR-49). Jangan menambah logika sembunyikan-tampilkan berdasarkan pengguna.
8. Error API dengan `field` wajib ditampilkan di field form yang sesuai.

### 7.3 Aturan `useEffect`

`useEffect` hanya untuk **menyinkronkan komponen dengan sistem di luar React**. Kalau tidak ada sistem luar yang terlibat, kemungkinan besar `useEffect` tidak dibutuhkan. Effect yang tidak perlu membuat render dobel, tampilan berkedip, data balapan (*race condition*), dan bug yang sulit dilacak.

**Tanyakan dulu:** "Sistem luar apa yang sedang saya sinkronkan?" Kalau jawabannya tidak ada, pakai salah satu pengganti di bawah.

#### Dilarang memakai `useEffect` untuk:

| Kebutuhan | Jangan | Pakai |
|---|---|---|
| Mengambil data dari API | `useEffect(() => { fetch(...).then(setData) }, [])` | hook TanStack Query (`useQuery`), dan prefetch di `loader` route |
| Nilai turunan dari props/state | `useEffect(() => setTotal(sum(items)), [items])` | hitung langsung saat render: `const total = sum(items)`. Kalau berat, pakai `useMemo` |
| Merespons aksi pengguna (klik, submit) | set flag → effect yang menjalankan aksi | jalankan langsung di event handler (`onClick`, `onSubmit`) |
| Mengirim mutasi / POST | effect yang memanggil API saat state berubah | `useMutation` dipanggil dari event handler |
| Menyalin props ke state | `useEffect(() => setValue(props.value), [props.value])` | pakai props langsung, atau komponen terkontrol |
| Mereset state saat ID berubah | `useEffect(() => reset(), [id])` | beri `key={id}` pada komponen agar dipasang ulang |
| Rantai state (state A berubah → set state B → set state C) | beberapa effect berantai | hitung semua perubahan di satu event handler atau satu `useReducer` |
| Memberi tahu parent saat state berubah | `useEffect(() => onChange(value), [value])` | panggil `onChange` di handler yang sama dengan `setValue` |
| Membaca/menulis filter ke URL | effect sinkron state ↔ URL | `validateSearch` + `navigate({ search })` TanStack Router |
| Validasi form | effect yang memvalidasi tiap perubahan | validator TanStack Form + skema `shared` |
| Inisialisasi sekali saat aplikasi mulai | `useEffect(() => init(), [])` di komponen | jalankan di `main.tsx` atau `loader` route `__root` |
| Berlangganan store luar (status online, ukuran layar, media query, `localStorage`) | effect + `addEventListener` + `setState` | `useSyncExternalStore` di custom hook |

#### `useEffect` boleh dipakai untuk:

1. **Langganan ke sumber luar yang tidak cocok untuk `useSyncExternalStore`**, misalnya WebSocket buku atau `BroadcastChannel` antar tab.
2. **Pustaka non-React** yang perlu dipasang dan dilepas, misalnya kamera untuk scan struk, chart imperatif, atau scanner barcode.
3. **API browser yang imperatif**, misalnya `document.title`, atribut `data-theme` di `<html>`, wake lock, atau `IntersectionObserver` untuk infinite scroll.
4. **Timer** yang terikat pada umur komponen, misalnya hitung mundur kirim ulang OTP.
5. **Fokus atau scroll setelah render** yang tidak bisa memakai `autoFocus` atau callback ref.

#### Syarat setiap `useEffect`:

1. **Wajib dibungkus custom hook** yang namanya menjelaskan tujuannya, misalnya `useDocumentTitle`, `useBookRealtime`, `useCameraStream`. Hook ditaruh di `features/<fitur>/hooks/` atau `lib/hooks/`. **Pages dan components dilarang memanggil `useEffect` langsung.**
2. **Wajib punya cleanup** bila memasang sesuatu: listener, langganan, timer, observer, stream kamera.
3. **Daftar dependensi wajib lengkap.** Biome `useExhaustiveDependencies` diset ke error. Dilarang mematikannya untuk "mengakali" dependensi. Kalau effect berjalan terlalu sering, perbaiki desainnya (pindahkan fungsi ke dalam effect, pakai `useEffectEvent`, atau pisahkan effect).
4. **Wajib aman dijalankan dua kali.** React StrictMode memasang–melepas–memasang ulang effect di mode development. Effect yang rusak saat dijalankan dua kali berarti cleanup-nya salah.
5. **Dilarang memanggil `setState` tanpa syarat di dalam effect.** `setState` hanya boleh dipanggil dari callback sumber luar (misalnya `ws.onmessage`).
6. Kalau effect melakukan pekerjaan asinkron, wajib menangani pembatalan (`AbortController` atau flag `cancelled` di cleanup) supaya hasil lama tidak menimpa hasil baru.
7. Beri komentar satu baris di atas effect yang menyebutkan sistem luar yang disinkronkan.

```ts
// lib/hooks/useDocumentTitle.ts
export function useDocumentTitle(title: string): void {
  // sinkron: judul tab browser
  useEffect(() => {
    const prev = document.title
    document.title = `${title} · Vynance`
    return () => { document.title = prev }
  }, [title])
}

// lib/hooks/useOnlineStatus.ts: tanpa useEffect
const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb)
  window.addEventListener("offline", cb)
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb) }
}
export const useOnlineStatus = (): boolean =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
```

`useLayoutEffect` mengikuti semua aturan di atas. Pakai hanya untuk mengukur atau mengubah DOM sebelum layar digambar, untuk mencegah tampilan berkedip.

### 7.4 Tampilan

Semua aturan tampilan dan perilaku UI ada di **[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)**. Bagian ini hanya merangkum hal yang menyentuh kode:

- Warna, radius, jarak, dan huruf hanya diambil dari token di `packages/ui` (DS-THEME-01, DS-SPACE-01). Dilarang menulis nilai warna hex atau palet mentah di komponen.
- Format nominal dan tanggal hanya lewat `shared/money` dan `shared/date` (DS-MONEY-01, DS-LANG-02).
- Peta status dan labelnya ada di `shared` (DS-STATE-02). Pesan error ada di `shared/errors` (DS-LANG-01).
- Layar dibuat mobile-first: desain 390 px, diuji di 360 dan 320 px (DS-FOUND-02).
- Pola atau komponen UI baru wajib dinilai dengan [rubrik penilaian desain](design-system/DESIGN-DECISION-RUBRIC.md) sebelum dibuat (DS-GOV-02).
- PR UI wajib menyertakan bukti sesuai DS-QA-01 ([qa/README.md](qa/README.md)).

---

## 8. Penamaan

| Hal | Aturan | Contoh |
|---|---|---|
| File backend | kebab-case + akhiran lapisan | `wallet.service.ts`, `wallet.repository.ts` |
| File komponen & halaman | PascalCase | `TransactionRow.tsx`, `BudgetsPage.tsx` |
| File hook | camelCase diawali `use` | `useCreateTransaction.ts` |
| File service frontend | kebab-case | `transaction.service.ts` |
| Kelas | PascalCase | `TransactionService` |
| Fungsi & variabel | camelCase | `adjustBalance`, `budgetStatus` |
| Konstanta global | UPPER_SNAKE | `TX_TYPES`, `NISAB_GOLD_GRAMS` |
| Skema Zod | camelCase + `Schema` | `createTransactionSchema` |
| Kode error | UPPER_SNAKE | `WALLET_NOT_FOUND` |
| Tabel & kolom DB | snake_case, tabel jamak | `transactions.book_id` |

Nama variabel, fungsi, kelas, dan tipe diperiksa Biome `useNamingConvention` (camelCase, PascalCase, UPPER_SNAKE untuk konstanta). Key objek yang ditulis dalam tanda kutip, misalnya header `"Idempotency-Key"`, tidak diperiksa.

Nama di kode memakai **bahasa Inggris**. Teks yang tampil ke pengguna memakai Bahasa Indonesia dan disimpan di `shared/errors` atau di komponen.

---

## 9. TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`.
- Dilarang memakai `any`, kecuali kasus di 9.1. Lihat 9.1 untuk penggantinya.
- Dilarang memakai `@ts-ignore`. Kalau terpaksa, pakai `@ts-expect-error` disertai alasan.
- Dilarang memakai non-null assertion (`!`) kecuali sudah dicek sebelumnya dan diberi komentar.
- Fungsi yang diekspor wajib punya tipe kembalian eksplisit.
- Impor memakai alias (`@/…`, `@vynance/…`), bukan `../../..` lebih dari dua tingkat.
- Impor yang hanya dipakai sebagai tipe wajib memakai `import type`.
- Dilarang ada impor dan variabel yang tidak dipakai.
- Dilarang mengubah nilai parameter fungsi. Buat variabel baru.

### 9.1 Aturan `any`

`any` mematikan pemeriksaan tipe dan diam-diam menular. Nilai yang berasal dari `any` juga menjadi `any`, sehingga kesalahan baru ketahuan saat aplikasi berjalan. Karena itu Biome `noExplicitAny` diset ke **error**.

**Pakai penggantinya:**

| Situasi | Jangan | Pakai |
|---|---|---|
| Data dari luar (body request, JSON, `localStorage`, pesan WebSocket, keluaran OCR/LLM) | `const data: any = await res.json()` | `unknown`, lalu parse dengan skema Zod: `const data = schema.parse(await res.json())` |
| Error di `catch` | `catch (e: any) { e.message }` | `catch (e: unknown) { if (e instanceof Error) … }` atau helper `toAppError(e)` |
| Fungsi yang menerima banyak tipe | `function first(xs: any[])` | generic: `function first<T>(xs: readonly T[]): T \| undefined` |
| Objek dengan key bebas | `Record<string, any>` | `Record<string, unknown>` atau tipe yang tepat |
| Tipe fungsi apa saja | `(...args: any[]) => any` | `(...args: never[]) => unknown` |
| Pustaka luar yang tipenya salah/kosong | `(lib as any).foo()` | tulis deklarasi tipe di `types/vendor/<lib>.d.ts`, atau bungkus pustaka dalam satu file adapter |
| Mock di test | `const repo: any = {}` | `const repo: Pick<WalletRepository, "findById"> = { … }` atau `satisfies` |
| Memaksa tipe | `x as any as Foo` | perbaiki tipenya; kalau tidak bisa, `as unknown as Foo` disertai komentar alasan |

**`any` hanya boleh dipakai bila semua syarat ini terpenuhi:**

1. Tidak ada pengganti di atas yang bisa dipakai. Biasanya ini terjadi pada *type utility* generik tingkat lanjut atau batas dengan pustaka luar.
2. `any` tidak bocor: hanya ada di dalam satu fungsi atau adapter, dan nilai yang keluar sudah bertipe jelas.
3. Ditulis dengan komentar penonaktifan berisi alasan:
   ```ts
   // biome-ignore lint/suspicious/noExplicitAny: tipe bawaan chart-lib salah untuk opsi plugin, dibungkus di sini
   const opts = rawOptions as any
   ```
4. Disebutkan di deskripsi PR supaya reviewer memeriksanya.

`any` dilarang sama sekali di `packages/shared`, di tipe yang diekspor, dan di signature service maupun repository.

---

## 10. Testing

| Yang diuji | Cara | Wajib |
|---|---|---|
| `shared/rules`, `shared/money`, `shared/date` | unit test `bun test` | ✅ setiap fungsi |
| Service | `bun test` dengan repository palsu | ✅ setiap aturan bisnis |
| Repository | `bun test` ke MySQL di Docker | ✅ setiap query, termasuk filter `bookId` |
| Route | `app.request()` Hono | sebaiknya untuk alur utama |
| Komponen | Vitest + Testing Library, API dipalsukan dengan MSW | sebaiknya untuk komponen berlogika |
| Alur utama | Playwright | ✅ login, catat transaksi, anggaran, undang anggota |

Setiap bug yang diperbaiki wajib disertai test yang gagal sebelum perbaikan.

---

## 11. Keamanan

- Rahasia (kunci API, `AUTH_SECRET`, URL DB) hanya ada di env server dan dibaca lewat `config/env.ts`. `process.env` dilarang dipakai di file lain. Dilarang menyimpannya di DB, di kode, atau di bundle frontend.
- Variabel `VITE_*` dianggap publik. Dilarang berisi rahasia.
- Setiap endpoint data buku wajib melewati `auth` → `bookAccess`. `bookAccess` menolak dengan 404 (bukan 403) bila pengguna bukan anggota, supaya keberadaan buku tidak bocor.
- Kode buku bukan rahasia dan tidak pernah dipakai sebagai bukti akses. Undangan memakai token acak terpisah (BR-48, BR-50).
- Query hanya lewat Drizzle atau `sql` template. Dilarang menyusun SQL dengan gabungan string.
- Keluaran OCR/LLM diperlakukan sebagai input tidak tepercaya dan wajib divalidasi skema.
- Dilarang mencatat (log) data pribadi atau nominal keuangan pengguna dalam bentuk mentah.

---

## 12. Git & pull request

- Branch: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`.
- Commit mengikuti Conventional Commits: `feat(transactions): catat transfer antar dompet`.
- Satu PR untuk satu perubahan. Sebaiknya di bawah 400 baris diff.
- CI wajib hijau: `biome check`, `tsc --noEmit`, dependency-cruiser, semua test. Workflow CI belum dibuat. Sampai ada, pemeriksaan ini hanya berjalan di hook pre-commit dan di mesin masing-masing.
- Perubahan skema DB wajib menyertakan file migrasi.

### Checklist review

- [ ] Route hanya memanggil service; service dan route tidak menyentuh `db`.
- [ ] Repository tidak memanggil service; semua query difilter `bookId`.
- [ ] Tidak ada dependensi melingkar antar service atau antar repository.
- [ ] Tipe baru dibuat di `shared` (atau termasuk pengecualian di 4.1).
- [ ] Fungsi yang dipakai di lebih dari satu tempat ada di `shared`.
- [ ] Validasi bersama memakai skema dari `shared/schemas`.
- [ ] Uang memakai `bigint`, tidak ada float.
- [ ] Perubahan yang harus konsisten ada dalam satu `withTransaction`.
- [ ] Mutasi di frontend meng-invalidate semua query terkait.
- [ ] Tidak ada `any`; kalau ada, memenuhi syarat 9.1 dan diberi alasan.
- [ ] Tidak ada `useEffect` di pages/components; setiap effect ada di custom hook, menyinkronkan sistem luar, dan punya cleanup.
- [ ] Tidak ada warna hex langsung di komponen.
- [ ] PR UI memenuhi checklist DESIGN-SYSTEM.md dan menyertakan bukti DS-QA-01.
- [ ] Ada test untuk aturan bisnis yang baru atau berubah.

---

## 13. Penegakan otomatis

Sebagian besar aturan di dokumen ini diperiksa alat, bukan diingat. Konfigurasinya:

| Berkas | Isi |
|---|---|
| [`biome.json`](../biome.json) | Linter + formatter. Aturan per folder lewat `overrides`. |
| [`tooling/biome-plugins/*.grit`](../tooling/biome-plugins/) | Aturan kustom Biome (GritQL) yang tidak ada bawaannya. |
| [`.dependency-cruiser.cjs`](../.dependency-cruiser.cjs) | Aturan lapisan dan paket (§3). |
| [`tooling/lint-deps.ts`](../tooling/lint-deps.ts) | Menjalankan dependency-cruiser per app dengan tsconfig-nya, supaya alias `@/` ter-resolve. |
| [`lefthook.yml`](../lefthook.yml) | Hook pre-commit. |

### 13.1 Perintah

```bash
bun install          # sekaligus memasang hook git (script "prepare")
bun run lint         # biome check + dependency-cruiser, seperti di CI
bun run lint:fix     # perbaiki format, urutan impor, dan lint yang bisa diperbaiki otomatis
bun run lint:deps    # aturan lapisan saja
```

### 13.2 Hook pre-commit

Setiap `git commit` menjalankan, secara paralel:

1. `biome check --write` pada file yang di-*stage*. Format dan urutan impor diperbaiki otomatis lalu di-*stage* ulang. Pelanggaran lint yang tidak bisa diperbaiki otomatis **menggagalkan commit**.
2. `bun run lint:deps` bila ada file JS/TS yang di-*stage*. Pelanggaran lapisan **menggagalkan commit**.

Hook boleh dilewati (`LEFTHOOK=0 git commit …`) hanya dalam keadaan darurat, dan alasannya wajib ditulis di PR. CI tetap menjalankan pemeriksaan yang sama, jadi melewati hook tidak membuat PR lolos.

Format kode: indentasi 2 spasi, lebar baris 120, kutip ganda, tanpa titik koma kecuali perlu, *trailing comma*. Jangan memperdebatkan format di review; ikuti keluaran Biome.

### 13.3 Peta aturan → alat

| Aturan | Bagian | Alat |
|---|---|---|
| Route/middleware/worker hanya memanggil service | §3.1 | depcruise `route-only-calls-service`, Biome `noRestrictedImports` |
| Service tidak menyentuh db/Drizzle; transaksi lewat `db/unit-of-work` | §3.1, §6.5 | depcruise `service-no-db`, Biome `noRestrictedImports` |
| Service tidak bergantung pada Hono | §6.3 | depcruise `service-no-hono`, Biome `noRestrictedImports` |
| Repository tidak memanggil service | §3.1 | depcruise `repository-no-service`, Biome `noRestrictedImports` |
| `@vynance/db`/`drizzle-orm` hanya di repository, `db/`, `container.ts` | §3.1 | depcruise `db-only-in-repository` |
| Tidak ada dependensi melingkar | §3.1 | depcruise `no-circular`, Biome `noImportCycles` |
| `container.ts` hanya diimpor titik masuk app | §3.1 | depcruise `container-only-from-entry` |
| Routes hanya ke pages dan `queryOptions` di hooks | §3.2 | depcruise `web-routes-only-pages`, `web-outside-feature-public-api` |
| Pages hanya diimpor routes; halaman tidak mengimpor halaman lain | §3.2 | depcruise `web-pages-only-from-routes`, `web-pages-no-other-pages` |
| Pages/components tidak memanggil service, `hc`, `fetch` | §3.2 | depcruise `web-view-no-service`, Biome `noRestrictedImports` + `noRestrictedGlobals` |
| Halaman tidak mengimpor file route | §7.2 | Biome `noRestrictedImports` |
| Komponen generik tidak mengimpor fitur/halaman/store (hook utilitas `lib/hooks` boleh) | §3.2 | depcruise `web-generic-components-pure` |
| Hooks tidak mengimpor komponen/halaman, `api-client`, atau `hc` | §3.2 | depcruise `web-hooks-no-view` |
| Service frontend tanpa React | §3.2 | depcruise `web-services-no-react`, Biome `noRestrictedImports` |
| Fitur lain hanya lewat `features/<nama>/index.ts` | §3.2 | depcruise `web-feature-public-api`, `web-outside-feature-public-api` |
| Aturan antar paket (shared/db/ui/apps) | §3.3 | depcruise `shared-no-workspace-deps`, `db-no-ui`, `ui-no-db`, `packages-no-apps` |
| `shared` TypeScript murni, dependensi luar hanya zod | §4.1 | depcruise `shared-is-pure`, Biome `noRestrictedImports` + `noRestrictedGlobals` |
| `shared` deterministik (`Date.now()`, `new Date()`, `Math.random()`) | §4.1 | plugin `shared-deterministic.grit` |
| Tipe yang diekspor hanya di `shared` (kecuali `*Props`, `AppEnv`, `AppType`) | §4.1 | plugin `no-exported-types-outside-shared.grit` |
| `type`, bukan `interface`; tanpa `enum` | §4.3 | Biome `useConsistentTypeDefinitions`, `noEnum` |
| Tanpa `catch {}` kosong | §6.6 | Biome `noEmptyBlockStatements` |
| `useEffect` tidak dipanggil langsung di pages/components | §7.3 | plugin `no-use-effect-in-view.grit` |
| Dependensi hook lengkap, hook di level atas | §7.3 | Biome `useExhaustiveDependencies`, `useHookAtTopLevel` |
| Tanpa warna hex di komponen | §7.4 | plugin `no-hex-color.grit` |
| Query key hanya dari `lib/query-keys.ts` | §7.2 | plugin `query-keys-only-from-factory.grit` |
| Penamaan file (kebab-case backend, PascalCase komponen, `useX` hook) | §8 | Biome `useFilenamingConvention` per folder |
| Penamaan variabel, fungsi, kelas, tipe, konstanta | §8 | Biome `useNamingConvention` |
| Tanpa `any`, `@ts-ignore`, non-null assertion | §9, §9.1 | Biome `noExplicitAny`, `noTsIgnore`, `noNonNullAssertion` |
| Impor relatif maksimal dua tingkat | §9 | Biome `noRestrictedImports` |
| `import type` untuk impor tipe | §9 | Biome `useImportType` |
| Tanpa impor/variabel yang tidak dipakai | §9 | Biome `noUnusedImports`, `noUnusedVariables` |
| Tanpa mengubah parameter | §9 | Biome `noParameterAssign` |
| `process.env` hanya di `config/env.ts` | §11 | Biome `noProcessEnv` |
| Tanpa `sql.raw()` | §11 | plugin `no-sql-raw.grit` |

### 13.4 Yang **tidak** bisa diperiksa alat

Aturan berikut tetap diperiksa di review (checklist §12 dan skill `pr-code-review`).

| Bagian | Aturan |
|---|---|
| §3.1 butir 6 | Instance service/repository hanya dibuat di `container.ts` |
| §4.1 | Fungsi yang dipakai di lebih dari satu tempat sudah dipindah ke `shared` |
| §5 | Setiap pintu masuk mem-parse input dengan skema `shared`; service tidak mem-parse ulang; `bookId`, `createdBy`, `createdAt` tidak ada di skema input |
| §6.2 | Route hanya memanggil satu method service, tanpa logika bisnis |
| §6.3 | Parameter pertama service adalah `ServiceCtx`; aturan bisnis lewat `shared/rules` |
| §6.4 | Setiap query difilter `bookId` dan `deletedAt IS NULL`; repository tanpa aturan bisnis; mengembalikan tipe domain |
| §6.5 | Perubahan yang harus konsisten ada dalam satu `withTransaction` |
| §6.6 | Kode error dari `shared/errors` |
| §6.7 | Konvensi URL, bentuk respons, cursor, `Idempotency-Key` |
| §6.8 | Uang memakai `bigint`, bukan `number` |
| §7.2 | Data server tidak disalin ke `useState`/store; mutasi meng-invalidate semua query terkait; filter di URL; form memakai TanStack Form; error `field` tampil di field |
| §7.3 | Syarat `useEffect` butir 2 dan 4–7: cleanup, aman dijalankan dua kali, tanpa `setState` tanpa syarat, pembatalan kerja asinkron, komentar sistem luar |
| §9 | Tipe kembalian eksplisit pada fungsi yang diekspor. Biome `useExplicitType` masih *nursery* dan ikut menandai konstanta biasa, jadi belum dipakai. |
| §10 | Test untuk aturan bisnis dan query |
| §11 | Variabel `VITE_*` tanpa rahasia; endpoint melewati `auth` → `bookAccess`; keluaran OCR/LLM divalidasi; tidak mencatat data pribadi |

Batas yang perlu diingat:

- Aturan lapisan dikenali dari nama file (`*.route.ts`, `*.service.ts`, `*.repository.ts`) dan folder. File yang salah nama tidak dianggap route atau service.
- Route dan fitur lain mengimpor lewat `features/<nama>/index.ts`. Alat hanya memeriksa bahwa impornya lewat `index.ts`, bukan apa yang diambil dari sana. Karena itu `index.ts` hanya mengekspor API publik fitur (komponen, hook, `queryOptions`), dan reviewer memeriksa bahwa route tidak mengambil komponen fitur.

Pemeriksaan tipe (`tsc --noEmit`) dan test berjalan di CI, tidak di hook, supaya commit tetap cepat.

### 13.5 Menonaktifkan aturan

Menonaktifkan aturan untuk satu baris wajib memakai `// biome-ignore <grup>/<aturan>: <alasan>` dan disebut di deskripsi PR. Menonaktifkan aturan di `biome.json` atau `.dependency-cruiser.cjs` wajib lewat ADR.
