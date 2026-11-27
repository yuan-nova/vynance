import { env } from "./config/env"
import { createAuth } from "./db/auth"
import { db } from "./db/client"
import { UnitOfWork } from "./db/unit-of-work"
import { generateBookCode } from "./lib/book-code"
import { newId } from "./lib/id"
import { createMailer } from "./lib/mailer"
import { ActivityRepository } from "./modules/activity/activity.repository"
import { AuthService } from "./modules/auth/auth.service"
import { BooksRepository } from "./modules/books/books.repository"
import { BooksService } from "./modules/books/books.service"
import { CategoriesRepository } from "./modules/categories/categories.repository"
import { CategoriesService } from "./modules/categories/categories.service"
import { HealthRepository } from "./modules/health/health.repository"
import { HealthService } from "./modules/health/health.service"
import { MeRepository } from "./modules/me/me.repository"
import { MeService } from "./modules/me/me.service"
import { WalletsRepository } from "./modules/wallets/wallets.repository"
import { WalletsService } from "./modules/wallets/wallets.service"

// Composition root: satu-satunya tempat membuat instance repository dan service (CODING-GUIDELINES §3.1 butir 6).
const isProduction = env.NODE_ENV === "production"
const mailer = createMailer({ from: env.EMAIL_FROM, apiKey: env.EMAIL_API_KEY, isProduction })
const auth = createAuth(db, {
  secret: env.AUTH_SECRET,
  appUrl: env.APP_URL,
  isProduction,
  google:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
      : undefined,
  sendOtp: mailer.sendOtp,
})

const booksService = new BooksService({
  books: new BooksRepository(db),
  uow: new UnitOfWork(db, (exec) => ({ books: new BooksRepository(exec), activity: new ActivityRepository(exec) })),
  newId: () => newId(),
  newCode: generateBookCode,
})

export const container = {
  healthService: new HealthService(new HealthRepository(db)),
  authService: new AuthService(auth.api, auth.handler, Boolean(env.GOOGLE_CLIENT_ID)),
  meService: new MeService(new MeRepository(db), booksService),
  booksService,
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
}
