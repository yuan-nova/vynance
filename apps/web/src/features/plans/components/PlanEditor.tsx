import {
  type AllocationMode,
  type Category,
  type InvestmentType,
  type Plan,
  type PutPlanInput,
  planTotals,
} from "@vynance/shared"
import { useRef, useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { ChipGroup } from "@/components/ChipGroup"
import { Money } from "@/components/Money"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { ApiRequestError } from "@/lib/api-error"
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback"
import { showSnackbar } from "@/lib/snackbar"
import { useSavePlan } from "../hooks/usePlan"

type Alloc = { mode: AllocationMode; amount: bigint | null; percentBp: number }
type Draft = {
  spendingCap: bigint | null
  incomes: { key: number; name: string; amount: bigint | null }[]
  expense: Record<string, Alloc>
  investment: Record<string, Alloc>
}

const MODE_OPTIONS = [
  { value: "amount", label: "Rp" },
  { value: "percent", label: "%" },
] as const

function fromPlan(p: Plan): Draft {
  const expense: Record<string, Alloc> = {}
  const investment: Record<string, Alloc> = {}
  for (const a of p.allocations) {
    const v = { mode: a.mode, amount: BigInt(a.amount), percentBp: a.percentBp }
    if (a.kind === "expense" && a.categoryId) expense[a.categoryId] = v
    if (a.kind === "investment" && a.investmentTypeId) investment[a.investmentTypeId] = v
  }
  return {
    spendingCap: p.spendingCap === null ? null : BigInt(p.spendingCap),
    incomes: p.incomes.map((i, key) => ({ key, name: i.name, amount: BigInt(i.amount) })),
    expense,
    investment,
  }
}

function toInput(d: Draft, version: number, defaultWalletId: string | null): PutPlanInput {
  const allocs = (kind: "expense" | "investment", m: Record<string, Alloc>) =>
    Object.entries(m)
      .filter(([, a]) => (a.mode === "amount" ? (a.amount ?? 0n) > 0n : a.percentBp > 0))
      .map(([id, a]) =>
        kind === "expense"
          ? { kind, categoryId: id, mode: a.mode, amount: a.amount ?? 0n, percentBp: a.percentBp }
          : { kind, investmentTypeId: id, mode: a.mode, amount: a.amount ?? 0n, percentBp: a.percentBp },
      )
  return {
    version,
    spendingCap: d.spendingCap,
    defaultWalletId,
    method: "custom",
    incomes: d.incomes
      .filter((i) => i.name.trim() && i.amount !== null)
      .map((i) => ({ name: i.name.trim(), amount: i.amount ?? 0n })),
    allocations: [...allocs("expense", d.expense), ...allocs("investment", d.investment)],
  }
}

function parsePercent(v: string): number {
  const n = Number(v.replace(",", "."))
  return Number.isFinite(n) ? Math.max(0, Math.min(10_000, Math.round(n * 100))) : 0
}

type PlanEditorProps = {
  bookId: string
  plan: Plan
  categories: Category[]
  investmentTypes: InvestmentType[]
  onConflict: () => void
}

/**
 * Rencana bulanan (PB-04): penghasilan, plafon, alokasi nominal/persen, sisa belum dialokasikan (BR-13).
 * Simpan otomatis 0,6 detik setelah berhenti mengetik. Draf form lokal; data server tetap di TanStack Query.
 */
export function PlanEditor({ bookId, plan, categories, investmentTypes, onConflict }: PlanEditorProps) {
  const [draft, setDraft] = useState<Draft>(() => fromPlan(plan))
  const version = useRef(plan.version)
  const nextKey = useRef(plan.incomes.length)
  const save = useSavePlan(bookId, plan.month)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle")

  const persist = (d: Draft) => {
    setStatus("saving")
    save.mutate(toInput(d, version.current, plan.defaultWalletId), {
      onSuccess: (p) => {
        version.current = p.version
        setStatus("saved")
      },
      onError: (err) => {
        if (err instanceof ApiRequestError && err.code === "PLAN_CONFLICT") {
          showSnackbar(err.message, { tone: "error" })
          onConflict()
          return
        }
        setStatus("failed")
      },
    })
  }
  const schedule = useDebouncedCallback(persist, 600)
  const update = (fn: (d: Draft) => Draft) => {
    const next = fn(draft)
    setDraft(next)
    schedule(next)
  }

  const allocList = (m: Record<string, Alloc>) =>
    Object.values(m).map((a) => ({ mode: a.mode, amount: a.amount ?? 0n, percentBp: a.percentBp }))
  const totals = planTotals(
    draft.incomes.map((i) => ({ amount: i.amount ?? 0n })),
    draft.spendingCap,
    [
      ...allocList(draft.expense).map((a) => ({ ...a, kind: "expense" as const })),
      ...allocList(draft.investment).map((a) => ({ ...a, kind: "investment" as const })),
    ],
  )

  const allocRow = (kind: "expense" | "investment", id: string, name: string) => {
    const m = kind === "expense" ? draft.expense : draft.investment
    const a = m[id] ?? { mode: "amount" as const, amount: null, percentBp: 0 }
    const set = (patch: Partial<Alloc>) =>
      update((d) => ({
        ...d,
        [kind]: { ...(kind === "expense" ? d.expense : d.investment), [id]: { ...a, ...patch } },
      }))
    return (
      <div key={id} className="alloc-row">
        <p className="row-title truncate">{name}</p>
        <div className="alloc-inputs">
          <ChipGroup
            label={`Satuan ${name}`}
            options={MODE_OPTIONS}
            value={a.mode}
            onChange={(mode) => set({ mode })}
          />
          {a.mode === "amount" ? (
            <MoneyInput label={`Alokasi ${name}`} value={a.amount} onChange={(amount) => set({ amount })} />
          ) : (
            <TextField
              label={`Persen ${name}`}
              inputMode="decimal"
              value={a.percentBp ? String(a.percentBp / 100) : ""}
              onChange={(e) => set({ percentBp: parsePercent(e.target.value) })}
              hint={kind === "expense" ? "% dari plafon pengeluaran" : "% dari total penghasilan"}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="hero" aria-label="Penghasilan rencana">
        <p className="hero-label">Penghasilan bulan ini (rencana)</p>
        <p className="hero-value">
          <Money value={totals.totalIncome} />
        </p>
        <div className="hero-row">
          <span>
            Tercatat <Money value={BigInt(plan.recordedIncome)} />
          </span>
          <span aria-live="polite">
            {status === "saving"
              ? "Menyimpan…"
              : status === "saved"
                ? "Tersimpan otomatis"
                : status === "failed"
                  ? "Gagal menyimpan"
                  : plan.version > 0
                    ? "Tersimpan"
                    : "Belum disimpan"}
          </span>
        </div>
      </section>
      {status === "failed" ? (
        <Button variant="soft" full onClick={() => persist(draft)}>
          Coba simpan lagi
        </Button>
      ) : null}

      <section className="card summary-strip summary-3" aria-label="Ringkasan alokasi">
        <div>
          <p className="row-sub">Pengeluaran</p>
          <Money value={totals.expenseAllocated} short />
        </div>
        <div>
          <p className="row-sub">Investasi</p>
          <Money value={totals.investmentAllocated} short />
        </div>
        <div>
          <p className="row-sub">{totals.unallocated < 0n ? "Kelebihan" : "Belum diatur"}</p>
          <Money
            value={totals.unallocated < 0n ? -totals.unallocated : totals.unallocated}
            short
            tone={totals.unallocated < 0n ? "exp" : "ink"}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="plan-income">
        <h2 id="plan-income" className="h2">
          Penghasilan
        </h2>
        <div className="card">
          {draft.incomes.map((inc, i) => (
            <div key={inc.key} className="income-row">
              <TextField
                label={`Nama penghasilan ${i + 1}`}
                value={inc.name}
                maxLength={60}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    incomes: d.incomes.map((x) => (x.key === inc.key ? { ...x, name: e.target.value } : x)),
                  }))
                }
              />
              <MoneyInput
                label={`Jumlah penghasilan ${i + 1}`}
                value={inc.amount}
                onChange={(amount) =>
                  update((d) => ({ ...d, incomes: d.incomes.map((x) => (x.key === inc.key ? { ...x, amount } : x)) }))
                }
              />
              <IconButton
                icon="trash"
                label={`Hapus penghasilan ${inc.name || i + 1}`}
                onClick={() => update((d) => ({ ...d, incomes: d.incomes.filter((x) => x.key !== inc.key) }))}
              />
            </div>
          ))}
          <Button
            variant="soft"
            full
            icon="plus"
            onClick={() => {
              nextKey.current += 1
              const key = nextKey.current
              setDraft((d) => ({ ...d, incomes: [...d.incomes, { key, name: "", amount: null }] }))
            }}
          >
            Tambah penghasilan
          </Button>
        </div>
      </section>

      <section className="section" aria-labelledby="plan-cap">
        <h2 id="plan-cap" className="h2">
          Plafon pengeluaran
        </h2>
        <MoneyInput
          label="Batas pengeluaran bulan ini"
          value={draft.spendingCap}
          onChange={(spendingCap) => update((d) => ({ ...d, spendingCap }))}
        />
      </section>

      <section className="section" aria-labelledby="plan-expense">
        <h2 id="plan-expense" className="h2">
          Alokasi pengeluaran
        </h2>
        <div className="card">{categories.map((c) => allocRow("expense", c.id, c.name))}</div>
      </section>

      <section className="section" aria-labelledby="plan-invest">
        <h2 id="plan-invest" className="h2">
          Alokasi investasi
        </h2>
        <div className="card">{investmentTypes.map((t) => allocRow("investment", t.id, t.name))}</div>
      </section>
    </>
  )
}
