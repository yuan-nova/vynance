import {
  type Category,
  distributeEvenly,
  type GroupSplit,
  type Plan,
  type PutPlanInput,
  splitByPercent,
  WIZARD_METHOD_LABEL,
  WIZARD_PRESETS,
  type WizardMethod,
  wizardSpendingCap,
} from "@vynance/shared"
import { useRef, useState } from "react"
import { Button, IconButton } from "@/components/Button"
import { Money } from "@/components/Money"
import { MoneyInput } from "@/components/MoneyInput"
import { TextField } from "@/components/TextField"
import { ApiRequestError } from "@/lib/api-error"
import { useSavePlan } from "../hooks/usePlan"

type Income = { key: number; name: string; amount: bigint | null }
type Group = "needs" | "wants" | "savings"
const GROUP_LABEL: Record<Group, string> = { needs: "Kebutuhan", wants: "Keinginan", savings: "Tabungan & investasi" }
const STEPS = ["Metode", "Pendapatan", "Alokasi", "Kategori", "Simpan"] as const
const METHODS: WizardMethod[] = ["50_30_20", "60_20_20", "70_10_20", "custom", "fixed"]

type PlanWizardProps = {
  bookId: string
  plan: Plan
  categories: Category[]
  onDone: () => void
  onCancel: () => void
}

/**
 * Wizard anggaran (design/08, FR-41, PB-04): layar penuh karena langkahnya saling bergantung (DS-SHEET-01).
 * Semua isian disimpan di satu state, jadi kembali ke langkah sebelumnya tidak menghapus isian.
 * Hasilnya rencana biasa (method + plafon + alokasi nominal), sama dengan isian manual setara.
 */
export function PlanWizard({ bookId, plan, categories, onDone, onCancel }: PlanWizardProps) {
  const save = useSavePlan(bookId, plan.month)
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState<WizardMethod>("50_30_20")
  const [customPct, setCustomPct] = useState<[string, string, string]>(["50", "30", "20"])
  const [fixed, setFixed] = useState<Record<Group, bigint | null>>({ needs: null, wants: null, savings: null })
  const nextKey = useRef(plan.incomes.length)
  const [incomes, setIncomes] = useState<Income[]>(
    plan.incomes.some((i) => !i.fromSource)
      ? plan.incomes.filter((i) => !i.fromSource).map((i, key) => ({ key, name: i.name, amount: BigInt(i.amount) }))
      : plan.incomes.length
        ? []
        : [{ key: 0, name: "Gaji", amount: null }],
  )
  const [perCategory, setPerCategory] = useState<Record<string, bigint | null> | null>(null)
  const [error, setError] = useState<string | null>(null)

  // BR-62: penghasilan dari Sumber Penghasilan sudah masuk; wizard hanya menambah penghasilan khusus.
  const sourceTotal = plan.incomes.filter((i) => i.fromSource).reduce((s, i) => s + BigInt(i.amount), 0n)
  const totalIncome = sourceTotal + incomes.reduce((s, i) => s + (i.amount ?? 0n), 0n)
  const pctBp = customPct.map((v) => Math.round(Number(v.replace(",", ".") || "0") * 100)) as [number, number, number]
  const split: GroupSplit =
    method === "fixed"
      ? { needs: fixed.needs ?? 0n, wants: fixed.wants ?? 0n, savings: fixed.savings ?? 0n }
      : splitByPercent(totalIncome, method === "custom" ? pctBp : WIZARD_PRESETS[method])
  const allocatedTotal = split.needs + split.wants + split.savings
  const byGroup = (g: Group) => categories.filter((c) => c.budgetGroup === g)

  /** Saran awal per kategori: bagi rata nominal kelompok. Dibuat sekali saat masuk langkah Kategori. */
  const suggested = (): Record<string, bigint | null> => {
    const out: Record<string, bigint | null> = {}
    for (const g of ["needs", "wants", "savings"] as Group[]) {
      const cats = byGroup(g)
      distributeEvenly(split[g], cats.length).forEach((v, i) => {
        const c = cats[i]
        if (c) out[c.id] = v
      })
    }
    return out
  }

  const canNext =
    step === 0
      ? method !== "custom" || pctBp.reduce((a, b) => a + b, 0) <= 10_000
      : step === 1
        ? totalIncome > 0n && incomes.every((i) => i.name.trim() || i.amount === null)
        : step === 2
          ? allocatedTotal <= totalIncome || method === "fixed"
          : true

  const next = () => {
    setError(null)
    if (step === 2) setPerCategory((cur) => cur ?? suggested())
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const submit = () => {
    const alloc = perCategory ?? suggested()
    const input: PutPlanInput = {
      version: plan.version,
      spendingCap: wizardSpendingCap(split),
      defaultWalletId: plan.defaultWalletId,
      method,
      incomes: incomes
        .filter((i) => i.name.trim() && i.amount !== null && i.amount > 0n)
        .map((i) => ({ name: i.name.trim(), amount: i.amount ?? 0n })),
      allocations: Object.entries(alloc)
        .filter(([, v]) => (v ?? 0n) > 0n)
        .map(([categoryId, v]) => ({
          kind: "expense" as const,
          categoryId,
          mode: "amount" as const,
          amount: v ?? 0n,
          percentBp: 0,
        })),
    }
    save.mutate(input, {
      onSuccess: onDone,
      onError: (e) =>
        setError(
          e instanceof ApiRequestError && e.code === "PLAN_CONFLICT"
            ? "Rencana bulan ini baru diubah anggota lain. Buka lagi wizard untuk memakai data terbaru."
            : e.message,
        ),
    })
  }

  return (
    <div className="wizard">
      <p className="row-sub">
        Langkah {step + 1} dari {STEPS.length} · {STEPS[step]}
      </p>
      <ol className="wizard-steps" aria-label="Langkah wizard">
        {STEPS.map((s, i) => (
          <li key={s} className={i <= step ? "wizard-step-done" : ""} aria-current={i === step ? "step" : undefined}>
            <span className="sr-only">{s}</span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section aria-labelledby="wz-method">
          <h2 id="wz-method" className="h2">
            Pilih cara membagi penghasilan
          </h2>
          <fieldset className="wizard-options">
            <legend className="sr-only">Metode pembagian</legend>
            {METHODS.map((m) => (
              <label key={m} className={`wizard-option${method === m ? " wizard-option-on" : ""}`}>
                <input
                  type="radio"
                  name="wizard-method"
                  className="sr-only"
                  checked={method === m}
                  onChange={() => setMethod(m)}
                />
                <span className="row-title">{WIZARD_METHOD_LABEL[m].title}</span>
                <span className="row-sub">{WIZARD_METHOD_LABEL[m].sub}</span>
              </label>
            ))}
          </fieldset>
          {method === "custom" ? (
            <div className="wizard-grid">
              {(["needs", "wants", "savings"] as Group[]).map((g, i) => (
                <TextField
                  key={g}
                  label={`${GROUP_LABEL[g]} (%)`}
                  inputMode="decimal"
                  value={customPct[i] ?? ""}
                  onChange={(e) =>
                    setCustomPct((p) => p.map((v, j) => (j === i ? e.target.value : v)) as [string, string, string])
                  }
                  error={i === 2 && pctBp.reduce((a, b) => a + b, 0) > 10_000 ? "Total lebih dari 100%" : undefined}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 1 ? (
        <section aria-labelledby="wz-income">
          <h2 id="wz-income" className="h2">
            Penghasilan bulan ini
          </h2>
          <div className="card">
            {incomes.map((inc, i) => (
              <div key={inc.key} className="income-row">
                <TextField
                  label={`Nama penghasilan ${i + 1}`}
                  value={inc.name}
                  maxLength={60}
                  onChange={(e) =>
                    setIncomes((l) => l.map((x) => (x.key === inc.key ? { ...x, name: e.target.value } : x)))
                  }
                />
                <MoneyInput
                  label={`Jumlah penghasilan ${i + 1}`}
                  value={inc.amount}
                  onChange={(amount) => setIncomes((l) => l.map((x) => (x.key === inc.key ? { ...x, amount } : x)))}
                />
                <IconButton
                  icon="trash"
                  label={`Hapus penghasilan ${inc.name || i + 1}`}
                  onClick={() => setIncomes((l) => l.filter((x) => x.key !== inc.key))}
                />
              </div>
            ))}
            <Button
              variant="soft"
              full
              icon="plus"
              onClick={() => {
                nextKey.current += 1
                setIncomes((l) => [...l, { key: nextKey.current, name: "", amount: null }])
              }}
            >
              Tambah penghasilan
            </Button>
          </div>
          <p className="row-sub">
            Total <Money value={totalIncome} />
          </p>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="wz-alloc">
          <h2 id="wz-alloc" className="h2">
            Bagaimana kamu ingin membagi <Money value={totalIncome} />?
          </h2>
          <div className="card">
            {(["needs", "wants", "savings"] as Group[]).map((g) =>
              method === "fixed" ? (
                <MoneyInput
                  key={g}
                  label={GROUP_LABEL[g]}
                  value={fixed[g]}
                  onChange={(v) => setFixed((f) => ({ ...f, [g]: v }))}
                />
              ) : (
                <div key={g} className="status-row">
                  <span>{GROUP_LABEL[g]}</span>
                  <Money value={split[g]} />
                </div>
              ),
            )}
          </div>
          <p className="row-sub">
            Plafon pengeluaran = Kebutuhan + Keinginan = <Money value={wizardSpendingCap(split)} />
          </p>
          {allocatedTotal > totalIncome ? (
            <p className="field-error" role="alert">
              Total alokasi <Money value={allocatedTotal} /> melebihi penghasilan.
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby="wz-cat">
          <h2 id="wz-cat" className="h2">
            Bagi ke kategori
          </h2>
          {(["needs", "wants", "savings"] as Group[]).map((g) => {
            const cats = byGroup(g)
            if (cats.length === 0) return null
            const used = cats.reduce((s, c) => s + (perCategory?.[c.id] ?? 0n), 0n)
            return (
              <div key={g} className="card wizard-group">
                <div className="status-row">
                  <span className="row-title">{GROUP_LABEL[g]}</span>
                  <span className={`row-sub${used > split[g] ? " text-exp" : ""}`}>
                    <Money value={used} /> / <Money value={split[g]} />
                  </span>
                </div>
                {cats.map((c) => (
                  <MoneyInput
                    key={c.id}
                    label={c.name}
                    value={perCategory?.[c.id] ?? null}
                    onChange={(v) => setPerCategory((p) => ({ ...(p ?? {}), [c.id]: v }))}
                  />
                ))}
              </div>
            )
          })}
          {categories.every((c) => !c.budgetGroup) ? (
            <p className="row-sub">Kategorimu belum punya grup 50/30/20. Atur grupnya di Lainnya → Kategori.</p>
          ) : null}
        </section>
      ) : null}

      {step === 4 ? (
        <section aria-labelledby="wz-save">
          <h2 id="wz-save" className="h2">
            Simpan rencana
          </h2>
          <div className="card">
            <div className="status-row">
              <span>Penghasilan</span>
              <Money value={totalIncome} />
            </div>
            <div className="status-row">
              <span>Plafon pengeluaran</span>
              <Money value={wizardSpendingCap(split)} />
            </div>
            <div className="status-row">
              <span>Kategori teranggarkan</span>
              <span>{Object.values(perCategory ?? {}).filter((v) => (v ?? 0n) > 0n).length}</span>
            </div>
          </div>
          {plan.version > 0 ? (
            <p className="row-sub">Rencana bulan ini yang sudah ada akan diganti dengan hasil wizard.</p>
          ) : null}
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="wizard-actions">
        <Button variant="ghost" onClick={() => (step === 0 ? onCancel() : setStep((s) => s - 1))}>
          {step === 0 ? "Batal" : "Kembali"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!canNext}>
            {step === 3 ? "Lanjut ke ringkasan" : step === 2 ? "Lanjut ke kategori" : "Lanjut"}
          </Button>
        ) : (
          <Button onClick={submit} loading={save.isPending}>
            Simpan rencana
          </Button>
        )}
      </div>
    </div>
  )
}
