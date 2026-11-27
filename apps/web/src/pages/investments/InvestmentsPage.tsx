import { useNavigate } from "@tanstack/react-router"
import { type Asset, formatUnits, heroNeedsShort, type IconName, type Portfolio } from "@vynance/shared"
import { useState } from "react"
import { IconButton } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { ListRow } from "@/components/ListRow"
import { Money } from "@/components/Money"
import { ProgressBar } from "@/components/ProgressBar"
import { Sheet } from "@/components/Sheet"
import { EmptyState, ErrorState, Skeleton } from "@/components/States"
import { TopBar } from "@/components/TopBar"
import { useActiveBook } from "@/features/books"
import {
  AssetForm,
  TypeForm,
  useCreateAsset,
  useDeleteAsset,
  useDeleteInvestmentType,
  usePortfolio,
  useSaveInvestmentType,
  useUpdateAsset,
} from "@/features/investments"
import { showSnackbar } from "@/lib/snackbar"

type TypeRow = Portfolio["types"][number]
type SheetState =
  | { kind: "asset-create" }
  | { kind: "asset-edit"; asset: Asset }
  | { kind: "type-create" }
  | { kind: "type-edit"; type: TypeRow }
  | null

function pct(bp: number | null): string {
  if (bp === null) return "—"
  const v = (bp / 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })
  return `${bp > 0 ? "+" : ""}${v}%`
}

/** Investasi (design/10-investments.svg, FR-70, PB-06): nilai portofolio, untung/rugi, target per jenis, aset. */
export function InvestmentsPage() {
  const navigate = useNavigate()
  const bookId = useActiveBook()?.id ?? ""
  const query = usePortfolio(bookId)
  const saveType = useSaveInvestmentType(bookId)
  const removeType = useDeleteInvestmentType(bookId)
  const createAsset = useCreateAsset(bookId)
  const updateAsset = useUpdateAsset(bookId)
  const removeAsset = useDeleteAsset(bookId)
  const [sheet, setSheet] = useState<SheetState>(null)
  const close = () => setSheet(null)
  const p = query.data
  const value = BigInt(p?.totals.value ?? "0")
  const gain = BigInt(p?.totals.gain ?? "0")

  const onErr = (e: Error) => showSnackbar(e.message, { tone: "error" })

  return (
    <>
      <TopBar
        level={2}
        title="Investasi"
        backLabel="Kembali ke Lainnya"
        onBack={() => void navigate({ to: "/lainnya" })}
        action={<IconButton icon="plus" label="Tambah aset" onClick={() => setSheet({ kind: "asset-create" })} />}
      />
      {query.isPending ? <Skeleton rows={4} /> : null}
      {query.isError && !p ? (
        <ErrorState
          message="Investasi gagal dimuat."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}

      {p ? (
        <section className="hero" aria-label="Nilai portofolio">
          <p className="hero-label">Nilai portofolio</p>
          <p className="hero-value">
            <Money value={value} short={heroNeedsShort(value)} />
          </p>
          <div className="hero-row">
            <span>
              <Money value={gain} sign="auto" /> ({pct(p.totals.gainBp)})
            </span>
            <span>
              Modal <Money value={BigInt(p.totals.cost)} short />
            </span>
          </div>
        </section>
      ) : null}

      {p ? (
        <section className="section" aria-labelledby="inv-types">
          <div className="section-head">
            <h2 id="inv-types" className="h2">
              Target per jenis
            </h2>
            <button type="button" className="text-link" onClick={() => setSheet({ kind: "type-create" })}>
              Tambah jenis
            </button>
          </div>
          <div className="card">
            {p.types.map((t) => (
              <button
                key={t.id}
                type="button"
                className="alloc-row type-row"
                onClick={() => setSheet({ kind: "type-edit", type: t })}
                aria-label={`Ubah jenis ${t.name}`}
              >
                <span className="alloc-head">
                  <span className="row-title truncate">
                    <Icon name={t.icon as IconName} size={16} /> {t.name}
                  </span>
                  <span className="row-sub">
                    <Money value={BigInt(t.value)} short />
                    {t.targetValue ? (
                      <>
                        {" / "}
                        <Money value={BigInt(t.targetValue)} short />
                      </>
                    ) : null}
                  </span>
                </span>
                {t.progressBp !== null ? (
                  <ProgressBar valueBp={t.progressBp} tone="inc" label={`Progres target ${t.name}`} />
                ) : (
                  <span className="row-sub">Tanpa target · ketuk untuk mengatur</span>
                )}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {p && p.assets.length === 0 ? (
        <EmptyState
          icon="trend"
          title="Belum ada aset"
          body="Tambahkan emas, saham, atau reksa dana yang kamu punya beserta modal dan nilai kininya."
          actionLabel="Tambah aset"
          onAction={() => setSheet({ kind: "asset-create" })}
        />
      ) : null}

      {p && p.assets.length > 0 ? (
        <section className="section" aria-labelledby="inv-assets">
          <h2 id="inv-assets" className="h2">
            Aset
          </h2>
          <div className="card plain-list">
            {p.assets.map((a) => {
              const g = BigInt(a.gain)
              return (
                <ListRow
                  key={a.id}
                  icon={(p.types.find((t) => t.id === a.investmentTypeId)?.icon ?? "trend") as IconName}
                  tone="inv"
                  title={a.name}
                  subtitle={`${a.typeName}${Number(a.units) > 0 ? ` · ${formatUnits(a.units)}` : ""}`}
                  trailing={
                    <span className="asset-trailing">
                      <Money value={BigInt(a.currentValue)} />
                      <span className={`row-meta ${g < 0n ? "text-exp" : "text-inc"}`}>{pct(a.gainBp)}</span>
                    </span>
                  }
                  onClick={() => setSheet({ kind: "asset-edit", asset: a })}
                  ariaLabel={`Ubah aset ${a.name}`}
                />
              )
            })}
          </div>
        </section>
      ) : null}

      <Sheet open={sheet?.kind === "asset-create"} title="Tambah aset" onClose={close}>
        {p && sheet?.kind === "asset-create" ? (
          <AssetForm
            types={p.types}
            pending={createAsset.isPending}
            onSubmit={(v, onError) =>
              createAsset.mutate(v, {
                onSuccess: (a) => {
                  close()
                  showSnackbar(`Aset ${a.name} ditambahkan`)
                },
                onError,
              })
            }
          />
        ) : null}
      </Sheet>

      <Sheet open={sheet?.kind === "asset-edit"} title="Ubah aset" onClose={close}>
        {p && sheet?.kind === "asset-edit" ? (
          <AssetForm
            key={sheet.asset.id}
            initial={sheet.asset}
            types={p.types}
            pending={updateAsset.isPending}
            onDelete={() =>
              removeAsset.mutate(sheet.asset.id, {
                onSuccess: () => {
                  close()
                  showSnackbar("Aset dihapus")
                },
                onError: onErr,
              })
            }
            onSubmit={({ costBasis: _c, ...v }, onError) =>
              updateAsset.mutate(
                { id: sheet.asset.id, input: v },
                {
                  onSuccess: () => {
                    close()
                    showSnackbar("Nilai aset diperbarui")
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "type-create" || sheet?.kind === "type-edit"}
        title={sheet?.kind === "type-edit" ? "Ubah jenis investasi" : "Tambah jenis investasi"}
        onClose={close}
      >
        {sheet?.kind === "type-create" || sheet?.kind === "type-edit" ? (
          <TypeForm
            key={sheet.kind === "type-edit" ? sheet.type.id : "new"}
            initial={sheet.kind === "type-edit" ? sheet.type : undefined}
            pending={saveType.isPending}
            onDelete={
              sheet.kind === "type-edit"
                ? () =>
                    removeType.mutate(sheet.type.id, {
                      onSuccess: () => {
                        close()
                        showSnackbar("Jenis dihapus")
                      },
                      onError: onErr,
                    })
                : undefined
            }
            onSubmit={(v, onError) =>
              saveType.mutate(
                { id: sheet.kind === "type-edit" ? sheet.type.id : null, input: v },
                {
                  onSuccess: () => {
                    close()
                    showSnackbar("Jenis investasi disimpan")
                  },
                  onError,
                },
              )
            }
          />
        ) : null}
      </Sheet>
    </>
  )
}
