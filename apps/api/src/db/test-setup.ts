import { afterAll } from "bun:test"
import { testDb } from "./test-fixtures"

// Preload bun test: tutup pool DB uji bersama setelah semua test supaya proses selesai.
afterAll(async () => {
  await testDb.$client.end()
})
