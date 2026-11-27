import { Hono } from "hono"
import type { AppEnv } from "./lib/app-env"
import { requireAuth } from "./middleware/auth"
import { bookAccess } from "./middleware/book-access"
import { errorHandler, notFoundHandler } from "./middleware/error-handler"
import { authRoutes } from "./modules/auth/auth.route"
import type { AuthService } from "./modules/auth/auth.service"
import { bookRoutes, booksRoutes } from "./modules/books/books.route"
import type { BooksService } from "./modules/books/books.service"
import { categoryRoutes } from "./modules/categories/categories.route"
import type { CategoriesService } from "./modules/categories/categories.service"
import { healthRoutes } from "./modules/health/health.route"
import type { HealthService } from "./modules/health/health.service"
import { investmentTypeRoutes } from "./modules/investments/investments.route"
import type { InvestmentsService } from "./modules/investments/investments.service"
import { meRoutes } from "./modules/me/me.route"
import type { MeService } from "./modules/me/me.service"
import { onboardingRoutes } from "./modules/onboarding/onboarding.route"
import type { OnboardingService } from "./modules/onboarding/onboarding.service"
import { planRoutes } from "./modules/plans/plans.route"
import type { PlansService } from "./modules/plans/plans.service"
import { transactionRoutes } from "./modules/transactions/transactions.route"
import type { TransactionsService } from "./modules/transactions/transactions.service"
import { walletRoutes } from "./modules/wallets/wallets.route"
import type { WalletsService } from "./modules/wallets/wallets.service"

type Deps = {
  healthService: HealthService
  authService: AuthService
  meService: MeService
  booksService: BooksService
  walletsService: WalletsService
  categoriesService: CategoriesService
  onboardingService: OnboardingService
  transactionsService: TransactionsService
  plansService: PlansService
  investmentsService: InvestmentsService
}

// Route wajib dirangkai supaya AppType terbaca Hono RPC (CODING-GUIDELINES §6.2).
export const createApp = (deps: Deps) => {
  const authed = requireAuth(deps.authService)
  // Semua data buku: auth → bookAccess (CODING-GUIDELINES §11).
  const bookBound = bookAccess(deps.booksService)
  return new Hono<AppEnv>()
    .basePath("/api/v1")
    .onError(errorHandler)
    .notFound(notFoundHandler)
    .route("/health", healthRoutes(deps.healthService))
    .route("/auth", authRoutes(deps.authService))
    .route("/me", new Hono<AppEnv>().use(authed).route("/", meRoutes(deps.meService)))
    .route("/books", new Hono<AppEnv>().use(authed).route("/", booksRoutes(deps.booksService)))
    .route(
      "/books/:bookId",
      new Hono<AppEnv>()
        .use(authed, bookBound)
        .route("/", bookRoutes(deps.booksService))
        .route("/wallets", walletRoutes(deps.walletsService))
        .route("/categories", categoryRoutes(deps.categoriesService))
        .route("/onboarding", onboardingRoutes(deps.onboardingService))
        .route("/transactions", transactionRoutes(deps.transactionsService))
        .route("/plans", planRoutes(deps.plansService))
        .route("/investment-types", investmentTypeRoutes(deps.investmentsService)),
    )
}

export type AppType = ReturnType<typeof createApp>
