import type { OpeningBalancesInput, ServiceCtx } from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { MeRepository } from "../me/me.repository"
import type { WalletsRepository } from "../wallets/wallets.repository"

type Repos = { wallets: WalletsRepository; me: MeRepository; activity: ActivityRepository }
type Deps = { uow: Pick<UnitOfWork<Repos>, "withTransaction">; newId: () => string; now: () => Date }

export class OnboardingService {
  constructor(private readonly d: Deps) {}

  /** PB-01 langkah 3: isi saldo awal rekening bawaan, lalu tandai onboarding selesai. Semua atau tidak sama sekali. */
  async setOpeningBalances(ctx: ServiceCtx, input: OpeningBalancesInput): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      for (const b of input.balances) {
        // FK lintas buku dicek di service (TSD §6.3).
        if (!(await r.wallets.findById(ctx.bookId, b.walletId))) throw new NotFound("WALLET_NOT_FOUND")
        await r.wallets.update(ctx.bookId, b.walletId, { openingBalance: b.openingBalance })
      }
      await r.me.markOnboarded(ctx.userId, this.d.now())
      if (input.balances.length > 0) {
        await r.activity.record({
          id: this.d.newId(),
          bookId: ctx.bookId,
          actorId: ctx.userId,
          action: "onboarding.opening_balances",
          entityType: "book",
          entityId: ctx.bookId,
          summary: { count: String(input.balances.length) },
        })
      }
    })
  }
}
