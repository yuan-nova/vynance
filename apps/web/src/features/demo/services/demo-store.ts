import type { DemoTransaction } from "@vynance/shared"

// Penyimpanan mode demo (FR-151): hanya localStorage perangkat ini, tidak pernah dikirim sebelum pengguna memilih impor.

const STORAGE_KEY = "vynance.demo.v1"
const listeners = new Set<() => void>()
let cache: DemoTransaction[] | null = null

function load(): DemoTransaction[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    cache = Array.isArray(parsed) ? (parsed as DemoTransaction[]) : []
  } catch {
    cache = []
  }
  return cache
}

function save(rows: DemoTransaction[]): void {
  cache = rows
  try {
    if (rows.length === 0) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  } catch {
    // Penyimpanan diblokir: data demo hanya hidup selama tab terbuka.
  }
  for (const l of listeners) l()
}

export function demoRows(): DemoTransaction[] {
  return load()
}

export function subscribeDemo(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function addDemoRow(row: Omit<DemoTransaction, "id">): void {
  const id = crypto.randomUUID().replaceAll("-", "")
  save([{ ...row, id }, ...load()])
}

export function removeDemoRow(id: string): void {
  save(load().filter((r) => r.id !== id))
}

export function clearDemo(): void {
  save([])
}
