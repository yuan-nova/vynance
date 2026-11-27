import { CURRENCY_SYMBOL, formatDateShort, type IconName, recognizeService, type Subscription } from "@vynance/shared"
import { ListRow } from "@/components/ListRow"
import { Money } from "@/components/Money"
import { Pill } from "@/components/Pill"
import { usePrivacyMode } from "@/lib/hooks/usePrivacyMode"

type SubscriptionRowProps = { sub: Subscription; onOpen: () => void }

/** Baris langganan (design/11): ikon layanan, tanggal & rekening, biaya per bulan (BR-40). */
export function SubscriptionRow({ sub, onOpen }: SubscriptionRowProps) {
  const privacy = usePrivacyMode()
  const svc = recognizeService(sub.name)
  const foreign = sub.currency !== "IDR"
  const sub2 = sub.paused
    ? "Dijeda"
    : sub.lastChargedOn
      ? `Tercatat otomatis ${formatDateShort(sub.lastChargedOn)}`
      : foreign && !privacy
        ? `${CURRENCY_SYMBOL[sub.currency]}${Number(sub.originalAmount)} · kurs ${Number(sub.fxRate ?? 0) || "otomatis"}`
        : `Tgl ${sub.billingDay}${sub.cycle === "yearly" ? ` · tahunan` : ""} · ${sub.walletName}`
  return (
    <ListRow
      icon={(svc?.icon ?? "repeat") as IconName}
      tone={svc?.tone === "exp" ? "exp" : svc?.tone === "inc" ? "inc" : svc?.tone === "trf" ? "trf" : "pri"}
      title={sub.name}
      subtitle={sub2}
      badge={sub.paused ? <Pill tone="neutral">Dijeda</Pill> : undefined}
      trailing={
        <span className="sub-amount">
          <Money value={BigInt(sub.monthlyIdr)} />
          <span className="row-meta">/bln</span>
        </span>
      }
      onClick={onOpen}
      ariaLabel={`Ubah langganan ${sub.name}`}
    />
  )
}
