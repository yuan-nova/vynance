import { INVITATION_TTL_DAYS } from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import type { MaintenanceRepository } from "./maintenance.repository"

type Repos = { maintenance: MaintenanceRepository }
type Deps = {
  maintenance: Pick<MaintenanceRepository, "expiredBooks" | "deleteInvitationsExpiredBefore">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
}

const DAY_MS = 86_400_000

/** Job worker (TSD §9). Semua job idempoten supaya aman berjalan ganda bersamaan. */
export class MaintenanceService {
  constructor(private readonly d: Deps) {}

  /** BR-52: hapus permanen buku yang `purge_after` sudah lewat, per batch; satu buku satu transaksi. */
  async purgeDeletedBooks(now: Date, batch = 20): Promise<number> {
    const ids = await this.d.maintenance.expiredBooks(now, batch)
    for (const id of ids) {
      await this.d.uow.withTransaction((r) => r.maintenance.purgeBook(id))
    }
    return ids.length
  }

  /** BR-50: bersihkan undangan yang sudah kedaluwarsa lebih dari 7 hari (riwayat singkat tetap terlihat). */
  cleanInvitations(now: Date): Promise<number> {
    return this.d.maintenance.deleteInvitationsExpiredBefore(new Date(now.getTime() - INVITATION_TTL_DAYS * DAY_MS))
  }
}
