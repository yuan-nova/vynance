import { type ErrorCode, errorMessage } from "@vynance/shared"

type Status = 401 | 403 | 404 | 409 | 410 | 422 | 500

/** Dasar semua error aplikasi. Diubah menjadi `{ error: { code, message, field? } }` oleh error-handler. */
export class AppError extends Error {
  constructor(
    readonly status: Status,
    readonly code: ErrorCode,
    readonly field?: string,
  ) {
    super(errorMessage(code))
    this.name = new.target.name
  }
}

export class ValidationError extends AppError {
  constructor(field?: string, code: ErrorCode = "VALIDATION") {
    super(422, code, field)
  }
}

export class BusinessError extends AppError {
  constructor(code: ErrorCode, field?: string, status: 409 | 422 = 422) {
    super(status, code, field)
  }
}

export class NotFound extends AppError {
  constructor(code: ErrorCode = "NOT_FOUND") {
    super(404, code)
  }
}

export class Forbidden extends AppError {
  constructor(code: ErrorCode = "FORBIDDEN") {
    super(403, code)
  }
}

export class Unauthorized extends AppError {
  constructor(code: ErrorCode = "UNAUTHORIZED") {
    super(401, code)
  }
}
