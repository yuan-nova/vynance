import type { Context } from "hono"

// Bentuk respons sukses (CODING-GUIDELINES §6.7). Uang sudah berupa string di DTO.

export function ok<T>(c: Context, data: T) {
  return c.json({ data }, 200)
}

export function created<T>(c: Context, data: T) {
  return c.json({ data }, 201)
}

export function page<T>(c: Context, result: { data: T[]; nextCursor: string | null }) {
  return c.json({ data: result.data, nextCursor: result.nextCursor }, 200)
}

export function noContent(c: Context) {
  return c.body(null, 204)
}
