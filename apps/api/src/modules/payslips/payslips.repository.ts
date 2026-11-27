import { type Executor, payslips } from "@vynance/db"
import { and, desc, eq, isNull } from "drizzle-orm"

type PayslipRow = { id: string; period: string; gross: bigint; deductions: bigint; net: bigint }

const cols = {
  id: payslips.id,
  period: payslips.period,
  gross: payslips.gross,
  deductions: payslips.deductions,
  net: payslips.net,
}

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class PayslipsRepository {
  constructor(private readonly db: Executor) {}

  /** 12 periode terbaru. */
  latest(bookId: string): Promise<PayslipRow[]> {
    return this.db
      .select(cols)
      .from(payslips)
      .where(and(eq(payslips.bookId, bookId), isNull(payslips.deletedAt)))
      .orderBy(desc(payslips.period))
      .limit(12)
  }

  async findByPeriod(bookId: string, period: string): Promise<PayslipRow | null> {
    const [row] = await this.db
      .select(cols)
      .from(payslips)
      .where(and(eq(payslips.bookId, bookId), eq(payslips.period, period), isNull(payslips.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async findById(bookId: string, id: string): Promise<PayslipRow | null> {
    const [row] = await this.db
      .select(cols)
      .from(payslips)
      .where(and(eq(payslips.bookId, bookId), eq(payslips.id, id), isNull(payslips.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async insert(v: {
    id: string
    bookId: string
    period: string
    gross: bigint
    deductions: bigint
    net: bigint
    createdBy: string
  }): Promise<void> {
    await this.db.insert(payslips).values(v)
  }

  async updateAmounts(
    bookId: string,
    id: string,
    v: { gross: bigint; deductions: bigint; net: bigint },
  ): Promise<void> {
    await this.db
      .update(payslips)
      .set(v)
      .where(and(eq(payslips.bookId, bookId), eq(payslips.id, id), isNull(payslips.deletedAt)))
  }

  async softDelete(bookId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(payslips)
      .set({ deletedAt: at })
      .where(and(eq(payslips.bookId, bookId), eq(payslips.id, id)))
  }
}
