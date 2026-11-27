import { fileURLToPath, URL } from "node:url"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    host: "0.0.0.0",
    port: 12082,
    strictPort: true,
    // Bind mount dari Windows tidak mengirim event file ke container, jadi pakai polling di Docker.
    watch: process.env.VITE_POLL === "1" ? { usePolling: true, interval: 300 } : undefined,
    proxy: { "/api": { target: process.env.API_PROXY_TARGET ?? "http://localhost:12081", changeOrigin: false } },
  },
})
