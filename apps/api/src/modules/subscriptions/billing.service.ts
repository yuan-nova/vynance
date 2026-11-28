import {
  billingDate,
  dateOnlyOf,
  formatDateLong,
  formatMoney,
  isBilledInMonth,
  isDueToday,
  monthOfDate,
  nextBillingDate,
} from "@vynance/shared"
import { logger } from "../../lib/logger"
import type { BillingRepository } from "./billing.repository"

type Deps = {
  billing: Pick<
    BillingRepository,
    "activeSubscriptions" | "subscriptionCategory" | "insertCharge" | "claimReminder" | "memberEmails"
  >
  newId: () => string
  sendMail: (to: string, subject: string, text: string) => Promise<void>
}

const REMIND_DAYS = 3

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Transaksi langganan otomatis + pengingat H-3 (PB-05, BR-41, TSD §9). Berjalan di worker, bukan saat
 * aplikasi dibuka, jadi tidak dobel walau dua anggota membuka bersamaan (temuan BRD §9 no. 10).
 */
export class BillingService {
  constructor(private readonly d: Deps) {}

  /** Buat transaksi untuk langganan yang jatuh tempo bulan ini. Dua kali jalan → tetap satu (UNIQUE). */
  async chargeDue(now: Date): Promise<number> {
    const today = dateOnlyOf(now)
    const period = monthOfDate(today)
    let created = 0
    for (const s of await this.d.billing.activeSubscriptions()) {
      if (!isDueToday(s, today)) continue
      if (s.walletArchived) {
        logger.warn("langganan dilewati: rekening diarsipkan", { subscription: s.id })
        continue
      }
      const categoryId = s.categoryId ?? (await this.d.billing.subscriptionCategory(s.bookId))
      const res = await this.d.billing.insertCharge({
        id: this.d.newId(),
        bookId: s.bookId,
        amount: s.amountIdr,
        txDate: billingDate(period, s.billingDay),
        walletId: s.walletId,
        categoryId,
        note: `Tagihan Otomatis: ${s.name}`.slice(0, 200),
        subscriptionId: s.id,
        subscriptionPeriod: period,
        createdBy: s.createdBy,
      })
      if (res === "created") created++
    }
    return created
  }

  /** Pengingat H-3 ke semua anggota buku, sekali per langganan per periode. */
  async remindUpcoming(now: Date): Promise<number> {
    const today = dateOnlyOf(now)
    const target = addDays(today, REMIND_DAYS)
    let sent = 0
    for (const s of await this.d.billing.activeSubscriptions()) {
      if (!isBilledInMonth(s, monthOfDate(target))) continue
      if (nextBillingDate(s, today) !== target || target < s.startDate) continue
      if (!(await this.d.billing.claimReminder(s.bookId, s.id, monthOfDate(target)))) continue
      const subject = `Tagihan ${s.name} ${REMIND_DAYS} hari lagi`
      const text = `${s.name} akan ditagih ${formatMoney(s.amountIdr)} pada ${formatDateLong(target)}. Tandai Realisasi di daftar transaksi Vynance setelah dibayar.`
      for (const email of await this.d.billing.memberEmails(s.bookId)) {
        try {
          await this.d.sendMail(email, subject, text)
        } catch {
          logger.error("pengingat langganan gagal dikirim", { subscription: s.id })
        }
      }
      sent++
    }
    return sent
  }
}
