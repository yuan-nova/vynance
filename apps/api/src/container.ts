import { env } from "./config/env"
import { createAuth } from "./db/auth"
import { makeBookRepos } from "./db/book-repos"
import { db } from "./db/client"
import { UnitOfWork } from "./db/unit-of-work"
import { generateBookCode } from "./lib/book-code"
import { bookEvents } from "./lib/book-events"
import { newId } from "./lib/id"
import { createMailer } from "./lib/mailer"
import { ActivityRepository } from "./modules/activity/activity.repository"
import { AuthService } from "./modules/auth/auth.service"
import { BooksRepository } from "./modules/books/books.repository"
import { BooksService } from "./modules/books/books.service"
import { CategoriesRepository } from "./modules/categories/categories.repository"
import { CategoriesService } from "./modules/categories/categories.service"
import { DashboardService } from "./modules/dashboard/dashboard.service"
import { GoalsRepository } from "./modules/goals/goals.repository"
import { GoalsService } from "./modules/goals/goals.service"
import { HealthRepository } from "./modules/health/health.repository"
import { HealthService } from "./modules/health/health.service"
import { HealthScoreService } from "./modules/health-score/health-score.service"
import { InvestmentTypesRepository } from "./modules/investments/investment-types.repository"
import { InvestmentsService } from "./modules/investments/investments.service"
import { InvitationsRepository } from "./modules/invitations/invitations.repository"
import { InvitationsService } from "./modules/invitations/invitations.service"
import { MaintenanceRepository } from "./modules/maintenance/maintenance.repository"
import { MaintenanceService } from "./modules/maintenance/maintenance.service"
import { AccountRepository } from "./modules/me/account.repository"
import { AccountService } from "./modules/me/account.service"
import { MeRepository } from "./modules/me/me.repository"
import { MeService } from "./modules/me/me.service"
import { MembersRepository } from "./modules/members/members.repository"
import { MembersService } from "./modules/members/members.service"
import { OnboardingService } from "./modules/onboarding/onboarding.service"
import { PlansRepository } from "./modules/plans/plans.repository"
import { PlansService } from "./modules/plans/plans.service"
import { TransactionsRepository } from "./modules/transactions/transactions.repository"
import { TransactionsService } from "./modules/transactions/transactions.service"
import { WalletsRepository } from "./modules/wallets/wallets.repository"
import { WalletsService } from "./modules/wallets/wallets.service"

// Composition root: satu-satunya tempat membuat instance repository dan service (CODING-GUIDELINES §3.1 butir 6).
const isProduction = env.NODE_ENV === "production"
const mailer = createMailer({ from: env.EMAIL_FROM, apiKey: env.EMAIL_API_KEY, isProduction })
const booksService = new BooksService({
  books: new BooksRepository(db),
  uow: new UnitOfWork(db, makeBookRepos),
  newId: () => newId(),
  newCode: generateBookCode,
})

const auth = createAuth(db, {
  secret: env.AUTH_SECRET,
  appUrl: env.APP_URL,
  isProduction,
  google:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
      : undefined,
  sendOtp: mailer.sendOtp,
  onUserCreated: async (userId) => {
    await booksService.createDefault({ userId })
  },
})

const txRepos = (exec: Parameters<typeof makeBookRepos>[0]) => ({
  transactions: new TransactionsRepository(exec),
  wallets: new WalletsRepository(exec),
  categories: new CategoriesRepository(exec),
  activity: new ActivityRepository(exec),
})

const services = {
  healthService: new HealthService(new HealthRepository(db)),
  authService: new AuthService(auth.api, auth.handler, Boolean(env.GOOGLE_CLIENT_ID)),
  meService: new MeService(new MeRepository(db), booksService),
  accountService: new AccountService({
    account: new AccountRepository(db),
    me: new MeRepository(db),
    uow: new UnitOfWork(db, (exec) => ({ account: new AccountRepository(exec), me: new MeRepository(exec) })),
    now: () => new Date(),
  }),
  booksService,
  transactionsService: new TransactionsService({
    transactions: new TransactionsRepository(db),
    uow: new UnitOfWork(db, txRepos),
    newId: () => newId(),
    now: () => new Date(),
  }),
  plansService: new PlansService({
    plans: new PlansRepository(db),
    transactions: new TransactionsRepository(db),
    uow: new UnitOfWork(db, (exec) => ({
      plans: new PlansRepository(exec),
      categories: new CategoriesRepository(exec),
      investmentTypes: new InvestmentTypesRepository(exec),
      wallets: new WalletsRepository(exec),
      activity: new ActivityRepository(exec),
    })),
    newId: () => newId(),
  }),
  investmentsService: new InvestmentsService(new InvestmentTypesRepository(db)),
  onboardingService: new OnboardingService({
    uow: new UnitOfWork(db, (exec) => ({
      wallets: new WalletsRepository(exec),
      me: new MeRepository(exec),
      activity: new ActivityRepository(exec),
    })),
    newId: () => newId(),
    now: () => new Date(),
  }),
  categoriesService: new CategoriesService({
    categories: new CategoriesRepository(db),
    uow: new UnitOfWork(db, (exec) => ({
      categories: new CategoriesRepository(exec),
      activity: new ActivityRepository(exec),
    })),
    newId: () => newId(),
    now: () => new Date(),
  }),
  walletsService: new WalletsService({
    wallets: new WalletsRepository(db),
    uow: new UnitOfWork(db, (exec) => ({
      wallets: new WalletsRepository(exec),
      activity: new ActivityRepository(exec),
    })),
    newId: () => newId(),
    now: () => new Date(),
  }),
  membersService: new MembersService({
    members: new MembersRepository(db),
    uow: new UnitOfWork(db, (exec) => ({
      members: new MembersRepository(exec),
      activity: new ActivityRepository(exec),
    })),
    newId: () => newId(),
    now: () => new Date(),
  }),
  invitationsService: new InvitationsService({
    invitations: new InvitationsRepository(db),
    uow: new UnitOfWork(db, (exec) => ({
      invitations: new InvitationsRepository(exec),
      activity: new ActivityRepository(exec),
    })),
    newId: () => newId(),
    now: () => new Date(),
    appUrl: env.APP_URL,
  }),
  goalsService: new GoalsService({
    goals: new GoalsRepository(db),
    uow: new UnitOfWork(db, (exec) => ({
      goals: new GoalsRepository(exec),
      activity: new ActivityRepository(exec),
    })),
    newId: () => newId(),
    now: () => new Date(),
  }),
}

const healthScoreService = new HealthScoreService({
  wallets: services.walletsService,
  plans: services.plansService,
  transactions: services.transactionsService,
  categories: services.categoriesService,
})

export const container = {
  ...services,
  maintenanceService: new MaintenanceService({
    maintenance: new MaintenanceRepository(db),
    uow: new UnitOfWork(db, (exec) => ({ maintenance: new MaintenanceRepository(exec) })),
  }),
  bookEvents,
  healthScoreService,
  dashboardService: new DashboardService({
    wallets: services.walletsService,
    plans: services.plansService,
    transactions: services.transactionsService,
    categories: services.categoriesService,
    healthScore: healthScoreService,
  }),
}
