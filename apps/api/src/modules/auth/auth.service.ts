import type { AuthProviders } from "@vynance/shared"

// Membaca sesi dari header request lewat Better Auth. Tidak bergantung pada Hono (CODING-GUIDELINES §6.3).

type SessionApi = {
  getSession: (opts: { headers: Headers }) => Promise<{ user: { id: string } } | null>
}

export class AuthService {
  constructor(
    private readonly api: SessionApi,
    readonly handler: (req: Request) => Promise<Response>,
    private readonly googleEnabled: boolean,
  ) {}

  /** Penyedia login yang aktif, untuk menampilkan tombol di halaman Masuk. */
  providers(): AuthProviders {
    return { google: this.googleEnabled, emailOtp: true }
  }

  /** ID pengguna dari cookie sesi, atau null bila tidak ada sesi aktif. */
  async userIdFrom(headers: Headers): Promise<string | null> {
    const session = await this.api.getSession({ headers })
    return session?.user.id ?? null
  }
}
