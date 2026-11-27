import {
  type AuthProviders,
  authProvidersSchema,
  type ErrorCode,
  errorMessage,
  type Me,
  meSchema,
  type UpdateMeInput,
} from "@vynance/shared"
import { createAuthClient } from "better-auth/client"
import { emailOTPClient } from "better-auth/client/plugins"
import { api } from "@/lib/api-client"
import { ApiRequestError, ensureOk } from "@/lib/api-error"

const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/v1/auth",
  plugins: [emailOTPClient()],
})

const OTP_CODES: Record<string, ErrorCode> = {
  INVALID_OTP: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  TOO_MANY_ATTEMPTS: "OTP_TOO_MANY_ATTEMPTS",
}

/** Error Better Auth → ApiRequestError dengan pesan dari shared/errors. */
function authError(status: number, code: string | undefined): ApiRequestError {
  if (status === 429) return new ApiRequestError(429, "RATE_LIMITED", errorMessage("RATE_LIMITED"))
  const otpCode = code ? OTP_CODES[code] : undefined
  if (otpCode) return new ApiRequestError(422, otpCode, errorMessage(otpCode), "otp")
  return new ApiRequestError(status, "AUTH_FAILED", errorMessage("AUTH_FAILED"))
}

export async function fetchMe(): Promise<Me | null> {
  const res = await api.me.$get()
  // Tanpa sesi: bukan error, pengguna diarahkan ke Masuk.
  if ((res.status as number) === 401) return null
  await ensureOk(res)
  const body = await res.json()
  return meSchema.parse(body.data)
}

export async function updateMe(input: UpdateMeInput): Promise<Me> {
  const res = await api.me.$patch({ json: input })
  await ensureOk(res)
  const body = await res.json()
  return meSchema.parse(body.data)
}

export async function fetchAuthProviders(): Promise<AuthProviders> {
  const res = await api.auth.providers.$get()
  await ensureOk(res)
  const body = await res.json()
  return authProvidersSchema.parse(body.data)
}

export async function requestOtp(email: string): Promise<void> {
  const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })
  if (error) throw authError(error.status, error.code)
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const { error } = await authClient.signIn.emailOtp({ email, otp })
  if (error) throw authError(error.status, error.code)
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" })
  if (error) throw authError(error.status, error.code)
}

export async function signOut(): Promise<void> {
  const { error } = await authClient.signOut()
  if (error) throw authError(error.status, error.code)
}
