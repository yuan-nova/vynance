import { formatBookCode } from "@vynance/shared"

type BookCodeProps = { code: string }

/** Kode buku `XXXX-XXXX` dengan angka tabular (DS-NAV-04). */
export function BookCode({ code }: BookCodeProps) {
  return <span className="book-code">{formatBookCode(code)}</span>
}
