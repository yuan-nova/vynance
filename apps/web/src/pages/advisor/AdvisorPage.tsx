import { useNavigate } from "@tanstack/react-router"
import { ADVISOR_QUICK_QUESTIONS, MAX_ADVISOR_QUESTION } from "@vynance/shared"
import { useRef, useState } from "react"
import { Button } from "@/components/Button"
import { ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { askAdvisor, useAdvisorConsent, useAdvisorContext, useSaveConsent } from "@/features/advisor"
import { useActiveBook } from "@/features/books"
import { showSnackbar } from "@/lib/snackbar"

type Turn = { id: number; question: string; answer: string; done: boolean; error?: string }

/** AI advisor (design/13-ai-advisor.svg, FR-100, PB-11). Jawaban dirender sebagai teks biasa (input tak tepercaya). */
export function AdvisorPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const consent = useAdvisorConsent(bookId)
  const agreed = Boolean(consent.data?.consentedAt)
  const context = useAdvisorContext(consent.data && !agreed ? bookId : "")
  const save = useSaveConsent(bookId)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState("")
  const busy = turns.some((t) => !t.done)
  const nextId = useRef(0)

  const ask = async (question: string) => {
    const q = question.trim()
    if (q.length < 3 || busy) return
    const id = nextId.current++
    setDraft("")
    setTurns((ts) => [...ts, { id, question: q, answer: "", done: false }])
    const patch = (p: Partial<Turn> | ((t: Turn) => Partial<Turn>)) =>
      setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, ...(typeof p === "function" ? p(t) : p) } : t)))
    try {
      await askAdvisor(bookId, q, (chunk) => patch((t) => ({ answer: t.answer + chunk })))
      patch({ done: true })
    } catch (e) {
      patch({ done: true, error: e instanceof Error ? e.message : "Gagal menjawab." })
    }
  }

  return (
    <>
      <TopBar
        level={2}
        title="Asisten Vynance"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
      />
      <p className="row-sub advisor-sub">Pakai data bulan ini · edukasi, bukan nasihat resmi</p>
      {consent.isPending ? <Skeleton rows={2} /> : null}
      {consent.isError ? (
        <ErrorState
          message="Asisten gagal dimuat."
          onRetry={() => void consent.refetch()}
          retrying={consent.isFetching}
        />
      ) : null}

      {consent.data && !agreed ? (
        <section className="card advisor-consent">
          <h2 className="h2">Izinkan kirim ringkasan ke penyedia AI?</h2>
          <p className="body">
            Untuk menjawab, Vynance mengirim ringkasan angka berikut ke penyedia AI (OpenRouter, yang meneruskannya ke
            model AI pilihan Vynance). Tanpa nama rekening, email, atau nomor apa pun. Kamu bisa mencabut izin kapan
            saja.
          </p>
          {context.data ? <pre className="advisor-context">{context.data}</pre> : <Skeleton rows={3} />}
          <Button
            variant="primary"
            full
            loading={save.isPending}
            onClick={() => save.mutate(true, { onError: (e) => showSnackbar(e.message, { tone: "error" }) })}
          >
            Setuju dan mulai bertanya
          </Button>
        </section>
      ) : null}

      {agreed ? (
        <>
          <ol className="plain-list advisor-chat" aria-live="polite">
            {turns.map((t) => (
              <li key={t.id} className="advisor-turn">
                <p className="advisor-q">{t.question}</p>
                <div className="card advisor-a" aria-busy={!t.done}>
                  {t.error ? (
                    <p className="field-error" role="alert">
                      {t.error}
                    </p>
                  ) : (
                    <p className="advisor-text">{t.answer || (t.done ? "" : "Sedang berpikir…")}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <section className="section" aria-labelledby="advisor-quick">
            <h2 id="advisor-quick" className="row-sub">
              Coba tanya
            </h2>
            <div className="chip-row">
              {ADVISOR_QUICK_QUESTIONS.map((q) => (
                <button key={q} type="button" className="chip" disabled={busy} onClick={() => void ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          </section>

          <form
            className="advisor-form"
            onSubmit={(e) => {
              e.preventDefault()
              void ask(draft)
            }}
          >
            <label htmlFor="advisor-input" className="sr-only">
              Pertanyaan
            </label>
            <input
              id="advisor-input"
              className="field-input"
              placeholder="Tanya soal keuanganmu…"
              maxLength={MAX_ADVISOR_QUESTION}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" variant="primary" loading={busy} disabled={draft.trim().length < 3}>
              Kirim
            </Button>
          </form>

          <Button variant="ghost" full onClick={() => save.mutate(false, { onSuccess: () => setTurns([]) })}>
            Cabut izin AI
          </Button>
        </>
      ) : null}
    </>
  )
}
