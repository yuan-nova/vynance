import { ERROR_MESSAGES, type ErrorCode } from "@vynance/shared"
import { z } from "zod"

const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), field: z.string().optional() }),
})

/** Error dari API dengan kode, pesan Indonesia, dan field opsional. Dilempar oleh service frontend. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly field?: string,
  ) {
    super(message)
    this.name = "ApiRequestError"
  }
}

function isErrorCode(code: string): code is ErrorCode {
  return code in ERROR_MESSAGES
}

/** Ubah respons gagal menjadi ApiRequestError. */
export async function toApiError(res: Response): Promise<ApiRequestError> {
  const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null))
  if (!parsed.success) return new ApiRequestError(res.status, "INTERNAL", ERROR_MESSAGES.INTERNAL)
  const { code, message, field } = parsed.data.error
  return new ApiRequestError(res.status, isErrorCode(code) ? code : "INTERNAL", message, field)
}

/** Lempar ApiRequestError bila respons tidak ok. */
export async function ensureOk(res: Response): Promise<void> {
  if (!res.ok) throw await toApiError(res)
}

/**
 * Ambil error ber-field untuk ditampilkan di kolom form (CODING-GUIDELINES §7.2 butir 8).
 * Mengembalikan `{ fields, formError }`: field yang dikenal masuk ke `fields`, sisanya ke `formError`.
 */
export function splitApiError<F extends string>(
  err: unknown,
  knownFields: readonly F[],
): { fields: Partial<Record<F, string>>; formError: string | null } {
  if (!(err instanceof ApiRequestError)) return { fields: {}, formError: ERROR_MESSAGES.INTERNAL }
  const field = knownFields.find((f) => f === err.field)
  if (field) return { fields: { [field]: err.message } as Partial<Record<F, string>>, formError: null }
  return { fields: {}, formError: err.message }
}
