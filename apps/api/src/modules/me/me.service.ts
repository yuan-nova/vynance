import type { Me, UpdateMeInput, UserCtx } from "@vynance/shared"
import { NotFound } from "../../lib/errors"
import type { BooksService } from "../books/books.service"
import type { MeRepository } from "./me.repository"

export class MeService {
  constructor(
    private readonly repo: Pick<MeRepository, "findById" | "update">,
    private readonly books: Pick<BooksService, "assertMember">,
  ) {}

  async get(ctx: UserCtx): Promise<Me> {
    const me = await this.repo.findById(ctx.userId)
    if (!me) throw new NotFound()
    return me
  }

  async update(ctx: UserCtx, input: UpdateMeInput): Promise<Me> {
    // Buku terakhir harus buku tempat pengguna menjadi anggota; selain itu 404 (TSD §5.2).
    if (input.lastBookId) await this.books.assertMember(ctx.userId, input.lastBookId)
    await this.repo.update(ctx.userId, input)
    return this.get(ctx)
  }
}
