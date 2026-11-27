import type { Activity, Member, ServiceCtx } from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError, NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { MembersRepository } from "./members.repository"

type Repos = { members: MembersRepository; activity: ActivityRepository }
type Deps = {
  members: Pick<MembersRepository, "list" | "activities">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}

/** Anggota dan aktivitas buku (FR-04). Semua anggota boleh mengeluarkan anggota lain (BR-49). */
export class MembersService {
  constructor(private readonly d: Deps) {}

  async list(ctx: ServiceCtx): Promise<Member[]> {
    return (await this.d.members.list(ctx.bookId)).map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
      joinedAt: m.joinedAt.toISOString(),
      isMe: m.userId === ctx.userId,
    }))
  }

  /** Keluarkan anggota lain. Mengeluarkan diri sendiri = keluar. */
  async remove(ctx: ServiceCtx, userId: string): Promise<void> {
    if (userId === ctx.userId) return this.leave(ctx)
    await this.d.uow.withTransaction(async (r) => {
      const members = await r.members.list(ctx.bookId)
      const target = members.find((m) => m.userId === userId)
      if (!target) throw new NotFound("MEMBER_NOT_FOUND")
      await r.members.leave(ctx.bookId, userId, this.d.now())
      await this.log(r, ctx, "member.removed", userId, { name: target.name })
    })
  }

  /** BR-51: anggota terakhir tidak bisa keluar; ia harus menghapus buku. */
  async leave(ctx: ServiceCtx): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      if ((await r.members.activeCount(ctx.bookId)) <= 1) throw new BusinessError("BOOK_LAST_MEMBER", undefined, 409)
      await r.members.leave(ctx.bookId, ctx.userId, this.d.now())
      await this.log(r, ctx, "member.left", ctx.userId, {})
    })
  }

  async activities(ctx: ServiceCtx, limit: number): Promise<Activity[]> {
    return (await this.d.members.activities(ctx.bookId, limit)).map((a) => ({
      id: a.id,
      action: a.action,
      actorName: a.actorName ?? "",
      entityType: a.entityType,
      summary: a.summary ?? {},
      createdAt: a.createdAt.toISOString(),
    }))
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, userId: string, summary: Record<string, string>) {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "member",
      entityId: userId,
      summary,
    })
  }
}
