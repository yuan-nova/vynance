import type { Me, UpdateMeInput, UserCtx } from "@vynance/shared"
import { NotFound } from "../../lib/errors"
import type { MeRepository } from "./me.repository"

export class MeService {
  constructor(private readonly repo: Pick<MeRepository, "findById" | "update">) {}

  async get(ctx: UserCtx): Promise<Me> {
    const me = await this.repo.findById(ctx.userId)
    if (!me) throw new NotFound()
    return me
  }

  // lastBookId dicek keanggotaannya di tiket #7 (buku); di sini hanya disimpan.
  async update(ctx: UserCtx, input: UpdateMeInput): Promise<Me> {
    await this.repo.update(ctx.userId, input)
    return this.get(ctx)
  }
}
