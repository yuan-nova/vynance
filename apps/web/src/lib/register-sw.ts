/**
 * Daftarkan service worker (NFR-04) hanya di build produksi.
 * Di dev, Vite menyajikan modul langsung dan service worker akan mengganggu HMR.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Gagal mendaftar tidak menghalangi aplikasi; hanya mode offline yang tidak tersedia.
    })
  })
}
