// Logger JSON satu baris. Field sensitif disamarkan (CODING-GUIDELINES §11): nominal, catatan, email, token.

const SENSITIVE = /amount|balance|note|email|token|password|secret|otp|value|limit|budget|cap|gross|net/i

type Level = "debug" | "info" | "warn" | "error"

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE.test(k) ? "[redacted]" : redact(v, depth + 1)
  }
  return out
}

function write(level: Level, msg: string, fields?: Record<string, unknown>): void {
  const line = JSON.stringify({ level, time: new Date().toISOString(), msg, ...(redact(fields ?? {}) as object) })
  if (level === "error" || level === "warn") console.error(line)
  else console.log(line)
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>): void => write("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>): void => write("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>): void => write("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>): void => write("error", msg, fields),
  redact,
}
