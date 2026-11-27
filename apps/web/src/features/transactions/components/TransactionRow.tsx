import { type IconName, type TransactionListItem, TX_TYPE_ICON, TX_TYPE_TONE, txSign } from "@vynance/shared"
import { ListRow } from "@/components/ListRow"
import { Money } from "@/components/Money"
import { Pill } from "@/components/Pill"

type TransactionRowProps = { tx: TransactionListItem; onOpen?: () => void }

/** Baris transaksi (DS-DATA-01): arti dari ikon + tanda + warna, bukan warna saja (DS-COLOR-01). */
export function TransactionRow({ tx, onOpen }: TransactionRowProps) {
  const sign = txSign(tx.type)
  const title =
    tx.note ||
    (tx.type === "transfer" ? `${tx.walletName} → ${tx.toWalletName ?? "(dihapus)"}` : (tx.categoryName ?? "(dihapus)"))
  const sub = tx.type === "transfer" ? "Transfer" : `${tx.categoryName ?? "(dihapus)"} · ${tx.walletName}`
  const badge =
    tx.source === "scan" ? (
      <Pill tone="neutral">Scan</Pill>
    ) : tx.source === "subscription" ? (
      <Pill tone="auto">Otomatis</Pill>
    ) : null
  return (
    <ListRow
      icon={(tx.categoryIcon as IconName | null) ?? TX_TYPE_ICON[tx.type]}
      tone={TX_TYPE_TONE[tx.type]}
      title={title}
      subtitle={sub}
      badge={badge}
      trailing={
        <Money
          value={BigInt(tx.amount)}
          sign={sign}
          tone={sign === "income" ? "inc" : sign === "expense" ? "exp" : "ink"}
        />
      }
      meta={tx.createdByName || undefined}
      onClick={onOpen}
      ariaLabel={onOpen ? `Buka transaksi ${title}` : undefined}
    />
  )
}
