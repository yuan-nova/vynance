/**
 * Aturan dependensi antar lapisan, sesuai docs/CODING-GUIDELINES.md §3.
 * Jalankan: bun run lint:deps (tooling/lint-deps.ts memanggil depcruise per app dengan tsconfig-nya,
 * supaya alias `@/` tiap app ter-resolve).
 *
 * Catatan path:
 * - `container.ts` adalah composition root, jadi boleh mengimpor apa saja.
 * - `apps/api/src/db/unit-of-work.ts` berisi `withTransaction` dan boleh dipakai service (§6.5).
 *   File lain di `apps/api/src/db/` (client, executor) hanya untuk repository.
 */

const DB_DIRECT = "^(node_modules/(drizzle-orm|mysql2)/|packages/db/|apps/api/src/db/(?!unit-of-work))"
const COMPOSITION_ROOT = "(^|/)container\\.ts$"
const ref = (section) => `docs/CODING-GUIDELINES.md ${section}`

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ---------- umum ----------
    {
      name: "no-circular",
      severity: "error",
      comment: `Dilarang ada dependensi melingkar antar service atau antar repository (${ref("§3.1 butir 5")}).`,
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans-in-shared",
      severity: "warn",
      comment: "File di packages/shared yang tidak dipakai di mana pun. Hapus atau ekspor dari index.ts.",
      from: { orphan: true, path: "^packages/shared/src/", pathNot: ["\\.test\\.ts$", "index\\.ts$"] },
      to: {},
    },

    // ---------- backend (§3.1) ----------
    {
      name: "route-only-calls-service",
      severity: "error",
      comment: `Route, middleware, dan worker hanya boleh memanggil service, bukan repository atau db (${ref("§3.1 butir 1")}).`,
      from: { path: ["\\.route\\.ts$", "^apps/api/src/middleware/", "^apps/worker/"] },
      to: { path: ["\\.repository\\.ts$", DB_DIRECT, "^apps/api/src/db/"] },
    },
    {
      name: "service-no-db",
      severity: "error",
      comment: `Service dilarang memakai db, Drizzle, atau SQL langsung. Akses data lewat repository; transaksi lewat withTransaction (${ref("§3.1 butir 2, §6.5")}).`,
      from: { path: "\\.service\\.ts$" },
      to: { path: DB_DIRECT },
    },
    {
      name: "service-no-hono",
      severity: "error",
      comment: `Service dilarang bergantung pada Hono; parameter pertama ServiceCtx (${ref("§6.3")}).`,
      from: { path: "\\.service\\.ts$", pathNot: "^apps/web/" },
      to: { path: "^node_modules/hono/" },
    },
    {
      name: "repository-no-service",
      severity: "error",
      comment: `Repository dilarang memanggil service (${ref("§3.1 butir 3")}).`,
      from: { path: "\\.repository\\.ts$" },
      to: { path: ["\\.service\\.ts$", "^node_modules/hono/"] },
    },
    {
      name: "db-only-in-repository",
      severity: "error",
      comment: `Hanya *.repository.ts, apps/api/src/db/, dan container.ts yang boleh mengimpor @vynance/db atau drizzle-orm (${ref("§3.1 butir 4")}).`,
      from: {
        path: "^apps/(api|worker)/",
        pathNot: ["\\.repository\\.ts$", "\\.repository\\.test\\.ts$", "^apps/api/src/db/", COMPOSITION_ROOT],
      },
      to: { path: DB_DIRECT },
    },
    {
      name: "container-only-from-entry",
      severity: "error",
      comment: `container.ts (composition root) hanya diimpor oleh titik masuk app; route dan service menerima dependensi lewat parameter/constructor (${ref("§3.1 butir 6")}).`,
      from: {
        path: "^apps/(api|worker)/",
        pathNot: ["^apps/(api|worker)/src/(app|index|main)\\.ts$", COMPOSITION_ROOT],
      },
      to: { path: COMPOSITION_ROOT },
    },
    {
      name: "api-no-ui",
      severity: "error",
      comment: `Backend dilarang memakai packages/ui atau React (${ref("§3.3")}).`,
      from: { path: "^apps/(api|worker)/" },
      to: { path: ["^packages/ui/", "^node_modules/(react|react-dom)/"] },
    },

    // ---------- frontend (§3.2) ----------
    {
      name: "web-no-db",
      severity: "error",
      comment: `Frontend dilarang memakai packages/db atau Drizzle (${ref("§3.3")}).`,
      from: { path: "^apps/web/" },
      to: { path: ["^packages/db/", "^node_modules/(drizzle-orm|mysql2)/", "^apps/api/src/(?!index\\.ts$|app\\.ts$)"] },
    },
    {
      name: "web-routes-only-pages",
      severity: "error",
      comment: `routes/ hanya mengimpor pages dan queryOptions dari hooks (lewat features/<nama>/index.ts) untuk loader (${ref("§3.2, §7.1")}).`,
      from: { path: "^apps/web/src/routes/" },
      to: {
        path: [
          "^apps/web/src/components/",
          "^apps/web/src/features/[^/]+/(components|services)/",
          "^apps/web/src/lib/api-client",
          "^node_modules/hono/",
        ],
      },
    },
    {
      name: "web-pages-only-from-routes",
      severity: "error",
      comment: `pages hanya diimpor oleh routes (${ref("§3.2")}).`,
      from: { path: "^apps/web/src/", pathNot: "^apps/web/src/(routes|pages)/" },
      to: { path: "^apps/web/src/pages/" },
    },
    {
      name: "web-pages-no-other-pages",
      severity: "error",
      comment: `Halaman dilarang mengimpor halaman lain; bagian yang dipakai bersama dipindah ke features/ atau components/ (${ref("§3.2")}).`,
      from: { path: "^apps/web/src/pages/([^/]+)/" },
      to: { path: "^apps/web/src/pages/", pathNot: "^apps/web/src/pages/$1/" },
    },
    {
      name: "web-view-no-service",
      severity: "error",
      comment: `Pages dan komponen dilarang memanggil service, hc, atau api-client; data lewat hook (${ref("§3.2 butir 1")}).`,
      from: { path: "^apps/web/src/(pages|components|features/[^/]+/components)/" },
      to: { path: ["^apps/web/src/features/[^/]+/services/", "^apps/web/src/lib/api-client", "^node_modules/hono/"] },
    },
    {
      name: "web-generic-components-pure",
      severity: "error",
      comment: `Komponen generik di components/ hanya boleh mengimpor komponen generik, hook utilitas lib/hooks, ui, dan shared; tanpa hook data (${ref("§3.2 butir 4")}).`,
      from: { path: "^apps/web/src/components/" },
      to: { path: "^apps/web/src/(features|pages|routes|stores)/" },
    },
    {
      name: "web-hooks-no-view",
      severity: "error",
      comment: `Hooks hanya boleh memanggil hooks lain dan services, bukan api-client atau hc langsung (${ref("§3.2")}).`,
      from: { path: ["^apps/web/src/lib/hooks/", "^apps/web/src/features/[^/]+/hooks/"] },
      to: {
        path: [
          "^apps/web/src/(pages|components|routes)/",
          "^apps/web/src/features/[^/]+/components/",
          "^apps/web/src/lib/api-client",
          "^node_modules/hono/",
        ],
      },
    },
    {
      name: "web-services-no-react",
      severity: "error",
      comment: `Service frontend dilarang memakai React, hooks, atau komponen (${ref("§3.2 butir 2")}).`,
      from: { path: "^apps/web/src/features/[^/]+/services/" },
      to: {
        path: [
          "^node_modules/(react|react-dom|@tanstack/react-[^/]+)/",
          "^apps/web/src/(pages|components|routes|stores)/",
          "^apps/web/src/features/[^/]+/(hooks|components)/",
        ],
      },
    },
    {
      name: "web-feature-public-api",
      severity: "error",
      comment: `Fitur lain hanya boleh diimpor lewat features/<nama>/index.ts (${ref("§3.2 butir 3")}).`,
      from: { path: "^apps/web/src/features/([^/]+)/" },
      to: {
        path: "^apps/web/src/features/([^/]+)/(?!index\\.tsx?$)",
        pathNot: "^apps/web/src/features/$1/",
      },
    },
    {
      name: "web-outside-feature-public-api",
      severity: "error",
      comment: `Dari luar fitur, impor fitur hanya lewat features/<nama>/index.ts (${ref("§3.2 butir 3")}).`,
      from: { path: "^apps/web/src/(pages|routes|components|lib|stores)/" },
      to: { path: "^apps/web/src/features/[^/]+/(?!index\\.tsx?$)" },
    },

    // ---------- paket (§3.3, §4.1) ----------
    {
      name: "shared-is-pure",
      severity: "error",
      comment: `packages/shared wajib TypeScript murni; dependensi luar hanya zod (${ref("§4.1 butir 4")}).`,
      from: { path: "^packages/shared/", pathNot: "\\.test\\.ts$" },
      to: { pathNot: ["^packages/shared/", "^node_modules/zod/", "^zod$"] },
    },
    {
      name: "shared-no-workspace-deps",
      severity: "error",
      comment: `packages/shared dilarang bergantung pada db, ui, atau apps (${ref("§3.3")}).`,
      from: { path: "^packages/shared/" },
      to: { path: ["^packages/(db|ui)/", "^apps/"] },
    },
    {
      name: "db-no-ui",
      severity: "error",
      comment: `packages/db hanya boleh bergantung pada shared (${ref("§3.3")}).`,
      from: { path: "^packages/db/" },
      to: { path: ["^packages/ui/", "^apps/"] },
    },
    {
      name: "ui-no-db",
      severity: "error",
      comment: `packages/ui hanya boleh bergantung pada shared (${ref("§3.3")}).`,
      from: { path: "^packages/ui/" },
      to: { path: ["^packages/db/", "^apps/"] },
    },
    {
      name: "packages-no-apps",
      severity: "error",
      comment: "Paket dilarang mengimpor dari apps/.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "no-unresolvable",
      severity: "error",
      comment: "Impor yang tidak bisa di-resolve (salah path atau paket belum dipasang).",
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: ["(^|/)dist/", "(^|/)node_modules/", "\\.d\\.ts$"] },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
      mainFields: ["module", "main", "types", "typings"],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
}
