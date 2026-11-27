import {
  type CreatedInvitation,
  INVITATION_TTL_DAYS,
  type Invitation,
  type InvitationPreview,
  invitationStatus,
  type ServiceCtx,
  type UserCtx,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { AppError, NotFound } from "../../lib/errors"
import { hashInviteToken, newInviteToken } from "../../lib/invite-token"
import type { ActivityRepository } from "../activity/activity.repository"
import type { InvitationsRepository } from "./invitations.repository"

type Repos = { invitations: InvitationsRepository; activity: ActivityRepository }
type Deps = {
  invitations: Pick<InvitationsRepository, "list" | "findById" | "findByTokenHash">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
  appUrl: string
}
type Row = NonNullable<Awaited<ReturnType<InvitationsRepository["findById"]>>>

const DAY_MS = 86_400_000
const STATUS_ERROR = {
  expired: "INVITATION_EXPIRED",
  used: "INVITATION_USED",
  revoked: "INVITATION_REVOKED",
} as const

/** Undangan lewat tautan (FR-04, PB-12, BR-50, TSD §5.4). Token mentah tidak disimpan dan tidak dicatat di log. */
export class InvitationsService {
  constructor(private readonly d: Deps) {}

  private toInvitation(r: Row): Invitation {
    return {
      id: r.id,
      status: invitationStatus(r, this.d.now()),
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
      createdByName: r.createdByName ?? "",
      usedByName: r.usedByName,
    }
  }

  async list(ctx: ServiceCtx): Promise<Invitation[]> {
    return (await this.d.invitations.list(ctx.bookId)).map((r) => this.toInvitation(r))
  }

  async create(ctx: ServiceCtx): Promise<CreatedInvitation> {
    const token = newInviteToken()
    const id = this.d.newId()
    const now = this.d.now()
    await this.d.uow.withTransaction(async (r) => {
      await r.invitations.insert({
        id,
        bookId: ctx.bookId,
        tokenHash: await hashInviteToken(token),
        expiresAt: new Date(now.getTime() + INVITATION_TTL_DAYS * DAY_MS),
        createdBy: ctx.userId,
      })
      await this.log(r, ctx.bookId, ctx.userId, "invitation.created", id)
    })
    const row = await this.d.invitations.findById(ctx.bookId, id)
    if (!row) throw new NotFound("INVITATION_NOT_FOUND")
    return { invitation: this.toInvitation(row), url: `${this.d.appUrl.replace(/\/$/, "")}/undangan/${token}` }
  }

  /** Anggota mana pun boleh membatalkan (BR-49, BR-50). */
  async revoke(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const row = await r.invitations.findById(ctx.bookId, id)
      if (!row) throw new NotFound("INVITATION_NOT_FOUND")
      await r.invitations.revoke(ctx.bookId, id, this.d.now())
      await this.log(r, ctx.bookId, ctx.userId, "invitation.revoked", id)
    })
  }

  /** Pratinjau publik untuk halaman terima undangan. Status apa pun dikembalikan supaya pesannya jelas. */
  async preview(token: string): Promise<InvitationPreview> {
    const row = await this.d.invitations.findByTokenHash(await hashInviteToken(token))
    if (!row) throw new NotFound("INVITATION_NOT_FOUND")
    return {
      status: invitationStatus(row, this.d.now()),
      bookName: row.bookName,
      bookCode: row.bookCode,
      inviterName: row.createdByName ?? "",
      expiresAt: row.expiresAt.toISOString(),
    }
  }

  /**
   * Terima undangan dalam satu transaksi (TSD §5.4): token aktif, pengguna belum anggota,
   * buat atau aktifkan ulang keanggotaan, tandai dipakai, catat aktivitas.
   */
  async accept(ctx: UserCtx, token: string): Promise<{ bookId: string }> {
    const hash = await hashInviteToken(token)
    return this.d.uow.withTransaction(async (r) => {
      const row = await r.invitations.findByTokenHash(hash)
      if (!row) throw new NotFound("INVITATION_NOT_FOUND")
      const status = invitationStatus(row, this.d.now())
      if (status !== "active") throw new AppError(410, STATUS_ERROR[status])
      const member = await r.invitations.membership(row.bookId, ctx.userId)
      // BR-50: yang sudah anggota tidak bisa diundang lagi; token tidak ikut terpakai.
      if (member && member.leftAt === null) throw new AppError(409, "INVITATION_ALREADY_MEMBER")
      const now = this.d.now()
      if (!(await r.invitations.markUsed(row.id, ctx.userId, now))) throw new AppError(410, "INVITATION_USED")
      if (member) await r.invitations.rejoin(member.id, now)
      else
        await r.invitations.addMember({
          id: this.d.newId(),
          bookId: row.bookId,
          userId: ctx.userId,
          createdBy: ctx.userId,
        })
      await this.log(r, row.bookId, ctx.userId, "member.joined", ctx.userId)
      return { bookId: row.bookId }
    })
  }

  private log(r: Repos, bookId: string, actorId: string, action: string, entityId: string): Promise<void> {
    return r.activity.record({
      id: this.d.newId(),
      bookId,
      actorId,
      action,
      entityType: action.startsWith("member") ? "member" : "invitation",
      entityId,
      summary: {},
    })
  }
}
