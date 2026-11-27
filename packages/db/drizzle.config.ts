import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "mysql",
  schema: "./src/schema",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "mysql://vynance:vynance_dev@localhost:12306/vynance" },
  strict: true,
  verbose: true,
})
