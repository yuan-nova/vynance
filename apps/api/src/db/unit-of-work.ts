import type { Db, Executor } from "@vynance/db"

/**
 * Batas transaksi DB untuk service (CODING-GUIDELINES §6.5).
 * `makeRepos` merakit repository di atas executor transaksi, jadi semua tulis berjalan di transaksi yang sama.
 */
export class UnitOfWork<R> {
  constructor(
    private readonly db: Db,
    private readonly makeRepos: (exec: Executor) => R,
  ) {}

  withTransaction<T>(fn: (repos: R) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(this.makeRepos(tx)))
  }
}
