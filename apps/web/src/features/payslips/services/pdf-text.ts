/**
 * Ambil teks PDF di perangkat dengan pdf.js (ADR 0007). File tidak pernah diunggah.
 * Potongan teks dikelompokkan per baris berdasarkan posisi vertikal supaya label dan nominal tetap sebaris.
 */
export async function pdfToText(file: File, maxPages = 3): Promise<string> {
  const [pdfjs, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise
  try {
    const out: string[] = []
    for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const rows = new Map<number, { x: number; s: string }[]>()
      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue
        const y = Math.round(item.transform[5] / 3)
        const row = rows.get(y) ?? []
        row.push({ x: item.transform[4], s: item.str })
        rows.set(y, row)
      }
      for (const y of [...rows.keys()].sort((a, b) => b - a)) {
        const parts = (rows.get(y) ?? []).sort((a, b) => a.x - b.x).map((r) => r.s.trim())
        out.push(parts.join(" "))
      }
    }
    return out.join("\n")
  } finally {
    await doc.destroy()
  }
}
