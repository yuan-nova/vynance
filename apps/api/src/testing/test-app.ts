import { createApp } from "../app"
import { AuthService } from "../modules/auth/auth.service"

type Deps = Parameters<typeof createApp>[0]

/** Sesi palsu: `userId` null = tanpa sesi. */
export function fakeAuth(userId: string | null): AuthService {
  return new AuthService(
    { getSession: async () => (userId ? { user: { id: userId } } : null) },
    async () => new Response(null, { status: 404 }),
    false,
  )
}

/** App untuk test route: service yang tidak diisi diganti objek kosong (gagal keras bila terpanggil). */
export function testApp(userId: string | null, deps: Partial<Deps>): ReturnType<typeof createApp> {
  const empty = {} as unknown as Deps[keyof Deps]
  const full = {
    healthService: empty,
    meService: empty,
    booksService: empty,
    walletsService: empty,
    categoriesService: empty,
    onboardingService: empty,
    transactionsService: empty,
    plansService: empty,
    investmentsService: empty,
    ...deps,
    authService: deps.authService ?? fakeAuth(userId),
  } as Deps
  return createApp(full)
}
