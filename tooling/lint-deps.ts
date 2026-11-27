/**
 * Menjalankan dependency-cruiser per kelompok workspace dengan tsconfig masing-masing,
 * supaya alias `@/` di tiap app ter-resolve. Kelompok yang foldernya belum ada dilewati.
 * Aturan ada di .dependency-cruiser.cjs (docs/CODING-GUIDELINES.md §3).
 */
import { existsSync } from "node:fs"

type Target = { dirs: string[]; tsConfig?: string }

const TARGETS: Target[] = [
  { dirs: ["apps/web"], tsConfig: "apps/web/tsconfig.json" },
  { dirs: ["apps/api", "apps/worker"], tsConfig: "apps/api/tsconfig.json" },
  { dirs: ["packages"] },
]

let failed = false
let ran = 0
for (const target of TARGETS) {
  const dirs = target.dirs.filter((d) => existsSync(d))
  if (dirs.length === 0) continue
  const args = ["depcruise", ...dirs, "--config", ".dependency-cruiser.cjs", "--output-type", "err"]
  if (target.tsConfig && existsSync(target.tsConfig)) args.push("--ts-config", target.tsConfig)
  ran++
  const proc = Bun.spawnSync(["bunx", ...args], { stdout: "inherit", stderr: "inherit" })
  if (proc.exitCode !== 0) failed = true
}

if (ran === 0) console.log("lint:deps: belum ada apps/ atau packages/, dilewati.")
process.exit(failed ? 1 : 0)
