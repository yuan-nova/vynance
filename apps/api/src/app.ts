import { Hono } from "hono"
import type { AppEnv } from "./lib/app-env"
import type { BookEvents } from "./lib/book-events"
import { requireAuth } from "./middleware/auth"
import { bookAccess } from "./middleware/book-access"
import { errorHandler, notFoundHandler } from "./middleware/error-handler"
import { publishChanges } from "./middleware/publish-changes"
import { authRoutes } from "./modules/auth/auth.route"
import type { AuthService } from "./modules/auth/auth.service"
import { bookRoutes, booksRoutes } from "./modules/books/books.route"
import type { BooksService } from "./modules/books/books.service"
import { categoryRoutes } from "./modules/categories/categories.route"
import type { CategoriesService } from "./modules/categories/categories.service"
import { dashboardRoutes } from "./modules/dashboard/dashboard.route"
import type { DashboardService } from "./modules/dashboard/dashboard.service"
import { eventRoutes } from "./modules/events/events.route"
import { goalRoutes } from "./modules/goals/goals.route"
import type { GoalsService } from "./modules/goals/goals.service"
import { healthRoutes } from "./modules/health/health.route"
import type { HealthService } from "./modules/health/health.service"
import { healthScoreRoutes } from "./modules/health-score/health-score.route"
import type { HealthScoreService } from "./modules/health-score/health-score.service"
import { assetRoutes, investmentTypeRoutes, portfolioRoutes } from "./modules/investments/investments.route"
import type { InvestmentsService } from "./modules/investments/investments.service"
import { bookInvitationRoutes, invitationRoutes } from "./modules/invitations/invitations.route"
import type { InvitationsService } from "./modules/invitations/invitations.service"
import type { AccountService } from "./modules/me/account.service"
import { meRoutes } from "./modules/me/me.route"
import type { MeService } from "./modules/me/me.service"
import { memberRoutes } from "./modules/members/members.route"
import type { MembersService } from "./modules/members/members.service"
import { notificationRoutes } from "./modules/notifications/notifications.route"
import type { NotificationsService } from "./modules/notifications/notifications.service"
import { onboardingRoutes } from "./modules/onboarding/onboarding.route"
import type { OnboardingService } from "./modules/onboarding/onboarding.service"
import { planRoutes } from "./modules/plans/plans.route"
import type { PlansService } from "./modules/plans/plans.service"
import { subscriptionRoutes } from "./modules/subscriptions/subscriptions.route"
import type { SubscriptionsService } from "./modules/subscriptions/subscriptions.service"
import { transactionRoutes } from "./modules/transactions/transactions.route"
import type { TransactionsService } from "./modules/transactions/transactions.service"
import { walletRoutes } from "./modules/wallets/wallets.route"
import type { WalletsService } from "./modules/wallets/wallets.service"

type Deps = {
  healthService: HealthService
  authService: AuthService
  meService: MeService
  accountService: AccountService
  booksService: BooksService
  walletsService: WalletsService
  categoriesService: CategoriesService
  onboardingService: OnboardingService
  transactionsService: TransactionsService
  plansService: PlansService
  investmentsService: InvestmentsService
  dashboardService: DashboardService
  healthScoreService: HealthScoreService
  goalsService: GoalsService
  invitationsService: InvitationsService
  membersService: MembersService
  subscriptionsService: SubscriptionsService
  bookEvents: BookEvents
  notificationsService: NotificationsService
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
    .route("/me", new Hono<AppEnv>().use(authed).route("/", meRoutes(deps.meService, deps.accountService)))
    .route("/invitations", invitationRoutes(deps.invitationsService, authed))
    .route("/books", new Hono<AppEnv>().use(authed).route("/", booksRoutes(deps.booksService)))
    .route(
      "/books/:bookId",
      new Hono<AppEnv>()
        .use(authed, bookBound, publishChanges(deps.bookEvents))
        .route("/events", eventRoutes(deps.bookEvents))
        .route("/", bookRoutes(deps.booksService))
        .route("/", memberRoutes(deps.membersService))
        .route("/", notificationRoutes(deps.notificationsService))
        .route("/wallets", walletRoutes(deps.walletsService))
        .route("/categories", categoryRoutes(deps.categoriesService))
        .route("/onboarding", onboardingRoutes(deps.onboardingService))
        .route("/transactions", transactionRoutes(deps.transactionsService))
        .route("/plans", planRoutes(deps.plansService))
        .route("/investment-types", investmentTypeRoutes(deps.investmentsService))
        .route("/investments", portfolioRoutes(deps.investmentsService))
        .route("/assets", assetRoutes(deps.investmentsService))
        .route("/dashboard", dashboardRoutes(deps.dashboardService))
        .route("/health-score", healthScoreRoutes(deps.healthScoreService))
        .route("/goals", goalRoutes(deps.goalsService))
        .route("/invitations", bookInvitationRoutes(deps.invitationsService))
        .route("/subscriptions", subscriptionRoutes(deps.subscriptionsService)),
    )
}

export type AppType = ReturnType<typeof createApp>
