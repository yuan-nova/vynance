import { env } from "./config/env"
import { createAuth } from "./db/auth"
import { db } from "./db/client"
import { createMailer } from "./lib/mailer"
import { AuthService } from "./modules/auth/auth.service"
import { HealthRepository } from "./modules/health/health.repository"
import { HealthService } from "./modules/health/health.service"
import { MeRepository } from "./modules/me/me.repository"
import { MeService } from "./modules/me/me.service"

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

export const container = {
  healthService: new HealthService(new HealthRepository(db)),
  authService: new AuthService(auth.api, auth.handler, Boolean(env.GOOGLE_CLIENT_ID)),
  meService: new MeService(new MeRepository(db)),
}
