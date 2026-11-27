import { type IconName, isDebtWallet, WALLET_TYPE_LABEL, type Wallet } from "@vynance/shared"
import { ListRow } from "@/components/ListRow"
import { Money } from "@/components/Money"
import { ProgressBar } from "@/components/ProgressBar"

type WalletRowProps = { wallet: Wallet; onOpen: () => void }

/** Baris rekening; utang menampilkan pemakaian limit (BR-05, DS-DATA-03: bar + nominal teks). */
export function WalletRow({ wallet, onOpen }: WalletRowProps) {
  const balance = BigInt(wallet.balance)
  const debt = isDebtWallet(wallet.type)
  const row = (
    <ListRow
      icon={wallet.icon as IconName}
      tone={debt ? "exp" : "pri"}
      title={wallet.name}
      subtitle={WALLET_TYPE_LABEL[wallet.type]}
      trailing={<Money value={balance} tone={debt && balance < 0n ? "exp" : "ink"} />}
      onClick={onOpen}
      ariaLabel={`Ubah rekening ${wallet.name}`}
    />
  )
  if (!debt || wallet.creditLimit === null || wallet.limitUsageBp === null) return row
  const pct = Math.floor(wallet.limitUsageBp / 100)
  return (
    <div className="wallet-debt">
      {row}
      <ProgressBar
        valueBp={wallet.limitUsageBp}
        tone={wallet.limitUsageBp >= 9000 ? "exp" : wallet.limitUsageBp >= 7000 ? "warn" : "pri"}
        label={`Pemakaian limit ${wallet.name}`}
      />
      <span className="row-sub">
        Terpakai {pct}% dari <Money value={BigInt(wallet.creditLimit)} />
      </span>
    </div>
  )
}
