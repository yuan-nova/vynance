import type { Executor } from "@vynance/db"
import { ActivityRepository } from "../modules/activity/activity.repository"
import { BooksRepository } from "../modules/books/books.repository"
import { CategoriesRepository } from "../modules/categories/categories.repository"
import { InvestmentTypesRepository } from "../modules/investments/investment-types.repository"
import { WalletsRepository } from "../modules/wallets/wallets.repository"

/** Repository untuk transaksi pembuatan buku + data bawaan (BR-46). Dipakai container dan test. */
export const makeBookRepos = (exec: Executor) => ({
  books: new BooksRepository(exec),
  activity: new ActivityRepository(exec),
  wallets: new WalletsRepository(exec),
  categories: new CategoriesRepository(exec),
  investmentTypes: new InvestmentTypesRepository(exec),
})
